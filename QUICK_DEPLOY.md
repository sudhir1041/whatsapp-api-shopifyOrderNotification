# Quick Hostinger VPS Deployment Guide

## 🚀 Fast Track Deployment (30 minutes)

### Step 1: Prepare Your VPS
```bash
# SSH into your Hostinger VPS
ssh root@YOUR_VPS_IP

# Run the setup script
curl -fsSL https://raw.githubusercontent.com/yourusername/wanotify/main/scripts/setup-vps.sh | bash

# Switch to wanotify user
su - wanotify
```

### Step 2: Upload Your Project
```bash
# Option A: Clone from Git (if you have a repository)
git clone https://github.com/yourusername/wanotify.git
cd wanotify

# Option B: Upload via SCP from your local machine
# scp -r /path/to/test-app wanotify@YOUR_VPS_IP:~/wanotify
```

### Step 3: Configure Environment
```bash
# Copy and edit environment file
cp .env.production .env
nano .env

# Update these values:
# SHOPIFY_APP_URL=https://your-domain.com
# DATABASE_URL=mysql://wanotify:wanotify123@db:3306/wanotify
```

### Step 4: Deploy Application
```bash
# Run deployment script
./scripts/deploy.sh

# Check if running
docker-compose ps
```

### Step 5: Configure Nginx (as root)
```bash
# Switch back to root
sudo su

# Create Nginx config
cat > /etc/nginx/sites-available/wanotify << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/wanotify /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### Step 6: Setup SSL
```bash
# Get SSL certificate (replace with your domain)
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Step 7: Deploy to Shopify
```bash
# Switch back to wanotify user
su - wanotify
cd wanotify

# Install Shopify CLI
npm install -g @shopify/cli

# Login and deploy
shopify auth login
npm run deploy
```

## 🎉 You're Done!

Your WaNotify app is now live at: `https://your-domain.com`

## Quick Commands

```bash
# View logs
docker-compose logs -f app

# Restart app
docker-compose restart

# Stop app
docker-compose down

# Update app
git pull && docker-compose up -d --build

# Backup database
docker-compose exec db mysqldump -u wanotify -pwanotify123 wanotify > backup.sql
```

## Troubleshooting

**App not starting?**
```bash
docker-compose logs app
```

**Database issues?**
```bash
docker-compose logs db
docker-compose exec db mysql -u wanotify -pwanotify123 wanotify
```

**Nginx issues?**
```bash
sudo nginx -t
sudo systemctl status nginx
```

**SSL issues?**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```