#!/bin/bash

# Hostinger VPS Setup Script for WaNotify
# Run this script on your fresh Hostinger VPS

set -e

echo "🔧 Setting up Hostinger VPS for WaNotify..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

print_status "Updating system packages..."
apt update && apt upgrade -y

print_status "Installing essential packages..."
apt install -y curl wget git nano ufw software-properties-common

print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

print_status "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

print_status "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

print_status "Installing Nginx..."
apt install -y nginx

print_status "Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx

print_status "Creating wanotify user..."
if ! id "wanotify" &>/dev/null; then
    adduser --disabled-password --gecos "" wanotify
    usermod -aG sudo wanotify
    usermod -aG docker wanotify
fi

print_status "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 80
ufw allow 443
ufw --force enable

print_status "Starting services..."
systemctl start nginx
systemctl enable nginx
systemctl start docker
systemctl enable docker

print_status "✅ VPS setup completed!"
print_status "Next steps:"
print_status "1. Switch to wanotify user: su - wanotify"
print_status "2. Upload your WaNotify project files"
print_status "3. Run the deployment script: ./scripts/deploy.sh"
print_status "4. Configure Nginx and SSL"