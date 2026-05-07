import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { action, ...params } = await req.json()

    // Get Meta Settings
    const { data: settings } = await supabase
      .from('crm_settings')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (!settings?.meta_access_token) {
      throw new Error('Meta API credentials not configured')
    }

    const { meta_access_token, meta_phone_number_id } = settings

    if (action === 'getTemplates') {
      const { meta_waba_id } = settings
      console.log(`Fetching templates for WABA ${meta_waba_id}...`);
      
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${meta_waba_id}/message_templates?limit=1000`,
        {
          headers: { 'Authorization': `Bearer ${meta_access_token}` },
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Meta API Error fetching templates:', errorData);
        throw new Error(`Meta API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json()
      
      if (data.data) {
        console.log(`Found ${data.data.length} templates on Meta.`);
        const metaTemplateIds = data.data.map((t: any) => t.id);
        
        for (const template of data.data) {
          // Process components to find and store media permanently
          const processedComponents = [...template.components];
          for (const component of processedComponents) {
            if (component.type === 'HEADER' && (component.format === 'IMAGE' || component.format === 'VIDEO')) {
              const mediaUrl = component.example?.header_handle?.[0];
              if (mediaUrl && mediaUrl.includes('scontent.whatsapp.net')) {
                console.log(`Storing template media permanently: ${template.name} - ${component.format}`);
                const permanentUrl = await downloadAndStoreMetaMedia(supabase, meta_access_token, mediaUrl, component.format.toLowerCase(), `${template.name}_header`);
                if (permanentUrl) {
                  component.example.header_handle = [permanentUrl];
                }
              }
            }
          }

          await supabase.from('crm_templates').upsert({
            id: template.id,
            name: template.name,
            category: template.category,
            language: template.language,
            status: template.status,
            components: processedComponents,
            updated_at: new Date().toISOString()
          })
        }
        
        // Remove local templates that are no longer on Meta
        if (metaTemplateIds.length > 0) {
          await supabase.from('crm_templates').delete().not('id', 'in', metaTemplateIds)
        }
      }
      
      return new Response(JSON.stringify({ success: true, templates: data.data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'createTemplate') {
      const { meta_waba_id } = settings
      const { name, category, language, components } = params
      
      console.log(`Creating template ${name}...`);

      // 1. Process components to get Meta handles for media examples
      const processedComponents = [...components];
      
      let appId = settings.meta_app_id;
      if (!appId && meta_access_token) {
        console.log('App ID not found in settings, attempting to debug token...');
        appId = await getAppId(meta_access_token);
      }

      for (const component of processedComponents) {
        // Handle standard Header media
        if (component.type === 'HEADER' && (component.format === 'IMAGE' || component.format === 'VIDEO' || component.format === 'DOCUMENT')) {
          const mediaUrl = component.example?.header_handle?.[0];
          
          if (mediaUrl && (mediaUrl.startsWith('http') || mediaUrl.startsWith('https'))) {
            console.log(`Processing media header example for ${name}...`);
            if (appId) {
              const handle = await getMetaHeaderHandle(meta_access_token, appId, mediaUrl);
              if (handle) {
                console.log(`Generated Meta handle for ${name}: ${handle}`);
                component.example.header_handle = [handle];
              }
            } else {
              console.warn('Could not determine Meta App ID. Media upload might fail.');
            }
          }
        }
        
        // Handle Carousel cards media
        if (component.type === 'CAROUSEL' && component.cards) {
          console.log(`Processing carousel cards for ${name}...`);
          for (const card of component.cards) {
            const headerComp = card.components?.find((c: any) => c.type === 'HEADER');
            if (headerComp && headerComp.format === 'IMAGE') {
              const mediaUrl = headerComp.example?.header_handle?.[0];
              if (mediaUrl && (mediaUrl.startsWith('http') || mediaUrl.startsWith('https'))) {
                console.log(`Processing carousel card media example for ${name}...`);
                if (appId) {
                  const handle = await getMetaHeaderHandle(meta_access_token, appId, mediaUrl);
                  if (handle) {
                    console.log(`Generated Meta handle for carousel card: ${handle}`);
                    headerComp.example.header_handle = [handle];
                  }
                }
              }
            }
          }
        }
      }
      
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${meta_waba_id}/message_templates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${meta_access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, category, language, components: processedComponents }),
        }
      )
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('Meta API Error:', JSON.stringify(result, null, 2));
        return new Response(JSON.stringify({ 
          success: false, 
          error: result.error?.message || 'Meta API returned an error',
          details: result 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      if (result.id) {
        const { is_pix, pix_code, is_carousel } = params;
        await supabase.from('crm_templates').upsert({
          id: result.id,
          name,
          category,
          language,
          status: 'PENDING',
          components: processedComponents,
          is_pix: is_pix || false,
          pix_code: pix_code || null,
          is_carousel: is_carousel || false,
          updated_at: new Date().toISOString()
        })
      }
      
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'deleteTemplate') {
      const { meta_waba_id } = settings
      const { name } = params
      
      console.log(`Deleting template ${name} from Meta WABA ${meta_waba_id}...`);
      
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${meta_waba_id}/message_templates?name=${name}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${meta_access_token}` },
        }
      )
      
      const result = await response.json()
      console.log('Meta Deletion Result:', JSON.stringify(result));
      
      // Even if Meta returns an error (like template not found), we should allow deleting it locally
      // if it's no longer on Meta or if there's a mismatch.
      // Meta returns { success: true } on success.
      
      if (result.success || (result.error && (result.error.code === 100 || result.error.error_subcode === 2388044))) {
        console.log(`Template ${name} deleted from Meta or not found. Removing from local database...`);
        const { error: dbError } = await supabase.from('crm_templates').delete().eq('name', name)
        if (dbError) {
          console.error('Local DB Deletion Error:', dbError);
        }
      }
      
      if (!result.success && !result.error) {
        // Fallback for unexpected response format
        await supabase.from('crm_templates').delete().eq('name', name)
      }
      
      return new Response(JSON.stringify({ 
        success: result.success || (result.error?.code === 100), 
        result 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'sendTemplate') {
      const { to, templateName, languageCode, components: manualComponents } = params
      
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('wa_id', to)
        .single();

      if (!contact) throw new Error('Contact not found');

      const { contactId: providedContactId } = params;
      const response = await internalSendTemplate(
        supabase, 
        meta_phone_number_id, 
        meta_access_token, 
        to, 
        templateName, 
        languageCode || 'pt_BR', 
        manualComponents, 
        contact,
        null,
        providedContactId
      );


      return response;
    }

    if (action === 'sendMessage') {
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('wa_id', params.to)
        .single();
        
      return await handleInternalSendMessage(supabase, meta_phone_number_id, meta_access_token, params, contact);
    }

    if (action === 'startFlow') {
      const { flowId, contactId, waId } = params
      
      // Check if contact already has an active flow to prevent duplicates
      const { data: currentContact } = await supabase
        .from('crm_contacts')
        .select('flow_state, current_flow_id')
        .eq('id', contactId)
        .single();
        
      if (currentContact?.flow_state === 'running' || currentContact?.flow_state === 'waiting_response') {
        console.log(`Contact ${contactId} already has an active flow (${currentContact.current_flow_id}). Skipping startFlow for ${flowId}.`);
        return new Response(JSON.stringify({ success: true, message: 'Flow already active, skipped duplicate' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: flow } = await supabase
        .from('crm_flows')
        .select('*')
        .eq('id', flowId)
        .single()
      
      if (!flow) throw new Error('Flow not found')

      // Clear any existing scheduled messages for this contact to prevent flow conflicts
      await supabase.from('crm_scheduled_messages').delete().eq('contact_id', contactId);

      // Use visual flow if it has nodes, otherwise fallback to old step-based system
      if (flow.nodes && flow.nodes.length > 0) {
        // Find starting node (no incoming edges)
        const nodeIdsWithTarget = new Set(flow.edges.map((e: any) => e.target))
        const startNode = flow.nodes.find((n: any) => !nodeIdsWithTarget.has(n.id)) || flow.nodes[0]
        
        await supabase
          .from('crm_contacts')
          .update({
            current_flow_id: flowId,
            current_node_id: startNode.id,
            flow_state: 'running',
            last_flow_interaction: new Date().toISOString(),
            next_execution_time: null
          })
          .eq('id', contactId)
        
        return await executeVisualNode(supabase, flow, startNode, contactId, waId)
      } else {
        // Fallback to old steps system
        await supabase
          .from('crm_contacts')
          .update({
            current_flow_id: flowId,
            current_step_index: 0,
            flow_state: 'running',
            last_flow_interaction: new Date().toISOString()
          })
          .eq('id', contactId)
        
        const { data: step } = await supabase
          .from('crm_flow_steps')
          .select('*')
          .eq('flow_id', flowId)
          .eq('step_order', 0)
          .single()
        
        if (step) return await processStep(supabase, step, contactId, waId)
      }
      
      return new Response(JSON.stringify({ success: true, message: 'Flow started but no logic found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'continueFlow') {
      const { contactId, waId, buttonId, nextNodeId, text } = params
      
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .single()
      
      if (!contact || !contact.current_flow_id) {
        return new Response(JSON.stringify({ success: false, message: 'No active flow' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: flow } = await supabase
        .from('crm_flows')
        .select('*')
        .eq('id', contact.current_flow_id)
        .single()

      if (flow && flow.nodes && flow.nodes.length > 0) {
        let nextNode = null;

        if (nextNodeId) {
          nextNode = flow.nodes.find((n: any) => n.id === nextNodeId)
        } else {
          const currentNode = flow.nodes.find((n: any) => n.id === contact.current_node_id)
          if (!currentNode) return new Response(JSON.stringify({ error: 'Current node not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

          // Find next node based on buttonId or standard connection
          let nextEdge = null;
          if (buttonId) {
            // Priority 1: Match specific button ID
            nextEdge = flow.edges.find((e: any) => e.source === currentNode.id && e.sourceHandle === buttonId)
          }
          
          // Priority 1.5: Match text against button labels if no buttonId matched
          if (!nextEdge && text && currentNode.data?.buttons) {
            const matchedButtonIdx = currentNode.data.buttons.findIndex((b: any) => 
              b.text?.toLowerCase().trim() === text.toLowerCase().trim() ||
              (text.toLowerCase().includes('[button reply]') && text.toLowerCase().includes(b.text?.toLowerCase().trim()))
            );
            
            if (matchedButtonIdx !== -1) {
              const handleId = currentNode.data.buttons[matchedButtonIdx].id || `btn-${matchedButtonIdx}`;
              nextEdge = flow.edges.find((e: any) => e.source === currentNode.id && e.sourceHandle === handleId);
              console.log(`Matched text "${text}" to button index ${matchedButtonIdx} (handle: ${handleId})`);
            }
          }
          if (!nextEdge) {
            // Priority 2: Match generic "responded" or the new "any_response" handle
            nextEdge = flow.edges.find((e: any) => e.source === currentNode.id && (e.sourceHandle === 'responded' || e.sourceHandle === 'any_response'))
          }

          // Priority 3: Match standard transition (no handle)
          if (!nextEdge) {
            nextEdge = flow.edges.find((e: any) => e.source === currentNode.id && !e.sourceHandle)
          }

          if (nextEdge) {
            nextNode = flow.nodes.find((n: any) => n.id === nextEdge.target)
          }
        }

        if (nextNode) {
          await supabase
            .from('crm_contacts')
            .update({ 
              current_node_id: nextNode.id, 
              last_flow_interaction: new Date().toISOString(),
              flow_state: 'running'
            })
            .eq('id', contactId)
          
          return await executeVisualNode(supabase, flow, nextNode, contactId, waId)
        }

        // No more nodes, finish flow
        await supabase.from('crm_contacts').update({ 
          flow_state: 'idle', 
          current_flow_id: null, 
          current_node_id: null 
        }).eq('id', contactId)

        return new Response(JSON.stringify({ success: true, message: 'Flow completed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }


    if (action === 'improvePrompt') {
      const { prompt } = params;
      const openaiApiKey = settings.openai_api_key;
      
      if (!openaiApiKey) {
        throw new Error('Chave da OpenAI não configurada nas definições do CRM');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em engenharia de prompt para agentes de atendimento e vendas via WhatsApp. Sua tarefa é pegar um prompt rascunhado pelo usuário e transformá-lo em um prompt profissional, assertivo e funcional. Corrija erros de português, melhore a clareza, adicione estrutura se necessário e destaque pontos cruciais para o bom atendimento. Mantenha o objetivo original do prompt, mas eleve a qualidade para um nível sênior. Responda APENAS com o novo texto do prompt.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const improvedPrompt = data.choices[0].message.content.trim();

      return new Response(JSON.stringify({ success: true, improvedPrompt }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'processScheduled') {
      const now = new Date().toISOString()
      console.log(`Checking for scheduled messages at ${now}...`);
      
      const { data: messages, error: fetchError } = await supabase
        .from('crm_scheduled_messages')
        .select('*, crm_contacts(*)')
        .eq('status', 'pending')
        .lte('scheduled_for', now)
      
      if (fetchError) {
        console.error('Error fetching scheduled messages:', fetchError);
        throw fetchError;
      }
      
      if (messages && messages.length > 0) {
        console.log(`Found ${messages.length} messages to process.`);
        for (const msg of messages) {
          try {
            // Update status immediately to prevent double execution if the function takes time
            await supabase.from('crm_scheduled_messages').update({ status: 'sent' }).eq('id', msg.id)
            
            const messageData = msg.message_data || {}
            const msgAction = messageData.action || 'continueFlow'
            
            console.log(`Processing scheduled message ${msg.id} with action: ${msgAction}`);
            
            if (msgAction === 'sendMessage') {
              await handleInternalSendMessage(supabase, meta_phone_number_id, meta_access_token, {
                to: msg.crm_contacts.wa_id,
                text: messageData.text,
                imageUrl: messageData.imageUrl,
                videoUrl: messageData.videoUrl,
                audioUrl: messageData.audioUrl,
                documentUrl: messageData.documentUrl,
                fileName: messageData.fileName,
                isVoice: messageData.isVoice
              }, msg.crm_contacts);
            } else if (msgAction === 'sendTemplate') {
              await internalSendTemplate(
                supabase,
                meta_phone_number_id,
                meta_access_token,
                msg.crm_contacts.wa_id,
                messageData.templateName,
                messageData.languageCode || 'pt_BR',
                messageData.components,
                msg.crm_contacts
              );
            } else if (msgAction === 'startFlow') {
              // We need to fetch the flow again or just call startFlow logic
              const { data: flow } = await supabase
                .from('crm_flows')
                .select('*')
                .eq('id', messageData.flowId)
                .single()
              
              if (flow) {
                if (flow.nodes && flow.nodes.length > 0) {
                  const nodeIdsWithTarget = new Set(flow.edges.map((e: any) => e.target))
                  const startNode = flow.nodes.find((n: any) => !nodeIdsWithTarget.has(n.id)) || flow.nodes[0]
                  
                  await supabase.from('crm_contacts').update({
                    current_flow_id: flow.id,
                    current_node_id: startNode.id,
                    flow_state: 'running',
                    last_flow_interaction: new Date().toISOString()
                  }).eq('id', msg.contact_id)
                  
                  await executeVisualNode(supabase, flow, startNode, msg.contact_id, msg.crm_contacts.wa_id)
                }
              }
            } else {
              // Default: continueFlow
              await supabase.functions.invoke('meta-whatsapp-crm', {
                body: { 
                  action: 'continueFlow', 
                  contactId: msg.contact_id, 
                  waId: msg.crm_contacts.wa_id,
                  nextNodeId: msg.node_id 
                }
              })
            }
          } catch (err) {
            console.error(`Error processing scheduled message ${msg.id}:`, err);
            await supabase.from('crm_scheduled_messages').update({ status: 'failed' }).eq('id', msg.id)
          }
        }
      }
      
      return new Response(JSON.stringify({ success: true, processed: messages?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }


    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// sanitizeMetaLink removed as we now use uploadMediaToMeta for all media types to ensure delivery

async function handleInternalSendMessage(supabase: any, meta_phone_number_id: string, meta_access_token: string, params: any, contact: any) {
  const { to, text, audioUrl, imageUrl, videoUrl, documentUrl, fileName, buttons, headerText, footerText, isVoice } = params
  
  let body: any = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
  }

  let mediaUrlToStore = null;

  if (audioUrl) {
    body.type = "audio"
    const metaMediaId = await uploadMediaToMeta(meta_access_token, meta_phone_number_id, audioUrl, 'audio');
    if (metaMediaId) {
      body.audio = { id: metaMediaId, voice: !!isVoice };
    } else {
      body.audio = { link: audioUrl, voice: !!isVoice };
    }
    mediaUrlToStore = audioUrl;
  } else if (imageUrl && !buttons) {
    body.type = "image"
    const metaMediaId = await uploadMediaToMeta(meta_access_token, meta_phone_number_id, imageUrl, 'image');
    if (metaMediaId) {
      body.image = { id: metaMediaId, caption: text };
    } else {
      body.image = { link: imageUrl, caption: text };
    }
    mediaUrlToStore = imageUrl;
  } else if (videoUrl) {
    body.type = "video"
    const metaMediaId = await uploadMediaToMeta(meta_access_token, meta_phone_number_id, videoUrl, 'video');
    if (metaMediaId) {
      body.video = { id: metaMediaId, caption: text };
    } else {
      body.video = { link: videoUrl, caption: text };
    }
    mediaUrlToStore = videoUrl;
  } else if (documentUrl) {
    body.type = "document"
    const metaMediaId = await uploadMediaToMeta(meta_access_token, meta_phone_number_id, documentUrl, 'document');
    if (metaMediaId) {
      body.document = { id: metaMediaId, caption: text, filename: fileName || "document.pdf" };
    } else {
      body.document = { link: documentUrl, caption: text, filename: fileName || "document.pdf" };
    }
    mediaUrlToStore = documentUrl;
  } else if (buttons && buttons.length > 0) {
    body.type = "interactive"
    const interactive: any = {
      type: "button",
      body: { text: text || "Selecione uma opção:" },
      action: {
        buttons: buttons.map((b: any) => ({
          type: "reply",
          reply: {
            id: b.id || Math.random().toString(36).substr(2, 9),
            title: b.text.substring(0, 20)
          }
        }))
      }
    }
    if (imageUrl) {
      const metaMediaId = await uploadMediaToMeta(meta_access_token, meta_phone_number_id, imageUrl, 'image');
      if (metaMediaId) {
        interactive.header = { type: "image", image: { id: metaMediaId } };
      } else {
        interactive.header = { type: "image", image: { link: imageUrl } };
      }
      mediaUrlToStore = imageUrl;
    }
    else if (headerText) interactive.header = { type: "text", text: headerText }
    if (footerText) interactive.footer = { text: footerText }
    body.interactive = interactive
  } else {
    body.type = "text"
    body.text = { body: text }
  }
  
  console.log('Sending message to Meta:', JSON.stringify(body, null, 2));
  
  const response = await fetch(
    `https://graph.facebook.com/v20.0/${meta_phone_number_id}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${meta_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const result = await response.json()
  if (!response.ok) {
    console.error('Meta API Error:', result)
    return new Response(JSON.stringify({ success: false, error: result.error?.message, details: result }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  
  if (result.messages && result.messages[0]) {
    if (contact) {
      await supabase.from('crm_messages').insert({
        contact_id: contact.id,
        direction: 'outbound',
        content: text || `[${body.type}]`,
        message_type: body.type,
        media_url: mediaUrlToStore,
        meta_message_id: result.messages[0].id,
        status: 'sent'
      })
      await supabase.from('crm_contacts').update({ 
        total_messages_sent: (contact.total_messages_sent || 0) + 1,
        last_interaction: new Date().toISOString()
      }).eq('id', contact.id)
      await supabase.rpc('increment_crm_metric', { metric_column: 'sent_count' })
    }
  }

  return new Response(JSON.stringify({ success: true, result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function internalSendTemplate(
  supabase: any,
  metaPhoneNumberId: string,
  metaAccessToken: string,
  to: string,
  templateName: string,
  languageCode: string,
  manualComponents: any[] = [],
  contact: any = null,
  nodeId: string | null = null,
  contactId: string | null = null
) {
  console.log(`Internal sending template ${templateName} to ${to}...`);
  
  // Use provided contactId if contact object is missing
  if (!contact && contactId) {
    const { data: fetchedContact } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', contactId)
      .single();
    contact = fetchedContact;
  }


  // 1. Fetch template details
  const { data: templateData } = await supabase
    .from('crm_templates')
    .select('*')
    .eq('name', templateName)
    .single();

  if (!templateData) {
    return new Response(JSON.stringify({ success: false, error: 'Template not found locally' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 2. Fallback if window is open (Always fallback for speed if window is open, or if not approved)
  // MODIFICAÇÃO: Removido o fallback automático se a janela estiver aberta para forçar o envio do template oficial com botões de link.
  const isApproved = templateData.status === 'APPROVED';
  const lastInteraction = contact?.last_interaction;
  const isWindowOpen = lastInteraction && (new Date().getTime() - new Date(lastInteraction).getTime()) < 24 * 60 * 60 * 1000;

  
  if (!isApproved && isWindowOpen) {
    console.log(`Template ${templateName} not approved but window is open. Using rich message fallback...`);
    
    const headerComponent = templateData.components?.find((c: any) => c.type === 'HEADER');
    const bodyComponent = templateData.components?.find((c: any) => c.type === 'BODY');
    const footerComponent = templateData.components?.find((c: any) => c.type === 'FOOTER');
    const buttonsComponent = templateData.components?.find((c: any) => c.type === 'BUTTONS');
    
    if (bodyComponent && bodyComponent.text) {
      let text = bodyComponent.text;
      const bodyParams = manualComponents?.find((c: any) => c.type === 'body')?.parameters || [];
      
      bodyParams.forEach((param: any, index: number) => {
        text = text.replace(`{{${index + 1}}}`, param.text || '-');
      });

      if (bodyParams.length === 0 && text.includes('{{1}}') && contact?.name) {
        text = text.replace(/\{\{1\}\}/g, contact.name);
      }
      text = text.replace(/\{\{\d+\}\}/g, '---');

      let imageUrl = manualComponents?.find((c: any) => c.type === 'header')?.parameters?.[0]?.image?.link || null;
      let headerText = null;
      
      if (headerComponent) {
        if (headerComponent.format === 'TEXT') {
          headerText = headerComponent.text;
        } else if (headerComponent.format === 'IMAGE' && !imageUrl) {
          imageUrl = headerComponent.example?.header_handle?.[0];
        }
      }

      let buttons = [];
      if (buttonsComponent && buttonsComponent.buttons) {
        buttonsComponent.buttons.forEach((b: any, index: number) => {
          if (b.type === 'QUICK_REPLY') {
            buttons.push({ id: b.payload || b.text || `btn_${index}`, text: b.text });
          }
        });
      }

      return await handleInternalSendMessage(supabase, metaPhoneNumberId, metaAccessToken, {
        to,
        text,
        imageUrl,
        headerText,
        footerText: footerComponent?.text,
        buttons: buttons.length > 0 ? buttons : undefined
      }, contact);
    }
  }

  // 3. Official Template Sending
  let finalComponents: any[] = [];
  let messageContent = `[Template: ${templateName}]`;

  if (templateData.components) {
    const bodyComponent = templateData.components.find((c: any) => c.type === 'BODY');
    const headerComponent = templateData.components.find((c: any) => c.type === 'HEADER');
    const buttonsComponent = templateData.components.find((c: any) => c.type === 'BUTTONS');

    // Handle Header
    if (headerComponent) {
      if (headerComponent.format === 'IMAGE') {
        let imageUrl = manualComponents?.find((c: any) => c.type === 'header')?.parameters?.[0]?.image?.link;
        if (!imageUrl) {
          const potentialUrl = headerComponent.example?.header_handle?.[0];
          if (potentialUrl && (potentialUrl.startsWith('http') || potentialUrl.startsWith('https'))) {
            imageUrl = potentialUrl;
          }
        }

        if (imageUrl) {
          console.log(`Processing header image: ${imageUrl}`);
          // Always try to upload to Meta to get an ID, especially for Meta's own CDN links
          // which are often rejected when sent as a "link"
          const metaMediaId = await uploadMediaToMeta(metaAccessToken, metaPhoneNumberId, imageUrl, 'image');
          
          if (metaMediaId) {
            console.log(`Using Meta Media ID for header: ${metaMediaId}`);
            finalComponents.push({
              type: "header",
              parameters: [{
                type: "image",
                image: { id: metaMediaId }
              }]
            });
          } else if (imageUrl.startsWith('http')) {
            // Fallback to link if upload fails but we have a valid-looking URL
            console.log(`Fallback to image link: ${imageUrl}`);
            finalComponents.push({
              type: "header",
              parameters: [{
                type: "image",
                image: { link: imageUrl }
              }]
            });
          }
        }
      } else if (headerComponent.format === 'VIDEO' || headerComponent.format === 'DOCUMENT') {
         let mediaUrl = manualComponents?.find((c: any) => c.type === 'header')?.parameters?.[0]?.[headerComponent.format.toLowerCase()]?.link;
         if (!mediaUrl) mediaUrl = headerComponent.example?.header_handle?.[0];

         if (mediaUrl) {
            const type = headerComponent.format.toLowerCase();
            console.log(`Processing header ${type}: ${mediaUrl}`);
            const metaMediaId = await uploadMediaToMeta(metaAccessToken, metaPhoneNumberId, mediaUrl, type);

            if (metaMediaId) {
              finalComponents.push({
                type: "header",
                parameters: [{
                  type,
                  [type]: { id: metaMediaId }
                }]
              });
            } else if (mediaUrl.startsWith('http')) {
              const mediaObj: any = { link: mediaUrl };
              if (type === 'document') mediaObj.filename = "document.pdf";
              
              finalComponents.push({
                type: "header",
                parameters: [{ type, [type]: mediaObj }]
              });
            }
         }
      } else if (headerComponent.format === 'TEXT' && headerComponent.text?.includes('{{1}}')) {
        const headerText = manualComponents?.find((c: any) => c.type === 'header')?.parameters?.[0]?.text || contact?.name || 'Cliente';
        finalComponents.push({
          type: "header",
          parameters: [{ type: "text", text: headerText }]
        });
      }
    }

    // Handle Body Variables
    if (bodyComponent && bodyComponent.text) {
      let text = bodyComponent.text;
      const varCount = (text.match(/\{\{\d+\}\}/g) || []).length;
      
      if (varCount > 0) {
        const manualBodyParams = manualComponents?.find((c: any) => c.type === 'body')?.parameters || [];
        const bodyParams = [];
        for (let i = 1; i <= varCount; i++) {
          const manualParam = manualBodyParams[i-1]?.text;
          const val = manualParam || (i === 1 ? (contact?.name || 'Cliente') : "-");
          bodyParams.push({ type: "text", text: val });
          text = text.replace(`{{${i}}}`, val);
        }
        finalComponents.push({ type: "body", parameters: bodyParams });
        messageContent = text;
      } else {
        messageContent = text;
      }
    }

    // Handle Buttons
    if (buttonsComponent && buttonsComponent.buttons) {
      const buttonParams: any[] = [];
      buttonsComponent.buttons.forEach((b: any, index: number) => {
        if (b.type === 'URL' && b.url?.includes('{{1}}')) {
          const manualBtn = manualComponents?.find((c: any) => c.type === 'button' && (c.index === index || index === 0));
          const btnParam = manualBtn?.parameters?.[0]?.text || contact?.id || '1';
          
          buttonParams.push({
            type: "button",
            sub_type: "url",
            index: index.toString(),
            parameters: [{ type: "text", text: btnParam }]
          });
        } else if (b.type === 'COPY_CODE' && b.example?.[0]) {
          const manualBtn = manualComponents?.find((c: any) => c.type === 'button' && (c.index === index || index === 0));
          const btnParam = manualBtn?.parameters?.[0]?.text || b.example[0];
          
          buttonParams.push({
            type: "button",
            sub_type: "copy_code",
            index: index.toString(),
            parameters: [{ type: "text", text: btnParam }]
          });
        }
      });
      
      if (buttonParams.length > 0) {
        finalComponents.push(...buttonParams);
      }
    }
  }

  const metaRequestBody = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: finalComponents
    }
  };

  console.log('Sending Template to Meta:', JSON.stringify(metaRequestBody, null, 2));

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${metaPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${metaAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaRequestBody),
    }
  );

  const result = await response.json();
  
  if (!response.ok) {
    console.error('Meta API Error (internalSendTemplate):', JSON.stringify(result, null, 2));
    return new Response(JSON.stringify({ 
      success: false, 
      error: result.error?.message || 'Meta API returned an error',
      details: result 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Save to message history
  if (result.messages && result.messages[0]) {
    const headerParams = finalComponents.find((c: any) => c.type === "header")?.parameters?.[0];
    let mediaUrl = null;
    
    if (headerParams) {
      const type = headerParams.type;
      // First check for a link in headerParams itself
      mediaUrl = headerParams[type]?.link;
      
      // If no link, check manualComponents for original URL
      if (!mediaUrl || /^\d+$/.test(mediaUrl.toString())) {
        const manualUrl = manualComponents?.find((c: any) => c.type === 'header')?.parameters?.[0]?.[type]?.link;
        if (manualUrl) {
          mediaUrl = manualUrl;
        }
      }
      
      // If still no link, check template data examples
      if (!mediaUrl || /^\d+$/.test(mediaUrl.toString())) {
        const headerComponent = templateData.components?.find((c: any) => c.type === 'HEADER');
        const exampleUrl = headerComponent?.example?.header_handle?.[0];
        if (exampleUrl) {
          mediaUrl = exampleUrl;
        }
      }

      // If it's a Meta temporary URL, it might be the reason for "broken images" in chat history
      // We already try to use the permanent stored URL above if it exists
    }

    // Ensure content has the [Template: name] prefix for the frontend to recognize it
    const finalContent = `[Template: ${templateName}] ${messageContent}`;

    // Improve mediaUrl capture: if it was a numeric ID, try to get the original URL from finalComponents
    let finalMediaUrl = mediaUrl;
    if (!finalMediaUrl || /^\d+$/.test(finalMediaUrl.toString())) {
      const headerParam = finalComponents.find((c: any) => c.type === "header")?.parameters?.[0];
      const type = headerParam?.type;
      if (type && headerParam[type]?.link) {
        finalMediaUrl = headerParam[type].link;
      }
    }

    await supabase.from('crm_messages').insert({
      contact_id: contact.id,
      direction: 'outbound',
      content: finalContent,
      message_type: 'template',
      media_url: finalMediaUrl,
      meta_message_id: result.messages[0].id,
      status: 'sent'
    });


    await supabase.from('crm_contacts').update({ 
      total_messages_sent: (contact.total_messages_sent || 0) + 1,
      last_interaction: new Date().toISOString()
    }).eq('id', contact.id);
    
    await supabase.rpc('increment_crm_metric', { metric_column: 'sent_count' });
  }

  return new Response(JSON.stringify({ success: true, result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function executeVisualNode(supabase: any, flow: any, node: any, contactId: string, waId: string) {
  const { meta_access_token, meta_phone_number_id } = await getSettings(supabase)
  
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  console.log(`Executing node ${node.id} (${node.type}) for contact ${contactId}`);

  // Clear any existing next_execution_time when starting a new node
  await supabase.from('crm_contacts').update({ next_execution_time: null }).eq('id', contactId)

  // Handle Action/Content Nodes
  let sendResult = null;
  
  if (node.type === 'message') {
    const response = await handleInternalSendMessage(supabase, meta_phone_number_id, meta_access_token, {
      to: waId,
      text: node.data.text
    }, contact)
    sendResult = await response.json();
  } 
  else if (node.type === 'audio') {
    if (node.data.audioUrl) {
      const response = await handleInternalSendMessage(supabase, meta_phone_number_id, meta_access_token, {
        to: waId,
        audioUrl: node.data.audioUrl,
        isVoice: node.data.isPTT ?? true
      }, contact)
      sendResult = await response.json();
    } else {
      console.error('Audio node missing URL');
      sendResult = { success: false, error: 'Missing audio URL' };
    }
  }
  else if (node.type === 'video') {
    const response = await handleInternalSendMessage(supabase, meta_phone_number_id, meta_access_token, {
      to: waId,
      videoUrl: node.data.videoUrl
    }, contact)
    sendResult = await response.json();
  }
  else if (node.type === 'image') {
    const response = await handleInternalSendMessage(supabase, meta_phone_number_id, meta_access_token, {
      to: waId,
      imageUrl: node.data.imageUrl
    }, contact)
    sendResult = await response.json();
  }
  else if (node.type === 'question') {
    const response = await handleInternalSendMessage(supabase, meta_phone_number_id, meta_access_token, {
      to: waId,
      text: node.data.text,
      buttons: node.data.buttons.map((b: any, idx: number) => ({
        id: b.id || `btn-${idx}`,
        text: b.text
      }))
    }, contact)
    sendResult = await response.json();
    
    if (sendResult?.success) {
      await supabase.from('crm_contacts').update({ flow_state: 'waiting_response' }).eq('id', contactId)
      
      const timeoutEdge = flow.edges.find((e: any) => e.source === node.id && e.sourceHandle === 'timeout')
      if (timeoutEdge) {
        const timeoutMin = parseInt(node.data.timeout) || 20
        const scheduledFor = new Date(Date.now() + timeoutMin * 60000).toISOString()
        
        await supabase.from('crm_scheduled_messages').insert({
          contact_id: contactId,
          flow_id: flow.id,
          node_id: timeoutEdge.target,
          scheduled_for: scheduledFor,
          message_data: { action: 'continueFlow' }
        })
        
        // Store timeout as next_execution_time
        await supabase.from('crm_contacts').update({ next_execution_time: scheduledFor }).eq('id', contactId)
      }
      return new Response(JSON.stringify({ success: true, node: node.id, state: 'waiting_response' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }
  else if (node.type === 'waitResponse') {
    await supabase.from('crm_contacts').update({ flow_state: 'waiting_response' }).eq('id', contactId)
    
    const timeoutEdge = flow.edges.find((e: any) => e.source === node.id && e.sourceHandle === 'timeout')
    if (timeoutEdge) {
      const timeoutMin = parseInt(node.data.timeout) || 20
      const scheduledFor = new Date(Date.now() + timeoutMin * 60000).toISOString()
      
      await supabase.from('crm_scheduled_messages').insert({
        contact_id: contactId,
        flow_id: flow.id,
        node_id: timeoutEdge.target,
        scheduled_for: scheduledFor,
        message_data: { action: 'continueFlow' }
      })
      
      await supabase.from('crm_contacts').update({ next_execution_time: scheduledFor }).eq('id', contactId)
    }
    return new Response(JSON.stringify({ success: true, node: node.id, state: 'waiting_response' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  else if (node.type === 'delay') {
    const delay = parseInt(node.data.delay) || 5
    const unit = node.data.unit || 'segundos'
    let delayMs = delay * 1000
    if (unit === 'minutos') delayMs *= 60000
    if (unit === 'horas') delayMs *= 3600000

    const scheduledFor = new Date(Date.now() + delayMs).toISOString()
    await supabase.from('crm_contacts').update({ next_execution_time: scheduledFor }).eq('id', contactId)

    // Process delay in real-time for any delay up to 25 seconds to ensure exact timing
    // Any delay longer than 25s will be scheduled via database to avoid function timeout
    if (delayMs <= 25000) {
      if (delayMs > 0) {
        console.log(`Waiting ${delayMs}ms for flow delay...`);
        await sleep(delayMs);
      }
      const nextEdge = flow.edges.find((e: any) => e.source === node.id)
      if (nextEdge) {
        const nextNode = flow.nodes.find((n: any) => n.id === nextEdge.target)
        if (nextNode) {
          console.log(`Delay finished, proceeding to node: ${nextNode.id}`);
          await supabase.from('crm_contacts').update({ 
            current_node_id: nextNode.id, 
            next_execution_time: null,
            last_flow_interaction: new Date().toISOString()
          }).eq('id', contactId)
          return executeVisualNode(supabase, flow, nextNode, contactId, waId)
        }
      }
    } else {
      const nextEdge = flow.edges.find((e: any) => e.source === node.id)
      if (nextEdge) {
        await supabase.from('crm_scheduled_messages').insert({
          contact_id: contactId,
          flow_id: flow.id,
          node_id: nextEdge.target,
          scheduled_for: scheduledFor,
          message_data: { action: 'continueFlow' }
        })
        await supabase.from('crm_contacts').update({ flow_state: 'waiting_delay' }).eq('id', contactId)
      }
    }
  }
  else if (node.type === 'crmAction') {
    const action = node.data.action || 'Notificar Agente'
    if (action === 'Finalizar Atendimento' || action === 'Mudar Status: Ganho') {
      await supabase.from('crm_contacts').update({ status: 'closed' }).eq('id', contactId)
    } else if (action === 'Mudar Status: Perdido') {
      await supabase.from('crm_contacts').update({ status: 'lost' }).eq('id', contactId)
    } else if (action === 'Adicionar Etiqueta' && node.data.statusValue) {
      const updateData: any = { status: node.data.statusValue };
      if (node.data.statusValue === 'human') updateData.ai_active = false;
      await supabase.from('crm_contacts').update(updateData).eq('id', contactId)
    } else if (action === 'Humanizar Atendimento') {
      await supabase.from('crm_contacts').update({ status: 'human', ai_active: false }).eq('id', contactId)
    }
    sendResult = { success: true };
  }
  else if (node.type === 'template') {
    if (node.data.templateName) {
      const templateName = node.data.templateName
      const languageCode = node.data.language || 'pt_BR'
      const manualComponents = node.data.imageUrl ? [{
        type: "header",
        parameters: [{
          type: "image",
          image: { link: node.data.imageUrl }
        }]
      }] : [];

      console.log(`Executing template node ${templateName} to ${waId}...`);

      const response = await internalSendTemplate(
        supabase,
        meta_phone_number_id,
        meta_access_token,
        waId,
        templateName,
        languageCode,
        manualComponents,
        contact,
        node.id // Pass node ID to save to message history correctly if needed
      );

      sendResult = await response.json();
      
      // internalSendTemplate returns a Response, we check success from the JSON
      if (!response.ok || !sendResult.success) {
        console.error('Template node send failed:', JSON.stringify(sendResult, null, 2));
      }
    } else {
      sendResult = { success: false, error: 'Missing template name' };
    }
  }

  else if (node.type === 'jump') {
    if (node.data.targetFlowId) {
      console.log(`Jumping from flow ${flow.id} to flow ${node.data.targetFlowId} for contact ${contactId}`);
      
      // Stop current flow by deleting scheduled messages
      await supabase.from('crm_scheduled_messages').delete().eq('contact_id', contactId);
      
      let { data: targetFlow } = await supabase
        .from('crm_flows')
        .select('*')
        .eq('id', node.data.targetFlowId)
        .single()
      
      // Fallback: search by name if ID not found
      if (!targetFlow && node.data.targetFlowName) {
        console.log(`Flow ID ${node.data.targetFlowId} not found, searching by name: ${node.data.targetFlowName}`);
        const { data: flowsByName } = await supabase
          .from('crm_flows')
          .select('*')
          .eq('name', node.data.targetFlowName)
          .eq('is_active', true)
          .limit(1);
        
        if (flowsByName && flowsByName.length > 0) {
          targetFlow = flowsByName[0];
          console.log(`Found matching flow by name with ID: ${targetFlow.id}`);
        }
      }
      
      if (targetFlow && targetFlow.nodes && targetFlow.nodes.length > 0) {
        const nodeIdsWithTarget = new Set(targetFlow.edges.map((e: any) => e.target))
        const startNode = targetFlow.nodes.find((n: any) => !nodeIdsWithTarget.has(n.id)) || targetFlow.nodes[0]
        
        await supabase
          .from('crm_contacts')
          .update({
            current_flow_id: targetFlow.id,
            current_node_id: startNode.id,
            flow_state: 'running',
            last_flow_interaction: new Date().toISOString(),
            next_execution_time: null
          })
          .eq('id', contactId)
        
        return executeVisualNode(supabase, targetFlow, startNode, contactId, waId)
      } else if (targetFlow) {
        // Fallback to old steps system
        await supabase
          .from('crm_contacts')
          .update({
            current_flow_id: targetFlow.id,
            current_step_index: 0,
            flow_state: 'running',
            last_flow_interaction: new Date().toISOString()
          })
          .eq('id', contactId)
        
        const { data: step } = await supabase
          .from('crm_flow_steps')
          .select('*')
          .eq('flow_id', targetFlow.id)
          .eq('step_order', 0)
          .single()
        
        if (step) return processStep(supabase, step, contactId, waId)
        
        return new Response(JSON.stringify({ success: true, message: 'Jumped to step-based flow' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        console.error('Target flow not found');
        sendResult = { success: false, error: 'Target flow not found' };
      }
    } else {
      sendResult = { success: false, error: 'Missing target flow ID' };
    }
  }

  // AUTO-CONTINUE for non-waiting nodes
  const autoContinueTypes = ['message', 'audio', 'video', 'image', 'crmAction', 'followup', 'template']
  if (autoContinueTypes.includes(node.type)) {
    // Only continue if the action was successful
    if (sendResult?.success) {
      const nextEdge = flow.edges.find((e: any) => e.source === node.id && !e.sourceHandle)
      if (nextEdge) {
        const nextNode = flow.nodes.find((n: any) => n.id === nextEdge.target)
        if (nextNode) {
          await supabase.from('crm_contacts').update({ 
            current_node_id: nextNode.id,
            last_flow_interaction: new Date().toISOString()
          }).eq('id', contactId)
          
          return executeVisualNode(supabase, flow, nextNode, contactId, waId)
        }
      } else {
        // No more nodes, finish flow
        console.log(`No more nodes after ${node.id}, finishing flow.`);
        await supabase.from('crm_contacts').update({ 
          flow_state: 'idle', 
          current_flow_id: null, 
          current_node_id: null 
        }).eq('id', contactId);
      }
    } else {
      console.error(`Node ${node.id} failed, stopping flow:`, sendResult?.error);
      await supabase.from('crm_contacts').update({ 
        flow_state: 'error',
        metadata: { ...contact?.metadata, last_flow_error: sendResult?.error }
      }).eq('id', contactId)
    }
  }

  return new Response(JSON.stringify({ success: true, node: node.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getSettings(supabase: any) {
  const { data: settings } = await supabase
    .from('crm_settings')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()
  return settings
}

async function processStep(supabase: any, step: any, contactId: string, waId: string) {
  if (step.step_type === 'delay') {
    const scheduledFor = new Date(Date.now() + (step.delay_seconds || 5) * 1000).toISOString()
    await supabase
      .from('crm_contacts')
      .update({ 
        flow_state: 'waiting_delay', 
        last_flow_interaction: new Date().toISOString(),
        next_execution_time: scheduledFor
      })
      .eq('id', contactId)
    
    return new Response(JSON.stringify({ success: true, action: 'wait', seconds: step.delay_seconds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  
  if (step.step_type === 'wait_response') {
    await supabase
      .from('crm_contacts')
      .update({ flow_state: 'waiting_response', last_flow_interaction: new Date().toISOString() })
      .eq('id', contactId)
    
    return new Response(JSON.stringify({ success: true, action: 'wait_response' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, message: 'Step processed' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getAppId(accessToken: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`);
    const data = await response.json();
    return data.data?.app_id;
  } catch (error) {
    console.error('Error getting App ID:', error);
    return null;
  }
}

async function getMetaHeaderHandle(accessToken: string, appId: string, mediaUrl: string) {
  try {
    console.log(`Getting Meta header handle for: ${mediaUrl}`);
    
    // 1. Fetch the file content
    const fileResponse = await fetch(mediaUrl);
    if (!fileResponse.ok) throw new Error(`Failed to fetch media from URL: ${mediaUrl}`);
    const blob = await fileResponse.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const fileSize = arrayBuffer.byteLength;
    const fileType = blob.type || 'image/png';

    // 2. Start Resumable Upload
    const uploadStartResponse = await fetch(
      `https://graph.facebook.com/v20.0/${appId}/uploads?file_length=${fileSize}&file_type=${fileType}&access_token=${accessToken}`,
      { method: 'POST' }
    );
    const uploadStartData = await uploadStartResponse.json();
    if (!uploadStartResponse.ok) throw new Error(`Failed to start upload: ${JSON.stringify(uploadStartData)}`);
    const uploadSessionId = uploadStartData.id;

    // 3. Upload the file content
    const uploadResponse = await fetch(
      `https://graph.facebook.com/v20.0/${uploadSessionId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${accessToken}`,
          'file_offset': '0'
        },
        body: arrayBuffer
      }
    );
    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) throw new Error(`Failed to upload content: ${JSON.stringify(uploadData)}`);
    
    return uploadData.h; // The handle
  } catch (error) {
    console.error('Error getting Meta header handle:', error);
    return null;
  }
}

async function uploadMediaToMeta(accessToken: string, phoneNumberId: string, mediaUrl: string, type: string) {
  try {
    console.log(`Uploading media to Meta from URL: ${mediaUrl}`);
    const fileResponse = await fetch(mediaUrl);
    if (!fileResponse.ok) throw new Error(`Failed to fetch media: ${mediaUrl}`);
    const blob = await fileResponse.blob();
    
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('type', type);
    formData.append('messaging_product', 'whatsapp');

    const response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/media`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(`Meta media upload failed: ${JSON.stringify(data)}`);
    
    return data.id;
  } catch (error) {
    console.error('Error uploading media to Meta:', error);
    return null;
  }
}

async function downloadAndStoreMetaMedia(supabase: any, token: string, mediaUrl: string, type: string, baseName: string) {
  try {
    const response = await fetch(mediaUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch media from Meta: ${response.statusText}`);
    
    const blob = await response.blob();
    const ext = blob.type.split('/')[1] || 'bin';
    const filePath = `templates/${type}/${Date.now()}_${baseName}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('crm-media')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: true
      });
      
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('crm-media')
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    console.error('Error in downloadAndStoreMetaMedia:', error);
    return null;
  }
}
