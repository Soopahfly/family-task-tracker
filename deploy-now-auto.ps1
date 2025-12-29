# Automated deployment to Docker server
$ErrorActionPreference = "Stop"

$SERVER = "192.168.1.61"
$USER = "soopah-admin"
$PASSWORD = "Orange5Five!99"
$REMOTE_DIR = "/home/soopah-admin/family-task-tracker"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Deploying v2.1.0 to Docker Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create credential for PuTTY plink or use expect-style automation
# Note: This requires plink (PuTTY) to be installed
# Alternative: Use WinSCP scripting

Write-Host "[Step 1/4] Copying files to server..." -ForegroundColor Yellow
Write-Host ""

# Use WinSCP if available, otherwise scp with password
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

$foldersToC = @("src", "server", "public", "scripts")

# Try using plink (PuTTY)
try {
    # Test connection first
    echo y | plink -pw $PASSWORD ${USER}@${SERVER} "echo Connected"

    # Copy files
    foreach ($file in $filesToCopy) {
        Write-Host "  Copying $file..." -ForegroundColor Gray
        echo y | pscp -pw $PASSWORD $file ${USER}@${SERVER}:${REMOTE_DIR}/
    }

    foreach ($folder in $foldersToC) {
        Write-Host "  Copying $folder/..." -ForegroundColor Gray
        echo y | pscp -r -pw $PASSWORD $folder ${USER}@${SERVER}:${REMOTE_DIR}/
    }
} catch {
    Write-Host "PuTTY tools not found. Please install PuTTY or use manual deployment." -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor Yellow
    Write-Host "1. Use WinSCP to copy files to ${SERVER}:${REMOTE_DIR}" -ForegroundColor White
    Write-Host "2. SSH: ssh ${USER}@${SERVER}" -ForegroundColor White
    Write-Host "3. Run: cd ${REMOTE_DIR} && docker compose build && docker compose up -d" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "[Step 2/4] Building Docker image..." -ForegroundColor Yellow
Write-Host "(This takes 3-5 minutes)" -ForegroundColor Gray
Write-Host ""

echo y | plink -pw $PASSWORD ${USER}@${SERVER} "cd ${REMOTE_DIR} && docker compose build"

Write-Host ""
Write-Host "[Step 3/4] Stopping old container..." -ForegroundColor Yellow
echo y | plink -pw $PASSWORD ${USER}@${SERVER} "cd ${REMOTE_DIR} && docker compose down"

Write-Host ""
Write-Host "[Step 4/4] Starting new container..." -ForegroundColor Yellow
echo y | plink -pw $PASSWORD ${USER}@${SERVER} "cd ${REMOTE_DIR} && docker compose up -d"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "App running at: http://${SERVER}:3000" -ForegroundColor Cyan
Write-Host ""

echo y | plink -pw $PASSWORD ${USER}@${SERVER} "docker ps | grep kids-task-tracker"

Read-Host "Press Enter to exit"
