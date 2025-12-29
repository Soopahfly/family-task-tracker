# Family Task Tracker v2.1.0 - Deployment Script
# Run this script to deploy to Docker server

$ErrorActionPreference = "Stop"

$SERVER = "192.168.1.61"
$USER = "soopa"
$REMOTE_DIR = "/home/soopa/family-task-tracker"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Family Task Tracker v2.1.0" -ForegroundColor Cyan
Write-Host " Docker Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will deploy to: ${USER}@${SERVER}" -ForegroundColor Yellow
Write-Host ""
Write-Host "Steps:" -ForegroundColor White
Write-Host "  1. Copy files to server" -ForegroundColor Gray
Write-Host "  2. Build Docker image" -ForegroundColor Gray
Write-Host "  3. Restart container" -ForegroundColor Gray
Write-Host ""
Write-Host "Your data will be preserved (stored in Docker volume)." -ForegroundColor Green
Write-Host ""

$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[1/3] Copying files to server..." -ForegroundColor Yellow
Write-Host ""

# Use rsync or scp to copy files
$filesToCopy = @(
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "Dockerfile",
    "docker-compose.yml",
    ".dockerignore",
    "index.html"
)

$foldersToC = @(
    "src",
    "server",
    "public",
    "scripts"
)

# Copy individual files
foreach ($file in $filesToCopy) {
    Write-Host "  Copying $file..." -ForegroundColor Gray
    scp $file "${USER}@${SERVER}:${REMOTE_DIR}/"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to copy $file" -ForegroundColor Red
        exit 1
    }
}

# Copy folders
foreach ($folder in $foldersToC) {
    Write-Host "  Copying $folder/..." -ForegroundColor Gray
    scp -r $folder "${USER}@${SERVER}:${REMOTE_DIR}/"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to copy $folder" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "[2/3] Building Docker image on server..." -ForegroundColor Yellow
Write-Host "(This may take 3-5 minutes)" -ForegroundColor Gray
Write-Host ""

ssh "${USER}@${SERVER}" "cd ${REMOTE_DIR} && docker compose build"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build Docker image" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/3] Restarting container..." -ForegroundColor Yellow
Write-Host ""

ssh "${USER}@${SERVER}" "cd ${REMOTE_DIR} && docker compose down && docker compose up -d"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to restart container" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "App is running at: http://${SERVER}:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Checking container status..." -ForegroundColor Yellow

ssh "${USER}@${SERVER}" "docker ps | grep kids-task-tracker"

Write-Host ""
Write-Host "View logs: ssh ${USER}@${SERVER} 'docker compose -f ${REMOTE_DIR}/docker-compose.yml logs -f'" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
