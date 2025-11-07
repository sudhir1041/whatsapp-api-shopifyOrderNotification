#!/bin/bash

echo "🚀 Manual deployment without Shopify CLI..."

# Set production environment
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"

# Ensure app is running
echo "📋 Checking if app is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Starting app..."
    pm2 start ecosystem.config.cjs
    sleep 5
fi

# Test app endpoints
echo "📋 Testing app endpoints:"
echo "Root: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)"
echo "App: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/app)"
echo "Auth: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login)"

# Test HTTPS
echo ""
echo "📋 Testing HTTPS domain:"
if curl -s https://zaptool.online > /dev/null; then
    echo "✅ HTTPS working"
else
    echo "❌ HTTPS not working"
fi

echo ""
echo "✅ Manual deployment complete!"
echo ""
echo "📋 Your app is running at:"
echo "   Local: http://localhost:3000"
echo "   Domain: https://zaptool.online"
echo ""
echo "📋 To use the app:"
echo "1. Go to Shopify Partner Dashboard (partners.shopify.com)"
echo "2. Find your app or create a new one"
echo "3. Set App URL to: https://zaptool.online"
echo "4. Set Allowed redirection URLs to:"
echo "   - https://zaptool.online/auth/callback"
echo "   - https://zaptool.online/auth/shopify/callback"
echo "5. Install the app in your store"
echo ""
echo "⚠️  If you don't have the app in Partner Dashboard:"
echo "   Create a new app and update the credentials in .env file"