#!/bin/bash

echo "🔧 Fixing Shopify app embedding and distribution..."

# Ensure environment is set correctly
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"

# Check if the app is running
echo "📋 Checking app status..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ App not running, starting it..."
    pm2 start ecosystem.config.cjs
    sleep 5
fi

# Test app response
echo "📋 Testing app response..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/app)
if [ "$response" = "200" ]; then
    echo "✅ App responding correctly"
else
    echo "❌ App not responding properly (HTTP $response)"
fi

# Deploy Shopify configuration
echo "📦 Deploying Shopify app configuration..."
npm run deploy

# Check if nginx is properly configured for HTTPS
echo "📋 Checking HTTPS configuration..."
if curl -s -I https://zaptool.online | grep -q "200 OK"; then
    echo "✅ HTTPS working"
else
    echo "❌ HTTPS not working - this may cause embedding issues"
    echo "Run: sudo certbot --nginx -d zaptool.online"
fi

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📋 To install the app in Shopify:"
echo "1. Go to Shopify Partner Dashboard"
echo "2. Find 'WaNotify' app"
echo "3. Click 'Install app' or 'Test on development store'"
echo "4. Select your store (ecogreenapp.myshopify.com)"
echo "5. The app should load with full content and menus"
echo ""
echo "🔧 If app still shows blank:"
echo "- Check browser console for errors"
echo "- Ensure HTTPS is working"
echo "- Try clearing browser cache"
echo "- Check PM2 logs: pm2 logs wanotify"