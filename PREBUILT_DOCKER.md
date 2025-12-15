# Using Pre-Built Docker Images

## Quick Start (No Build Required!)

Instead of building the Docker image locally, you can use the pre-built image from GitHub Container Registry.

### Option 1: Using Pre-Built Image (Fastest)

```bash
# Pull and run the latest pre-built image
docker run -d \
  --name family-task-tracker \
  -p 3000:80 \
  --restart unless-stopped \
  ghcr.io/soopahfly/family-task-tracker:latest
```

Access at: http://localhost:3000

### Option 2: Using Docker Compose

```bash
# Download the docker-compose.prebuilt.yml file
curl -O https://raw.githubusercontent.com/Soopahfly/family-task-tracker/main/docker-compose.prebuilt.yml

# Run with pre-built image
docker compose -f docker-compose.prebuilt.yml up -d
```

---

## Comparison: Build vs Pre-Built

| Method | First Time | Updates | Disk Space | Network |
|--------|-----------|---------|------------|---------|
| **Build Locally** | 2-5 min | 1-3 min | ~500 MB build files | Minimal |
| **Pre-Built Image** | 30 sec | 10 sec | ~25 MB image only | ~25 MB download |

**Use Pre-Built If:**
- ✅ You want quick deployment
- ✅ You're on a slow machine
- ✅ You don't need to modify the code
- ✅ You're deploying to multiple servers

**Build Locally If:**
- ✅ You're modifying the code
- ✅ You have slow internet
- ✅ You want maximum control

---

## Available Image Tags

Images are automatically built and published on every push to the repository.

### Tag Options:

```bash
# Latest stable version
ghcr.io/soopahfly/family-task-tracker:latest

# Specific version (when tagged)
ghcr.io/soopahfly/family-task-tracker:v1.0.0
ghcr.io/soopahfly/family-task-tracker:v1.0
ghcr.io/soopahfly/family-task-tracker:v1

# Specific commit (for testing)
ghcr.io/soopahfly/family-task-tracker:sha-abc1234

# Main branch (development)
ghcr.io/soopahfly/family-task-tracker:main
```

### Example: Using a Specific Version

```bash
docker run -d \
  --name family-task-tracker \
  -p 3000:80 \
  ghcr.io/soopahfly/family-task-tracker:v1.0.0
```

---

## Updating Pre-Built Images

### Pull Latest Version

```bash
# Stop running container
docker stop family-task-tracker
docker rm family-task-tracker

# Pull latest image
docker pull ghcr.io/soopahfly/family-task-tracker:latest

# Start with new image
docker run -d \
  --name family-task-tracker \
  -p 3000:80 \
  --restart unless-stopped \
  ghcr.io/soopahfly/family-task-tracker:latest
```

### Using Docker Compose

```bash
# Pull latest image
docker compose -f docker-compose.prebuilt.yml pull

# Restart with new image
docker compose -f docker-compose.prebuilt.yml up -d
```

### One-Liner Update

```bash
docker compose -f docker-compose.prebuilt.yml pull && \
docker compose -f docker-compose.prebuilt.yml up -d
```

---

## Automated Updates

### Create Update Script

**Windows (update-prebuilt.bat):**

```batch
@echo off
echo Updating to latest pre-built image...
docker compose -f docker-compose.prebuilt.yml pull
docker compose -f docker-compose.prebuilt.yml up -d
echo Update complete!
pause
```

**Linux/Mac (update-prebuilt.sh):**

```bash
#!/bin/bash
echo "Updating to latest pre-built image..."
docker compose -f docker-compose.prebuilt.yml pull
docker compose -f docker-compose.prebuilt.yml up -d
echo "Update complete!"
```

---

## Multi-Architecture Support

Pre-built images support multiple architectures:

- **linux/amd64** - Standard PCs, servers, Intel Macs
- **linux/arm64** - Raspberry Pi 4/5, Apple Silicon Macs, ARM servers

Docker automatically pulls the correct version for your system!

### Example: Raspberry Pi Deployment

```bash
# Same command works on Raspberry Pi!
docker run -d \
  --name family-task-tracker \
  -p 3000:80 \
  --restart unless-stopped \
  ghcr.io/soopahfly/family-task-tracker:latest
```

---

## GitHub Actions Workflow

The Docker image is automatically built and published when you:

1. **Push to main branch** → `latest` tag updated
2. **Create a release tag** (e.g., `v1.0.0`) → Version tags created
3. **Open a pull request** → PR-specific tag created for testing

