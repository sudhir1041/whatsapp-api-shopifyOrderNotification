#!/bin/bash

echo "📦 Deploying Shopify app configuration..."

# Set environment
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"

# Deploy the Shopify app configuration
npm run deploy

echo "✅ Shopify configuration deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Shopify Partner Dashboard"
echo "2. Find your 'WaNotify' app"
echo "3. Click 'Install app' or 'Test on development store'"
echo "4. Select a development store to install it"
echo "5. The app will load properly inside Shopify admin"
echo ""
echo "⚠️  Important: Don't access https://zaptool.online directly"
echo "   The app must be accessed through Shopify admin panel"