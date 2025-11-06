#!/bin/bash

echo "🚀 Direct deployment to zaptool.online..."

# Set production environment
export NODE_ENV=production
export DATABASE_URL="file:./prisma/production.sqlite"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client and setup database
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build complete!"
echo ""
echo "🚀 To start the application:"
echo "export NODE_ENV=production"
echo "export DATABASE_URL=\"file:./prisma/production.sqlite\""
echo "npm run start"
echo ""
echo "📋 Configure nginx to proxy zaptool.online to localhost:3000"
echo "📋 Update Shopify app URLs to https://zaptool.online"
echo "📋 Deploy app configuration: npm run deploy"