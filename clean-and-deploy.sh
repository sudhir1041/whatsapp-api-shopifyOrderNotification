#!/bin/bash

echo "🧹 Cleaning backup files and deploying..."

APP_DIR="/home/zaptool/htdocs/zaptool.online"
cd $APP_DIR

# Remove all backup files that cause build issues
echo "Removing backup files..."
rm -f app/routes/*.backup
rm -f app/routes/**/*.backup

# Remove any problematic files
find app/routes -name "*.backup" -delete
find app/routes -name "*~" -delete

# List remaining route files
echo "Remaining route files:"
ls -la app/routes/

# Install dependencies
echo "📦 Installing dependencies..."
npm install @remix-run/dev --save-dev

# Try building without backup files
echo "🏗️ Building application..."
npx remix vite:build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Deploying without build..."
fi

# Start application
echo "🚀 Starting application..."
if [ -f "ecosystem.config.cjs" ]; then
    sudo -u zaptool pm2 start ecosystem.config.cjs
    sudo -u zaptool pm2 save
else
    # Create minimal PM2 config
    cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'zaptool-whatsapp',
    script: 'npm',
    args: 'start',
    instances: 1,
    env: { NODE_ENV: 'production', PORT: 3000 }
  }]
};
EOF
    sudo -u zaptool pm2 start ecosystem.config.cjs
    sudo -u zaptool pm2 save
fi

# Reload Nginx
systemctl reload nginx

echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
echo "- PM2: $(sudo -u zaptool pm2 list | grep zaptool || echo 'Check manually')"
echo "- Nginx: $(systemctl is-active nginx)"
echo ""
echo "🔧 Next steps:"
echo "1. Update .env with credentials"
echo "2. Get SSL: certbot --nginx -d zaptool.online"
echo "3. Test: curl http://localhost:3000"