#!/bin/bash
# Docker Update Script for Family Task Tracker
# Run this script to rebuild and restart your Docker container with latest changes

set -e  # Exit on error

echo "🔄 Updating Family Task Tracker Docker Container..."
echo ""

# Step 1: Stop running container
echo "1️⃣  Stopping current container..."
docker compose down
echo "✅ Container stopped"
echo ""

# Step 2: Rebuild image (no cache to ensure fresh build)
echo "2️⃣  Rebuilding Docker image with latest code..."
docker compose build --no-cache
echo "✅ Image rebuilt"
echo ""

# Step 3: Start new container
echo "3️⃣  Starting updated container..."
docker compose up -d
echo "✅ Container started"
echo ""

# Step 4: Show status
echo "📊 Container Status:"
docker compose ps
echo ""

# Step 5: Show logs (last 20 lines)
echo "📋 Recent Logs:"
docker compose logs --tail=20
echo ""

echo "🎉 Update complete! App is running at http://localhost:3000"
echo ""
echo "💡 Useful commands:"
echo "   View logs:        docker compose logs -f"
echo "   Stop container:   docker compose down"
echo "   Restart:          docker compose restart"
