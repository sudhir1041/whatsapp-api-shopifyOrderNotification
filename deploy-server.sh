#!/bin/bash

echo "🚀 Deploying WhatsApp Analytics App to production server..."

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "npm.*start" || true
pkill -f "node.*remix-serve" || true

# Set production environment
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Generate Prisma client and setup database
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push

# Build the application
echo "🏗️ Building application..."
npm run build

# Start the application in background
echo "🚀 Starting application..."
nohup npm run start > app.log 2>&1 &

# Get the process ID
APP_PID=$!
echo "Application started with PID: $APP_PID"

# Wait a moment and check if it's running
sleep 3
if ps -p $APP_PID > /dev/null; then
    echo "✅ Application is running successfully!"
    echo "📋 App URL: https://zaptool.online"
    echo "📋 Logs: tail -f app.log"
    echo "📋 Stop app: kill $APP_PID"
else
    echo "❌ Application failed to start. Check app.log for errors."
    exit 1
fi

echo ""
echo "🔧 Next steps:"
echo "1. Configure nginx to proxy zaptool.online to localhost:3000"
echo "2. Update Shopify app URLs to https://zaptool.online"
echo "3. Deploy Shopify configuration: npm run deploy"
echo "4. Add WhatsApp credentials to .env file"