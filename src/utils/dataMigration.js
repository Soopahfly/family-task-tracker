// Data Migration System
// Handles version upgrades and data structure changes

const CURRENT_DATA_VERSION = 2

/**
 * Check if migration is needed
 */
export function needsMigration() {
  const storedVersion = parseInt(localStorage.getItem('dataVersion') || '1')
  return storedVersion < CURRENT_DATA_VERSION
}

/**
 * Get current data version
 */
export function getCurrentVersion() {
  return parseInt(localStorage.getItem('dataVersion') || '1')
}

/**
 * Run all necessary migrations
 */
export function runMigrations() {
  const currentVersion = getCurrentVersion()

  console.log(`Current data version: ${currentVersion}`)
  console.log(`Target data version: ${CURRENT_DATA_VERSION}`)

  if (currentVersion < CURRENT_DATA_VERSION) {
    console.log('Migration needed - creating backup...')

    // Create automatic backup before migration
    createPreMigrationBackup()

    // Run migrations in sequence
    if (currentVersion < 2) {
      migrateV1ToV2()
    }

    // Set new version
    localStorage.setItem('dataVersion', CURRENT_DATA_VERSION.toString())
    console.log('Migration completed successfully!')

    return true // Migration was performed
  }

  return false // No migration needed
}

/**
 * Migrate from V1 to V2
 * Changes:
 * - Rename "kids" → "familyMembers"
 * - Add "role" field to each member (default: "child")
 */
function migrateV1ToV2() {
  console.log('Running migration V1 → V2...')

  // Migrate kids to familyMembers
  const oldKids = JSON.parse(localStorage.getItem('kids') || '[]')

  if (oldKids.length > 0) {
    const familyMembers = oldKids.map(kid => ({
      ...kid,
      role: 'child', // Default existing kids to "child" role
    }))

    localStorage.setItem('familyMembers', JSON.stringify(familyMembers))
    console.log(`Migrated ${familyMembers.length} kids to familyMembers with child role`)
  }

  // Tasks remain the same (just reference familyMembers now)
  // The task structure still uses "kidId" but we'll rename it gradually

  console.log('V1 → V2 migration complete')
}

/**
 * Create backup before migration
 */
function createPreMigrationBackup() {
  const backupData = {
    version: getCurrentVersion(),
    timestamp: new Date().toISOString(),
    data: {
      kids: localStorage.getItem('kids'),
      tasks: localStorage.getItem('tasks'),
      rewards: localStorage.getItem('rewards'),
      rewardSuggestions: localStorage.getItem('rewardSuggestions'),
      settings: localStorage.getItem('settings'),
      integrations: localStorage.getItem('integrations'),
      moduleStates: localStorage.getItem('moduleStates'),
    }
  }

  // Save to IndexedDB for safety
  saveBackupToIndexedDB('pre-migration-v' + getCurrentVersion(), backupData)

  // Also save to localStorage as fallback
  localStorage.setItem('preMigrationBackup', JSON.stringify(backupData))

  console.log('Pre-migration backup created')
}

/**
 * Save backup to IndexedDB
 */
async function saveBackupToIndexedDB(name, data) {
  try {
    const db = await openBackupDB()
    const tx = db.transaction('backups', 'readwrite')
    const store = tx.objectStore('backups')

    await store.put({
      name,
      data: JSON.stringify(data),
      timestamp: new Date().toISOString(),
      type: 'migration'
    })

    console.log('Migration backup saved to IndexedDB')
  } catch (err) {
    console.error('Failed to save migration backup:', err)
  }
}

/**
 * Open IndexedDB for backups
 */
function openBackupDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TaskTrackerBackups', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('backups')) {
        db.createObjectStore('backups', { keyPath: 'name' })
      }
    }
  })
}

/**
 * Restore from pre-migration backup
 */
export function restorePreMigrationBackup() {
  const backup = localStorage.getItem('preMigrationBackup')

  if (!backup) {
    console.error('No pre-migration backup found')
    return false
  }

  try {
    const backupData = JSON.parse(backup)

    // Restore all data
    Object.entries(backupData.data).forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(key, value)
      }
    })

    // Restore old version
    localStorage.setItem('dataVersion', backupData.version.toString())

    console.log('Pre-migration backup restored successfully')
    return true
  } catch (err) {
    console.error('Failed to restore backup:', err)
    return false
  }
}

/**
 * Get migration status for display
 */
export function getMigrationStatus() {
  const currentVersion = getCurrentVersion()
  const needsUpdate = needsMigration()

  return {
    currentVersion,
    targetVersion: CURRENT_DATA_VERSION,
    needsMigration: needsUpdate,
    hasBackup: !!localStorage.getItem('preMigrationBackup')
  }
}
