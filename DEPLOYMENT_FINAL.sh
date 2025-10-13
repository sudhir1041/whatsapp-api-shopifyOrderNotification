#!/bin/bash

echo "🚀 Starting WhatsApp Notifications App Deployment..."

# Check if ngrok tunnel is running
echo "📡 Checking ngrok tunnel..."
curl -s https://saving-drake-eternal.ngrok-free.app > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Ngrok tunnel is accessible"
else
    echo "❌ Ngrok tunnel not accessible. Please start ngrok first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push

# Deploy to Shopify
echo "🏗️ Deploying to Shopify..."
npm run deploy

echo "✅ Deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Install app in your Shopify store"
echo "2. Configure WhatsApp settings in the app"
echo "3. Test notifications using the Test page"
echo "4. Create a real order to test webhooks"
echo ""
echo "🔗 App URL: https://saving-drake-eternal.ngrok-free.app"
echo "📚 Documentation: See FINAL_PROJECT_SETUP.md"