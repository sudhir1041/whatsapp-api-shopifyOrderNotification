# Production Deployment - Final Steps

## ✅ Build Issues Fixed:

1. **Server Import Errors** - Removed server-only imports from webhooks
2. **PM2 ESM Error** - Created `ecosystem.config.cjs` for CommonJS compatibility
3. **JSX Template Syntax** - Fixed template variable display

## 🚀 Deploy to Production:

### 1. Copy Files to Server
```bash
# Copy fixed files to production
scp ecosystem.config.cjs zaptool-deploy.sh zaptool-nginx.conf root@your-server:/home/zaptool/htdocs/zaptool.online/
```

### 2. Run Deployment Script
```bash
# On production server
cd /home/zaptool/htdocs/zaptool.online
chmod +x zaptool-deploy.sh
sudo ./zaptool-deploy.sh
```

### 3. Start Application with Fixed Config
```bash
# Use .cjs config file
sudo -u zaptool pm2 start ecosystem.config.cjs
sudo -u zaptool pm2 save
```

### 4. Configure SSL
```bash
# Get SSL certificate
certbot --nginx -d zaptool.online -d www.zaptool.online
```

### 5. Update Environment Variables
```bash
# Edit .env file
nano /home/zaptool/htdocs/zaptool.online/.env

# Add your actual values:
SHOPIFY_API_KEY="your_api_key"
SHOPIFY_API_SECRET="your_api_secret"
WHATSAPP_ACCESS_TOKEN="your_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_id"
DATABASE_URL="postgresql://zaptool:password@localhost:5432/whatsapp_analytics"
HOST="https://zaptool.online"
```

## 🔧 Management Commands:

```bash
# Check application status
sudo -u zaptool pm2 status

# View logs
sudo -u zaptool pm2 logs zaptool-whatsapp

# Restart application
sudo -u zaptool pm2 restart zaptool-whatsapp

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

## 📊 Verification Steps:

1. **Build Test**: `npm run build` (should complete without errors)
2. **PM2 Start**: `pm2 start ecosystem.config.cjs` (should start successfully)
3. **Web Access**: Visit `https://zaptool.online` (should load app)
4. **Health Check**: `curl https://zaptool.online/health` (should return "healthy")

## 🔍 Troubleshooting:

### If Build Still Fails:
```bash
# Run comprehensive fix
chmod +x fix-all-build-errors.sh
./fix-all-build-errors.sh
```

### If PM2 Won't Start:
```bash
# Check config syntax
pm2 ecosystem ecosystem.config.cjs

# Try direct start
pm2 start npm --name "zaptool-whatsapp" -- start
```

### If Nginx Issues:
```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

## 📁 Key Files:

- `ecosystem.config.cjs` - PM2 configuration (CommonJS format)
- `zaptool-nginx.conf` - Nginx server configuration
- `zaptool-deploy.sh` - Automated deployment script
- `.env` - Environment variables (update with real values)

## 🎯 Production Checklist:

- [ ] Build completes without errors
- [ ] PM2 starts application successfully
- [ ] Nginx serves application
- [ ] SSL certificate installed
- [ ] Environment variables configured
- [ ] Database connected
- [ ] Webhooks responding
- [ ] Health check passes

Your application should now be ready for production at `https://zaptool.online`!