### Viewing Build Status

Check the build status:
- Go to: https://github.com/Soopahfly/family-task-tracker/actions
- Look for "Build and Publish Docker Image" workflow

### Viewing Published Images

Browse published images:
- Go to: https://github.com/Soopahfly/family-task-tracker/pkgs/container/family-task-tracker

---

## Creating Version Releases

To publish a versioned image:

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This automatically creates:
- `v1.0.0` - Full version
- `v1.0` - Minor version
- `v1` - Major version
- `latest` - Always points to latest stable

---

## Private vs Public Images

### Making Images Public

By default, GitHub Container Registry images are public if your repo is public.

To ensure images are public:
1. Go to package settings: https://github.com/Soopahfly/family-task-tracker/pkgs/container/family-task-tracker/settings
2. Click "Change visibility"
3. Select "Public"

### Using Private Images

If your repo is private, users need to authenticate:

```bash
# Login with GitHub token
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Then pull as normal
docker pull ghcr.io/soopahfly/family-task-tracker:latest
```

---

## Troubleshooting

### Image Pull Fails

```bash
# Check if image exists
docker pull ghcr.io/soopahfly/family-task-tracker:latest

# If permission denied, check if package is public
# Go to: github.com/Soopahfly/family-task-tracker/packages
```

### Wrong Architecture

```bash
# Force specific platform
docker pull --platform linux/amd64 ghcr.io/soopahfly/family-task-tracker:latest
```

### Check Image Details

```bash
# View image info
docker inspect ghcr.io/soopahfly/family-task-tracker:latest

# View image layers
docker history ghcr.io/soopahfly/family-task-tracker:latest

# View image size
docker images ghcr.io/soopahfly/family-task-tracker
```

---

## Alternative: Docker Hub

You can also publish to Docker Hub instead of/in addition to GitHub Container Registry.

### Docker Hub Setup

1. Create account at https://hub.docker.com
2. Create repository: `soopahfly/family-task-tracker`
3. Add Docker Hub credentials to GitHub Secrets
4. Update workflow to push to Docker Hub

Then users can:

```bash
docker run -d -p 3000:80 soopahfly/family-task-tracker:latest
```

---

## Best Practices

### For Developers

- ✅ Tag releases with semantic versioning (`v1.0.0`)
- ✅ Test images before pushing to `latest`
- ✅ Document breaking changes in release notes
- ✅ Keep images under 100 MB when possible

### For Users

- ✅ Pin to specific versions in production (`v1.0.0` not `latest`)
- ✅ Test updates in staging before production
- ✅ Set up automated pulls for security updates
- ✅ Use `docker compose` for easier management

---

## Complete Deployment Example

### New User Quick Start

```bash
# 1. Install Docker
# (see https://docs.docker.com/get-docker/)

# 2. Run the app (one command!)
docker run -d \
  --name family-task-tracker \
  -p 3000:80 \
  --restart unless-stopped \
  ghcr.io/soopahfly/family-task-tracker:latest

# 3. Open browser
# http://localhost:3000

# Done! No git, no build tools needed!
```

### Production Deployment

```bash
# 1. Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  family-task-tracker:
    image: ghcr.io/soopahfly/family-task-tracker:v1.0.0
    container_name: family-task-tracker
    ports:
      - "3000:80"
    restart: unless-stopped
EOF

# 2. Deploy
docker compose up -d

# 3. Check logs
docker compose logs -f
```

---

## Summary Commands

```bash
# Quick deploy
docker run -d -p 3000:80 ghcr.io/soopahfly/family-task-tracker:latest

# Update to latest
docker pull ghcr.io/soopahfly/family-task-tracker:latest && \
docker stop family-task-tracker && \
docker rm family-task-tracker && \
docker run -d -p 3000:80 --name family-task-tracker \
  ghcr.io/soopahfly/family-task-tracker:latest

# With docker-compose
docker compose -f docker-compose.prebuilt.yml up -d

# Update with docker-compose
docker compose -f docker-compose.prebuilt.yml pull && \
docker compose -f docker-compose.prebuilt.yml up -d
```

---

## Resources

- GitHub Package: https://github.com/Soopahfly/family-task-tracker/pkgs/container/family-task-tracker
- Build Workflows: https://github.com/Soopahfly/family-task-tracker/actions
- Docker Hub: https://hub.docker.com (alternative)
