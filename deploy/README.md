# Deploy I.A MRO - Ubuntu VPS (Hostinger)

## 🚀 Instalação Rápida (1 comando)

Conecte via SSH na sua VPS e execute:

```bash
# 1. Baixe e execute o script de instalação
curl -fsSL https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPO/main/deploy/install.sh | bash -s seu-dominio.com
```

## 📋 Instalação Manual Passo a Passo

### 1. Conectar na VPS via SSH

```bash
ssh root@SEU_IP_HOSTINGER
```

### 2. Atualizar sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Instalar dependências

```bash
# Git, Nginx, Certbot
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 4. Clonar repositório

```bash
cd /var/www
git clone https://github.com/SEU_USUARIO/SEU_REPO.git ia-mro
cd ia-mro
```

### 5. Instalar e fazer build

```bash
npm install
npm run build
```

### 6. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/ia-mro
```

Cole esta configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/ia-mro/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 7. Ativar site

```bash
sudo ln -sf /etc/nginx/sites-available/ia-mro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 8. SSL Gratuito (Let's Encrypt)

```bash
sudo certbot --nginx -d seu-dominio.com
```

## 🔄 Atualizar Aplicação

```bash
cd /var/www/ia-mro
git pull origin main
npm install
npm run build
```

Ou execute o script:

```bash
bash /var/www/ia-mro/deploy/update.sh
```

## 🔧 Comandos Úteis

```bash
# Ver status do Nginx
sudo systemctl status nginx

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx

# Testar configuração Nginx
sudo nginx -t
```

## 📝 Variáveis de Ambiente

Se precisar de variáveis de ambiente, crie um arquivo `.env` na raiz:

```bash
cd /var/www/ia-mro
nano .env
```

Adicione suas variáveis (exemplo):
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx
```

Depois refaça o build:
```bash
npm run build
```

## ❓ Problemas Comuns

### Erro 502 Bad Gateway
```bash
sudo systemctl restart nginx
```

### Página em branco
Verifique se o build foi feito corretamente:
```bash
ls -la /var/www/ia-mro/dist
```

### Rotas não funcionam
Certifique-se que o `try_files` está configurado no Nginx para redirecionar para `index.html`.

---

**Desenvolvido com ❤️ por MRO - Mais Resultados Online**
