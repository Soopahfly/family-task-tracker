// Backup and Restore Manager
// Handles exporting, importing, and scheduling backups

/**
 * Get all app data for backup
 */
export function getAllAppData() {
  const data = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: {
      kids: JSON.parse(localStorage.getItem('kids') || '[]'),
      tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
      rewards: JSON.parse(localStorage.getItem('rewards') || '[]'),
      rewardSuggestions: JSON.parse(localStorage.getItem('rewardSuggestions') || '[]'),
      settings: JSON.parse(localStorage.getItem('settings') || '{"pointsPerMinute":2}'),
      integrations: JSON.parse(localStorage.getItem('integrations') || '[]'),
      moduleStates: JSON.parse(localStorage.getItem('moduleStates') || '{}'),
    },
    stats: {
      totalKids: JSON.parse(localStorage.getItem('kids') || '[]').length,
      totalTasks: JSON.parse(localStorage.getItem('tasks') || '[]').length,
      totalRewards: JSON.parse(localStorage.getItem('rewards') || '[]').length,
    }
  }
  return data
}

/**
 * Export data as JSON file download
 */
export function exportBackup(filename) {
  const data = getAllAppData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename || `kids-task-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return data
}

/**
 * Import data from JSON file
 */
export function importBackup(jsonData) {
  try {
    // Validate the data structure
    if (!jsonData.version || !jsonData.data) {
      throw new Error('Invalid backup file format')
    }

    // Restore each piece of data
    Object.entries(jsonData.data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value))
    })

    return {
      success: true,
      message: 'Backup restored successfully!',
      stats: jsonData.stats
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to restore backup: ${error.message}`
    }
  }
}

/**
 * Save backup to browser's IndexedDB for scheduled backups
 */
