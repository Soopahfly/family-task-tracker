import { useState } from 'react'
import { ListTodo, Plus, X, Calendar } from 'lucide-react'
import { tasksAPI } from '../utils/api'

function TaskManagement({ familyMembers, tasks, setTasks }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 10,
    kidId: '',
    category: 'chore',
    recurring: 'none'
  })

  const categories = ['chore', 'homework', 'behavior', 'extra']
  const recurringOptions = [
    { value: 'none', label: 'One-time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newTask = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      points: parseInt(formData.points),
      category: formData.category,
      difficulty: 'medium',
      assigned_to: formData.kidId || null,
      created_by: null,
      status: 'available',
      recurring: formData.recurring,
      recurring_parent_id: null,
      created_at: new Date().toISOString()
    }

    try {
      await tasksAPI.create(newTask)
      // Fetch updated tasks from server to ensure consistency
      const updatedTasks = await tasksAPI.getAll()
      setTasks(updatedTasks)
      setFormData({ title: '', description: '', points: 10, kidId: '', category: 'chore', recurring: 'none' })
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task. Please try again.')
    }
  }

  const handleDelete = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(taskId)
        setTasks(tasks.filter(t => t.id !== taskId))
      } catch (error) {
        console.error('Failed to delete task:', error)
        alert('Failed to delete task. Please try again.')
      }
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
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Tasks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-purple-50 p-6 rounded-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Clean your room"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to Kid</label>
              <select
                required
                value={formData.kidId}
                onChange={(e) => setFormData({...formData, kidId: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a kid</option>
                {familyMembers.map(kid => (
                  <option key={kid.id} value={kid.id}>{kid.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="2"
              placeholder="Add details about the task"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Points</label>
              <input
                type="number"
                required
                min="1"
                max="1000"
                value={formData.points}
                onChange={(e) => setFormData({...formData, points: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="chore">Chore</option>
                <option value="homework">Homework</option>
                <option value="behavior">Good Behavior</option>
                <option value="extra">Extra Credit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Recurring
              </label>
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
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700"
            >
              Add Task
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ListTodo size={64} className="mx-auto mb-4 opacity-50" />
            <p>No tasks created yet. Click "Add Task" to get started!</p>
          </div>
        ) : (
          tasks.map(task => {
            const assignedMember = familyMembers.find(k => k.id === task.assigned_to)
            const isRecurringTemplate = task.recurring && task.recurring !== 'none' && !task.recurring_parent_id
            const isRecurringInstance = task.recurring_parent_id !== null && task.recurring_parent_id !== undefined
            return (
              <div
                key={task.id}
                className={`border-2 rounded-xl p-4 ${
                  task.status === 'completed' ? 'bg-green-50 border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className={`font-bold text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                      {isRecurringTemplate && (
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Calendar size={12} />
                          {task.recurring} (template)
                        </span>
                      )}
                      {isRecurringInstance && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Calendar size={12} />
                          recurring
                        </span>
                      )}
                      {task.status === 'completed' && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Completed
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-purple-600 font-semibold">
                        +{task.points} points
                      </span>
                      {assignedMember && (
                        <span className="text-gray-500">
                          Assigned to: <span className="font-semibold">{assignedMember.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                    title={isRecurringTemplate ? 'Delete recurring template (stops future instances)' : 'Delete task'}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TaskManagement
