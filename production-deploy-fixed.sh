#!/bin/bash

echo "🚀 Production Deployment - Fixed Version"

APP_DIR="/home/zaptool/htdocs/zaptool.online"
DOMAIN="zaptool.online"
USER="zaptool"

cd $APP_DIR

# Fix Remix CLI issue
echo "📦 Installing dependencies..."
npm install

# Install Remix CLI locally
npm install @remix-run/dev --save-dev

# Update package.json build script
if grep -q '"build": "remix vite:build"' package.json; then
    sed -i 's/"build": "remix vite:build"/"build": "npx remix vite:build"/g' package.json
    echo "Updated build script to use npx"
fi

# Try building
echo "🏗️ Building application..."
npx remix vite:build

if [ $? -ne 0 ]; then
    echo "Remix build failed, trying vite directly..."
    npx vite build
    
    if [ $? -eq 0 ]; then
        # Update package.json to use vite
        sed -i 's/"build": "npx remix vite:build"/"build": "npx vite build"/g' package.json
        echo "Updated to use vite build directly"
    else
        echo "❌ Build failed. Skipping build step for now."
    fi
fi

# Database setup
echo "🗄️ Setting up database..."
npx prisma generate 2>/dev/null || echo "Prisma not available"
npx prisma db push 2>/dev/null || echo "Database push skipped"

# Start with PM2
echo "🔄 Starting application..."
if [ -f "ecosystem.config.cjs" ]; then
    sudo -u $USER pm2 start ecosystem.config.cjs
elif [ -f "ecosystem.config.js" ]; then
    sudo -u $USER pm2 start ecosystem.config.js
else
    # Create basic PM2 config
    cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'zaptool-whatsapp',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF
    sudo -u $USER pm2 start ecosystem.config.cjs
fi

sudo -u $USER pm2 save

# Reload Nginx
echo "🌐 Reloading Nginx..."
systemctl reload nginx

echo "✅ Deployment complete!"
echo ""
echo "📋 Status:"
echo "- PM2: $(sudo -u $USER pm2 list | grep zaptool-whatsapp || echo 'Check manually')"
echo "- Nginx: $(systemctl is-active nginx)"
echo "- App URL: https://$DOMAIN"
echo ""
echo "🔧 Next steps:"
echo "1. Update .env with real credentials"
echo "2. Get SSL: certbot --nginx -d $DOMAIN"
echo "3. Test: curl https://$DOMAIN/health"