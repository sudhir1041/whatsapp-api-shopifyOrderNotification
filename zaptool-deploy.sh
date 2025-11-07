#!/bin/bash

echo "🚀 ZapTool.online Production Deployment Script"
echo "=============================================="

# Configuration
APP_DIR="/home/zaptool/htdocs/zaptool.online"
DOMAIN="zaptool.online"
USER="zaptool"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Create app directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    print_status "Creating application directory..."
    mkdir -p $APP_DIR
    chown $USER:$USER $APP_DIR
fi

# Navigate to app directory
cd $APP_DIR

print_status "Starting deployment process..."

# 1. System Dependencies
print_status "Installing system dependencies..."
apt update -qq
apt install -y curl wget gnupg2 software-properties-common

# Install Node.js 18
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    apt install -y nginx
else
    print_status "Nginx already installed"
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    print_status "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
else
    print_status "PostgreSQL already installed"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
else
    print_status "PM2 already installed"
fi

# 2. Application Setup
print_status "Setting up application..."

# Set correct ownership
chown -R $USER:$USER $APP_DIR

# Install application dependencies
if [ -f "package.json" ]; then
    print_status "Installing application dependencies..."
    sudo -u $USER npm install --production
else
    print_warning "No package.json found. Please ensure your application files are in $APP_DIR"
fi

# 3. Database Setup
print_status "Setting up database..."
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='whatsapp_analytics';" | grep -q 1 || {
    print_status "Creating database and user..."
    sudo -u postgres psql << EOF
CREATE DATABASE whatsapp_analytics;
CREATE USER $USER WITH ENCRYPTED PASSWORD 'zaptool123!';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_analytics TO $USER;
\q
EOF
}

# Run database migrations if Prisma is available
if [ -f "prisma/schema.prisma" ]; then
    print_status "Running database migrations..."
    sudo -u $USER npx prisma generate
    sudo -u $USER npx prisma db push
fi

# 4. Environment Configuration
if [ ! -f ".env" ]; then
    print_status "Creating environment configuration..."
    cat > .env << EOF
NODE_ENV=production
DATABASE_URL="postgresql://$USER:zaptool123!@localhost:5432/whatsapp_analytics"
SHOPIFY_API_KEY="your_api_key_here"
SHOPIFY_API_SECRET="your_api_secret_here"
SCOPES="read_orders,write_orders,read_customers,write_customers"
HOST="https://$DOMAIN"
WHATSAPP_ACCESS_TOKEN="your_whatsapp_token_here"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id_here"
PORT=3000
EOF
    chown $USER:$USER .env
    print_warning "Please update .env file with your actual credentials"
fi

# 5. Build Application
if [ -f "package.json" ] && grep -q "build" package.json; then
    print_status "Building application..."
    sudo -u $USER npm run build
fi

# 6. PM2 Configuration
print_status "Setting up PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'zaptool-whatsapp',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 2,
    exec_mode: 'cluster',
    user: '$USER',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/zaptool-error.log',
    out_file: '/var/log/pm2/zaptool-out.log',
    log_file: '/var/log/pm2/zaptool.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Create PM2 log directory
mkdir -p /var/log/pm2
chown $USER:$USER /var/log/pm2

# 7. Nginx Configuration
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    root $APP_DIR/public;
    index index.html index.htm;

    # SSL Configuration (will be configured by Certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

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
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }

    # Static Assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ /\\. {
        deny all;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 8. SSL Certificate Setup
print_status "Setting up SSL certificate..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificate (interactive)
print_warning "Run this command manually to get SSL certificate:"
print_warning "certbot --nginx -d $DOMAIN -d www.$DOMAIN"

# 9. Start Application
print_status "Starting application with PM2..."
sudo -u $USER pm2 start ecosystem.config.js
sudo -u $USER pm2 save

# Setup PM2 startup
sudo -u $USER pm2 startup | grep "sudo" | bash

# 10. Firewall Setup
print_status "Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'

# 11. Create management scripts
print_status "Creating management scripts..."

# Health check script
cat > /usr/local/bin/zaptool-health.sh << EOF
#!/bin/bash
curl -f https://$DOMAIN/health || {
    echo "App down, restarting..."
    sudo -u $USER pm2 restart zaptool-whatsapp
    systemctl reload nginx
}
EOF
chmod +x /usr/local/bin/zaptool-health.sh

# Deployment script for updates
cat > $APP_DIR/update-app.sh << EOF
#!/bin/bash
cd $APP_DIR
git pull origin main 2>/dev/null || echo "No git repository"
npm install --production
npm run build 2>/dev/null || echo "No build script"
npx prisma generate 2>/dev/null || echo "No Prisma"
npx prisma db push 2>/dev/null || echo "No Prisma migrations"
pm2 reload zaptool-whatsapp
systemctl reload nginx
echo "Update complete!"
EOF
chmod +x $APP_DIR/update-app.sh
chown $USER:$USER $APP_DIR/update-app.sh

# 12. Setup monitoring
print_status "Setting up monitoring..."
echo "*/5 * * * * /usr/local/bin/zaptool-health.sh" | crontab -

# 13. Final status check
print_status "Deployment completed! Final status:"
echo ""
echo "📊 System Status:"
echo "- Node.js: $(node --version)"
echo "- NPM: $(npm --version)"
echo "- PM2: $(pm2 --version)"
echo "- Nginx: $(nginx -v 2>&1)"
echo "- PostgreSQL: $(sudo -u postgres psql --version)"
echo ""
echo "📁 Application:"
echo "- Path: $APP_DIR"
echo "- Owner: $(ls -ld $APP_DIR | awk '{print $3":"$4}')"
echo "- PM2 Status: $(sudo -u $USER pm2 list | grep zaptool-whatsapp || echo 'Not running')"
echo ""
echo "🌐 Web Server:"
echo "- Nginx Status: $(systemctl is-active nginx)"
echo "- Site Config: /etc/nginx/sites-available/$DOMAIN"
echo ""
echo "🔧 Next Steps:"
echo "1. Update .env file with your credentials"
echo "2. Run: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Test your application: http://$DOMAIN"
echo "4. Start PM2 app: sudo -u $USER pm2 start ecosystem.config.js"
echo ""
echo "📞 Management Commands:"
echo "- Check status: sudo -u $USER pm2 status"
echo "- View logs: sudo -u $USER pm2 logs zaptool-whatsapp"
echo "- Update app: $APP_DIR/update-app.sh"
echo "- Health check: /usr/local/bin/zaptool-health.sh"

print_status "Deployment script completed successfully!"