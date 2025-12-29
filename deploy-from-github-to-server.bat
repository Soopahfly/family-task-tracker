@echo off
REM Deploy from GitHub Container Registry to Docker Server
REM Run this after you've pushed the image to GitHub

echo ========================================
echo  Deploy v2.1.0 from GitHub to Server
echo ========================================
echo.

set SERVER=192.168.1.61
set USER=soopah-admin
set PASSWORD=Orange5Five!99
set REMOTE_DIR=/home/soopah-admin/family-task-tracker

echo This will:
echo 1. Stop the old container on %SERVER%
echo 2. Pull the latest image from GitHub
echo 3. Start the new container
echo.
echo Your data will be preserved in Docker volume.
echo.
pause

echo.
echo [1/4] Copying docker-compose.production.yml to server...
echo.

scp docker-compose.production.yml %USER%@%SERVER%:%REMOTE_DIR%/

echo.
echo [2/4] Stopping old container...
echo.

ssh %USER%@%SERVER% "cd %REMOTE_DIR% && docker compose -f docker-compose.production.yml down"

echo.
echo [3/4] Pulling latest image from GitHub...
echo.

ssh %USER%@%SERVER% "cd %REMOTE_DIR% && docker compose -f docker-compose.production.yml pull"

echo.
echo [4/4] Starting new container...
echo.

ssh %USER%@%SERVER% "cd %REMOTE_DIR% && docker compose -f docker-compose.production.yml up -d"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to start container
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo App running at: http://%SERVER%:3000
echo.
echo Checking status...
ssh %USER%@%SERVER% "docker ps | grep family-task-tracker"

echo.
echo View logs: ssh %USER%@%SERVER% "docker logs -f family-task-tracker"
echo.
pause
