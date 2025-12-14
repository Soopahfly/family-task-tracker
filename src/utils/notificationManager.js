// Notification and Reminder Manager
// Handles browser notifications and task deadline reminders

/**
 * Request notification permission from browser
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return { granted: false, error: 'Notifications not supported' }
  }

  if (Notification.permission === 'granted') {
    return { granted: true }
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return { granted: permission === 'granted' }
  }

  return { granted: false, error: 'Notifications denied' }
}

/**
 * Show a browser notification
 */
export function showNotification(title, options = {}) {
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted')
    return null
  }

  const notification = new Notification(title, {
    icon: '/vite.svg',
    badge: '/vite.svg',
    ...options
  })

  return notification
}

/**
 * Check tasks for upcoming deadlines and send notifications
 */
export function checkDeadlines(tasks, kids, settings) {
  const now = new Date()
  const notifications = []

  tasks.forEach(task => {
    if (task.completed || !task.deadline) return

    const deadline = new Date(task.deadline)
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60)

    const kid = kids.find(k => k.id === task.kidId)
    const kidName = kid ? kid.name : 'Someone'

    // Check if we should notify based on settings
    const { notifyHours, notifyOnOverdue } = settings

    // Upcoming deadline notification
    if (hoursUntilDeadline > 0 && hoursUntilDeadline <= notifyHours) {
      const lastNotified = localStorage.getItem(`notified_${task.id}`)
      if (!lastNotified || Date.now() - parseInt(lastNotified) > 3600000) { // 1 hour cooldown
        notifications.push({
          type: 'upcoming',
          task,
          kidName,
          hoursUntilDeadline: Math.ceil(hoursUntilDeadline)
        })
        localStorage.setItem(`notified_${task.id}`, Date.now().toString())
      }
    }

    // Overdue notification
    if (hoursUntilDeadline < 0 && notifyOnOverdue) {
      const lastNotified = localStorage.getItem(`notified_overdue_${task.id}`)
      if (!lastNotified || Date.now() - parseInt(lastNotified) > 86400000) { // 24 hour cooldown
        notifications.push({
          type: 'overdue',
          task,
          kidName,
          hoursPastDeadline: Math.abs(Math.floor(hoursUntilDeadline))
        })
        localStorage.setItem(`notified_overdue_${task.id}`, Date.now().toString())
      }
    }
  })

  return notifications
}

/**
 * Send all pending deadline notifications
 */
export function sendDeadlineNotifications(notifications) {
  notifications.forEach(notif => {
    if (notif.type === 'upcoming') {
      showNotification(
        `⏰ Upcoming Deadline: ${notif.task.title}`,
        {
          body: `${notif.kidName} has ${notif.hoursUntilDeadline}h to complete this task!`,
          tag: `deadline_${notif.task.id}`,
          requireInteraction: false
        }
      )
    } else if (notif.type === 'overdue') {
      showNotification(
        `⚠️ Overdue Task: ${notif.task.title}`,
        {
          body: `${notif.kidName}'s task is ${notif.hoursPastDeadline}h overdue!`,
          tag: `overdue_${notif.task.id}`,
          requireInteraction: true
        }
      )
    }
  })
}

/**
 * Start deadline monitoring (runs periodically)
 */
export function startDeadlineMonitoring(tasks, kids, settings) {
  const intervalMinutes = settings.checkInterval || 30

  // Clear existing interval
  const existingInterval = localStorage.getItem('deadlineMonitorInterval')
  if (existingInterval) {
    clearInterval(parseInt(existingInterval))
  }

  // Check immediately
  const notifications = checkDeadlines(tasks, kids, settings)
  sendDeadlineNotifications(notifications)

  // Set up interval
  const intervalId = setInterval(() => {
    const currentTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
    const currentKids = JSON.parse(localStorage.getItem('kids') || '[]')
    const notifications = checkDeadlines(currentTasks, currentKids, settings)
    sendDeadlineNotifications(notifications)
  }, intervalMinutes * 60 * 1000)

  localStorage.setItem('deadlineMonitorInterval', intervalId.toString())
  return intervalId
}

/**
 * Stop deadline monitoring
 */
export function stopDeadlineMonitoring() {
  const intervalId = localStorage.getItem('deadlineMonitorInterval')
  if (intervalId) {
    clearInterval(parseInt(intervalId))
    localStorage.removeItem('deadlineMonitorInterval')
  }
}

/**
 * Get tasks grouped by deadline urgency
 */
export function getTasksByUrgency(tasks) {
  const now = new Date()
  const urgency = {
    overdue: [],
    urgent: [],      // < 24 hours
    soon: [],        // 24-72 hours
    upcoming: [],    // > 72 hours
    noDeadline: []
  }

  tasks.filter(t => !t.completed).forEach(task => {
    if (!task.deadline) {
      urgency.noDeadline.push(task)
      return
    }

    const deadline = new Date(task.deadline)
    const hoursUntil = (deadline - now) / (1000 * 60 * 60)

    if (hoursUntil < 0) {
      urgency.overdue.push(task)
    } else if (hoursUntil < 24) {
      urgency.urgent.push(task)
    } else if (hoursUntil < 72) {
      urgency.soon.push(task)
    } else {
      urgency.upcoming.push(task)
    }
  })

  return urgency
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline) {
  const date = new Date(deadline)
  const now = new Date()
  const hoursUntil = (date - now) / (1000 * 60 * 60)

  if (hoursUntil < 0) {
    const hoursPast = Math.abs(Math.floor(hoursUntil))
    if (hoursPast < 24) {
      return `${hoursPast}h overdue`
    } else {
      const daysPast = Math.floor(hoursPast / 24)
      return `${daysPast}d overdue`
    }
  } else if (hoursUntil < 24) {
    return `${Math.ceil(hoursUntil)}h remaining`
  } else if (hoursUntil < 72) {
    const days = Math.ceil(hoursUntil / 24)
    return `${days}d remaining`
  } else {
    return date.toLocaleDateString()
  }
}

/**
 * Get color for deadline urgency
 */
export function getDeadlineColor(deadline) {
  if (!deadline) return 'gray'

  const now = new Date()
  const hoursUntil = (new Date(deadline) - now) / (1000 * 60 * 60)

  if (hoursUntil < 0) return 'red'      // Overdue
  if (hoursUntil < 24) return 'orange'  // Urgent
  if (hoursUntil < 72) return 'yellow'  // Soon
  return 'green'                         // Upcoming
}

/**
 * Clear notification cooldown for a task
 */
export function clearNotificationCooldown(taskId) {
  localStorage.removeItem(`notified_${taskId}`)
  localStorage.removeItem(`notified_overdue_${taskId}`)
}

/**
 * Test notification system
 */
export function testNotification() {
  return showNotification(
    '🎉 Notifications Working!',
    {
      body: 'You will receive deadline reminders for tasks.',
      requireInteraction: false
    }
  )
}
