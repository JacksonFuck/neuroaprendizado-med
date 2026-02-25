#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Neuroaprendizado Med — VPS Deployment Script
# Run on VPS: bash deploy.sh
# ═══════════════════════════════════════════════════════════════

set -e

APP_DIR="/var/www/neuroaprendizado"
DOMAIN="neuroaprendizado.unipar.jacksonuti.cloud"

echo "═══ Neuroaprendizado Med — Deploy ═══"

# 1. Create app directory
echo "→ Creating app directory..."
mkdir -p $APP_DIR

# 2. Copy/sync project files (run this from the project root)
echo "→ Syncing files..."
# These should already be transferred via scp/rsync

# 3. Install dependencies
echo "→ Installing dependencies..."
cd $APP_DIR
npm install --production

# 4. Setup PostgreSQL database
echo "→ Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE neuroaprendizado;" 2>/dev/null || echo "Database exists"
sudo -u postgres psql -c "CREATE USER neuroapp WITH PASSWORD 'NeuroApp2026_Secure';" 2>/dev/null || echo "User exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE neuroaprendizado TO neuroapp;" 2>/dev/null
sudo -u postgres psql -d neuroaprendizado -c "GRANT ALL ON SCHEMA public TO neuroapp;" 2>/dev/null

# 5. Initialize DB schema
echo "→ Initializing schema..."
node server/config/init-db.js

# 6. Setup Nginx
echo "→ Configuring Nginx..."
cp deploy/nginx-neuroaprendizado.conf /etc/nginx/sites-available/neuroaprendizado
ln -sf /etc/nginx/sites-available/neuroaprendizado /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 7. Setup PM2
echo "→ Starting with PM2..."
npm install -g pm2 2>/dev/null
pm2 delete neuroaprendizado 2>/dev/null || true
pm2 start server/index.js --name neuroaprendizado --env production
pm2 save
pm2 startup 2>/dev/null || true

# 8. SSL (after DNS propagation)
echo "→ Setting up SSL..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN 2>/dev/null || echo "⚠️  SSL will be configured after DNS propagation"

echo ""
echo "═══ Deploy complete! ═══"
echo "→ App: http://$DOMAIN"
echo "→ PM2: pm2 status"
echo "→ Logs: pm2 logs neuroaprendizado"
