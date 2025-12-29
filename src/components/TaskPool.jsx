import { useState } from 'react'
import { Plus, Star, Zap, GripVertical } from 'lucide-react'
import { tasksAPI } from '../utils/api'

/**
 * Task Pool Component - Drag & Drop Task Assignment
 * Features:
 * - Visual family member grid with avatars
 * - Drag tasks from pool onto family members
 * - Core vs Optional task types
 * - Mobile-friendly tap-to-assign fallback
 */
export default function TaskPool({ familyMembers, tasks, setTasks }) {
  const [draggedTask, setDraggedTask] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 10,
    category: 'chore',
    recurring: 'none',
    taskType: 'optional', // 'core' or 'optional'
    claimedBy: null, // null = in pool, memberId = claimed
    deadline: ''
  })

  // Filter tasks in pool (not assigned to anyone)
  const poolTasks = tasks.filter(t => !t.claimedBy && !t.kidId && !t.assigned_to && !t.completed)
  const coreTasks = poolTasks.filter(t => t.taskType === 'core')
  const optionalTasks = poolTasks.filter(t => t.taskType === 'optional')

  // Categories
  const categories = ['chore', 'homework', 'behavior', 'extra']
  const recurringOptions = [
    { value: 'none', label: 'One-time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }
  ]

  // Handle form submission to create pool task
  const handleSubmit = async (e) => {
    e.preventDefault()
    const newTask = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      points: parseInt(formData.points),
      category: formData.category,
      recurring: formData.recurring,
      taskType: formData.taskType,
      claimedBy: null, // Starts in pool
      kidId: null,
      assigned_to: null, // Server field name
      status: 'available',
      completed: false,
      createdAt: new Date().toISOString(),
      deadline: formData.deadline || null
    }

    try {
      await tasksAPI.create(newTask)
      setTasks([...tasks, newTask])
      setFormData({
        title: '',
        description: '',
        points: 10,
        category: 'chore',
        recurring: 'none',
        taskType: 'optional',
        claimedBy: null,
        deadline: ''
      })
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task. Please try again.')
    }
  }

  // Drag handlers
  const handleDragStart = (task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e) => {
    e.preventDefault() // Required to allow drop
  }

  const handleDrop = async (memberId) => {
    if (!draggedTask) return

    // Check if member has completed all core tasks
    const memberTasks = tasks.filter(t => t.kidId === memberId || t.assigned_to === memberId)
    const incompleteCoreTask = memberTasks.find(t => t.taskType === 'core' && !t.completed)

    if (draggedTask.taskType === 'optional' && incompleteCoreTask) {
      alert('Complete all core tasks (⭐) before claiming optional tasks!')
      setDraggedTask(null)
      return
    }

    try {
      // Assign task to member
      const updatedTask = {
        ...draggedTask,
        kidId: memberId,
        claimedBy: memberId,
        assigned_to: memberId, // Server field name
        claimedAt: new Date().toISOString()
      }
      await tasksAPI.update(draggedTask.id, updatedTask)

      setTasks(tasks.map(t =>
        t.id === draggedTask.id ? updatedTask : t
      ))
      setDraggedTask(null)
    } catch (error) {
      console.error('Failed to assign task:', error)
      alert('Failed to assign task. Please try again.')
      setDraggedTask(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  // Mobile tap-to-assign (fallback for no drag-and-drop)
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null)

  const handleTaskClick = (task) => {
    setSelectedTaskForAssign(task)
  }

  const handleMemberSelect = async (memberId) => {
    if (!selectedTaskForAssign) return

    // Same core task check
    const memberTasks = tasks.filter(t => t.kidId === memberId)
    const incompleteCoreTask = memberTasks.find(t => t.taskType === 'core' && !t.completed)

    if (selectedTaskForAssign.taskType === 'optional' && incompleteCoreTask) {
      alert('Complete all core tasks (⭐) before claiming optional tasks!')
      setSelectedTaskForAssign(null)
      return
    }

    try {
      const updatedTask = {
        ...selectedTaskForAssign,
        kidId: memberId,
        claimedBy: memberId,
        claimedAt: new Date().toISOString()
      }
      await tasksAPI.update(selectedTaskForAssign.id, updatedTask)

      setTasks(tasks.map(t =>
        t.id === selectedTaskForAssign.id ? updatedTask : t
      ))
      setSelectedTaskForAssign(null)
    } catch (error) {
      console.error('Failed to assign task:', error)
      alert('Failed to assign task. Please try again.')
      setSelectedTaskForAssign(null)
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      chore: 'bg-blue-100 text-blue-800',
      homework: 'bg-green-100 text-green-800',
      behavior: 'bg-purple-100 text-purple-800',
      extra: 'bg-orange-100 text-orange-800'
    }
    return colors[category] || colors.chore
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Task Pool</h2>
          <p className="text-gray-500 mt-1">
            {selectedTaskForAssign
              ? '👇 Tap a family member to assign the selected task'
              : 'Drag tasks onto family members to assign'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Task to Pool
        </button>
      </div>

      {/* Task Creation Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-purple-50 p-6 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Take out trash"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Points</label>
              <input
                type="number"
                required
                min="1"
                value={formData.points}
                onChange={(e) => setFormData({...formData, points: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="2"
              placeholder="Add details..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
              <select
                value={formData.recurring}
                onChange={(e) => setFormData({...formData, recurring: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {recurringOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Task Type</label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({...formData, taskType: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="core">⭐ Core (Must complete first)</option>
                <option value="optional">💫 Optional</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline (optional)</label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Add to Pool
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Family Members Grid - Drop Zones */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {selectedTaskForAssign ? '👇 Tap to Assign' : 'Family Members'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {familyMembers.map(member => {
            const memberTasks = tasks.filter(t => t.kidId === member.id && !t.completed)
            const coreTasksRemaining = memberTasks.filter(t => t.taskType === 'core').length
            const canClaimOptional = coreTasksRemaining === 0

            return (
              <div
                key={member.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(member.id)}
                onClick={() => selectedTaskForAssign && handleMemberSelect(member.id)}
                className={`
                  relative bg-white rounded-xl p-4 text-center transition-all cursor-pointer
                  ${draggedTask || selectedTaskForAssign
                    ? 'border-4 border-purple-400 border-dashed shadow-lg scale-105 hover:scale-110'
                    : 'border-2 border-gray-200 hover:border-purple-300 hover:shadow-md'}
                `}
              >
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl font-bold text-white"
                  style={{ backgroundColor: member.color || '#667eea' }}
                >
                  {member.avatar || member.name.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-bold text-gray-800 mb-1">{member.name}</h4>
                <p className="text-sm text-gray-500">{member.points || 0} pts</p>
                <p className="text-xs text-gray-400 mt-1">{memberTasks.length} active tasks</p>
                {coreTasksRemaining > 0 && (
                  <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    ⭐ {coreTasksRemaining} core task{coreTasksRemaining > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Core Tasks */}
      {coreTasks.length > 0 && (
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" size={24} />
            Core Tasks ({coreTasks.length})
            <span className="text-sm font-normal text-gray-500 ml-2">Must be completed before optional tasks</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreTasks.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task)}
                onDragEnd={handleDragEnd}
                onClick={() => handleTaskClick(task)}
                className={`
                  bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border-2
                  ${selectedTaskForAssign?.id === task.id
                    ? 'border-yellow-500 ring-4 ring-yellow-200'
                    : 'border-yellow-300'}
                  cursor-move hover:shadow-lg transition-all
                `}
              >
                <div className="flex items-start gap-2 mb-2">
                  <GripVertical className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <Star className="text-yellow-500" size={16} />
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    +{task.points} pts
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(task.category)}`}>
                    {task.category}
                  </span>
                </div>
                {task.recurring !== 'none' && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Zap size={12} />
                    {task.recurring}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Tasks */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="text-purple-500" size={24} />
          Optional Tasks ({optionalTasks.length})
        </h3>
        {optionalTasks.length === 0 ? (
          <p className="text-gray-400 text-center py-8 italic">No optional tasks in the pool yet. Add some above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optionalTasks.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task)}
                onDragEnd={handleDragEnd}
                onClick={() => handleTaskClick(task)}
                className={`
                  bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2
                  ${selectedTaskForAssign?.id === task.id
                    ? 'border-purple-500 ring-4 ring-purple-200'
                    : 'border-purple-300'}
                  cursor-move hover:shadow-lg transition-all
                `}
              >
                <div className="flex items-start gap-2 mb-2">
                  <GripVertical className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    +{task.points} pts
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(task.category)}`}>
                    {task.category}
                  </span>
                </div>
                {task.recurring !== 'none' && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Zap size={12} />
                    {task.recurring}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTaskForAssign && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-full shadow-xl">
          Tap a family member to assign "{selectedTaskForAssign.title}"
          <button
            onClick={() => setSelectedTaskForAssign(null)}
            className="ml-4 bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-bold"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
