import { useState } from 'react'
import { Users, Star, Clock, Check, ListTodo, Gift, Lightbulb, X, Plus, Award } from 'lucide-react'
import ReturnTaskDialog from './ReturnTaskDialog'
import StreakDisplay from './StreakDisplay'
import { rewardSuggestionsAPI, tasksAPI, meritsAPI, familyMembersAPI, completeTask } from '../utils/api'

function KidView({ familyMembers, tasks, setTasks, rewards, rewardSuggestions, setRewardSuggestions, selectedKid, setSelectedKid, settings, meritTypes, setFamilyMembers, merits, setMerits }) {
  const [showSuggestionForm, setShowSuggestionForm] = useState(false)
  const [suggestionTitle, setSuggestionTitle] = useState('')
  const [taskToReturn, setTaskToReturn] = useState(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskFormData, setTaskFormData] = useState({ title: '', description: '' })
  const [showMeritForm, setShowMeritForm] = useState(false)
  const [meritFormData, setMeritFormData] = useState({ meritTypeId: '', note: '' })

  if (!selectedKid && familyMembers.length > 0) {
    return (
      <div className="bg-white rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Who are you?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {familyMembers.map(kid => (
            <button
              key={kid.id}
              onClick={() => setSelectedKid(kid)}
              className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 rounded-2xl hover:shadow-xl transition-all hover:scale-105"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white mx-auto mb-3"
                style={{ backgroundColor: kid.color }}
              >
                {kid.avatar || kid.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-2xl font-bold text-gray-800">{kid.name}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!selectedKid) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <Users size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No family members added yet. Ask a parent to add you!</p>
      </div>
    )
  }

  const myTasks = tasks.filter(t => t.kidId === selectedKid.id || t.assigned_to === selectedKid.id)
  const pendingTasks = myTasks.filter(t => !t.completed)
  const completedToday = myTasks.filter(t => {
    if (!t.completed || !t.completedAt) return false
    const today = new Date().toDateString()
    const completedDate = new Date(t.completedAt).toDateString()
    return today === completedDate
  })

  // Available tasks from the pool (not assigned to anyone, not completed)
  const availableTasks = tasks.filter(t => !t.assigned_to && !t.completed)
  const coreTasksAvailable = availableTasks.filter(t => t.taskType === 'core')
  const optionalTasksAvailable = availableTasks.filter(t => t.taskType === 'optional')

  // Check if kid has incomplete core tasks (blocks claiming optional tasks)
  const hasIncompleteCoreTask = pendingTasks.some(t => t.taskType === 'core')

  const affordableRewards = rewards.filter(r => selectedKid.points >= r.pointsCost)
  const screenTimeAvailable = Math.floor(selectedKid.points / settings.pointsPerMinute)

  const handleSuggestReward = async (e) => {
    e.preventDefault()
    const newSuggestion = {
      id: Date.now().toString(),
      kidId: selectedKid.id,
      kidName: selectedKid.name,
      title: suggestionTitle,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    try {
      await rewardSuggestionsAPI.create(newSuggestion)
      setRewardSuggestions([...rewardSuggestions, newSuggestion])
      setSuggestionTitle('')
      setShowSuggestionForm(false)
      alert('Reward suggestion sent to parent!')
    } catch (error) {
      console.error('Failed to create reward suggestion:', error)
      alert('Failed to send reward suggestion. Please try again.')
    }
  }

  const handleCompleteTask = async (task) => {
    try {
      const result = await completeTask(task.id, selectedKid.id)

      // Update the task in the tasks list
      const updatedTasks = tasks.map(t =>
        t.id === task.id
          ? { ...t, completed: true, completedAt: result.task.completed_at, status: 'completed' }
          : t
      )
      setTasks(updatedTasks)

      // Update points in local state
      const updatedMembers = familyMembers.map(member =>
        member.id === selectedKid.id
          ? { ...member, points: (member.points || 0) + task.points }
          : member
      )
      setFamilyMembers(updatedMembers)

      // Reload to get updated streaks and achievements
      window.location.reload()
    } catch (error) {
      console.error('Failed to complete task:', error)
      alert('Failed to complete task. Please try again.')
    }
  }

  const handleClaimTask = async (task) => {
    // Check if trying to claim optional task while having incomplete core tasks
    if (task.taskType === 'optional' && hasIncompleteCoreTask) {
      alert('Complete all core tasks (⭐) before claiming optional tasks!')
      return
    }

    try {
      const updatedTask = {
        ...task,
        kidId: selectedKid.id,
        assigned_to: selectedKid.id,
        claimedBy: selectedKid.id,
        claimedAt: new Date().toISOString()
      }
      await tasksAPI.update(task.id, updatedTask)

      setTasks(tasks.map(t =>
        t.id === task.id ? updatedTask : t
      ))
    } catch (error) {
      console.error('Failed to claim task:', error)
      alert('Failed to claim task. Please try again.')
    }
  }

  const handleReturnTask = async (reason) => {
    if (!taskToReturn) return

    try {
      await tasksAPI.returnToPool(taskToReturn.id, reason)

      // Update local state - remove task from kid's tasks
      setTasks(tasks.map(t =>
        t.id === taskToReturn.id
          ? { ...t, kidId: null, assigned_to: null, claimedBy: null, status: 'available', return_reason: reason }
          : t
      ))

      setTaskToReturn(null)
      alert('Task returned to the pool!')
    } catch (error) {
      console.error('Failed to return task:', error)
      alert('Failed to return task. Please try again.')
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    const newTask = {
      id: Date.now().toString(),
      title: taskFormData.title,
      description: taskFormData.description,
      points: 0, // Kid-created tasks have 0 points initially
      category: 'Kid Created',
      kidId: selectedKid.id,
      claimedBy: selectedKid.name,
      status: 'claimed',
      completed: false,
      created_by_kid: 1,
      createdAt: new Date().toISOString()
    }

    try {
      await tasksAPI.create(newTask)
      setTasks([...tasks, newTask])
      setTaskFormData({ title: '', description: '' })
      setShowTaskForm(false)
      alert('Task created! A parent will review and assign points.')
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task. Please try again.')
    }
  }

  const handleLogMerit = async (e) => {
    e.preventDefault()

    if (!meritTypes || meritTypes.length === 0) {
      alert('No merit types available. Ask a parent to create merit types first.')
      return
    }

    const meritType = meritTypes.find(t => t.id === meritFormData.meritTypeId)
    if (!meritType) {
      alert('Please select a valid merit type.')
      return
    }

    const newMerit = {
      id: Date.now().toString(),
      kidId: selectedKid.id,
      kidName: selectedKid.name,
      meritTypeId: meritFormData.meritTypeId,
      meritTypeName: meritType.name,
      meritTypeIcon: meritType.icon,
      points: meritType.points,
      note: meritFormData.note,
      awardedAt: new Date().toISOString(),
      logged_at_school: 1
    }

    try {
      await meritsAPI.create(newMerit)
      setMerits([...merits, newMerit])

      // Award points to kid
      const updatedKid = { ...selectedKid, points: (selectedKid.points || 0) + meritType.points }
      await familyMembersAPI.update(selectedKid.id, updatedKid)
      setFamilyMembers(familyMembers.map(k => k.id === selectedKid.id ? updatedKid : k))

      setMeritFormData({ meritTypeId: '', note: '' })
      setShowMeritForm(false)
      alert(`Great job! You earned ${meritType.points} points for ${meritType.name}!`)
    } catch (error) {
      console.error('Failed to log merit:', error)
      alert('Failed to log merit. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
              style={{ backgroundColor: selectedKid.color }}
            >
              {selectedKid.avatar || selectedKid.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Hi, {selectedKid.name}!</h2>
              <p className="text-gray-500">Keep up the great work!</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedKid(null)}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold"
          >
            Switch Kid
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Star size={24} />
              <span className="font-semibold">Your Points</span>
            </div>
            <p className="text-4xl font-bold">{selectedKid.points || 0}</p>
          </div>

          <div className="bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={24} />
              <span className="font-semibold">Screen Time</span>
            </div>
            <p className="text-4xl font-bold">{screenTimeAvailable} <span className="text-xl">min</span></p>
          </div>

          <div className="bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Check size={24} />
              <span className="font-semibold">Done Today</span>
            </div>
            <p className="text-4xl font-bold">{completedToday.length}</p>
          </div>
        </div>
      </div>

      {/* Streak Display */}
      <StreakDisplay memberId={selectedKid.id} />

      {/* Create Your Own Task Section */}
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Plus size={20} />
          Create Your Own Task
        </h3>
        {!showTaskForm ? (
          <button
            onClick={() => setShowTaskForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add a Task You Want to Do
          </button>
        ) : (
          <form onSubmit={handleCreateTask} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
              <input
                type="text"
                required
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What do you want to do?"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
              <textarea
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                placeholder="Add details about the task..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={() => setShowTaskForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 italic">A parent will review your task and assign points!</p>
          </form>
        )}
      </div>

      {/* Log School Merits Section */}
      {meritTypes && meritTypes.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Award size={20} />
            Log Merits from School
          </h3>
          {!showMeritForm ? (
            <button
              onClick={() => setShowMeritForm(true)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Award size={20} />
              I Got a Merit at School!
            </button>
          ) : (
            <form onSubmit={handleLogMerit} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">What merit did you get?</label>
                <select
                  required
                  value={meritFormData.meritTypeId}
                  onChange={(e) => setMeritFormData({...meritFormData, meritTypeId: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border-2 border-yellow-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">Choose merit type...</option>
                  {meritTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name} (+{type.points} pts)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note (optional)</label>
                <textarea
                  value={meritFormData.note}
                  onChange={(e) => setMeritFormData({...meritFormData, note: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border-2 border-yellow-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows="2"
                  placeholder="What did you do to earn this merit?"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Log Merit
                </button>
                <button
                  type="button"
                  onClick={() => setShowMeritForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Available Tasks from Pool */}
      {(coreTasksAvailable.length > 0 || optionalTasksAvailable.length > 0) && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 shadow-xl mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={24} className="text-purple-600" />
            Available Tasks - Click to Claim!
          </h3>

          {hasIncompleteCoreTask && optionalTasksAvailable.length > 0 && (
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mb-4 text-sm">
              ⚠️ Complete all core tasks (⭐) before claiming optional tasks!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreTasksAvailable.map(task => (
              <div
                key={task.id}
                onClick={() => handleClaimTask(task)}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border-2 border-yellow-300 cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
              >
                <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <Star className="text-yellow-500" size={20} />
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    +{task.points} pts
                  </span>
                  <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                    ⭐ Core
                  </span>
                </div>
              </div>
            ))}
            {optionalTasksAvailable.map(task => (
              <div
                key={task.id}
                onClick={() => handleClaimTask(task)}
                className={`bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-300 cursor-pointer transition-all ${
                  hasIncompleteCoreTask
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-lg hover:scale-105'
                }`}
              >
                <h4 className="font-bold text-lg text-gray-800">{task.title}</h4>
                {task.description && (
                  <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    +{task.points} pts
                  </span>
                  <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                    💫 Optional
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ListTodo size={24} />
            Your Tasks ({pendingTasks.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingTasks.length === 0 ? (
              <p className="text-gray-400 italic text-center py-8">All caught up! Great job!</p>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200 relative">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => handleCompleteTask(task)}
                      className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg transition-colors"
                      title="Mark as complete"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setTaskToReturn(task)}
                      className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors"
                      title="Can't do this task?"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <h4 className="font-bold text-lg text-gray-800 pr-20">{task.title}</h4>
                  {task.description && (
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                      +{task.points} points
                    </span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      {task.category}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Gift size={24} />
            Available Rewards
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {affordableRewards.length === 0 ? (
              <p className="text-gray-400 italic text-center py-8">
                Keep completing tasks to unlock rewards!
              </p>
            ) : (
              affordableRewards.map(reward => (
                <div key={reward.id} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{reward.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800">{reward.title}</h4>
                      {reward.description && (
                        <p className="text-gray-600 text-sm">{reward.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 bg-green-600 text-white text-center py-2 rounded-lg font-bold">
                    {reward.pointsCost} points - Ask parent to redeem!
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            {!showSuggestionForm ? (
              <button
                onClick={() => setShowSuggestionForm(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Lightbulb size={20} />
                Suggest a Reward
              </button>
            ) : (
              <form onSubmit={handleSuggestReward} className="space-y-3">
                <input
                  type="text"
                  required
                  value={suggestionTitle}
                  onChange={(e) => setSuggestionTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="What reward would you like?"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSuggestionForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Return Task Dialog */}
      {taskToReturn && (
        <ReturnTaskDialog
          task={taskToReturn}
          onReturn={handleReturnTask}
          onCancel={() => setTaskToReturn(null)}
        />
      )}
    </div>
  )
}

export default KidView
