/**
 * Bot WhatsApp - Renda Extra v2 / I.A MRO
 * --------------------------------------------------------------
 * Conecta via whatsapp-web.js (LocalAuth + puppeteer headless),
 * envia o QR Code para a edge function `wpp-bot-admin` para que
 * apareça na página /rendaextra2/admin, e processa mensagens
 * pendentes da fila.
 *
 * IMPORTANTE: o bot NÃO inicializa o cliente WhatsApp automaticamente.
 * Ele aguarda o comando `request_qr` do painel para gerar o QR Code.
 * Quando o painel pede um novo QR, qualquer sessão anterior é apagada
 * para garantir que um novo QR seja gerado (anulando a conexão antiga).
 *
 * Rodando na VPS:
 *   pm2 start index.js --name wpp-bot-mro --time
 *   pm2 logs wpp-bot-mro
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const fetch = require('node-fetch');

// Defaults públicos do projeto Lovable Cloud (podem ser sobrescritos via .env)
const DEFAULT_SUPABASE_URL = 'https://adljdeekwifwcdcgbpit.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkbGpkZWVrd2lmd2NkY2dicGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjk0MDMsImV4cCI6MjA4MDcwNTQwM30.odKBOAuEEW0WJEburLRTL9Qj1EbitETmhxqNoE_F_g4';

const SUPABASE_URL = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const WPP_BOT_TOKEN = process.env.WPP_BOT_TOKEN || 'wpp-bot-default-token-change-me';
const POLL_INTERVAL = Math.max(2, parseInt(process.env.POLL_INTERVAL || '5', 10)) * 1000;
const AUTH_PATH = './.wwebjs_auth';
const CLIENT_ID = 'renda-extra-v2';

if (!process.env.WPP_BOT_TOKEN) {
  console.warn('⚠️  WPP_BOT_TOKEN não definido em .env — usando token padrão.');
  console.warn('   Para produção defina o mesmo valor configurado em Lovable → Secrets → WPP_BOT_TOKEN.');
}

const ENDPOINT = `${SUPABASE_URL}/functions/v1/wpp-bot-admin`;

let currentStatus = 'disconnected';
let currentQr = null;
let currentPhone = null;
let client = null;
let initializing = false;

let lastBackendError = null;
let errorCount = 0;

async function callBackend(action, extra = {}) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        'x-bot-token': WPP_BOT_TOKEN,
      },
      body: JSON.stringify({ action, ...extra }),
    });

    if (!res.ok) {
      const text = await res.text();
      const errorMsg = `Backend ${action} ${res.status}: ${text.slice(0, 100)}`;
      
      // Só loga o erro se for diferente do último ou se já passou um tempo (throttling)
      if (errorMsg !== lastBackendError || errorCount % 10 === 0) {
        console.error(`⚠️  ${errorMsg}${errorCount > 0 ? ` (repetido ${errorCount}x)` : ''}`);
      }
      
      lastBackendError = errorMsg;
      errorCount++;
      return null;
    }

    // Sucesso: reseta controle de erros
    lastBackendError = null;
    errorCount = 0;
    return await res.json();
  } catch (err) {
    const errorMsg = `Erro chamando backend (${action}): ${err.message}`;
    if (errorMsg !== lastBackendError || errorCount % 10 === 0) {
      console.error(`⚠️  ${errorMsg}${errorCount > 0 ? ` (repetido ${errorCount}x)` : ''}`);
    }
    lastBackendError = errorMsg;
    errorCount++;
    return null;
  }
}

async function sendHeartbeat() {
  await callBackend('botHeartbeat', {
    status: currentStatus,
    qr_code: currentQr,
    phone_number: currentPhone,
  });
}

function wipeAuthSession() {
  try {
    const sessionDir = path.join(AUTH_PATH, `session-${CLIENT_ID}`);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log('🧹 Sessão antiga apagada para gerar novo QR.');
    }
  } catch (err) {
    console.error('Erro apagando sessão:', err.message);
  }
}

function buildClient() {
  return new Client({
    authStrategy: new LocalAuth({ clientId: CLIENT_ID, dataPath: AUTH_PATH }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
      ],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        '/usr/bin/chromium-browser' ||
        '/usr/bin/chromium' ||
        undefined,
    },
  });
}

function attachClientHandlers(c) {
  c.on('qr', async (qr) => {
    console.log('\n📱 QR Code recebido — enviando para o painel /rendaextra2/admin\n');
    qrcodeTerminal.generate(qr, { small: true });
    currentQr = qr;
    currentStatus = 'connecting';
    await sendHeartbeat();
  });

  c.on('authenticated', () => {
    console.log('✅ Autenticado com sucesso!');
    currentStatus = 'connecting';
    currentQr = null;
  });

  c.on('ready', async () => {
    currentStatus = 'connected';
    currentQr = null;
    try {
      currentPhone = c.info?.wid?.user || null;
    } catch {}
    console.log(`🚀 Bot conectado! Telefone: ${currentPhone || 'desconhecido'}`);
    await sendHeartbeat();
  });

  c.on('auth_failure', async (msg) => {
    console.error('❌ Falha na autenticação:', msg);
    currentStatus = 'disconnected';
    currentQr = null;
    await sendHeartbeat();
  });

  c.on('disconnected', async (reason) => {
    console.log('❌ Desconectado:', reason);
    currentStatus = 'disconnected';
    currentQr = null;
    currentPhone = null;
    await sendHeartbeat();
    try { await c.destroy(); } catch {}
    client = null;
    console.log('💤 Cliente destruído. Aguardando novo comando "Gerar QR" do painel.');
  });
}

async function startClientForQr({ wipe = true } = {}) {
  if (initializing) {
    console.log('⏳ Já está inicializando, ignorando comando duplicado.');
    return;
  }
  if (client && currentStatus === 'connected') {
    console.log('🔄 Conexão atual será encerrada para gerar novo QR.');
    try { await client.logout(); } catch {}
    try { await client.destroy(); } catch {}
    client = null;
  } else if (client) {
    try { await client.destroy(); } catch {}
    client = null;
  }

  if (wipe) wipeAuthSession();

  initializing = true;
  currentStatus = 'connecting';
  currentQr = null;
  currentPhone = null;
  await sendHeartbeat();

  console.log('🚀 Iniciando cliente WhatsApp para gerar QR Code...');
  client = buildClient();
  attachClientHandlers(client);
  try {
    await client.initialize();
  } catch (err) {
    console.error('Erro ao inicializar cliente:', err.message);
    currentStatus = 'disconnected';
    await sendHeartbeat();
    client = null;
  } finally {
    initializing = false;
  }
}

function formatPhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 13 && digits.startsWith('55') && digits[4] === '9') {
    digits = digits.slice(0, 4) + digits.slice(5);
  }
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits;
  }
  return `${digits}@c.us`;
}

async function processPending() {
  const data = await callBackend('botFetchPending');
  if (!data || !data.success) return;

  const cmd = data.commands || {};

  if (cmd.request_logout) {
    console.log('🔌 Logout solicitado pelo painel.');
    if (client) {
      try { await client.logout(); } catch (err) { console.error('Erro no logout:', err.message); }
      try { await client.destroy(); } catch {}
      client = null;
    }
    wipeAuthSession();
    currentStatus = 'disconnected';
    currentPhone = null;
    currentQr = null;
    await callBackend('botAckCommand', { cleared: 'logout' });
    await sendHeartbeat();
    return;
  }

  if (cmd.request_qr) {
    console.log('📲 Comando "Gerar QR" recebido do painel.');
    await callBackend('botAckCommand', { cleared: 'qr' });
    await startClientForQr({ wipe: true });
    return;
  }

  // Se não estiver conectado, não tenta processar mensagens, mas continua
  // verificando comandos (request_qr, request_logout) acima.
  if (currentStatus !== 'connected' || !client) return;

  const messages = data.messages || [];
  for (const msg of messages) {
    // Verifica se o cliente ainda está vivo antes de cada mensagem
    if (!client || currentStatus !== 'connected') break;

    const chatId = formatPhone(msg.phone);
    if (!chatId) {
      await callBackend('botUpdateMessage', {
        message_id: msg.id,
        status: 'failed',
        error_message: 'Telefone inválido',
      });
      continue;
    }

    try {
      // Pequena validação extra para evitar o erro de "Execution context destroyed"
      // Tentamos buscar o ID do número apenas se o cliente parecer estar pronto
      const numberId = await client.getNumberId(chatId.replace('@c.us', ''));
      
      if (!numberId) {
        await callBackend('botUpdateMessage', {
          message_id: msg.id,
          status: 'failed',
          error_message: 'Número não está no WhatsApp',
        });
        continue;
      }

      await client.sendMessage(numberId._serialized, msg.message);
      await callBackend('botUpdateMessage', { message_id: msg.id, status: 'sent' });
      console.log(`✉️  Enviado para ${msg.phone}`);
      
      // Delay entre mensagens para evitar bloqueio
      await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));
    } catch (err) {
      const isNavError = err.message?.includes('Execution context was destroyed') || 
                         err.message?.includes('Target closed');
      
      if (isNavError) {
        console.warn('⚠️  Conexão do navegador instável (context destroyed). Interrompendo envio.');
        // Forçamos uma verificação de estado se o erro for grave
        break;
      }

      console.error(`❌ Erro enviando para ${msg.phone}:`, err.message);
      await callBackend('botUpdateMessage', {
        message_id: msg.id,
        status: 'failed',
        error_message: err.message?.slice(0, 500) || 'Erro desconhecido',
      });
    }
  }
}

// Loop de polling — mantém heartbeat e escuta comandos do painel
setInterval(async () => {
  await sendHeartbeat();
  await processPending();
}, POLL_INTERVAL);

process.on('SIGINT', async () => {
  console.log('\n👋 Encerrando bot...');
  try { if (client) await client.destroy(); } catch {}
  process.exit(0);
});

console.log('🚀 Bot WhatsApp pronto (Renda Extra v2)');
console.log(`   Endpoint: ${ENDPOINT}`);
console.log(`   Polling:  ${POLL_INTERVAL / 1000}s`);
console.log('💤 Aguardando comando "Gerar QR" no painel /rendaextra2/admin...');

// Heartbeat inicial para mostrar "desconectado" no painel
sendHeartbeat();