export async function saveBackupToIndexedDB(backupName) {
  const data = getAllAppData()

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KidsTaskTrackerBackups', 1)

    request.onerror = () => reject(request.error)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('backups')) {
        db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true })
      }
    }

    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['backups'], 'readwrite')
      const store = transaction.objectStore('backups')

      const backup = {
        name: backupName || `Auto Backup ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString(),
        data: data,
        auto: backupName === null // Mark as automatic backup
      }

      const addRequest = store.add(backup)

      addRequest.onsuccess = () => {
        resolve({ success: true, id: addRequest.result })
      }

      addRequest.onerror = () => {
        reject(addRequest.error)
      }
    }
  })
}

/**
 * Get all backups from IndexedDB
 */
export async function getAllBackupsFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KidsTaskTrackerBackups', 1)

    request.onerror = () => reject(request.error)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('backups')) {
        db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true })
      }
    }

    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['backups'], 'readonly')
      const store = transaction.objectStore('backups')
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result)
      }

      getAllRequest.onerror = () => {
        reject(getAllRequest.error)
      }
    }
  })
}

/**
 * Delete a backup from IndexedDB
 */
export async function deleteBackupFromIndexedDB(backupId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KidsTaskTrackerBackups', 1)

    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['backups'], 'readwrite')
      const store = transaction.objectStore('backups')
      const deleteRequest = store.delete(backupId)

      deleteRequest.onsuccess = () => {
        resolve({ success: true })
      }

      deleteRequest.onerror = () => {
        reject(deleteRequest.error)
      }
    }

    request.onerror = () => reject(request.error)
  })
}

/**
 * Restore a backup from IndexedDB
 */
export async function restoreBackupFromIndexedDB(backupId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KidsTaskTrackerBackups', 1)

    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['backups'], 'readonly')
      const store = transaction.objectStore('backups')
      const getRequest = store.get(backupId)

      getRequest.onsuccess = () => {
        const backup = getRequest.result
        if (backup) {
          const result = importBackup(backup.data)
          resolve(result)
        } else {
          reject(new Error('Backup not found'))
        }
      }

      getRequest.onerror = () => {
        reject(getRequest.error)
      }
    }

    request.onerror = () => reject(request.error)
  })
}

/**
 * Schedule automatic backups
 */
export function scheduleAutoBackup(intervalHours) {
  const intervalMs = intervalHours * 60 * 60 * 1000

  // Clear any existing interval
  const existingInterval = localStorage.getItem('autoBackupInterval')
  if (existingInterval) {
    clearInterval(parseInt(existingInterval))
  }

  // Set up new interval
  const intervalId = setInterval(async () => {
    try {
      await saveBackupToIndexedDB(null) // null = auto backup
      console.log('Auto backup created successfully')

      // Clean up old auto backups (keep only last 10)
      const backups = await getAllBackupsFromIndexedDB()
      const autoBackups = backups.filter(b => b.auto).sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      )

      if (autoBackups.length > 10) {
        const toDelete = autoBackups.slice(10)
        for (const backup of toDelete) {
          await deleteBackupFromIndexedDB(backup.id)
        }
      }
    } catch (error) {
      console.error('Auto backup failed:', error)
    }
  }, intervalMs)

  // Save interval ID to localStorage
  localStorage.setItem('autoBackupInterval', intervalId.toString())
  localStorage.setItem('autoBackupIntervalHours', intervalHours.toString())

  return intervalId
}

/**
 * Stop automatic backups
 */
export function stopAutoBackup() {
  const intervalId = localStorage.getItem('autoBackupInterval')
  if (intervalId) {
    clearInterval(parseInt(intervalId))
    localStorage.removeItem('autoBackupInterval')
    localStorage.removeItem('autoBackupIntervalHours')
  }
}

/**
 * Check if auto backup is enabled
 */
export function isAutoBackupEnabled() {
  return localStorage.getItem('autoBackupInterval') !== null
}

/**
 * Get auto backup interval in hours
 */
export function getAutoBackupInterval() {
  return parseInt(localStorage.getItem('autoBackupIntervalHours') || '24')
}

/**
 * Compare two backups and show differences
 */
export function compareBackups(backup1, backup2) {
  const diff = {
    kids: {
      added: 0,
      removed: 0,
      modified: 0
    },
    tasks: {
      added: 0,
      removed: 0,
      modified: 0
    },
    rewards: {
      added: 0,
      removed: 0,
      modified: 0
    }
  }

  // Compare kids
  const kids1Ids = new Set(backup1.data.kids.map(k => k.id))
  const kids2Ids = new Set(backup2.data.kids.map(k => k.id))

  diff.kids.added = backup2.data.kids.filter(k => !kids1Ids.has(k.id)).length
  diff.kids.removed = backup1.data.kids.filter(k => !kids2Ids.has(k.id)).length

  // Similar comparisons for tasks and rewards
  const tasks1Ids = new Set(backup1.data.tasks.map(t => t.id))
  const tasks2Ids = new Set(backup2.data.tasks.map(t => t.id))

  diff.tasks.added = backup2.data.tasks.filter(t => !tasks1Ids.has(t.id)).length
  diff.tasks.removed = backup1.data.tasks.filter(t => !tasks2Ids.has(t.id)).length

  return diff
}

/**
 * Validate backup file before import
 */
export function validateBackup(jsonData) {
  const errors = []
  const warnings = []

  // Check version
  if (!jsonData.version) {
    errors.push('Missing version information')
  }

  // Check required data fields
  const requiredFields = ['kids', 'tasks', 'rewards']
  requiredFields.forEach(field => {
    if (!jsonData.data || !jsonData.data[field]) {
      warnings.push(`Missing ${field} data (will be empty)`)
    }
  })

  // Check data types
  if (jsonData.data) {
    if (jsonData.data.kids && !Array.isArray(jsonData.data.kids)) {
      errors.push('Kids data is not an array')
    }
    if (jsonData.data.tasks && !Array.isArray(jsonData.data.tasks)) {
      errors.push('Tasks data is not an array')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
