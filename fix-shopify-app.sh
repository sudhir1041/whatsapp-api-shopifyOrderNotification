#!/bin/bash

echo "🔧 Fixing Shopify app configuration..."

# Check if app is running locally
echo "📋 Checking local app status..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ App is running on localhost:3000"
else
    echo "❌ App is not running on localhost:3000"
    echo "Starting app..."
    ./start-app-simple.sh
fi

# Deploy Shopify configuration
echo "📦 Deploying Shopify app configuration..."
npm run deploy

# Check if nginx is configured
echo "📋 Checking nginx configuration..."
if nginx -t 2>/dev/null; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx not configured properly"
    echo "Creating basic nginx config..."
    
    # Create basic nginx config
    sudo tee /etc/nginx/sites-available/zaptool.online > /dev/null <<EOF
server {
    listen 80;
    server_name zaptool.online www.zaptool.online;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/zaptool.online /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
fi

# Test the domain
echo "🌐 Testing domain access..."
if curl -s https://zaptool.online > /dev/null; then
    echo "✅ Domain is accessible"
else
    echo "❌ Domain not accessible - check DNS and SSL"
fi

echo ""
echo "📋 Next steps:"
echo "1. Go to your Shopify Partner Dashboard"
echo "2. Find your WaNotify app"
echo "3. Install it in a development store"
echo "4. The app should now load properly"
echo ""
echo "🔗 App URL: https://zaptool.online"