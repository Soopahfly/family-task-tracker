import { BarChart3 } from 'lucide-react'

function Statistics({ familyMembers, tasks }) {
  const getKidStats = (kid) => {
    const kidTasks = tasks.filter(t => t.kidId === kid.id || t.assigned_to === kid.id)
    const completed = kidTasks.filter(t => t.completed)

    const completedThisWeek = completed.filter(t => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(t.completedAt) >= weekAgo
    })

    const pointsEarned = completed.reduce((sum, t) => sum + t.points, 0)

    return {
      total: kidTasks.length,
      completed: completed.length,
      completedThisWeek: completedThisWeek.length,
      pointsEarned,
      completionRate: kidTasks.length > 0 ? Math.round((completed.length / kidTasks.length) * 100) : 0
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BarChart3 size={28} />
        Statistics & Progress
      </h2>

      {familyMembers.length === 0 ? (
        <p className="text-gray-400 italic text-center py-8">No family members added yet</p>
      ) : (
        <div className="space-y-6">
          {familyMembers.map(kid => {
            const stats = getKidStats(kid)

            return (
              <div key={kid.id} className="border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: kid.color }}
                  >
                    {kid.avatar || kid.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{kid.name}</h3>
                    <p className="text-gray-600">Current Points: {kid.points || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-purple-600">{stats.completionRate}%</p>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg">
                    <p className="text-lg font-semibold text-gray-700">This Week</p>
                    <p className="text-2xl font-bold text-cyan-600">{stats.completedThisWeek} tasks completed</p>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                    <p className="text-lg font-semibold text-gray-700">Total Points Earned</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pointsEarned} points</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Statistics
