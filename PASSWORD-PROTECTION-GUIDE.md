# Password Protection Guide

## Problem
The parent view password was being lost from the database, requiring users to reset it repeatedly.

## Root Cause
The password is stored in the `settings` table with key `parentPassword`. The settings table was being cleared or the password entry was being deleted, possibly during:
- Database operations
- Migrations
- Backup/restore operations
- Server restarts with database issues

## Solution Implemented (v2.7.1)

### 1. Automatic Password Backup System
Every time a password is set or changed, a backup copy is automatically created:
- **Primary key**: `parentPassword` (the active password)
- **Backup key**: `passwordBackup` (automatic backup copy)

### 2. Auto-Recovery System
The server now monitors the password every 60 seconds and:
- ✅ If password exists but backup doesn't → Creates backup
- ✅ If password is lost but backup exists → Auto-restores password
- ✅ Logs all operations to console for monitoring

### 3. Password Operation Updates
All password-related operations now maintain both copies:
- **Setup Password**: Creates both `parentPassword` and `passwordBackup`
- **Change Password**: Updates both `parentPassword` and `passwordBackup`
- **Remove Password**: Deletes both `parentPassword` and `passwordBackup`

### 4. Manual Recovery Tools
Added `ensure-password-persistence.js` script that:
- Checks if password exists
- Creates default password "changeme" if none exists
- Creates backup if missing
- Shows all settings in database
- Provides recommendations

## How to Use

### Setting Up Password (First Time)
1. Access the parent view (no password required if none is set)
2. Go to **Admin Settings** → **Password Protection**
3. Click **"Set Up Password"**
4. Enter a strong password (minimum 4 characters, longer is better)
5. Confirm the password
6. Click **"Set Password"**

The system will automatically:
- Store the password hash as `parentPassword`
- Create a backup copy as `passwordBackup`
- Log: `🔐 Password set and backup created`

### Changing Password
1. Go to **Admin Settings** → **Password Protection**
2. Click **"Change Password"**
3. Enter your current password
4. Enter new password
5. Confirm new password
6. Click **"Change Password"**

The system will automatically:
- Update the password hash
- Update the backup copy
- Log: `🔐 Password changed and backup updated`

### If Password is Lost

#### Option 1: Wait for Auto-Recovery (if backup exists)
Within 60 seconds, the server will automatically restore the password from backup.
Check server logs for: `🔐 Password restored from backup!`

#### Option 2: Manual Recovery Script
```bash
cd c:\Users\soopa\family-task-tracker
node ensure-password-persistence.js
```

This will:
- Check if password exists
- Set default password "changeme" if missing
- Create backup copy
- Show recommendations

After running, you can:
1. Access parent view with password: **changeme**
2. Immediately go to Admin Settings → Password Protection
3. Change the password to your desired password

#### Option 3: Emergency Reset (requires parent name)
If you forget your password, use the emergency reset endpoint:
```bash
curl -X POST http://192.168.1.61:3000/api/auth/emergency-reset \
  -H "Content-Type: application/json" \
  -d '{"parentName": "YourParentName", "newPassword": "newpassword123"}'
```

Replace `YourParentName` with an actual parent's name from the family members list.

## Monitoring

### Server Logs
Watch for these log messages:
- `🔐 Password backup created` - Backup was missing and has been created
- `🔐 Password restored from backup!` - Password was lost and auto-restored
- `🔐 Password set and backup created` - New password created
- `🔐 Password changed and backup updated` - Password changed
- `🔐 Password removed (backup also cleared)` - Password protection removed

### Checking Password Status
```bash
# On production server
cd ~/family-task-tracker
node -e "import('better-sqlite3').then(m => {
  const db = new m.default('./server/data/data.db');
  const pw = db.prepare('SELECT * FROM settings WHERE key = ?').get('parentPassword');
  const backup = db.prepare('SELECT * FROM settings WHERE key = ?').get('passwordBackup');
  console.log('Password:', pw ? '✅ Set' : '❌ Missing');
  console.log('Backup:', backup ? '✅ Set' : '❌ Missing');
  db.close();
})"
```

## Security Notes

