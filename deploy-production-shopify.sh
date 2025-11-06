#!/bin/bash

echo "🚀 Deploying to production with zaptool.online domain..."

# Stop development mode if running
pkill -f "shopify app dev" 2>/dev/null || true

# Set production environment
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"

# Make sure app is running on production
echo "📋 Checking if production app is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Starting production app..."
    pm2 start ecosystem.config.cjs
fi

# Deploy the app configuration to use zaptool.online
echo "📦 Deploying Shopify app configuration for production..."
npm run deploy

echo "✅ Production deployment complete!"
echo ""
echo "📋 Your app is now configured for:"
echo "   Domain: https://zaptool.online"
echo "   App Name: WaNotify"
echo ""
echo "📋 To install the app:"
echo "1. Go to Shopify Partner Dashboard"
echo "2. Find 'WaNotify' app"
echo "3. Click 'Install app'"
echo "4. Select your store (ecogreenapp.myshopify.com)"
echo "5. App will load at https://zaptool.online"
echo ""
echo "⚠️  Don't use 'shopify app dev' - that's for development only"
echo "   Your production app is running with PM2"