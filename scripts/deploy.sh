#!/bin/bash

# WaNotify Deployment Script for Hostinger VPS
# Usage: ./deploy.sh

set -e

echo "🚀 Starting WaNotify deployment..."

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
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Copying from .env.production"
    if [ -f ".env.production" ]; then
        cp .env.production .env
        print_status "Please edit .env file with your production settings"
        exit 1
    else
        print_error ".env.production file not found. Please create environment configuration."
        exit 1
    fi
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down || true

# Pull latest changes (if git repo)
if [ -d ".git" ]; then
    print_status "Pulling latest changes..."
    git pull origin main || git pull origin master || true
fi

# Build and start containers
print_status "Building and starting containers..."
docker-compose up -d --build

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 10

# Run database migrations
print_status "Running database migrations..."
docker-compose exec -T app npm run db:migrate || true

# Check if containers are running
print_status "Checking container status..."
docker-compose ps

# Test application
print_status "Testing application..."
sleep 5
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Application is running successfully!"
else
    print_warning "⚠️  Application might not be ready yet. Check logs with: docker-compose logs -f app"
fi

print_status "🎉 Deployment completed!"
print_status "View logs: docker-compose logs -f app"
print_status "Stop app: docker-compose down"
print_status "Restart app: docker-compose restart"