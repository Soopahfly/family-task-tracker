@echo off
REM Quick Deploy to Docker Server
REM This script deploys the latest code to your Docker server at 192.168.1.61

echo ========================================
echo  Family Task Tracker v2.1.0
echo  Docker Deployment
echo ========================================
echo.

set SERVER=192.168.1.61
set USER=soopa
set REMOTE_DIR=/home/soopa/family-task-tracker

echo This will:
echo 1. Copy all files to %SERVER%
echo 2. Build Docker image on the server
echo 3. Restart the container
echo.
echo Data will be preserved (stored in Docker volume).
echo.
pause

echo.
echo [Step 1/3] Copying files to server...
echo.

REM Use SCP to copy files (make sure you have SSH configured)
scp -r ^
  package.json ^
  package-lock.json ^
  vite.config.js ^
  tailwind.config.js ^
  postcss.config.js ^
  Dockerfile ^
  docker-compose.yml ^
  .dockerignore ^
  src ^
  server ^
  public ^
  scripts ^
  index.html ^
  %USER%@%SERVER%:%REMOTE_DIR%/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to copy files to server
    echo Make sure you have SSH access configured.
    pause
    exit /b 1
)

echo.
echo [Step 2/3] Building Docker image on server...
echo.

REM SSH into server and build
ssh %USER%@%SERVER% "cd %REMOTE_DIR% && docker compose build"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to build Docker image
    pause
    exit /b 1
)

echo.
echo [Step 3/3] Restarting container...
echo.

REM Restart the container
ssh %USER%@%SERVER% "cd %REMOTE_DIR% && docker compose down && docker compose up -d"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to restart container
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo App is running at: http://%SERVER%:3000
echo.
echo Checking container status...
ssh %USER%@%SERVER% "docker ps | grep kids-task-tracker"

echo.
echo View logs with: ssh %USER%@%SERVER% "cd %REMOTE_DIR% && docker compose logs -f"
echo.
pause
