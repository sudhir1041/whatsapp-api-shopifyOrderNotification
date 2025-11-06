#!/bin/bash

echo "🚀 Starting WhatsApp Analytics App in production mode..."

# Set production environment
export NODE_ENV=production

# Set database URL (using SQLite for simplicity)
export DATABASE_URL="file:./prisma/production.sqlite"

# Generate Prisma client and setup database
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push

echo "🚀 Starting application on port 3000..."
echo "Configure your nginx to proxy zaptool.online to localhost:3000"

# Start the application
npm run start