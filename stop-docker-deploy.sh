#!/bin/bash

echo "🛑 Stopping Docker containers and deploying directly..."

# Stop and remove all Docker containers
docker-compose down --remove-orphans 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Kill any processes using port 3000 or 3306
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo fuser -k 3306/tcp 2>/dev/null || true

echo "✅ Docker containers stopped"

# Now deploy directly
echo "🚀 Starting direct deployment..."
./deploy-production-final.sh