#!/bin/bash

echo "🚀 Deploying WITHOUT Build (Development Mode)"

APP_DIR="/home/zaptool/htdocs/zaptool.online"
cd $APP_DIR

# Clean backup files
rm -f app/routes/*.backup app/routes/**/*.backup

# Install dependencies
npm install

# Create environment file if not exists
if [ ! -f ".env" ]; then
cat > .env << 'EOF'
NODE_ENV=development
DATABASE_URL="postgresql://zaptool:password@localhost:5432/whatsapp_analytics"
SHOPIFY_API_KEY="your_api_key"
SHOPIFY_API_SECRET="your_api_secret"
HOST="https://zaptool.online"
PORT=3000
EOF
fi

# Create PM2 config for development
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'zaptool-whatsapp',
    script: 'npm',
    args: 'run dev',
    instances: 1,
    watch: false,
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    }
  }]
};
EOF

# Stop any existing PM2 processes
sudo -u zaptool pm2 delete all 2>/dev/null || true

# Start in development mode
sudo -u zaptool pm2 start ecosystem.config.cjs
sudo -u zaptool pm2 save

# Update Nginx to serve development
cat > /etc/nginx/sites-available/zaptool.online << 'EOF'
server {
    listen 80;
    server_name zaptool.online www.zaptool.online;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

nginx -t && systemctl reload nginx

echo "✅ Development deployment complete!"
echo ""
echo "📊 Status:"
echo "- Mode: Development (no build required)"
echo "- PM2: $(sudo -u zaptool pm2 list)"
echo "- URL: http://zaptool.online"
echo ""
echo "🔧 To get SSL later:"
echo "certbot --nginx -d zaptool.online"