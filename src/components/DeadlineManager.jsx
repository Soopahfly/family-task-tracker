import { useState, useEffect } from 'react'
import { Bell, Clock, AlertTriangle, Check, X } from 'lucide-react'
import {
  requestNotificationPermission,
  startDeadlineMonitoring,
  stopDeadlineMonitoring,
  getTasksByUrgency,
  testNotification
} from '../utils/notificationManager'

export default function DeadlineManager({ tasks, kids }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [settings, setSettings] = useState({
    enabled: false,
    notifyHours: 24,
    notifyOnOverdue: true,
    checkInterval: 30
  })

  useEffect(() => {
    // Load settings
    const saved = localStorage.getItem('deadlineSettings')
    if (saved) {
      const loadedSettings = JSON.parse(saved)
      setSettings(loadedSettings)
      if (loadedSettings.enabled) {
        startMonitoring(loadedSettings)
      }
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const startMonitoring = (currentSettings) => {
    startDeadlineMonitoring(tasks, kids, currentSettings)
    setNotificationsEnabled(true)
  }

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permission first
      const result = await requestNotificationPermission()
      if (!result.granted) {
        alert('Please allow notifications in your browser settings to use deadline reminders.')
        return
      }
      setNotificationPermission('granted')

      // Start monitoring
      const newSettings = { ...settings, enabled: true }
      setSettings(newSettings)
      localStorage.setItem('deadlineSettings', JSON.stringify(newSettings))
      startMonitoring(newSettings)
    } else {
      // Stop monitoring
      stopDeadlineMonitoring()
      const newSettings = { ...settings, enabled: false }
      setSettings(newSettings)
      localStorage.setItem('deadlineSettings', JSON.stringify(newSettings))
      setNotificationsEnabled(false)
    }
  }

  const handleUpdateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('deadlineSettings', JSON.stringify(newSettings))

    // Restart monitoring if enabled
    if (settings.enabled) {
      stopDeadlineMonitoring()
      startMonitoring(newSettings)
    }
  }

  const handleTestNotification = async () => {
    const result = await requestNotificationPermission()
    if (result.granted) {
      testNotification()
    } else {
      alert('Please allow notifications to test')
    }
  }

  const urgency = getTasksByUrgency(tasks)

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell size={28} />
          Deadline Reminders
        </h2>
        <p className="text-gray-600 mt-1">
          Get notified before task deadlines and when tasks are overdue
        </p>
      </div>

      {/* Notification Permission Status */}
      {notificationPermission === 'denied' && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle size={20} />
            <div>
              <p className="font-semibold">Notifications Blocked</p>
              <p className="text-sm">
                Please enable notifications in your browser settings to use deadline reminders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Toggle */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-gray-700 text-lg">Enable Deadline Reminders</p>
            <p className="text-sm text-gray-600">
              Receive browser notifications for upcoming and overdue tasks
            </p>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              notificationsEnabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {notificationsEnabled && (
          <button
            onClick={handleTestNotification}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm"
          >
            Send Test Notification
          </button>
        )}
      </div>

      {/* Settings */}
      {notificationsEnabled && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Reminder Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notify me when deadline is within (hours):
              </label>
              <div className="flex gap-2">
                {[6, 12, 24, 48, 72].map(hours => (
                  <button
                    key={hours}
                    onClick={() => handleUpdateSetting('notifyHours', hours)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      settings.notifyHours === hours
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border-2 border-purple-300 text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-700">Notify when tasks are overdue</p>
                <p className="text-sm text-gray-600">Send reminder once per day for overdue tasks</p>
              </div>
              <button
                onClick={() => handleUpdateSetting('notifyOnOverdue', !settings.notifyOnOverdue)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.notifyOnOverdue ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.notifyOnOverdue ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Check for deadlines every (minutes):
              </label>
              <select
                value={settings.checkInterval}
                onChange={(e) => handleUpdateSetting('checkInterval', parseInt(e.target.value))}
                className="px-4 py-2 rounded-lg border-2 border-purple-300 w-full"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Urgency Summary */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Task Urgency Overview</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-800 font-semibold">Overdue</span>
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-red-600">{urgency.overdue.length}</p>
            {urgency.overdue.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-red-800">
                {urgency.overdue.slice(0, 3).map(task => {
                  const kid = kids.find(k => k.id === task.kidId)
                  return (
                    <li key={task.id} className="truncate">
                      {kid?.name}: {task.title}
                    </li>
                  )
                })}
                {urgency.overdue.length > 3 && (
                  <li className="text-xs">+{urgency.overdue.length - 3} more</li>
                )}
              </ul>
            )}
          </div>

          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-800 font-semibold">Urgent</span>
              <Clock className="text-orange-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-orange-600">{urgency.urgent.length}</p>
            <p className="text-xs text-orange-700 mt-1">Less than 24 hours</p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-800 font-semibold">Soon</span>
              <Clock className="text-yellow-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{urgency.soon.length}</p>
            <p className="text-xs text-yellow-700 mt-1">1-3 days away</p>
          </div>

          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-800 font-semibold">Upcoming</span>
              <Check className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-green-600">{urgency.upcoming.length}</p>
            <p className="text-xs text-green-700 mt-1">More than 3 days</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-2">How It Works</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Deadline reminders run in the background while the app is open</li>
          <li>• Notifications appear in your browser (like email notifications)</li>
          <li>• Each task is notified once per cooldown period to avoid spam</li>
          <li>• Overdue tasks get daily reminders until completed</li>
          <li>• Close or minimize the app - notifications still work!</li>
        </ul>
      </div>
    </div>
  )
}
