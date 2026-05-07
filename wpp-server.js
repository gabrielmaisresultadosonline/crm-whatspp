import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { OpenAI } from 'openai';
import fetch from 'node-fetch';

// Configurar DeepSeek
const deepseek = new OpenAI({
    apiKey: 'sk-2391c5c316e54c578bdf3cb1c84d465b',
    baseURL: 'https://api.deepseek.com'
});

// Configuração do Backend Supabase
const SUPABASE_URL = 'https://sepmaqhdiextgbtxyxrx.supabase.co';
const BOT_TOKEN = 'wpp-bot-master-token'; // Use uma chave forte

const SESSION_ID = 'renda_extra';
let grupoAtivo = null;
const PALAVRAS_GATILHO = ['quero entrar', 'renda extra', 'gostaria de ser adicionado', 'add grupo', 'me adiciona', 'quero participar'];
const aguardandoConfirmacao = new Map();

// Função para sincronizar com o Supabase
async function syncStatus(status, details = {}) {
    try {
        await fetch(`${SUPABASE_URL}/functions/v1/wpp-bot-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bot-token': BOT_TOKEN
            },
            body: JSON.stringify({
                action: 'botHeartbeat',
                status: status,
                phone_number: client.info?.wid?.user,
                ...details
            })
        });
    } catch (e) {
        console.error('Error syncing status:', e.message);
    }
}

async function entenderIntencao(mensagem) {
    try {
        const completion = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "Responda apenas SIM ou NAO. SIM se a pessoa quer entrar no grupo."
                },
                {
                    role: "user",
                    content: `Pessoa disse: "${mensagem}". Quer entrar? Responda SIM ou NAO:`
                }
            ],
            temperature: 0.1,
            max_tokens: 10
        });
        return completion.choices[0].message.content.trim().toUpperCase() === 'SIM';
    } catch (error) {
        const texto = mensagem.toLowerCase();
        const sim = ['sim', 'quero', 'yes', 'ok', 'pode', 'bora', 'claro', 'estou dentro', 'aceito'];
        return sim.some(p => texto.includes(p));
    }
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: SESSION_ID }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n📱 ESCANEIE O QR CODE NO CRM:\n');
    qrcode.generate(qr, { small: true });
    
    // Envia o QR code para o banco de dados para mostrar no CRM
    syncStatus('connecting', { qr_code: qr });
});

client.on('authenticated', () => {
    console.log('✅ Autenticado!\n');
    syncStatus('connected');
});

client.on('ready', async () => {
    console.log('🚀 Bot pronto!\n');
    syncStatus('connected');
});

client.on('message', async (message) => {
    if (message.from === 'status@broadcast') return;
    if (message.fromMe) return;
    if (message.from.includes('@g.us')) return;
    
    const texto = message.body.toLowerCase();
    const nome = message._data.notifyName || message.from.split('@')[0] || 'Usuário';
    const numero = message.from;
    
    // Verificar gatilho
    const contemGatilho = PALAVRAS_GATILHO.some(palavra => 
        texto.includes(palavra.toLowerCase())
    );
    
    if (contemGatilho && !aguardandoConfirmacao.has(numero)) {
        aguardandoConfirmacao.set(numero, { nome, timestamp: Date.now() });
        await client.sendMessage(numero, `🔐 Olá ${nome}!\n\nResponda *SIM* para entrar no nosso grupo VIP.`);
        return;
    }
    
    if (aguardandoConfirmacao.has(numero)) {
        const querEntrar = await entenderIntencao(message.body);
        if (querEntrar) {
            aguardandoConfirmacao.delete(numero);
            await client.sendMessage(numero, `✅ Em breve você será adicionado!`);
        }
        return;
    }
});

client.on('disconnected', () => {
    console.log('❌ Desconectado');
    syncStatus('disconnected');
});

// Loop para buscar mensagens pendentes do CRM para enviar
setInterval(async () => {
    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/wpp-bot-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bot-token': BOT_TOKEN
            },
            body: JSON.stringify({ action: 'botFetchPending' })
        });
        const data = await res.json();
        
        if (data.commands?.request_logout) {
            console.log('Logout solicitado pelo CRM...');
            await client.logout();
            return;
        }

        if (data.messages) {
            for (const msg of data.messages) {
                try {
                    console.log(`Enviando mensagem para ${msg.phone}...`);
                    await client.sendMessage(`${msg.phone}@c.us`, msg.message);
                    await fetch(`${SUPABASE_URL}/functions/v1/wpp-bot-admin`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-bot-token': BOT_TOKEN
                        },
                        body: JSON.stringify({ action: 'botUpdateMessage', message_id: msg.id, status: 'sent' })
                    });
                } catch (err) {
                    console.error('Erro ao enviar:', err.message);
                }
            }
        }
    } catch (e) {
        // Silencioso
    }
}, 10000);

console.log('🚀 Iniciando Bot...');
client.initialize();
