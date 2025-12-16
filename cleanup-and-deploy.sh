#!/bin/bash

echo "🧹 Cleaning up old Family Task Tracker containers..."

# Stop and remove old containers (try various possible names)
docker stop family-task-tracker 2>/dev/null || true
docker stop kids-task-tracker 2>/dev/null || true
docker stop kidstask-kids-task-tracker-1 2>/dev/null || true
docker stop nginxproxyrgr-app-1 2>/dev/null || true

docker rm family-task-tracker 2>/dev/null || true
docker rm kids-task-tracker 2>/dev/null || true
docker rm kidstask-kids-task-tracker-1 2>/dev/null || true
docker rm nginxproxyrgr-app-1 2>/dev/null || true

# Remove old images
docker rmi ghcr.io/soopahfly/family-task-tracker:latest 2>/dev/null || true
docker rmi ghcr.io/soopahfly/family-task-tracker:main 2>/dev/null || true

# Clean up unused images
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "🚀 Deploying new version..."

# Pull latest image
docker pull ghcr.io/soopahfly/family-task-tracker:latest

# Deploy with docker-compose
docker compose -f docker-compose.production.yml up -d

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://localhost:3000"
echo ""
echo "📊 Check status with: docker ps"
echo "📝 View logs with: docker logs -f family-task-tracker"
