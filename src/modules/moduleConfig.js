// Module Configuration System
// This file defines all available modules and their settings

export const availableModules = {
  smartLights: {
    id: 'smartLights',
    name: 'Smart Light Integration',
    description: 'Connect Home Assistant or WLED lights to show task status with traffic light colors',
    icon: 'Zap',
    enabled: false,
    category: 'integrations',
    dependencies: [],
    settings: {
      autoSync: true,
      syncDelay: 1000, // ms
    }
  },

  screenTime: {
    id: 'screenTime',
    name: 'Screen Time Manager',
    description: 'Convert points to screen time minutes with customizable rates',
    icon: 'Timer',
    enabled: true,
    category: 'rewards',
    dependencies: [],
    settings: {
      pointsPerMinute: 2,
    }
  },

  rewardSuggestions: {
    id: 'rewardSuggestions',
    name: 'Reward Suggestions',
    description: 'Allow kids to suggest rewards for parents to approve',
    icon: 'Lightbulb',
    enabled: true,
    category: 'rewards',
    dependencies: [],
    settings: {}
  },

  statistics: {
    id: 'statistics',
    name: 'Statistics Dashboard',
    description: 'Track completion rates, progress, and points earned over time',
    icon: 'BarChart3',
    enabled: true,
    category: 'tracking',
    dependencies: [],
    settings: {}
  },

  streaks: {
    id: 'streaks',
    name: 'Streak Tracking',
    description: 'Show fire emoji badges when kids complete multiple tasks in a day',
    icon: 'Flame',
    enabled: true,
    category: 'gamification',
    dependencies: [],
    settings: {
      minimumForStreak: 3,
    }
  },

  recurringTasks: {
    id: 'recurringTasks',
    name: 'Recurring Tasks',
    description: 'Set tasks to repeat daily or weekly automatically',
    icon: 'Calendar',
    enabled: true,
    category: 'tasks',
    dependencies: [],
    settings: {
      autoReset: false,
    }
  },

  kidView: {
    id: 'kidView',
    name: 'Kid View Mode',
    description: 'Simplified interface for kids to view their tasks and suggest rewards',
    icon: 'Eye',
    enabled: true,
    category: 'interface',
    dependencies: [],
    settings: {}
  },

  backupRestore: {
    id: 'backupRestore',
    name: 'Backup & Restore',
    description: 'Export, import, and schedule automatic backups of all your data',
    icon: 'Database',
    enabled: true,
    category: 'data',
    dependencies: [],
    settings: {
      autoBackupEnabled: false,
      autoBackupInterval: 24, // hours
      maxAutoBackups: 10,
    }
  },

  deadlineReminders: {
    id: 'deadlineReminders',
    name: 'Deadline Reminders',
    description: 'Set task deadlines and receive browser notifications for upcoming and overdue tasks',
    icon: 'Bell',
    enabled: true,
    category: 'notifications',
    dependencies: [],
    settings: {
      enabled: false,
      notifyHours: 24,
      notifyOnOverdue: true,
      checkInterval: 30
    }
  },

  passwordProtection: {
    id: 'passwordProtection',
    name: 'Password Protection',
    description: 'Require password to access Parent View and protect settings from kids',
    icon: 'Lock',
    enabled: true,
    category: 'security',
    dependencies: [],
    settings: {
      requirePassword: false,
      sessionTimeout: 24, // hours
    }
  }
}

export const moduleCategories = {
  integrations: {
    name: 'Integrations',
    description: 'Connect external services and devices',
    icon: 'Wifi'
  },
  rewards: {
    name: 'Rewards & Points',
    description: 'Features related to earning and spending points',
    icon: 'Gift'
  },
  tracking: {
    name: 'Tracking & Analytics',
    description: 'Monitor progress and view statistics',
    icon: 'BarChart3'
  },
  gamification: {
    name: 'Gamification',
    description: 'Fun features to motivate kids',
    icon: 'Star'
  },
  tasks: {
    name: 'Task Management',
    description: 'Advanced task features',
    icon: 'ListTodo'
  },
  interface: {
    name: 'User Interface',
    description: 'Different views and layouts',
    icon: 'Layout'
  },
  data: {
    name: 'Data Management',
    description: 'Backup, restore, and data handling',
    icon: 'Database'
  },
  notifications: {
    name: 'Notifications & Reminders',
    description: 'Deadline alerts and notifications',
    icon: 'Bell'
  },
  security: {
    name: 'Security & Privacy',
    description: 'Password protection and access control',
    icon: 'Shield'
  }
}

// Helper functions for module management

export function getEnabledModules(moduleStates) {
  return Object.keys(availableModules).filter(id =>
    moduleStates[id]?.enabled ?? availableModules[id].enabled
  )
}

export function getModulesByCategory(category, moduleStates) {
  return Object.values(availableModules)
    .filter(module => module.category === category)
    .map(module => ({
      ...module,
      enabled: moduleStates[module.id]?.enabled ?? module.enabled,
      settings: { ...module.settings, ...(moduleStates[module.id]?.settings || {}) }
    }))
}

export function isModuleEnabled(moduleId, moduleStates) {
  return moduleStates[moduleId]?.enabled ?? availableModules[moduleId]?.enabled ?? false
}

export function getModuleSettings(moduleId, moduleStates) {
  const defaultSettings = availableModules[moduleId]?.settings || {}
  const userSettings = moduleStates[moduleId]?.settings || {}
  return { ...defaultSettings, ...userSettings }
}

export function canDisableModule(moduleId, moduleStates) {
  // Check if any enabled modules depend on this one
  const enabledModules = getEnabledModules(moduleStates)
  return !enabledModules.some(id =>
    availableModules[id].dependencies.includes(moduleId)
  )
}

export function getDefaultModuleStates() {
  const states = {}
  Object.entries(availableModules).forEach(([id, module]) => {
    states[id] = {
      enabled: module.enabled,
      settings: { ...module.settings }
    }
  })
  return states
}
