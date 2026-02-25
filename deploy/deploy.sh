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

# 1. System dependencies — with broken package recovery
echo "→ [1/9] Instalando dependências do sistema..."

# Fix broken packages first
dpkg --configure -a 2>/dev/null || true
apt-get -f install -y 2>/dev/null || true
apt-get clean
apt-get update -qq

# Install only what we need, one at a time to avoid conflicts
for pkg in curl git postgresql nginx certbot python3-certbot-nginx; do
  apt-get install -y -qq $pkg 2>/dev/null || echo "  ⚠️ Falha ao instalar $pkg, continuando..."
done

# Install Node.js 20 via nodesource (bypasses apt conflicts)
if ! node --version 2>/dev/null | grep -q "v2"; then
  echo "  → Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
  apt-get install -y nodejs
fi

echo "  ✓ Node: $(node --version), npm: $(npm --version)"

# 2. Clone / update project
echo "→ [2/9] Clonando projeto do GitHub..."
if [ -d "$APP_DIR/.git" ]; then
  cd $APP_DIR
  git pull origin main
else
  mkdir -p $APP_DIR
  git clone $REPO $APP_DIR
  cd $APP_DIR
fi
cd $APP_DIR

# 3. Install Node dependencies
echo "→ [3/9] Instalando dependências Node.js..."
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
systemctl enable postgresql 2>/dev/null || true
systemctl start postgresql 2>/dev/null || service postgresql start 2>/dev/null || true
sleep 2

sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "  ✓ Database já existe"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || echo "  ✓ User já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null

# 6. Initialize DB schema
echo "→ [6/9] Inicializando schema do banco..."
cd $APP_DIR
node server/config/init-db.js && echo "  ✓ Schema criado"

# 7. Setup Nginx
echo "→ [7/9] Configurando Nginx..."
cat > /etc/nginx/sites-available/neuroaprendizado << 'NGINX'
server {
    listen 80;
    server_name neuroaprendizado.unipar.jacksonuti.cloud;

    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;

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

    location ~* \.(css|js|ttf|woff|woff2|png|jpg|ico)$ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000";
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
ln -sf /etc/nginx/sites-available/neuroaprendizado /etc/nginx/sites-enabled/
nginx -t && systemctl enable nginx && systemctl restart nginx
echo "  ✓ Nginx configurado"

# 8. Setup PM2
echo "→ [8/9] Iniciando aplicação com PM2..."
npm install -g pm2 --silent 2>/dev/null

pm2 delete neuroaprendizado 2>/dev/null || true
cd $APP_DIR
pm2 start server/index.js \
    --name neuroaprendizado \
    --env production \
    --max-memory-restart 512M \
    --time

pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo" | bash 2>/dev/null || true
echo "  ✓ Aplicação rodando em PM2"

# 9. SSL
echo "→ [9/9] Configurando SSL..."
certbot --nginx \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    -m $ADMIN_EMAIL \
    --redirect 2>/dev/null \
    && echo "  ✓ SSL OK" \
    || echo "  ⚠️  SSL pendente — configure DNS primeiro, depois rode:"
echo "       certbot --nginx -d $DOMAIN -m $ADMIN_EMAIL --agree-tos --redirect"

# Final status
echo ""
echo "✅ ═══════════════════════════════════════════════"
echo "   Deploy concluído!"
echo "   🌐  https://$DOMAIN"
echo "   📊 pm2 status"
echo "   📋 pm2 logs neuroaprendizado"
echo ""
echo "   ⚠️  AÇÃO NECESSÁRIA:"
echo "   Edite o .env com as credenciais reais do Google:"
echo "   nano $APP_DIR/.env"
echo ""
echo "   Google OAuth → console.cloud.google.com:"
echo "   Redirect URI: https://$DOMAIN/auth/google/callback"
echo "   Origin:       https://$DOMAIN"
echo "═══════════════════════════════════════════════"
