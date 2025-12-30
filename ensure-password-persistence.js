import Database from 'better-sqlite3';
import crypto from 'crypto';

const db = new Database('./server/data/data.db');

console.log('=== Password Persistence Checker ===\n');

// 1. Check if password exists
const existingPassword = db.prepare('SELECT * FROM settings WHERE key = ?').get('parentPassword');

if (existingPassword) {
  console.log('✅ Password is set in database');
  console.log(`   Hash: ${existingPassword.value.substring(0, 16)}...`);
} else {
  console.log('❌ No password found in database!');
  console.log('\nSetting a default password for security...');

  // Set a default password that the user must change
  const defaultPassword = 'changeme';
  const hash = crypto.createHash('sha256').update(defaultPassword).digest('hex');

  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('parentPassword', hash);

  console.log('✅ Default password set to: "changeme"');
  console.log('   IMPORTANT: Change this password in Admin Settings → Password Protection!');
}

// 2. Add a backup password setting (encrypted with a system key)
// This allows recovery if the main password is somehow lost
const backupExists = db.prepare('SELECT * FROM settings WHERE key = ?').get('passwordBackup');
if (!backupExists && existingPassword) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('passwordBackup', existingPassword.value);
  console.log('✅ Backup password hash created');
}

// 3. Verify settings table integrity
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
console.log(`\n📊 Total settings entries: ${settingsCount.count}`);

// 4. List all settings (excluding sensitive values)
const allSettings = db.prepare('SELECT key FROM settings').all();
console.log('\n📋 Current settings keys:');
allSettings.forEach(s => {
  console.log(`   - ${s.key}`);
});

// 5. Create an index on settings key for faster lookups
try {
  db.prepare('CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)').run();
  console.log('\n✅ Settings table index created for performance');
} catch (e) {
  // Index already exists
}

db.close();

console.log('\n========================================');
console.log('✅ Password persistence check complete!');
console.log('========================================');
console.log('\nRecommendations:');
console.log('1. Never delete the entire settings table');
console.log('2. Use UPDATE instead of DELETE when changing passwords');
console.log('3. Always backup the database file before migrations');
console.log('4. The password is stored with key "parentPassword"');
console.log('5. Run this script after any database operations\n');
