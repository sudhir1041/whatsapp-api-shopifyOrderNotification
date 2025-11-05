# WaNotify Deployment on Hostinger VPS - Complete Guide

## Prerequisites
- Hostinger VPS account
- Domain name (optional but recommended)
- SSH access to VPS
- Basic Linux knowledge

## Step 1: VPS Setup and Initial Configuration

### 1.1 Connect to Your Hostinger VPS
```bash
# SSH into your VPS (replace with your VPS IP)
ssh root@your-vps-ip
```

### 1.2 Update System
```bash
# Update package lists
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nano ufw
```

### 1.3 Create Non-Root User
```bash
# Create new user
adduser wanotify

# Add to sudo group
usermod -aG sudo wanotify

# Switch to new user
su - wanotify
```

## Step 2: Install Required Software

### 2.1 Install Node.js 18+
```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2.2 Install Docker and Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker wanotify

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
su - wanotify

# Verify Docker installation
docker --version
docker-compose --version
```

### 2.3 Install Nginx (Reverse Proxy)
```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 3: Configure Firewall

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Check status
sudo ufw status
```

## Step 4: Deploy Your Application

### 4.1 Clone Your Project
```bash
# Navigate to home directory
cd ~

# Clone your project (replace with your repository)
git clone https://github.com/yourusername/wanotify.git
cd wanotify

# Or upload files via SCP if no git repo
# scp -r /local/path/to/test-app wanotify@your-vps-ip:~/wanotify
```

### 4.2 Configure Environment Variables
```bash
# Copy production environment file
cp .env.production .env

# Edit environment variables
nano .env
```

**Update .env file with your VPS details:**
```bash
NODE_ENV=production
SHOPIFY_API_KEY=a2025f8cce4b8f141f39409f4baeec8b
SHOPIFY_API_SECRET=dfc7395493e3a575d322117785a1254f
SCOPES=read_orders,write_orders,write_products,read_customers
SHOPIFY_APP_URL=https://your-domain.com
DATABASE_URL=mysql://wanotify:wanotify123@localhost:3306/wanotify
```

### 4.3 Update Docker Compose for Production
```bash
nano docker-compose.yml
```

**Update docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://wanotify:wanotify123@db:3306/wanotify
    depends_on:
      - db
    restart: unless-stopped
    volumes:
      - ./prisma:/app/prisma

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=wanotify
      - MYSQL_USER=wanotify
      - MYSQL_PASSWORD=wanotify123
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "127.0.0.1:3306:3306"
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:
```

### 4.4 Build and Start Application
```bash
# Build and start services
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f app
```

## Step 5: Configure Nginx Reverse Proxy

### 5.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/wanotify
```

**Add this configuration:**
```nginx
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
        proxy_read_timeout 86400;
    }
}
```

### 5.2 Enable Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/wanotify /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 6: Configure SSL with Let's Encrypt

### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate
```bash
# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 7: Configure Domain (If Using Custom Domain)

### 7.1 DNS Configuration
In your domain registrar's DNS settings, add these records:
```
Type: A
Name: @
Value: YOUR_VPS_IP

Type: A  
Name: www
Value: YOUR_VPS_IP
```

### 7.2 Update Shopify App Configuration
```bash
# Update shopify.app.toml
nano shopify.app.toml
```

**Update URLs in shopify.app.toml:**
```toml
application_url = "https://your-domain.com"

[auth]
redirect_urls = [
  "https://your-domain.com/auth/callback",
  "https://your-domain.com/auth/shopify/callback", 
  "https://your-domain.com/api/auth/callback"
]
```

## Step 8: Deploy to Shopify

### 8.1 Install Shopify CLI
```bash
# Install Shopify CLI
npm install -g @shopify/cli @shopify/theme
```

### 8.2 Deploy App
```bash
# Login to Shopify
shopify auth login

# Deploy the app
npm run deploy
```

## Step 9: Set Up Process Management

### 9.1 Create Systemd Service
```bash
sudo nano /etc/systemd/system/wanotify.service
```

**Add service configuration:**
```ini
[Unit]
Description=WaNotify Shopify App
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/wanotify/wanotify
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=wanotify

[Install]
WantedBy=multi-user.target
```

### 9.2 Enable Service
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable wanotify

# Start service
sudo systemctl start wanotify

# Check status
sudo systemctl status wanotify
```

## Step 10: Monitoring and Maintenance

### 10.1 Set Up Log Rotation
```bash
sudo nano /etc/logrotate.d/wanotify
```

**Add log rotation config:**
```
/home/wanotify/wanotify/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 wanotify wanotify
}
```

### 10.2 Create Backup Script
```bash
nano ~/backup.sh
```

**Add backup script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/wanotify/backups"
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T db mysqldump -u wanotify -pwanotify123 wanotify > $BACKUP_DIR/db_backup_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /home/wanotify/wanotify

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Make executable
chmod +x ~/backup.sh

# Add to crontab for daily backups
crontab -e
# Add this line:
# 0 2 * * * /home/wanotify/backup.sh
```

## Step 11: Testing and Verification

### 11.1 Test Application
```bash
# Check if app is running
curl -I http://localhost:3000

# Check database connection
docker-compose exec app npm run prisma db push

# View application logs
docker-compose logs -f app
```

### 11.2 Test Webhooks
- Install app on a test Shopify store
- Create a test cart and verify webhook delivery
- Check cart abandonment functionality

## Troubleshooting

### Common Issues and Solutions

**1. Port 3000 already in use:**
```bash
sudo lsof -i :3000
sudo kill -9 PID
```

**2. Docker permission denied:**
```bash
sudo usermod -aG docker $USER
# Logout and login again
```

**3. Nginx configuration errors:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

**4. SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

**5. Database connection issues:**
```bash
docker-compose logs db
docker-compose exec db mysql -u wanotify -pwanotify123 wanotify
```

## Maintenance Commands

```bash
# Restart application
docker-compose restart

# Update application
git pull
docker-compose build --no-cache
docker-compose up -d

# View logs
docker-compose logs -f

# Database backup
docker-compose exec db mysqldump -u wanotify -pwanotify123 wanotify > backup.sql

# Database restore
docker-compose exec -T db mysql -u wanotify -pwanotify123 wanotify < backup.sql
```

## Security Checklist

- [ ] UFW firewall enabled
- [ ] SSH key authentication (disable password auth)
- [ ] SSL certificate installed
- [ ] Regular security updates
- [ ] Database password changed from default
- [ ] Nginx security headers configured
- [ ] Regular backups scheduled

Your WaNotify app is now successfully deployed on Hostinger VPS with production-grade configuration!