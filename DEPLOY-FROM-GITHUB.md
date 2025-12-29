# Deploy from GitHub Container Registry

## Overview

This guide shows how to push your Docker image to GitHub Container Registry and deploy it to your server.

## Step 1: Build and Push Image to GitHub (One-time setup)

### A. Login to GitHub Container Registry

On your local Windows machine:

```batch
docker login ghcr.io -u soopahfly
```

You'll be prompted for a Personal Access Token (not your GitHub password):
- Go to: https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Select scopes: `write:packages`, `read:packages`, `delete:packages`
- Copy the token and paste it as your password

### B. Build and Push the Image

Run the automated script:

```batch
push-to-github.bat
```

Or manually:

```batch
# Build the image
docker build -t family-task-tracker:2.1.0 .

# Tag for GitHub
docker tag family-task-tracker:2.1.0 ghcr.io/soopahfly/family-task-tracker:latest
docker tag family-task-tracker:2.1.0 ghcr.io/soopahfly/family-task-tracker:2.1.0

# Push to GitHub
docker push ghcr.io/soopahfly/family-task-tracker:latest
docker push ghcr.io/soopahfly/family-task-tracker:2.1.0
```

### C. Make the Package Public (Optional)

1. Go to: https://github.com/soopahfly?tab=packages
2. Click on `family-task-tracker`
3. Click "Package settings"
4. Scroll to "Danger Zone"
5. Click "Change visibility" → "Public"

This allows your Docker server to pull without authentication.

## Step 2: Deploy to Your Docker Server

### Option A: Simple Deployment (Recommended)

SSH into your server and run:

```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker

# Copy the production docker-compose file (if not already there)
# You can copy it manually or via scp

# Pull the latest image and restart
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

### Option B: First-time Setup

If this is the first deployment on your server:

```bash
# Create the directory
ssh soopah-admin@192.168.1.61
mkdir -p /home/soopah-admin/family-task-tracker
cd /home/soopah-admin/family-task-tracker

# Create docker-compose.production.yml
nano docker-compose.production.yml
```

Paste this content:

```yaml
version: '3.8'

services:
  family-task-tracker:
    image: ghcr.io/soopahfly/family-task-tracker:latest
    container_name: family-task-tracker
    ports:
      - "3000:80"
    restart: unless-stopped
    environment:
      - TZ=America/New_York
    volumes:
      - family-task-data:/app/server/data

volumes:
  family-task-data:
```

Save and exit (Ctrl+X, Y, Enter), then:

```bash
# Pull and start
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

## Step 3: Verify Deployment

```bash
# Check container is running
docker ps | grep family-task-tracker

# View logs
docker compose -f docker-compose.production.yml logs -f
```

Access the app at: **http://192.168.1.61:3000**

## Updating to a New Version

When you have a new version:

### On Your Local Machine:

```batch
# Update version in package.json
# Build and push new image
push-to-github.bat
```

### On Your Server:

```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

That's it! The new version is deployed.

## Benefits of This Approach

✅ **No file copying** - Just pull the pre-built image
✅ **Faster deployment** - No build time on server
✅ **Version control** - Can easily rollback to previous versions
✅ **Consistent builds** - Same image works everywhere
✅ **Easy updates** - Pull and restart in seconds

## Troubleshooting

### Authentication Required

If your package is private, login on the server:

```bash
docker login ghcr.io -u soopahfly
# Enter your Personal Access Token
```

### Check Available Versions

```bash
# List all tags
docker search ghcr.io/soopahfly/family-task-tracker
```

### Use Specific Version

Edit `docker-compose.production.yml`:

```yaml
image: ghcr.io/soopahfly/family-task-tracker:2.1.0  # Specific version
```

### Rollback to Previous Version

```bash
# Pull a specific older version
docker pull ghcr.io/soopahfly/family-task-tracker:2.0.0

# Update docker-compose.production.yml to use that version
# Then restart
docker compose -f docker-compose.production.yml up -d
```

## Your Current Setup

- **Local build**: Use `push-to-github.bat` to build and push
- **Server deployment**: Use `docker-compose.production.yml` to pull and run
- **Image location**: ghcr.io/soopahfly/family-task-tracker:latest
- **Current version**: 2.1.0
