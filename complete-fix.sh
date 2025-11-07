#!/bin/bash

echo "🔧 Complete fix for tunnel URL issue..."

# 1. Stop all development processes
echo "🛑 Step 1: Stopping all development processes..."
pkill -f "shopify app dev" 2>/dev/null || true
pkill -f "cloudflare" 2>/dev/null || true
pkill -f "trycloudflare" 2>/dev/null || true

# 2. Set production environment
echo "⚙️ Step 2: Setting production environment..."
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"
export SHOPIFY_API_KEY=a2025f8cce4b8f141f39409f4baeec8b
export SHOPIFY_API_SECRET=dfc7395493e3a575d322117785a1254f
export SHOPIFY_APP_URL=https://zaptool.online

# 3. Restart production app
echo "🚀 Step 3: Restarting production app..."
pm2 stop wanotify 2>/dev/null || true
pm2 delete wanotify 2>/dev/null || true
pm2 start ecosystem.config.cjs
sleep 5

# 4. Test local app
echo "🧪 Step 4: Testing local app..."
if curl -s http://localhost:3000/app > /dev/null; then
    echo "✅ Local app is running"
else
    echo "❌ Local app not responding"
fi

# 5. Deploy configuration
echo "📦 Step 5: Deploying Shopify configuration..."
npm run deploy

# 6. Test HTTPS
echo "🔒 Step 6: Testing HTTPS..."
if curl -s https://zaptool.online > /dev/null; then
    echo "✅ HTTPS is working"
else
    echo "❌ HTTPS not working - install SSL certificate"
fi

echo ""
echo "✅ Fix complete!"
echo ""
echo "🔄 IMPORTANT - You must REINSTALL the app:"
echo ""
echo "1. Go to Shopify Partner Dashboard"
echo "2. Find 'WaNotify' app"
echo "3. Go to your store (ecogreenapp.myshopify.com)"
echo "4. UNINSTALL the app if it's already installed"
echo "5. Go back to Partner Dashboard"
echo "6. Click 'Install app' or 'Test on development store'"
echo "7. Select ecogreenapp.myshopify.com again"
echo "8. App will now use https://zaptool.online"
echo ""
echo "⚠️  The tunnel URL error happens because the app was installed"
echo "   with the old development URL. Reinstalling fixes this."