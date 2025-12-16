#!/bin/bash
# Family Task Tracker - Remote Server Deployment Script
# Run this on your server: 192.168.1.61

set -e  # Exit on error

echo "🚀 Deploying Family Task Tracker..."
echo ""

# Step 1: Pull the latest Docker image
echo "📦 Pulling latest Docker image..."
docker pull ghcr.io/soopahfly/family-task-tracker:latest

# Step 2: Stop and remove existing container (if any)
echo "🛑 Stopping existing container (if running)..."
docker stop family-task-tracker 2>/dev/null || true
docker rm family-task-tracker 2>/dev/null || true

# Step 3: Run the new container
echo "▶️  Starting new container..."
docker run -d \
  --name family-task-tracker \
  -p 3000:80 \
  --restart unless-stopped \
  ghcr.io/soopahfly/family-task-tracker:latest

# Step 4: Wait a moment for container to start
sleep 3

# Step 5: Check container status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Container Status:"
docker ps | grep family-task-tracker || echo "⚠️  Container not running!"

echo ""
echo "📋 Recent Logs:"
docker logs --tail 20 family-task-tracker

echo ""
echo "🌐 Access your app at:"
echo "   http://192.168.1.61:3000"
echo ""
echo "💡 Useful commands:"
echo "   View logs:    docker logs -f family-task-tracker"
echo "   Stop app:     docker stop family-task-tracker"
echo "   Restart app:  docker restart family-task-tracker"
echo "   Update app:   Run this script again"
