# Deploy Family Task Tracker to Docker Server
# Usage: .\deploy.ps1

$SERVER = "192.168.1.61"
$USER = "soopa"
$REMOTE_DIR = "/home/soopa/family-task-tracker"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Family Task Tracker - Docker Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Copy files using scp (you need SSH access configured)
Write-Host "Step 1: Copying files to server $SERVER..." -ForegroundColor Yellow
Write-Host ""

# Create a temp directory with only necessary files
$tempDir = ".\deploy-temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}

# Copy necessary files to temp directory
Write-Host "Preparing files for deployment..." -ForegroundColor Gray
Copy-Item -Path "." -Destination $tempDir -Recurse -Exclude @(
    "node_modules",
    ".git",
    "dist",
    "server\data",
    "deploy-temp",
    "*.log"
)

# Use scp to copy to server
Write-Host "Uploading to server..." -ForegroundColor Gray
scp -r "$tempDir\*" "${USER}@${SERVER}:${REMOTE_DIR}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to copy files to server" -ForegroundColor Red
    Remove-Item $tempDir -Recurse -Force
    Read-Host "Press Enter to exit"
    exit 1
}

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "Step 2: Building and starting Docker container..." -ForegroundColor Yellow
Write-Host ""

# SSH into server and run docker commands
$sshCommand = "cd $REMOTE_DIR && docker compose down && docker compose build && docker compose up -d"
ssh "${USER}@${SERVER}" $sshCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build/start Docker container" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "App should be running at: http://${SERVER}:3000" -ForegroundColor Cyan
Write-Host ""

# Check container status
Write-Host "Checking container status..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" "docker ps | grep kids-task-tracker"

Write-Host ""
Read-Host "Press Enter to exit"
