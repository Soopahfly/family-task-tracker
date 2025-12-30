import { Check, Star, Zap, Trophy, TrendingUp } from 'lucide-react'
import { getLeaderboard } from '../utils/achievementHats'
import { completeTask } from '../utils/api'

/**
 * Enhanced Dashboard - Family Member Grid with Achievement Hats
 * First page view showing family members ranked by performance
 */
export default function EnhancedDashboard({ familyMembers, tasks, setTasks, setFamilyMembers }) {
  const leaderboard = getLeaderboard(familyMembers, tasks)

  const handleCompleteTask = async (taskId, kidId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    try {
      // Use the proper completion endpoint that creates history, streaks, and achievements
      const result = await completeTask(taskId, kidId)

      // Update the task in the tasks list (mark as completed, don't remove it)
      const updatedTasks = tasks.map(t =>
        t.id === taskId
          ? { ...t, completed: true, completedAt: result.task.completed_at, status: 'completed' }
          : t
      )
      setTasks(updatedTasks)

      // Update points in local state (backend already updated it)
      const updatedMembers = familyMembers.map(member =>
        member.id === kidId
          ? { ...member, points: (member.points || 0) + task.points }
          : member
      )
      setFamilyMembers(updatedMembers)

      // Reload data to get updated streaks and achievements
      window.location.reload()
    } catch (error) {
      console.error('Failed to complete task:', error)
      alert('Failed to complete task. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Family Task Tracker</h1>
        <p className="text-gray-500 text-lg">Who's leading today?</p>
      </div>

      {/* Leaderboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {leaderboard.map((member, index) => {
          // Filter tasks to show only relevant ones (hide recurring templates if instance exists today)
          const today = new Date().toISOString().split('T')[0]
          const visibleTasks = tasks.filter(t => {
            // Must be assigned to this member
            if (t.kidId !== member.id && t.assigned_to !== member.id) {
              return false
            }

            // If it's a recurring instance, always show it
            if (t.recurring_parent_id) {
              return true
            }

            // If it's a recurring template
            const isTemplate = t.recurring && t.recurring !== 'none' && !t.recurring_parent_id
            if (isTemplate) {
              // Check if there's an instance created today
              const hasInstanceToday = tasks.some(task =>
                task.recurring_parent_id === t.id &&
                task.created_at &&
                task.created_at.startsWith(today)
              )
              // Show template only if no instance exists for today
              return !hasInstanceToday
            }

            // Regular non-recurring tasks - always show
            return true
          })

          const activeTasks = visibleTasks.filter(t => !t.completed)
          const coreTasksRemaining = activeTasks.filter(t => t.taskType === 'core').length
          const completedToday = visibleTasks.filter(t =>
            t.completed &&
            t.completedAt &&
            new Date(t.completedAt).toDateString() === new Date().toDateString()
          ).length

          return (
            <div
              key={member.id}
              className={`
                bg-white rounded-2xl p-6 shadow-xl transition-all hover:shadow-2xl hover:scale-105
                ${index === 0 ? 'ring-4 ring-yellow-400' : ''}
                ${index === 1 ? 'ring-4 ring-gray-400' : ''}
                ${index === 2 ? 'ring-4 ring-orange-400' : ''}
              `}
            >
              {/* Rank Badge */}
              {index < 3 && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  #{index + 1}
                </div>
              )}

              {/* Avatar with Hat */}
              <div className="relative mb-4">
                <div
                  className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: member.color || '#667eea' }}
                >
                  {member.avatar || member.name.charAt(0).toUpperCase()}
                </div>
                {/* Achievement Hat */}
                {member.hat && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-5xl animate-bounce">
                    {member.hat.emoji}
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{member.name}</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  member.role === 'child' ? 'bg-blue-100 text-blue-800' :
                  member.role === 'parent' ? 'bg-purple-100 text-purple-800' :
                  member.role === 'teen' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {member.role === 'child' ? '👧 Child' :
                   member.role === 'parent' ? '👨 Parent' :
                   member.role === 'teen' ? '🧑 Teen' : '👤 Other'}
                </span>
              </div>

              {/* Achievement Hat Description */}
              {member.hat && (
                <div className={`text-center mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300`}>
                  <p className={`text-sm font-semibold ${member.hat.color}`}>
                    {member.hat.description}
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-3 text-white text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star size={16} />
                    <span className="text-xs font-semibold">Points</span>
                  </div>
                  <p className="text-2xl font-bold">{member.points || 0}</p>
                </div>

                <div className="bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg p-3 text-white text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Check size={16} />
                    <span className="text-xs font-semibold">Today</span>
                  </div>
                  <p className="text-2xl font-bold">{completedToday}</p>
                </div>

                <div className="bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg p-3 text-white text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp size={16} />
                    <span className="text-xs font-semibold">24h</span>
                  </div>
                  <p className="text-2xl font-bold">{member.completedLast24h}</p>
                </div>

                <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg p-3 text-white text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap size={16} />
                    <span className="text-xs font-semibold">Active</span>
                  </div>
                  <p className="text-2xl font-bold">{member.pendingTasks}</p>
                </div>
              </div>

              {/* Core Tasks Alert */}
              {coreTasksRemaining > 0 && (
                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-2 mb-4 text-center">
                  <p className="text-sm font-semibold text-yellow-800">
                    ⭐ {coreTasksRemaining} core task{coreTasksRemaining > 1 ? 's' : ''} remaining
                  </p>
                </div>
              )}

              {/* Quick Tasks */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Active Tasks:</h4>
                {activeTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                          {task.taskType === 'core' && <Star className="text-yellow-500" size={12} />}
                          {task.title}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCompleteTask(task.id, member.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ))}
                {activeTasks.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{activeTasks.length - 3} more task{activeTasks.length - 3 > 1 ? 's' : ''}
                  </p>
                )}
                {activeTasks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center italic py-2">
                    All caught up! 🎉
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* No Members Message */}
      {leaderboard.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-xl">
          <Trophy className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="text-gray-500 text-lg">No family members added yet.</p>
          <p className="text-gray-400 mt-2">Go to the Family tab to add your first member!</p>
        </div>
      )}

      {/* Achievement Explanation */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy size={24} />
          Achievement Hats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-4xl mb-2">👑</div>
            <p className="font-bold text-sm text-gray-800">Crown</p>
            <p className="text-xs text-gray-500 mt-1">Most tasks in 24h</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-4xl mb-2">🎩</div>
            <p className="font-bold text-sm text-gray-800">Top Hat</p>
            <p className="text-xs text-gray-500 mt-1">2nd place</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-4xl mb-2">🥳</div>
            <p className="font-bold text-sm text-gray-800">Party Hat</p>
            <p className="text-xs text-gray-500 mt-1">3rd place</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-4xl mb-2">🎓</div>
            <p className="font-bold text-sm text-gray-800">Graduation Cap</p>
            <p className="text-xs text-gray-500 mt-1">7-day streak</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-4xl mb-2">👨‍🍳</div>
            <p className="font-bold text-sm text-gray-800">Chef Hat</p>
            <p className="text-xs text-gray-500 mt-1">All core tasks done</p>
          </div>
        </div>
      </div>
    </div>
  )
}
