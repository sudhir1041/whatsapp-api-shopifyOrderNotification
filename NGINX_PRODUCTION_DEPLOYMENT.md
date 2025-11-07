# Nginx Production Deployment Guide
**For path: `/home/zaptool/htdocs/zaptool.online`**

## 🚀 Quick Deployment

```bash
# Navigate to your project
cd /home/zaptool/htdocs/zaptool.online

# Run deployment script
chmod +x deploy-production.sh
./deploy-production.sh
```

## 📋 Server Setup

### 1. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Nginx & PM2
apt install -y nginx
npm install -g pm2

# Install PostgreSQL
apt install -y postgresql postgresql-contrib
```

### 2. Application Setup

```bash
# Set correct ownership
chown -R zaptool:zaptool /home/zaptool/htdocs/zaptool.online
cd /home/zaptool/htdocs/zaptool.online

# Install dependencies
npm install --production

# Setup database
npx prisma generate
npx prisma db push

# Build application
npm run build
```

### 3. Environment Configuration

```bash
# Create production .env
cat > /home/zaptool/htdocs/zaptool.online/.env << EOF
NODE_ENV=production
DATABASE_URL="postgresql://zaptool:password@localhost:5432/whatsapp_analytics"
SHOPIFY_API_KEY="your_api_key"
SHOPIFY_API_SECRET="your_api_secret"
SCOPES="read_orders,write_orders,read_customers,write_customers"
HOST="https://zaptool.online"
WHATSAPP_ACCESS_TOKEN="your_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_id"
EOF
```

### 4. Database Setup

```bash
# Create database
sudo -u postgres psql << EOF
CREATE DATABASE whatsapp_analytics;
CREATE USER zaptool WITH ENCRYPTED PASSWORD 'secure_password123';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_analytics TO zaptool;
\q
EOF
```

### 5. Nginx Configuration

```bash
# Create Nginx config for zaptool.online
cat > /etc/nginx/sites-available/zaptool.online << EOF
server {
    listen 80;
    server_name zaptool.online www.zaptool.online;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zaptool.online www.zaptool.online;
    
    root /home/zaptool/htdocs/zaptool.online/public;
    index index.html index.htm;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/zaptool.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zaptool.online/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    # Main Application
    location / {
        try_files \$uri \$uri/ @nodejs;
    }

    # Node.js Application
    location @nodejs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Webhooks
    location /webhooks/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Security
    location ~ /\. {
        deny all;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/zaptool.online /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 6. SSL Certificate

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d zaptool.online -d www.zaptool.online

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### 7. PM2 Configuration

```bash
# Create PM2 config
cat > /home/zaptool/htdocs/zaptool.online/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'zaptool-whatsapp',
    script: 'npm',
    args: 'start',
    cwd: '/home/zaptool/htdocs/zaptool.online',
    instances: 2,
    exec_mode: 'cluster',
    user: 'zaptool',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/zaptool-error.log',
    out_file: '/var/log/pm2/zaptool-out.log',
    log_file: '/var/log/pm2/zaptool.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
EOF

# Create log directory
mkdir -p /var/log/pm2
chown zaptool:zaptool /var/log/pm2

# Start application as zaptool user
su - zaptool -c "cd /home/zaptool/htdocs/zaptool.online && pm2 start ecosystem.config.js"
su - zaptool -c "pm2 save"
su - zaptool -c "pm2 startup"
```

## 🔄 Deployment Script

```bash
# Create deployment script
cat > /home/zaptool/htdocs/zaptool.online/deploy-production.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Production Deployment for zaptool.online..."

APP_DIR="/home/zaptool/htdocs/zaptool.online"
DOMAIN="zaptool.online"

# Navigate to app directory
cd $APP_DIR

# Update application
echo "📦 Updating application..."
git pull origin main 2>/dev/null || echo "No git repository"
npm install --production

# Database operations
echo "🗄️ Running database operations..."
npx prisma generate
npx prisma db push

# Build application
echo "🏗️ Building application..."
npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 reload zaptool-whatsapp
systemctl reload nginx

# Health check
echo "🏥 Running health check..."
sleep 5
curl -f https://$DOMAIN/health || echo "⚠️ Health check failed"

# Deploy to Shopify
echo "📱 Deploying to Shopify..."
npm run deploy

echo "✅ Deployment complete!"
echo ""
echo "📋 Status Check:"
echo "1. PM2 Status: pm2 status"
echo "2. Logs: pm2 logs zaptool-whatsapp"
echo "3. App URL: https://$DOMAIN"
echo "4. Nginx Status: systemctl status nginx"
EOF

chmod +x /home/zaptool/htdocs/zaptool.online/deploy-production.sh
```

## 🔧 Management Commands

### Application Management

```bash
# Check status
pm2 status
pm2 logs zaptool-whatsapp

# Restart application
pm2 restart zaptool-whatsapp

# Monitor resources
pm2 monit

# View real-time logs
pm2 logs zaptool-whatsapp --lines 100
```

### Nginx Management

```bash
# Check configuration
nginx -t

# Reload configuration
systemctl reload nginx

# Check status
systemctl status nginx

# View logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Database Management

```bash
# Connect to database
sudo -u postgres psql whatsapp_analytics

# Backup database
pg_dump -U zaptool whatsapp_analytics > backup_$(date +%Y%m%d).sql

# Restore database
psql -U zaptool whatsapp_analytics < backup_file.sql
```

## 🔒 Security Setup

### Firewall Configuration

```bash
# Configure UFW
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

### Fail2Ban Protection

```bash
# Install and configure Fail2Ban
apt install -y fail2ban

cat > /etc/fail2ban/jail.local << EOF
[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true
EOF

systemctl restart fail2ban
```

## 📊 Monitoring Setup

### Health Check Script

```bash
# Create health monitoring
cat > /usr/local/bin/zaptool-health.sh << EOF
#!/bin/bash
curl -f https://zaptool.online/health || {
    echo "App down, restarting..."
    pm2 restart zaptool-whatsapp
    systemctl reload nginx
}
EOF

chmod +x /usr/local/bin/zaptool-health.sh

# Add to crontab
echo "*/5 * * * * /usr/local/bin/zaptool-health.sh" | crontab -
```

### Log Rotation

```bash
# Setup log rotation
cat > /etc/logrotate.d/zaptool << EOF
/var/log/pm2/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 zaptool zaptool
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

## 🚀 Performance Optimization

### Nginx Tuning

```bash
# Add to /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_max_body_size 10M;

# Enable in server block
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    gzip_static on;
}
```

### Node.js Optimization

```bash
# Update ecosystem.config.js
node_args: '--max-old-space-size=1024'
instances: 'max'  # Use all CPU cores
```

## 🔧 Troubleshooting

### Common Issues

**Permission Errors:**
```bash
chown -R zaptool:zaptool /home/zaptool/htdocs/zaptool.online
chmod -R 755 /home/zaptool/htdocs/zaptool.online
```

**Port Already in Use:**
```bash
lsof -i :3000
pm2 kill
pm2 start ecosystem.config.js
```

**SSL Certificate Issues:**
```bash
certbot renew --dry-run
nginx -t
systemctl reload nginx
```

**Database Connection:**
```bash
sudo -u postgres psql -c "\l"
systemctl status postgresql
```

## 📞 Support & Maintenance

### Daily Checks
- `pm2 status` - Application status
- `systemctl status nginx` - Web server status
- `df -h` - Disk space
- `free -m` - Memory usage

### Weekly Tasks
- `apt update && apt upgrade` - System updates
- `pm2 logs --lines 1000` - Review logs
- Database backup
- SSL certificate check

---

**Production deployment ready for zaptool.online with Nginx, SSL, monitoring, and security.**