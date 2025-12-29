@echo off
REM Build and push Docker image to GitHub Container Registry
REM Run this on your local machine after building the image

echo ========================================
echo  Push Docker Image to GitHub
echo  Family Task Tracker v2.1.0
echo ========================================
echo.

REM Set your GitHub username
set GITHUB_USER=soopahfly
set IMAGE_NAME=family-task-tracker
set VERSION=2.1.0

echo This will:
echo 1. Build the Docker image locally
echo 2. Tag it for GitHub Container Registry
echo 3. Push it to ghcr.io/%GITHUB_USER%/%IMAGE_NAME%:latest
echo.
echo Make sure you're logged in to GitHub Container Registry first!
echo Run: docker login ghcr.io -u %GITHUB_USER%
echo.
pause

echo.
echo [Step 1/3] Building Docker image...
echo.

docker build -t %IMAGE_NAME%:%VERSION% .

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build image
    pause
    exit /b 1
)

echo.
echo [Step 2/3] Tagging for GitHub Container Registry...
echo.

docker tag %IMAGE_NAME%:%VERSION% ghcr.io/%GITHUB_USER%/%IMAGE_NAME%:latest
docker tag %IMAGE_NAME%:%VERSION% ghcr.io/%GITHUB_USER%/%IMAGE_NAME%:%VERSION%

echo.
echo [Step 3/3] Pushing to GitHub...
echo.

docker push ghcr.io/%GITHUB_USER%/%IMAGE_NAME%:latest
docker push ghcr.io/%GITHUB_USER%/%IMAGE_NAME%:%VERSION%

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to push image
    echo.
    echo Make sure you're logged in:
    echo   docker login ghcr.io -u %GITHUB_USER%
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Success!
echo ========================================
echo.
echo Image pushed to:
echo   ghcr.io/%GITHUB_USER%/%IMAGE_NAME%:latest
echo   ghcr.io/%GITHUB_USER%/%IMAGE_NAME%:%VERSION%
echo.
echo To deploy on your server, run:
echo   ssh soopah-admin@192.168.1.61
echo   cd /home/soopah-admin/family-task-tracker
echo   docker compose -f docker-compose.production.yml pull
echo   docker compose -f docker-compose.production.yml up -d
echo.
pause