### Password Storage
- Passwords are **never** stored in plain text
- Stored as SHA-256 hash (64 character hexadecimal string)
- Cannot be reversed to get the original password
- Backup is also hashed (same hash as primary)

### Session Management
- Sessions last 24 hours after successful login
- Stored in browser's sessionStorage
- Cleared on logout
- Auto-expire after 24 hours

### Best Practices
1. **Use a strong password**: Minimum 4 characters, but longer is better
2. **Mix character types**: Use uppercase, lowercase, numbers, and symbols
3. **Don't share**: Keep your password private
4. **Change regularly**: Update password periodically
5. **Logout when done**: Use the logout button to end session early

## Troubleshooting

### "No password set" error but I just set one
**Cause**: Password was lost between setting it and trying to use it
**Solution**: Wait 60 seconds for auto-recovery, or run `ensure-password-persistence.js`

### Password doesn't work after server restart
**Cause**: Database file corruption or settings table cleared
**Solution**: Run `ensure-password-persistence.js` to set default password, then change it

### Can't access parent view at all
**Cause**: Password is set but you forgot it
**Solution**: Use emergency reset with a parent's name, or contact admin

### Server logs show "Password persistence check failed"
**Cause**: Database connection issue or corrupted database
**Solution**:
1. Check database file exists: `ls server/data/data.db`
2. Check database permissions
3. Restart server: `docker compose restart`

## Technical Details

### Database Schema
```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Password entries
-- parentPassword: SHA-256 hash of current password
-- passwordBackup: SHA-256 hash backup copy (same as parentPassword)
```

### Password Hash Format
```
Input: "mypassword123"
Hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
```

### Auto-Recovery Logic
```javascript
// Runs every 60 seconds
function ensurePasswordPersistence() {
  const password = db.prepare('SELECT value FROM settings WHERE key = ?').get('parentPassword');
  const passwordBackup = db.prepare('SELECT value FROM settings WHERE key = ?').get('passwordBackup');

  // Create backup if missing
  if (password && !passwordBackup) {
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('passwordBackup', password.value);
    console.log('🔐 Password backup created');
  }

  // Restore from backup if password lost
  if (!password && passwordBackup) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('parentPassword', passwordBackup.value);
    console.log('🔐 Password restored from backup!');
  }
}
```

## Maintenance

### Regular Checks
Run this monthly to verify password system health:
```bash
cd c:\Users\soopa\family-task-tracker
node ensure-password-persistence.js
```

### Before Database Migrations
Always run this before any database operations:
```bash
# Backup database first
cp server/data/data.db server/data/data.db.backup

# Check password status
node ensure-password-persistence.js

# Run your migration
# ...

# Verify password still exists
node ensure-password-persistence.js
```

### After System Updates
After deploying new versions:
1. Check server logs for password-related messages
2. Test login with existing password
3. Verify backup exists: `node ensure-password-persistence.js`

## Files Modified

### server/index.js
- Added `ensurePasswordPersistence()` function
- Added 60-second interval check
- Updated `/api/auth/setup-password` to create backup
- Updated `/api/auth/change-password` to update backup
- Updated `/api/auth/remove-password` to delete backup

### ensure-password-persistence.js
- New script for manual password verification
- Creates default password if none exists
- Shows all settings in database
- Provides recovery recommendations

### package.json
- Version bumped to 2.7.1

## Version History

### v2.7.1 (2025-12-30)
- ✅ Added automatic password backup system
- ✅ Added 60-second monitoring and auto-recovery
- ✅ Added ensure-password-persistence.js script
- ✅ Updated all password operations to maintain backup
- ✅ Added comprehensive logging

### v2.7.0 (Previous)
- Original password protection implementation
- Password stored only in `parentPassword` key
- No backup or recovery mechanism

## Support

If you continue to have password issues after implementing these fixes:

1. Check server logs: `docker compose logs kids-task-tracker`
2. Run persistence check: `node ensure-password-persistence.js`
3. Verify database health: Check that `server/data/data.db` exists and is not corrupted
4. Check for application errors in browser console (F12)

This system should prevent password loss permanently. The combination of automatic backup, monitoring, and auto-recovery ensures the password persists even if the primary entry is accidentally deleted.
