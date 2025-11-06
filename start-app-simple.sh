#!/bin/bash

echo "🚀 Starting WhatsApp Analytics App..."

# Set environment
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"

# Stop existing PM2 processes
pm2 stop wanotify 2>/dev/null || true
pm2 delete wanotify 2>/dev/null || true

# Start with PM2 using the .cjs config
pm2 start ecosystem.config.cjs

# Check status
pm2 status

echo "✅ App started!"
echo "📋 Check logs: pm2 logs wanotify"
echo "🌐 App URL: https://zaptool.online"