#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Neuroaprendizado Med — VPS Full Deployment Script
# Author: Dr. Jackson Erasmo Fuck (jacksontorax@gmail.com)
# Run on VPS as root: bash deploy.sh
# ═══════════════════════════════════════════════════════════════

set -e

APP_DIR="/var/www/neuroaprendizado"
DOMAIN="neuroaprendizado.unipar.jacksonuti.cloud"
REPO="https://github.com/JacksonFuck/neuroaprendizado-med.git"
ADMIN_EMAIL="jacksontorax@gmail.com"
DB_NAME="neuroaprendizado"
DB_USER="neuroapp"
DB_PASS="NeuroApp2026_Secure!"

echo ""
echo "🧠 ═══════════════════════════════════════════════"
echo "   Neuroaprendizado Med — Deploy Automático"
echo "   Domínio: $DOMAIN"
echo "═══════════════════════════════════════════════"
echo ""

# 1. System dependencies
echo "→ [1/9] Instalando dependências do sistema..."
apt-get update -qq
apt-get install -y -qq nodejs npm postgresql nginx git certbot python3-certbot-nginx curl

# Install Node.js 20 if needed
node --version | grep -q "v2" || {
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
}

# 2. Clone / update project
echo "→ [2/9] Clonando projeto do GitHub..."
if [ -d "$APP_DIR/.git" ]; then
  cd $APP_DIR
  git pull origin main
else
  git clone $REPO $APP_DIR
  cd $APP_DIR
fi

# 3. Install Node dependencies
echo "→ [3/9] Instalando dependências Node.js..."
cd $APP_DIR
npm install --production --silent

# 4. Create .env file
echo "→ [4/9] Configurando variáveis de ambiente..."
cat > $APP_DIR/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS

GOOGLE_CLIENT_ID=CHANGE_ME_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=CHANGE_ME_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=https://$DOMAIN/auth/google/callback

SESSION_SECRET=neuro2026_$(openssl rand -hex 16)

PORT=3000
NODE_ENV=production
EOF

chmod 600 $APP_DIR/.env

# 5. Setup PostgreSQL
echo "→ [5/9] Configurando PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql

sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "  ✓ Database já existe"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || echo "  ✓ User já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null

# 6. Initialize DB schema
echo "→ [6/9] Inicializando schema do banco..."
cd $APP_DIR
node server/config/init-db.js && echo "  ✓ Schema criado com sucesso"

# 7. Setup Nginx
echo "→ [7/9] Configurando Nginx..."
cat > /etc/nginx/sites-available/neuroaprendizado << 'NGINX'
server {
    listen 80;
    server_name neuroaprendizado.unipar.jacksonuti.cloud;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files with cache
    location ~* \.(css|js|ttf|woff|woff2|png|jpg|ico)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "public, max-age=31536000";
    }
}
NGINX

# Remove default and enable our site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/neuroaprendizado /etc/nginx/sites-enabled/
nginx -t && systemctl enable nginx && systemctl restart nginx

# 8. Setup PM2
echo "→ [8/9] Iniciando aplicação com PM2..."
npm install -g pm2 --silent 2>/dev/null

pm2 delete neuroaprendizado 2>/dev/null || true
cd $APP_DIR
pm2 start server/index.js \
    --name neuroaprendizado \
    --env production \
    --max-memory-restart 512M \
    --log /var/log/neuroaprendizado.log \
    --time

pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true

# 9. SSL Certificate
echo "→ [9/9] Configurando certificado SSL..."
certbot --nginx \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    -m $ADMIN_EMAIL \
    --redirect 2>/dev/null && echo "  ✓ SSL configurado com sucesso" || \
    echo "  ⚠️  SSL: aguardando propagação DNS. Rode depois: certbot --nginx -d $DOMAIN -m $ADMIN_EMAIL --agree-tos --redirect"

echo ""
echo "✅ ═══════════════════════════════════════════════"
echo "   Deploy concluído!"
echo ""
echo "   🌐 URL:   https://$DOMAIN"
echo "   📧 Admin: $ADMIN_EMAIL"
echo "   📊 PM2:   pm2 status"
echo "   📋 Logs:  pm2 logs neuroaprendizado"
echo ""
echo "   ⚠️  Próximos passos:"
echo "   1. Configure DNS A record: $DOMAIN → $(curl -s ifconfig.me)"
echo "   2. Configure Google OAuth em console.cloud.google.com:"
echo "      Authorized redirect: https://$DOMAIN/auth/google/callback"
echo "      Authorized origin:   https://$DOMAIN"
echo "═══════════════════════════════════════════════"
