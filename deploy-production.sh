#!/bin/bash

echo "🚀 Deploying WhatsApp Analytics App to zaptool.online..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Pull latest changes (if using git)
echo "📥 Pulling latest changes..."
git pull origin main 2>/dev/null || echo "No git repository found, skipping pull"

# Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec app npm run setup

# Deploy to Shopify
echo "📦 Deploying to Shopify..."
docker-compose exec app npm run deploy

echo "✅ Deployment complete!"
echo ""
echo "📋 Your app is now live at: https://zaptool.online"
echo ""
echo "🔧 Next steps:"
echo "1. Install the app in your Shopify store"
echo "2. Configure WhatsApp Business API settings"
echo "3. Set up your message templates"
echo "4. Test cart abandonment recovery"