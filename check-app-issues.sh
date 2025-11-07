#!/bin/bash

echo "🔍 Diagnosing Shopify app issues..."

echo "📋 1. Testing app routes:"
echo "Root route:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/

echo "App route:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/app

echo "Auth route:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/auth/login

echo ""
echo "📋 2. Checking PM2 logs for errors:"
pm2 logs wanotify --lines 20 --nostream

echo ""
echo "📋 3. Testing HTTPS domain:"
curl -s -I https://zaptool.online | head -5

echo ""
echo "📋 4. Checking environment variables:"
echo "SHOPIFY_API_KEY: ${SHOPIFY_API_KEY:-'Not set'}"
echo "SHOPIFY_APP_URL: ${SHOPIFY_APP_URL:-'Not set'}"
echo "NODE_ENV: ${NODE_ENV:-'Not set'}"

echo ""
echo "📋 5. Testing database connection:"
if [ -f "prisma/production.sqlite" ]; then
    echo "✅ Database file exists"
else
    echo "❌ Database file missing"
fi