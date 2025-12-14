import { useState, useEffect } from 'react'
import { Download, Upload, Save, Trash2, Clock, AlertCircle, Check, Database, Calendar, RefreshCw } from 'lucide-react'
import {
  exportBackup,
  importBackup,
  saveBackupToIndexedDB,
  getAllBackupsFromIndexedDB,
  deleteBackupFromIndexedDB,
  restoreBackupFromIndexedDB,
  scheduleAutoBackup,
  stopAutoBackup,
  isAutoBackupEnabled,
  getAutoBackupInterval,
  validateBackup
} from '../utils/backupManager'

export default function BackupManager() {
  const [backups, setBackups] = useState([])
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false)
  const [autoBackupInterval, setAutoBackupInterval] = useState(24)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadBackups()
    setAutoBackupEnabled(isAutoBackupEnabled())
    setAutoBackupInterval(getAutoBackupInterval())
  }, [])

  const loadBackups = async () => {
    try {
      const allBackups = await getAllBackupsFromIndexedDB()
      setBackups(allBackups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
    } catch (error) {
      console.error('Failed to load backups:', error)
    }
  }

  const handleExportNow = () => {
    try {
      const data = exportBackup()
      showMessage('success', `Backup downloaded! (${data.stats.totalKids} kids, ${data.stats.totalTasks} tasks)`)
    } catch (error) {
      showMessage('error', `Export failed: ${error.message}`)
    }
  }

  const handleImportFile = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result)

        // Validate first
        const validation = validateBackup(jsonData)
        if (!validation.valid) {
          showMessage('error', `Invalid backup file: ${validation.errors.join(', ')}`)
          return
        }

        if (validation.warnings.length > 0) {
          if (!confirm(`Warnings found:\n${validation.warnings.join('\n')}\n\nContinue anyway?`)) {
            return
          }
        }

        // Confirm before importing
        if (confirm('This will replace ALL current data. Are you sure?\n\nYou might want to export a backup first!')) {
          const result = importBackup(jsonData)
          if (result.success) {
            showMessage('success', result.message + ' Please refresh the page.')
            setTimeout(() => window.location.reload(), 2000)
          } else {
            showMessage('error', result.message)
          }
        }
      } catch (error) {
        showMessage('error', `Failed to import: ${error.message}`)
      }
    }
    reader.readAsText(file)

    // Reset file input
    event.target.value = ''
  }

  const handleCreateManualBackup = async () => {
    setLoading(true)
    try {
      const name = prompt('Enter backup name (optional):')
      await saveBackupToIndexedDB(name || `Manual Backup ${new Date().toLocaleString()}`)
      showMessage('success', 'Backup saved successfully!')
      await loadBackups()
    } catch (error) {
      showMessage('error', `Failed to create backup: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreBackup = async (backupId) => {
    if (!confirm('This will restore this backup and replace ALL current data. Continue?')) {
      return
    }

    setLoading(true)
    try {
      const result = await restoreBackupFromIndexedDB(backupId)
      if (result.success) {
        showMessage('success', result.message + ' Refreshing page...')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        showMessage('error', result.message)
      }
    } catch (error) {
      showMessage('error', `Failed to restore: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBackup = async (backupId) => {
    if (!confirm('Delete this backup permanently?')) {
      return
    }

    try {
      await deleteBackupFromIndexedDB(backupId)
      showMessage('success', 'Backup deleted')
      await loadBackups()
    } catch (error) {
      showMessage('error', `Failed to delete: ${error.message}`)
    }
  }

  const handleToggleAutoBackup = () => {
    if (autoBackupEnabled) {
      stopAutoBackup()
      setAutoBackupEnabled(false)
      showMessage('success', 'Automatic backups disabled')
    } else {
      scheduleAutoBackup(autoBackupInterval)
      setAutoBackupEnabled(true)
      showMessage('success', `Automatic backups enabled (every ${autoBackupInterval} hours)`)
    }
  }

  const handleUpdateInterval = (hours) => {
    setAutoBackupInterval(hours)
    if (autoBackupEnabled) {
      stopAutoBackup()
      scheduleAutoBackup(hours)
      showMessage('success', `Auto backup interval updated to ${hours} hours`)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const getBackupSize = (backup) => {
    const str = JSON.stringify(backup.data)
    const bytes = new Blob([str]).size
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Database size={28} />
          Backup & Restore
        </h2>
        <p className="text-gray-600 mt-1">
          Protect your data with backups. Export files, schedule automatic backups, or restore from a previous state.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border-2 border-green-300 text-green-800'
            : 'bg-red-50 border-2 border-red-300 text-red-800'
        }`}>
          {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={handleExportNow}
          className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <Download size={24} />
          Export Backup Now
        </button>

        <label className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold cursor-pointer">
          <Upload size={24} />
          Import Backup File
          <input
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </label>

        <button
          onClick={handleCreateManualBackup}
          disabled={loading}
          className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:bg-gray-400"
        >
          <Save size={24} />
          {loading ? 'Saving...' : 'Save Backup'}
        </button>
      </div>

      {/* Auto Backup Settings */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={20} />
          Automatic Backups
        </h3>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-gray-700">Enable automatic backups</p>
            <p className="text-sm text-gray-600">Backups are saved in your browser storage</p>
          </div>
          <button
            onClick={handleToggleAutoBackup}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              autoBackupEnabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                autoBackupEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {autoBackupEnabled && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Backup every (hours):
            </label>
            <div className="flex gap-2">
              {[6, 12, 24, 48, 168].map(hours => (
                <button
                  key={hours}
                  onClick={() => handleUpdateInterval(hours)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    autoBackupInterval === hours
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border-2 border-blue-300 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {hours < 24 ? `${hours}h` : `${hours / 24}d`}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Automatic backups are stored locally. Up to 10 auto-backups are kept.
            </p>
          </div>
        )}
      </div>

      {/* Saved Backups List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Saved Backups ({backups.length})</h3>
          <button
            onClick={loadBackups}
            className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-semibold"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Database size={64} className="mx-auto mb-4 opacity-50" />
            <p>No backups saved yet.</p>
            <p className="text-sm mt-2">Create a manual backup or enable automatic backups above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map(backup => (
              <div
                key={backup.id}
                className={`border-2 rounded-xl p-4 ${
                  backup.auto
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-purple-200 bg-purple-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-gray-800">{backup.name}</h4>
                      {backup.auto && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          AUTO
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <Calendar size={14} />
                        {formatDate(backup.timestamp)}
                      </p>
                      <p>
                        <strong>Kids:</strong> {backup.data.data.kids.length} |
                        <strong> Tasks:</strong> {backup.data.data.tasks.length} |
                        <strong> Rewards:</strong> {backup.data.data.rewards.length}
                      </p>
                      <p className="text-xs text-gray-500">
                        Size: {getBackupSize(backup)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestoreBackup(backup.id)}
                      disabled={loading}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-semibold text-sm disabled:bg-gray-400"
                      title="Restore this backup"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      title="Delete backup"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <AlertCircle size={18} />
          Backup Information
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Export Backup:</strong> Downloads a .json file you can save anywhere</li>
          <li>• <strong>Import Backup:</strong> Restores data from a previously exported .json file</li>
          <li>• <strong>Save Backup:</strong> Stores a backup in your browser (IndexedDB)</li>
          <li>• <strong>Auto Backups:</strong> Automatically saves backups at your chosen interval</li>
          <li>• Backups include: kids, tasks, rewards, settings, and module states</li>
          <li>• Browser backups are stored locally and survive page refreshes</li>
          <li>• Export backups to save them outside your browser (recommended!)</li>
        </ul>
      </div>
    </div>
  )
}
