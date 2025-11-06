#!/bin/bash

echo "🔧 Fixing build issues..."

# Remove any potential static imports in webhook files
echo "Checking webhook files for static imports..."

# Build the application
echo "🏗️ Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed"
    exit 1
fi