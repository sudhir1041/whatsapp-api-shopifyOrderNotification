#!/bin/bash

echo "🌐 Setting up zaptool.online server..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Install Certbot for SSL
echo "🔒 Installing Certbot..."
sudo apt install certbot python3-certbot-nginx -y

# Copy Nginx configuration
echo "⚙️ Setting up Nginx configuration..."
sudo cp nginx.conf /etc/nginx/sites-available/zaptool.online
sudo ln -sf /etc/nginx/sites-available/zaptool.online /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Get SSL certificate
echo "🔒 Getting SSL certificate..."
sudo certbot --nginx -d zaptool.online -d www.zaptool.online --non-interactive --agree-tos --email zaptoolonline@gmail.com

# Start services
echo "🚀 Starting services..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Make deployment script executable
chmod +x deploy-production.sh

echo "✅ Server setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Run: ./deploy-production.sh"
echo "2. Configure your Shopify app settings"
echo "3. Test your app at https://zaptool.online"