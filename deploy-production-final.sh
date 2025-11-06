#!/bin/bash

echo "🚀 Final Production Deployment for zaptool.online"

# Create logs directory
mkdir -p logs

# Set environment variables
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Generate Prisma client
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push

# Build application
echo "🏗️ Building application..."
npm run build

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Stop existing app
echo "🛑 Stopping existing app..."
pm2 stop wanotify 2>/dev/null || true
pm2 delete wanotify 2>/dev/null || true

# Start app with PM2
echo "🚀 Starting app with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "📋 App Status:"
pm2 status
echo ""
echo "📋 Useful commands:"
echo "  pm2 logs wanotify    - View logs"
echo "  pm2 restart wanotify - Restart app"
echo "  pm2 stop wanotify    - Stop app"
echo "  pm2 monit           - Monitor app"
echo ""
echo "🌐 Your app should be running at: https://zaptool.online"