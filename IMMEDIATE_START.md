# Start App Immediately

## 🚀 Quick Start Commands:

```bash
cd /home/zaptool/htdocs/zaptool.online

# Method 1: Use the start script
chmod +x start-app-now.sh
./start-app-now.sh
```

## 📋 Manual Start:

```bash
# Create PM2 config
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'zaptool-whatsapp',
    script: 'npm',
    args: 'start',
    instances: 1,
    env: { NODE_ENV: 'production', PORT: 3000 }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
```

## 🔧 Alternative - Direct Start:

```bash
# Start directly with npm
npm start &

# Or with nohup for background
nohup npm start > app.log 2>&1 &
```

## ✅ Verify Running:

```bash
# Check PM2
pm2 status
pm2 logs

# Check if app responds
curl http://localhost:3000
curl http://localhost:3000/health

# Check process
ps aux | grep node
netstat -tlnp | grep 3000
```

## 🌐 Access App:

- Local: `http://localhost:3000`
- Domain: `http://zaptool.online` (if Nginx configured)

## 🔒 Get SSL Later:

```bash
certbot --nginx -d zaptool.online -d www.zaptool.online
```

The app should start immediately with these commands!