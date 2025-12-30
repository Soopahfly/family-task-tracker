import { useState } from 'react'
import { ListTodo, Plus, X, Calendar, Filter, Edit2, Lock, CheckCircle } from 'lucide-react'
import { tasksAPI, completeTask } from '../utils/api'
import { verifyPassword } from '../utils/authManager'

function TaskManagement({ familyMembers, tasks, setTasks, setFamilyMembers }) {
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [passwordAction, setPasswordAction] = useState(null)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [filterMemberId, setFilterMemberId] = useState('all')
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [taskToComplete, setTaskToComplete] = useState(null)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [pointsRecipientId, setPointsRecipientId] = useState('')
  const [draggedTask, setDraggedTask] = useState(null)
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

  const handlePasswordVerification = async () => {
    setPasswordError('')
    const result = await verifyPassword(password)

    if (result.success) {
      setPassword('')
      setShowPasswordPrompt(false)

      if (passwordAction) {
        passwordAction()
        setPasswordAction(null)
      }
    } else {
      setPasswordError('Incorrect password')
    }
  }

  const requestPasswordForEdit = (task) => {
    setPasswordAction(() => () => startEditTask(task))
    setShowPasswordPrompt(true)
  }

  const startEditTask = (task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      points: task.points,
      kidId: task.assigned_to || '',
      category: task.category,
      recurring: task.recurring || 'none'
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (editingTask) {
      // Update existing task
      const updatedTask = {
        ...editingTask,
        title: formData.title,
        description: formData.description,
        points: parseInt(formData.points),
        category: formData.category,
        assigned_to: formData.kidId || null,
        recurring: formData.recurring
      }

      try {
        await tasksAPI.update(editingTask.id, updatedTask)
        const updatedTasks = await tasksAPI.getAll()
        setTasks(updatedTasks)
        setFormData({ title: '', description: '', points: 10, kidId: '', category: 'chore', recurring: 'none' })
        setShowForm(false)
        setEditingTask(null)
      } catch (error) {
        console.error('Failed to update task:', error)
        alert('Failed to update task. Please try again.')
      }
    } else {
      // Create new task
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
        const updatedTasks = await tasksAPI.getAll()
        setTasks(updatedTasks)
        setFormData({ title: '', description: '', points: 10, kidId: '', category: 'chore', recurring: 'none' })
        setShowForm(false)
      } catch (error) {
        console.error('Failed to create task:', error)
        alert('Failed to create task. Please try again.')
      }
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

  const handleCompleteClick = (task) => {
    setTaskToComplete(task)
    setSelectedMemberId('')
    setPointsRecipientId('')
    setShowCompleteDialog(true)
  }

  const handleCompleteTask = async () => {
    if (!selectedMemberId) {
      alert('Please select who completed this task')
      return
    }

    // Use points recipient if specified, otherwise use the person who completed it
    const recipientId = pointsRecipientId || selectedMemberId

    try {
      await completeTask(taskToComplete.id, recipientId)

      // Update local state
      const updatedTasks = tasks.filter(t => t.id !== taskToComplete.id)
      setTasks(updatedTasks)

      // Update points
      const member = familyMembers.find(m => m.id === recipientId)
      if (member && setFamilyMembers) {
        const updatedMembers = familyMembers.map(m =>
          m.id === recipientId
            ? { ...m, points: (m.points || 0) + taskToComplete.points }
            : m
        )
        setFamilyMembers(updatedMembers)
      }

      setShowCompleteDialog(false)
      setTaskToComplete(null)
      setSelectedMemberId('')
      setPointsRecipientId('')

      // Reload to get updated streaks/achievements
      window.location.reload()
    } catch (error) {
      console.error('Failed to complete task:', error)
      alert('Failed to complete task. Please try again.')
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, memberId) => {
    e.preventDefault()
    if (!draggedTask) return

    try {
      const updatedTask = {
        ...draggedTask,
        assigned_to: memberId
      }

      await tasksAPI.update(draggedTask.id, updatedTask)
      const updatedTasks = await tasksAPI.getAll()
      setTasks(updatedTasks)
      setDraggedTask(null)
    } catch (error) {
      console.error('Failed to assign task:', error)
      alert('Failed to assign task. Please try again.')
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

  // Filter tasks by selected family member
  const filteredTasks = filterMemberId === 'all'
    ? tasks
    : filterMemberId === 'unassigned'
    ? tasks.filter(t => !t.assigned_to || t.assigned_to === '')
    : tasks.filter(t => t.assigned_to === filterMemberId)

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

      {/* Filter by Family Member */}
      <div className="mb-6 flex items-center gap-3">
        <Filter size={20} className="text-gray-600" />
        <label className="font-semibold text-gray-700">Filter by:</label>
        <select
          value={filterMemberId}
          onChange={(e) => setFilterMemberId(e.target.value)}
          className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold"
        >
          <option value="all">All Family Members</option>
          {familyMembers.filter(m => m.role !== 'parent').map(member => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
          <option value="unassigned">Unassigned</option>
        </select>
        {filterMemberId !== 'all' && (
          <span className="text-sm text-gray-600">
            ({filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'})
          </span>
        )}
      </div>

      {/* Drag and Drop Assignment Zones */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm font-semibold text-gray-700 mb-3">Drag tasks to assign:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {familyMembers.map(member => (
            <div
              key={member.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, member.id)}
              className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              <p className="font-semibold text-gray-800">{member.name}</p>
              <p className="text-xs text-gray-500">{member.role === 'parent' ? 'Parent' : 'Kid'}</p>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-purple-50 p-6 rounded-xl mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h3>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to Family Member (optional)</label>
              <select
                value={formData.kidId}
                onChange={(e) => setFormData({...formData, kidId: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {familyMembers.filter(m => m.role === 'parent').length > 0 && (
                  <optgroup label="Parents">
                    {familyMembers.filter(m => m.role === 'parent').map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </optgroup>
                )}
                {familyMembers.filter(m => m.role !== 'parent').length > 0 && (
                  <optgroup label="Kids">
                    {familyMembers.filter(m => m.role !== 'parent').map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </optgroup>
                )}
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
              {editingTask ? 'Update Task' : 'Add Task'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingTask(null)
                setFormData({ title: '', description: '', points: 10, kidId: '', category: 'chore', recurring: 'none' })
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ListTodo size={64} className="mx-auto mb-4 opacity-50" />
            <p>{filterMemberId === 'all' ? 'No tasks created yet. Click "Add Task" to get started!' : 'No tasks found for this filter.'}</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const assignedMember = familyMembers.find(k => k.id === task.assigned_to)
            const isRecurringTemplate = task.recurring && task.recurring !== 'none' && !task.recurring_parent_id
            const isRecurringInstance = task.recurring_parent_id !== null && task.recurring_parent_id !== undefined
            return (
              <div
                key={task.id}
                draggable={task.status !== 'completed'}
                onDragStart={(e) => handleDragStart(e, task)}
                className={`border-2 rounded-xl p-4 ${
                  task.status === 'completed' ? 'bg-green-50 border-green-200' : 'border-gray-200 cursor-move'
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
                  <div className="flex gap-2">
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => handleCompleteClick(task)}
                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg"
                        title="Mark as complete"
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => requestPasswordForEdit(task)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                      title="Edit task (requires password)"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      title={isRecurringTemplate ? 'Delete recurring template (stops future instances)' : 'Delete task'}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Edit Task</h2>
              <p className="text-gray-600">Enter parent password to edit this task</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordVerification()}
                autoFocus
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{passwordError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePasswordVerification}
                disabled={!password}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Verify
              </button>
              <button
                onClick={() => {
                  setShowPasswordPrompt(false)
                  setPassword('')
                  setPasswordError('')
                  setPasswordAction(null)
                }}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Dialog */}
      {showCompleteDialog && taskToComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Task</h2>
              <p className="text-gray-600 mb-2">Who completed: <span className="font-bold">{taskToComplete.title}</span>?</p>
              <p className="text-sm text-purple-600 font-semibold">+{taskToComplete.points} points</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Who completed this task?
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose who completed this...</option>
                {familyMembers.filter(m => m.role === 'parent').length > 0 && (
                  <optgroup label="Parents">
                    {familyMembers.filter(m => m.role === 'parent').map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </optgroup>
                )}
                {familyMembers.filter(m => m.role !== 'parent').length > 0 && (
                  <optgroup label="Kids">
                    {familyMembers.filter(m => m.role !== 'parent').map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Who gets the points? (optional - defaults to who completed it)
              </label>
              <select
                value={pointsRecipientId}
                onChange={(e) => setPointsRecipientId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Same as who completed it</option>
                {familyMembers.filter(m => m.role === 'parent').length > 0 && (
                  <optgroup label="Parents">
                    {familyMembers.filter(m => m.role === 'parent').map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </optgroup>
                )}
                {familyMembers.filter(m => m.role !== 'parent').length > 0 && (
                  <optgroup label="Kids">
                    {familyMembers.filter(m => m.role !== 'parent').map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCompleteTask}
                disabled={!selectedMemberId}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Complete Task
              </button>
              <button
                onClick={() => {
                  setShowCompleteDialog(false)
                  setTaskToComplete(null)
                  setSelectedMemberId('')
                  setPointsRecipientId('')
                }}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskManagement
