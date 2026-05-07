const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://sepmaqhdiextgbtxyxrx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcG1hcWhkaWV4dGdidHh5eHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTAyNjYsImV4cCI6MjA5MzcyNjI2Nn0.w0jxw0jokQuNubdnYZk4LextB_eliLyB2VdB89dJs3c';
const SESSION_ID = 'renda_extra';

let client = null;

async function syncStatus(status, details = {}) {
    console.log(`[DEBUG] Sincronizando no banco -> Status: ${status}`);
    try {
        const payload = { 
            status, 
            phone_number: client?.info?.wid?.user || null,
            updated_at: new Date().toISOString(),
            ...details 
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/wpp_bot_session?id=eq.${SESSION_ID}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json', 
                'apikey': ANON_KEY, 
                'Authorization': `Bearer ${ANON_KEY}`,
                'Prefer': 'return=minimal' 
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log(`[DEBUG] Banco atualizado com sucesso!`);
        } else {
            const text = await response.text();
            console.error(`[DEBUG] Erro ao atualizar banco: ${response.status} - ${text}`);
        }
    } catch (e) { 
        console.error('[DEBUG] Erro de rede na sincronização:', e.message); 
    }
}

function startBot() {
    if (client) {
        console.log('[DEBUG] Bot já em execução ou iniciando...');
        return;
    }
    
    console.log('\n[DEBUG] 🚀 INICIANDO NAVEGADOR WHATSAPP...');
    client = new Client({
        authStrategy: new LocalAuth({ clientId: SESSION_ID }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
        }
    });

    client.on('qr', (qr) => {
        console.log('\n[DEBUG] 📱 QR CODE GERADO! ESCANEIE NO CRM.');
        qrcode.generate(qr, { small: true });
        // Importante: Detalhes do QR Code devem ir para o banco
        syncStatus('connecting', { qr_code: qr, request_qr: false });
    });

    client.on('ready', () => {
        console.log('\n[DEBUG] ✅ WHATSAPP CONECTADO COM SUCESSO!');
        syncStatus('connected', { qr_code: null, request_qr: false });
    });

    client.on('authenticated', () => {
        console.log('[DEBUG] 🔓 Autenticado!');
    });

    client.on('disconnected', (reason) => {
        console.log('[DEBUG] 🔌 WhatsApp desconectado:', reason);
        syncStatus('disconnected', { qr_code: null });
        client = null;
    });

    client.initialize().catch(err => {
        console.error('[DEBUG] Erro fatal na inicialização:', err.message);
        client = null;
    });
}

// Verifica comandos pendentes
setInterval(async () => {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/wpp_bot_commands?processed=eq.false&limit=1`, {
            headers: { 
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`
            }
        });
        const commands = await res.json();
        
        if (Array.isArray(commands) && commands.length > 0) {
            const cmd = commands[0];
            console.log(`[DEBUG] Comando recebido: ${cmd.command}`);
            
            if (cmd.command === 'requestQr' || cmd.command === 'restart') {
                if (client) {
                    console.log('[DEBUG] Reiniciando cliente existente...');
                    await client.destroy().catch(() => {});
                    client = null;
                }
                startBot();
            }

            // Marca comando como lido
            await fetch(`${SUPABASE_URL}/rest/v1/wpp_bot_commands?id=eq.${cmd.id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json', 
                    'apikey': ANON_KEY,
                    'Authorization': `Bearer ${ANON_KEY}`
                },
                body: JSON.stringify({ processed: true })
            });
        }
    } catch (e) {
        // Silencioso
    }
}, 3000);

console.log('\n[DEBUG] 📡 SERVIDOR WPP-WEB ONLINE E AGUARDANDO COMANDOS...');
syncStatus('disconnected'); // Reset inicial
