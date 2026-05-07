#!/bin/bash
echo "🚀 Iniciando reconstrução total..."
cat <<'WPP' > wpp-server.cjs
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://sepmaqhdiextgbtxyxrx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcG1hcWhkaWV4dGdidHh5eHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODQyNzEsImV4cCI6MjAzMjQ2MDI3MX0.mI-5O-yS6_y-0S8X7Y-S0S-O-yS6_y-0S8X7Y-S0S';

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "renda_extra" }),
    puppeteer: { 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    }
});

async function updateSession(data) {
    try {
        await fetch(\`\${SUPABASE_URL}/rest/v1/wpp_bot_session?id=eq.renda_extra\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': \`Bearer \${ANON_KEY}\` },
            body: JSON.stringify(data)
        });
    } catch (e) {}
}

async function syncToCRM(msg) {
    try {
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const waId = msg.from.includes('@g.us') ? msg.from : (msg.fromMe ? msg.to : msg.from);
        
        // Nome Real: Prioridade para o nome do Chat/Grupo, depois o PushName (nome que a pessoa salvou no WA dela)
        const realName = chat.name || contact.pushname || contact.name || waId.split('@')[0];

        // Sincronizar Contato/Grupo com Nome Real
        await fetch(\`\${SUPABASE_URL}/rest/v1/crm_contacts\`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'apikey': ANON_KEY, 
                'Authorization': \`Bearer \${ANON_KEY}\`,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                wa_id: waId,
                name: realName,
                last_interaction: new Date().toISOString(),
                status: 'responded',
                source_type: msg.from.includes('@g.us') ? 'group' : 'direct'
            })
        });

        const res = await fetch(\`\${SUPABASE_URL}/rest/v1/crm_contacts?wa_id=eq.\${waId}\`, {
            headers: { 'apikey': ANON_KEY, 'Authorization': \`Bearer \${ANON_KEY}\` }
        });
        const contacts = await res.json();
        if (!contacts.length) return;

        // Inserir Mensagem com Timestamp Real
        await fetch(\`\${SUPABASE_URL}/rest/v1/crm_messages\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': \`Bearer \${ANON_KEY}\` },
            body: JSON.stringify({
                contact_id: contacts[0].id,
                content: msg.body || '[Mídia]',
                direction: msg.fromMe ? 'outgoing' : 'incoming',
                type: 'text',
                status: 'delivered',
                created_at: new Date(msg.timestamp * 1000).toISOString()
            })
        });
        console.log(\`[DEBUG] Sincronizando: \${realName}\`);
    } catch (e) {
        console.error("Erro na sincronização:", e.message);
    }
}

client.on('qr', async (qr) => {
    const qrImage = await QRCode.toDataURL(qr);
    qrcodeTerminal.generate(qr, { small: true });
    updateSession({ qr_code: qrImage, status: 'connecting', updated_at: new Date() });
});

client.on('ready', async () => {
    console.log('✅ WhatsApp Conectado! Iniciando Sincronização de Nomes e Histórico...');
    updateSession({ status: 'connected', qr_code: null, updated_at: new Date() });
    
    const chats = await client.getChats();
    console.log(\`📦 Encontrados \${chats.length} chats ativos.\`);
    
    // Sincroniza mais chats para garantir que tudo apareça
    for (const chat of chats.slice(0, 100)) {
        const messages = await chat.fetchMessages({ limit: 50 });
        for (const m of messages) {
            await syncToCRM(m);
        }
    }
    console.log('🏁 Sincronização inicial concluída.');
});

client.on('message', syncToCRM);
client.on('message_create', (msg) => { if(msg.fromMe) syncToCRM(msg); });

client.initialize();

// Loop de comandos e mensagens pendentes
setInterval(async () => {
    try {
        const res = await fetch(\`\${SUPABASE_URL}/rest/v1/wpp_bot_messages?status=eq.pending\`, {
            headers: { 'apikey': ANON_KEY, 'Authorization': \`Bearer \${ANON_KEY}\` }
        });
        const msgs = await res.json();
        for (const m of msgs) {
            await client.sendMessage(\`\${m.phone}@c.us\`, m.message);
            await fetch(\`\${SUPABASE_URL}/rest/v1/wpp_bot_messages?id=eq.\${m.id}\`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': \`Bearer \${ANON_KEY}\` },
                body: JSON.stringify({ status: 'sent', sent_at: new Date() })
            });
        }
        
        // Comando de Logout
        const cmdRes = await fetch(\`\${SUPABASE_URL}/rest/v1/wpp_bot_commands?processed=eq.false\`, {
            headers: { 'apikey': ANON_KEY, 'Authorization': \`Bearer \${ANON_KEY}\` }
        });
        const cmds = await cmdRes.json();
        for (const cmd of cmds) {
            if (cmd.command === 'logout') {
                await client.logout();
                process.exit(0);
            }
            await fetch(\`\${SUPABASE_URL}/rest/v1/wpp_bot_commands?id=eq.\${cmd.id}\`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': \`Bearer \${ANON_KEY}\` },
                body: JSON.stringify({ processed: true })
            });
        }
    } catch (e) {}
}, 3000);
WPP

# Limpeza e Reinicialização
pm2 delete wpp-bot || true
pm2 start wpp-server.cjs --name wpp-bot
pm2 save
echo "✅ SCRIPT ATUALIZADO! Nomes e Histórico em Sincronização."
