@echo off
REM Script to copy database from Docker container to local dev environment
REM
REM Usage:
REM   1. If Docker is on the same machine, run this script
REM   2. If Docker is on a remote server, see instructions below

echo ========================================
echo Copy Database from Docker to Dev
echo ========================================
echo.

REM Check if docker is available
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker not found on this machine!
    echo.
    echo If your Docker server is remote, use one of these methods:
    echo.
    echo METHOD 1 - SSH from remote server:
    echo   ssh your-server
    echo   docker cp family-task-tracker:/app/server/data/data.db ~/data.db
    echo   exit
    echo   scp your-server:~/data.db c:\Users\soopa\family-task-tracker\server\data\data.db
    echo.
    echo METHOD 2 - From remote server console:
    echo   docker cp family-task-tracker:/app/server/data/data.db /path/to/backup/data.db
    echo   Then copy the file to this location:
    echo   c:\Users\soopa\family-task-tracker\server\data\data.db
    echo.
    pause
    exit /b 1
)

echo Copying database from Docker container...
docker cp family-task-tracker:/app/server/data/data.db server\data\data.db

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Database copied successfully
    echo.
    echo The database is now at: server\data\data.db
    echo Restart your dev server to use the new data
) else (
    echo.
    echo ❌ ERROR! Failed to copy database
    echo Make sure the container 'family-task-tracker' is running
    echo Run: docker ps
)

echo.
pause
