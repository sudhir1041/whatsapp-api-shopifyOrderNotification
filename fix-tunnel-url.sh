#!/bin/bash

echo "🔧 Fixing tunnel URL issue - switching to production domain..."

# Kill any development processes
echo "🛑 Stopping development processes..."
pkill -f "shopify app dev" 2>/dev/null || true
pkill -f "cloudflare" 2>/dev/null || true
pkill -f "trycloudflare" 2>/dev/null || true

# Set production environment
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"
export SHOPIFY_API_KEY=a2025f8cce4b8f141f39409f4baeec8b
export SHOPIFY_API_SECRET=dfc7395493e3a575d322117785a1254f
export SHOPIFY_APP_URL=https://zaptool.online

# Ensure production app is running
echo "🚀 Starting production app..."
pm2 stop wanotify 2>/dev/null || true
pm2 delete wanotify 2>/dev/null || true
pm2 start ecosystem.config.cjs

# Wait for app to start
sleep 5

# Force deploy with production URLs
echo "📦 Deploying production configuration..."
npm run deploy -- --force

echo "✅ Configuration updated!"
echo ""
echo "📋 Your app now uses: https://zaptool.online"
echo ""
echo "🔄 Next steps:"
echo "1. Go to Shopify Partner Dashboard"
echo "2. Find 'WaNotify' app"
echo "3. UNINSTALL the app from your store if already installed"
echo "4. REINSTALL the app - this will use the new URL"
echo "5. App should now work properly"
echo ""
echo "⚠️  Important: You must REINSTALL the app for URL changes to take effect"