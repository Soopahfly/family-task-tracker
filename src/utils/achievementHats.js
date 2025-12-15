/**
 * Achievement Hats System
 * Assigns fun hats to family members based on their task completion performance
 */

/**
 * Get tasks completed by a member in the last 24 hours
 */
function getTasksCompletedLast24Hours(tasks, memberId) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return tasks.filter(t =>
    t.kidId === memberId &&
    t.completed &&
    t.completedAt &&
    new Date(t.completedAt) > oneDayAgo
  ).length
}

/**
 * Check if member has completed all core tasks assigned to them
 */
function hasCompletedAllCoreTasks(tasks, memberId) {
  const coreTasks = tasks.filter(t => t.kidId === memberId && t.taskType === 'core')
  if (coreTasks.length === 0) return false
  return coreTasks.every(t => t.completed)
}

/**
 * Check if member has a streak (completed tasks for N consecutive days)
 */
function hasStreakOfDays(tasks, memberId, days = 7) {
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const startOfDay = new Date(checkDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(checkDate.setHours(23, 59, 59, 999))

    const completedThatDay = tasks.filter(t =>
      t.kidId === memberId &&
      t.completed &&
      t.completedAt &&
      new Date(t.completedAt) >= startOfDay &&
      new Date(t.completedAt) <= endOfDay
    ).length

    if (completedThatDay === 0) return false
  }
  return true
}

/**
 * Determine which hat a family member should wear
 * Priority order: Crown > Top Hat > Party Hat > Graduation Cap > Chef Hat
 */
export function getAchievementHat(familyMembers, tasks, memberId) {
  // Get completion counts for all members in last 24 hours
  const memberCompletions = familyMembers.map(m => ({
    id: m.id,
    name: m.name,
    count: getTasksCompletedLast24Hours(tasks, m.id)
  })).sort((a, b) => b.count - a.count)

  const memberRank = memberCompletions.findIndex(m => m.id === memberId)
  const memberCount = memberCompletions.find(m => m.id === memberId)?.count || 0

  // Crown - Most tasks completed in last 24 hours
  if (memberRank === 0 && memberCount > 0) {
    return {
      emoji: '👑',
      name: 'Crown',
      description: `Champion! ${memberCount} tasks completed in 24 hours`,
      color: 'text-yellow-500'
    }
  }

  // Top Hat - 2nd place
  if (memberRank === 1 && memberCount > 0) {
    return {
      emoji: '🎩',
      name: 'Top Hat',
      description: `Runner-up! ${memberCount} tasks completed in 24 hours`,
      color: 'text-gray-700'
    }
  }

  // Party Hat - 3rd place
  if (memberRank === 2 && memberCount > 0) {
    return {
      emoji: '🥳',
      name: 'Party Hat',
      description: `3rd place! ${memberCount} tasks completed in 24 hours`,
      color: 'text-pink-500'
    }
  }

  // Graduation Cap - Week-long streak
  if (hasStreakOfDays(tasks, memberId, 7)) {
    return {
      emoji: '🎓',
      name: 'Graduation Cap',
      description: '7-day streak! Completed tasks every day this week',
      color: 'text-blue-500'
    }
  }

  // Chef Hat - All core tasks done
  if (hasCompletedAllCoreTasks(tasks, memberId)) {
    return {
      emoji: '👨‍🍳',
      name: 'Chef Hat',
      description: 'All core tasks completed!',
      color: 'text-green-500'
    }
  }

  // No hat
  return null
}

/**
 * Get all members with their hats
 */
export function getAllMembersWithHats(familyMembers, tasks) {
  return familyMembers.map(member => ({
    ...member,
    hat: getAchievementHat(familyMembers, tasks, member.id)
  }))
}

/**
 * Get leaderboard sorted by 24-hour performance
 */
export function getLeaderboard(familyMembers, tasks) {
  return familyMembers.map(member => {
    const completedLast24h = getTasksCompletedLast24Hours(tasks, member.id)
    const allTasks = tasks.filter(t => t.kidId === member.id)
    const completedTasks = allTasks.filter(t => t.completed).length
    const pendingTasks = allTasks.filter(t => !t.completed).length

    return {
      ...member,
      completedLast24h,
      totalCompleted: completedTasks,
      pendingTasks,
      hat: getAchievementHat(familyMembers, tasks, member.id)
    }
  }).sort((a, b) => {
    // Sort by 24h completions, then by total points
    if (b.completedLast24h !== a.completedLast24h) {
      return b.completedLast24h - a.completedLast24h
    }
    return (b.points || 0) - (a.points || 0)
  })
}
