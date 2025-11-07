# Quick Fix for Remix Build Error

## Problem: `sh: 1: remix: not found`

The Remix CLI is not installed or not in PATH.

## ⚡ Quick Solutions:

### Option 1: Use npx (Recommended)
```bash
# Update package.json build script
sed -i 's/"build": "remix vite:build"/"build": "npx remix vite:build"/g' package.json

# Install Remix locally
npm install @remix-run/dev --save-dev

# Build
npm run build
```

### Option 2: Install Remix globally
```bash
npm install -g @remix-run/dev
npm run build
```

### Option 3: Use Vite directly
```bash
# If Remix still fails, use Vite
npx vite build

# Update package.json
sed -i 's/"build": "remix vite:build"/"build": "npx vite build"/g' package.json
```

## 🚀 Production Deployment:

```bash
# Run the fixed deployment script
chmod +x production-deploy-fixed.sh
sudo ./production-deploy-fixed.sh
```

## 📋 Manual Steps:

```bash
cd /home/zaptool/htdocs/zaptool.online

# Fix build
npm install @remix-run/dev --save-dev
npx remix vite:build || npx vite build

# Start app
pm2 start ecosystem.config.cjs
pm2 save

# Get SSL
certbot --nginx -d zaptool.online
```

## ✅ Verification:

```bash
# Check if build works
npm run build

# Check PM2 status
pm2 status

# Test app
curl https://zaptool.online/health
```

The fixed deployment script handles all these issues automatically.