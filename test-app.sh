#!/bin/bash

echo "🔍 Testing WhatsApp Analytics App..."

echo "📋 1. Checking if app is running locally:"
curl -s http://localhost:3000 | head -20

echo ""
echo "📋 2. Checking PM2 status:"
pm2 status

echo ""
echo "📋 3. Checking app logs:"
pm2 logs wanotify --lines 10

echo ""
echo "📋 4. Testing domain (if nginx configured):"
curl -s -I https://zaptool.online | head -5

echo ""
echo "📋 5. Environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL: $DATABASE_URL"