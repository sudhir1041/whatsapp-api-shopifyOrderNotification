#!/bin/bash

echo "🔧 Fixing Remix Build Issue..."

# Install Remix CLI globally if not present
if ! command -v remix &> /dev/null; then
    echo "Installing Remix CLI..."
    npm install -g @remix-run/dev
fi

# Alternative: Install locally and use npx
echo "Installing Remix locally..."
npm install @remix-run/dev --save-dev

# Update package.json build script to use npx
echo "Updating build script..."
if [ -f "package.json" ]; then
    # Backup package.json
    cp package.json package.json.backup
    
    # Update build script to use npx
    sed -i 's/"build": "remix vite:build"/"build": "npx remix vite:build"/g' package.json
    
    echo "Updated build script to use npx"
fi

# Try building with npx directly
echo "Testing build with npx..."
npx remix vite:build

if [ $? -eq 0 ]; then
    echo "✅ Build successful with npx!"
else
    echo "❌ Build still failing. Trying alternative..."
    
    # Try with vite directly
    echo "Trying vite build directly..."
    npx vite build
    
    if [ $? -eq 0 ]; then
        echo "✅ Vite build successful!"
        # Update package.json to use vite directly
        sed -i 's/"build": "npx remix vite:build"/"build": "npx vite build"/g' package.json
    fi
fi

echo "Build fix complete!"