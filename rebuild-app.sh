#!/bin/bash
echo "🚀 Iniciando reconstrução total do sistema..."

# 1. Atualizar o Servidor WhatsApp (Backend)
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
        await fetch(`${SUPABASE_URL}/rest/v1/wpp_bot_session?id=eq.renda_extra`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
            body: JSON.stringify(data)
        });
    } catch (e) {}
}

async function syncToCRM(msg) {
    try {
        if (!msg.body && !msg.hasMedia) return;
        
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const waId = msg.from.includes('@g.us') ? msg.from : (msg.fromMe ? msg.to : msg.from);
        
        let realName = chat.name;
        const isNumber = (val) => /^\d+$/.test(val.replace(/[^\d]/g, ''));
        
        if (!realName || isNumber(realName)) {
            realName = contact.name || contact.pushname || chat.name || waId.split('@')[0];
        }

        await fetch(`${SUPABASE_URL}/rest/v1/crm_contacts`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'apikey': ANON_KEY, 
                'Authorization': `Bearer ${ANON_KEY}`,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                wa_id: waId,
                name: realName,
                last_interaction: new Date(msg.timestamp * 1000).toISOString(),
                status: 'responded',
                source_type: msg.from.includes('@g.us') ? 'group' : 'direct'
            })
        });

        const res = await fetch(`${SUPABASE_URL}/rest/v1/crm_contacts?wa_id=eq.${waId}`, {
            headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
        });
        const contacts = await res.json();
        if (!contacts || !contacts.length) return;

        await fetch(`${SUPABASE_URL}/rest/v1/crm_messages`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'apikey': ANON_KEY, 
                'Authorization': `Bearer ${ANON_KEY}`,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                contact_id: contacts[0].id,
                content: msg.body || '[Mídia]',
                direction: msg.fromMe ? 'outgoing' : 'incoming',
                type: 'text',
                status: 'delivered',
                created_at: new Date(msg.timestamp * 1000).toISOString()
            })
        });
        console.log(`[DEBUG] Sincronizando: ${realName}`);
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
    console.log('✅ WhatsApp Conectado! Sincronizando nomes e histórico...');
    updateSession({ status: 'connected', qr_code: null, updated_at: new Date() });
    
    const chats = await client.getChats();
    console.log(`📦 Encontrados ${chats.length} chats ativos.`);
    
    for (const chat of chats.slice(0, 50)) {
        try {
            const messages = await chat.fetchMessages({ limit: 40 });
            for (const m of messages) {
                await syncToCRM(m);
            }
        } catch (err) {}
    }
    console.log('🏁 Sincronização concluída.');
});

client.on('message', syncToCRM);
client.on('message_create', (msg) => { if(msg.fromMe) syncToCRM(msg); });

client.initialize();

setInterval(async () => {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/wpp_bot_messages?status=eq.pending`, {
            headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
        });
        const msgs = await res.json();
        for (const m of msgs) {
            const target = m.phone.includes('@g.us') ? m.phone : `${m.phone}@c.us`;
            await client.sendMessage(target, m.message);
            await fetch(`${SUPABASE_URL}/rest/v1/wpp_bot_messages?id=eq.${m.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
                body: JSON.stringify({ status: 'sent', sent_at: new Date() })
            });
        }
    } catch (e) {}
}, 5000);
WPP

# 2. Reconstruir o Frontend (Interface)
echo "📦 Instalando dependências e gerando novo build..."
npm install
npm run build

# 3. Reiniciar Processos
echo "🔄 Reiniciando servidores..."
pm2 delete wpp-bot || true
pm2 start wpp-server.cjs --name wpp-bot
pm2 save
pm2 restart all

echo "✅ TUDO PRONTO! Agora os nomes e históricos serão sincronizados automaticamente."
echo "💡 DICA: Pressione CTRL+F5 no navegador para ver as mudanças."
