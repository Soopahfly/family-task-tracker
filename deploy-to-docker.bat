@echo off
REM Deploy Family Task Tracker to Docker Server
REM This script copies the code to the server and builds/runs the container

echo ========================================
echo  Family Task Tracker - Docker Deployment
echo ========================================
echo.

set SERVER=192.168.1.61
set USER=soopa
set REMOTE_DIR=/home/soopa/family-task-tracker

echo Step 1: Copying files to server...
echo.

REM Use rsync or scp to copy files (excluding node_modules, .git, etc.)
scp -r ^
  --exclude node_modules ^
  --exclude .git ^
  --exclude dist ^
  --exclude server/data ^
  . %USER%@%SERVER%:%REMOTE_DIR%

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to copy files to server
    pause
    exit /b 1
)

echo.
echo Step 2: Building Docker image on server...
echo.

REM SSH into server and build the container
ssh %USER%@%SERVER% "cd %REMOTE_DIR% && docker compose down && docker compose build && docker compose up -d"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build/start Docker container
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo App should be running at: http://%SERVER%:3000
echo.
pause
