@echo off
REM Docker Update Script for Family Task Tracker (Windows)
REM Run this script to rebuild and restart your Docker container with latest changes

echo.
echo 🔄 Updating Family Task Tracker Docker Container...
echo.

REM Step 1: Stop running container
echo 1️⃣  Stopping current container...
docker compose down
if %errorlevel% neq 0 (
    echo ❌ Failed to stop container
    pause
    exit /b %errorlevel%
)
echo ✅ Container stopped
echo.

REM Step 2: Rebuild image (no cache to ensure fresh build)
echo 2️⃣  Rebuilding Docker image with latest code...
docker compose build --no-cache
if %errorlevel% neq 0 (
    echo ❌ Failed to build image
    pause
    exit /b %errorlevel%
)
echo ✅ Image rebuilt
echo.

REM Step 3: Start new container
echo 3️⃣  Starting updated container...
docker compose up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start container
    pause
    exit /b %errorlevel%
)
echo ✅ Container started
echo.

REM Step 4: Show status
echo 📊 Container Status:
docker compose ps
echo.

REM Step 5: Show logs (last 20 lines)
echo 📋 Recent Logs:
docker compose logs --tail=20
echo.

echo 🎉 Update complete! App is running at http://localhost:3000
echo.
echo 💡 Useful commands:
echo    View logs:        docker compose logs -f
echo    Stop container:   docker compose down
echo    Restart:          docker compose restart
echo.

pause
