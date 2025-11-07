#!/bin/bash

echo "🚀 Starting App Immediately"

cd /home/zaptool/htdocs/zaptool.online

# Create PM2 config
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'zaptool-whatsapp',
    script: 'npm',
    args: 'start',
    cwd: '/home/zaptool/htdocs/zaptool.online',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/error.log',
    out_file: '/var/log/pm2/out.log',
    log_file: '/var/log/pm2/app.log'
  }]
};
EOF

# Create log directory
mkdir -p /var/log/pm2

# Start as root (since we're already root)
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

echo "✅ App started!"
echo ""
echo "📊 Check status:"
echo "pm2 status"
echo "pm2 logs"
echo ""
echo "🌐 Test app:"
echo "curl http://localhost:3000"