#!/bin/bash

echo "🚀 Simple deployment for zaptool.online..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️ Setting up database..."
npx prisma generate

# Build the application
echo "🏗️ Building application..."
npm run build

# Start the application
echo "🚀 Starting application..."
echo "Your app will be available at http://localhost:3000"
echo "Make sure to configure your reverse proxy (nginx) to point zaptool.online to localhost:3000"

# Start the app
npm run start