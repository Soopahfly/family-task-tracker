#!/bin/bash
# Script to copy database from remote Docker server (192.168.1.61) to local dev

echo "========================================="
echo "Copy Database from Remote Docker Server"
echo "========================================="
echo ""
echo "Remote server: 192.168.1.61"
echo "Container: family-task-tracker"
echo ""

# Step 1: Extract database from Docker container to remote server
echo "Step 1: Extracting database from Docker container..."
ssh soopahfly@192.168.1.61 "docker cp family-task-tracker:/app/server/data/data.db /tmp/family-task-data.db && chmod 644 /tmp/family-task-data.db"

if [ $? -ne 0 ]; then
    echo "❌ Failed to extract database from Docker container"
    echo "Please make sure:"
    echo "  1. You can SSH to 192.168.1.61"
    echo "  2. Docker container 'family-task-tracker' is running"
    exit 1
fi

echo "✅ Database extracted to remote /tmp/"
echo ""

# Step 2: Copy database from remote server to local machine
echo "Step 2: Copying database to local machine..."
scp soopahfly@192.168.1.61:/tmp/family-task-data.db "c:/Users/soopa/family-task-tracker/server/data/data.db"

if [ $? -ne 0 ]; then
    echo "❌ Failed to copy database"
    echo "You can manually copy it:"
    echo "  scp soopahfly@192.168.1.61:/tmp/family-task-data.db c:/Users/soopa/family-task-tracker/server/data/data.db"
    exit 1
fi

echo "✅ Database copied successfully!"
echo ""

# Step 3: Clean up remote temp file
echo "Step 3: Cleaning up remote temp file..."
ssh soopahfly@192.168.1.61 "rm /tmp/family-task-data.db"

echo ""
echo "========================================="
echo "✅ SUCCESS!"
echo "========================================="
echo ""
echo "Database location: c:/Users/soopa/family-task-tracker/server/data/data.db"
echo ""
echo "To use the new database, restart your dev server:"
echo "  1. Stop the current server (Ctrl+C)"
echo "  2. Run: npm run server"
echo ""
