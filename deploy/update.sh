#!/bin/bash

# =============================================================
# Script de Atualização - I.A MRO
# Para Ubuntu LTS 22.04 (VPS Hostinger)
# Inclui: Frontend + Bot WhatsApp (whatsapp-web.js)
# =============================================================

set -e

echo "🔄 Atualizando I.A MRO..."

APP_NAME="ia-mro"
APP_DIR="/var/www/$APP_NAME"
NGINX_SITE="/etc/nginx/sites-available/$APP_NAME"
DOMAIN="maisresultadosonline.com.br"
WPP_BOT_DIR="$APP_DIR/whatsapp-bot"

# Sudo helper (permite rodar como root ou usuário normal)
SUDO=""
if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  SUDO="sudo"
fi

cd "$APP_DIR"

echo "📥 Baixando atualizações do GitHub..."
git fetch origin
git reset --hard origin/main

# Garantir permissão de execução nos scripts deploy
chmod +x "$APP_DIR/deploy/"*.sh 2>/dev/null || true

# ============= Limpar legado whatsapp-server (se existir) =============
if command -v pm2 >/dev/null 2>&1; then
    pm2 delete zapmro-cloud 2>/dev/null || true
    pm2 delete whatsapp-multi 2>/dev/null || true
    pm2 save || true
fi
rm -rf "$APP_DIR/whatsapp-server" 2>/dev/null || true

echo "📦 Instalando dependências do frontend..."
npm install

echo "🔨 Fazendo build do frontend..."
npm run build

# ============= Bot WhatsApp (whatsapp-web.js) =============
echo ""
echo "🤖 Configurando Bot WhatsApp..."

# Instalar Chromium e libs necessárias para o Puppeteer/whatsapp-web.js
if ! command -v chromium-browser >/dev/null 2>&1 && ! command -v chromium >/dev/null 2>&1; then
  echo "🌐 Instalando Chromium e dependências do Puppeteer..."
  $SUDO apt-get update
  $SUDO apt-get install -y \
    chromium-browser \
    ca-certificates fonts-liberation libappindicator3-1 libasound2 \
    libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
    libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 \
    libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    lsb-release wget xdg-utils 2>/dev/null || true
fi

# Instalar PM2 globalmente se não existir
if ! command -v pm2 >/dev/null 2>&1; then
  echo "📦 Instalando PM2..."
  $SUDO npm install -g pm2
fi

# Se a pasta do bot existir no repo, instalar dependências e iniciar
# Se a pasta do bot existir no repo, instalar dependências e iniciar
if [ -d "$WPP_BOT_DIR" ]; then
  echo "📦 Instalando dependências do bot WhatsApp..."
  cd "$WPP_BOT_DIR"

  # Preserva WPP_BOT_TOKEN existente (se já configurado em .env anterior)
  EXISTING_TOKEN=""
  if [ -f .env ]; then
    EXISTING_TOKEN=$(grep -E '^WPP_BOT_TOKEN=' .env | head -1 | cut -d= -f2- || true)
  fi
  # Token: prioriza variável de ambiente WPP_BOT_TOKEN; depois o já existente em .env
  BOT_TOKEN="${WPP_BOT_TOKEN:-$EXISTING_TOKEN}"

  if [ -z "$BOT_TOKEN" ] || [ "$BOT_TOKEN" = "wpp-bot-default-token-change-me" ]; then
    echo ""
    echo "❌ ERRO: WPP_BOT_TOKEN não configurado!"
    echo ""
    echo "   O token DEVE ser idêntico ao secret WPP_BOT_TOKEN configurado"
    echo "   em Lovable Cloud → Secrets."
    echo ""
    echo "   Execute novamente assim (substitua pelo valor real do secret):"
    echo "     WPP_BOT_TOKEN='seu-token-aqui' ./deploy/update.sh"
    echo ""
    exit 1
  fi

  echo "📝 Criando/atualizando .env do bot..."
  cat > .env <<ENVEOF
SUPABASE_URL=https://adljdeekwifwcdcgbpit.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkbGpkZWVrd2lmd2NkY2dicGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjk0MDMsImV4cCI6MjA4MDcwNTQwM30.odKBOAuEEW0WJEburLRTL9Qj1EbitETmhxqNoE_F_g4
WPP_BOT_TOKEN=${BOT_TOKEN}
POLL_INTERVAL=5
ENVEOF
  echo "✅ .env atualizado em $WPP_BOT_DIR/.env (token: ${BOT_TOKEN:0:10}...)"

  npm install --omit=dev

  # Forçar delete + start para garantir código novo carregado
  pm2 delete wpp-bot-mro 2>/dev/null || true
  echo "🚀 Iniciando bot WhatsApp..."
  pm2 start index.js --name wpp-bot-mro --time --cwd "$WPP_BOT_DIR"

  pm2 save
  $SUDO pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true

  cd "$APP_DIR"
else
  echo "⚠️  Pasta whatsapp-bot/ não encontrada — pulando instalação do bot."
  echo "   Caminho esperado: $WPP_BOT_DIR"
  echo "   Conteúdo de $APP_DIR:"
  ls -la "$APP_DIR" | head -20
fi

# ============= Nginx =============
echo ""
echo "🧩 Verificando Nginx..."

# Só cria config Nginx se NÃO existir (preserva SSL/certbot)
if [ ! -f "$NGINX_SITE" ]; then
  echo "🛠️ Criando configuração Nginx inicial..."
  $SUDO tee "$NGINX_SITE" > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    root $APP_DIR/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
  $SUDO ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/$APP_NAME"
  echo "✅ Nginx configurado. Rode: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
else
  echo "✅ Config Nginx já existe (preservando SSL/certbot)"
fi

# ============= Subdomínio prompts.maisresultadosonline.com.br =============
PROMPTS_DOMAIN="prompts.$DOMAIN"
PROMPTS_NGINX="/etc/nginx/sites-available/prompts-mro"

if [ ! -f "$PROMPTS_NGINX" ]; then
  echo "🛠️ Criando configuração Nginx para $PROMPTS_DOMAIN..."
  $SUDO tee "$PROMPTS_NGINX" > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $PROMPTS_DOMAIN;
    root $APP_DIR/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

  $SUDO ln -sf "$PROMPTS_NGINX" "/etc/nginx/sites-enabled/prompts-mro"
  echo "✅ Nginx configurado para $PROMPTS_DOMAIN"
  echo ""
  echo "⚠️  Rode o comando abaixo para ativar SSL no subdomínio:"
  echo "   sudo certbot --nginx -d $PROMPTS_DOMAIN"
fi

echo "🔄 Reiniciando Nginx..."
$SUDO nginx -t
$SUDO systemctl restart nginx

echo ""
echo "✅ Atualização concluída!"
echo "🌐 Frontend: https://$DOMAIN"
echo "📝 Prompts MRO: https://$PROMPTS_DOMAIN"
echo ""
echo "🤖 Bot WhatsApp:"
echo "   Status:  pm2 status wpp-bot-mro"
echo "   Logs:    pm2 logs wpp-bot-mro"
echo "   QR Code: pm2 logs wpp-bot-mro --lines 50"
echo ""
