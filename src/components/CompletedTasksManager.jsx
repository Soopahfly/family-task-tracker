import { useState, useEffect } from 'react'
import { CheckCircle, Edit2, Trash2, Plus, Calendar } from 'lucide-react'
import { taskHistoryAPI, familyMembersAPI } from '../utils/api'
import { verifyPassword } from '../utils/authManager'

export default function CompletedTasksManager({ familyMembers }) {
  const [taskHistory, setTaskHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [removePoints, setRemovePoints] = useState(false)

  const [formData, setFormData] = useState({
    family_member_id: '',
    task_title: '',
    points_earned: 10,
    completed_at: new Date().toISOString().slice(0, 16),
    category: 'chore'
  })

  useEffect(() => {
    loadTaskHistory()
  }, [selectedMember])

  const loadTaskHistory = async () => {
    setLoading(true)
    try {
      if (selectedMember === 'all') {
        // Load all history
        const allHistory = await Promise.all(
          familyMembers.map(member => taskHistoryAPI.get(member.id))
        )
        setTaskHistory(allHistory.flat().sort((a, b) =>
          new Date(b.completed_at) - new Date(a.completed_at)
        ))
      } else {
        const history = await taskHistoryAPI.get(selectedMember)
        setTaskHistory(history)
      }
    } catch (error) {
      console.error('Failed to load task history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const entry = {
        id: editingTask?.id || crypto.randomUUID().replace(/-/g, ''),
        task_id: null,
        task_title: formData.task_title,
        family_member_id: formData.family_member_id,
        points_earned: parseInt(formData.points_earned),
        completed_at: new Date(formData.completed_at).toISOString(),
        category: formData.category,
        difficulty: null
      }

      if (editingTask) {
        // Update existing (would need a server endpoint)
        alert('Edit functionality requires server endpoint update')
      } else {
        // Add new historical task
        await taskHistoryAPI.add(entry)

        // Also update family member points
        const member = familyMembers.find(m => m.id === formData.family_member_id)
        if (member) {
          await familyMembersAPI.update(member.id, {
            ...member,
            points: (member.points || 0) + entry.points_earned
          })
        }
      }

      setShowAddForm(false)
      setEditingTask(null)
      setFormData({
        family_member_id: '',
        task_title: '',
        points_earned: 10,
        completed_at: new Date().toISOString().slice(0, 16),
        category: 'chore'
      })
      loadTaskHistory()
      window.location.reload() // Reload to update points display
    } catch (error) {
      console.error('Failed to save task:', error)
      alert('Failed to save task. Please try again.')
    }
  }

  const handleDeleteClick = (task) => {
    setTaskToDelete(task)
    setShowDeleteConfirm(true)
    setDeletePassword('')
    setRemovePoints(false)
  }

  const handleConfirmDelete = async (e) => {
    e.preventDefault()

    // Check password if set
    const hasPassword = localStorage.getItem('hasPassword') === 'true'
    if (hasPassword) {
      const isValid = await verifyPassword(deletePassword)
      if (!isValid) {
        alert('Incorrect password!')
        return
      }
    }

    try {
      // Delete from history with optional point removal
      const result = await taskHistoryAPI.delete(taskToDelete.id, removePoints)

      if (result.success) {
        // If points were removed, reload the entire page to update family member points
        if (removePoints) {
          alert(`Task deleted and ${result.pointsRemoved} points removed from ${getMemberName(taskToDelete.family_member_id)}!`)
          window.location.reload()
        } else {
          // Just reload task history
          loadTaskHistory()
        }
      }

      setShowDeleteConfirm(false)
      setTaskToDelete(null)
      setDeletePassword('')
      setRemovePoints(false)
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('Failed to delete task.')
    }
  }

  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId)
    return member ? member.name : 'Unknown'
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CheckCircle size={28} />
          Completed Tasks History
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Historical Task
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Member</label>
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="w-full md:w-64 px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">All Members</option>
          {familyMembers.map(member => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-green-50 p-6 rounded-xl mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {editingTask ? 'Edit Task' : 'Add Historical Task'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Family Member</label>
              <select
                value={formData.family_member_id}
                onChange={(e) => setFormData({...formData, family_member_id: e.target.value})}
                required
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select member...</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
              <input
                type="text"
                value={formData.task_title}
                onChange={(e) => setFormData({...formData, task_title: e.target.value})}
                required
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-green-500"
                placeholder="What was completed?"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Points</label>
              <input
                type="number"
                value={formData.points_earned}
                onChange={(e) => setFormData({...formData, points_earned: e.target.value})}
                required
                min="1"
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Completed Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.completed_at}
                onChange={(e) => setFormData({...formData, completed_at: e.target.value})}
                required
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-green-500"
              >
                <option value="chore">Chore</option>
                <option value="homework">Homework</option>
                <option value="behavior">Behavior</option>
                <option value="extra">Extra</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {editingTask ? 'Update' : 'Add'} Task
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setEditingTask(null)
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Task History List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : taskHistory.length === 0 ? (
          <p className="text-center text-gray-400 py-8 italic">No completed tasks found</p>
        ) : (
          taskHistory.map(task => (
            <div key={task.id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <CheckCircle size={20} className="text-green-600" />
                  <h4 className="font-bold text-gray-800">{task.task_title}</h4>
                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                    {getMemberName(task.family_member_id)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                  <span className="font-semibold text-green-600">+{task.points_earned} pts</span>
                  <span>{new Date(task.completed_at).toLocaleString()}</span>
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">{task.category}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteClick(task)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                  title="Delete task"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && taskToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-red-600 mb-4">⚠️ Delete Completed Task?</h3>
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete this completed task?
            </p>
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <p className="font-semibold">{taskToDelete.task_title}</p>
              <p className="text-sm text-gray-600">
                {getMemberName(taskToDelete.family_member_id)} • {taskToDelete.points_earned} pts
              </p>
            </div>

            <form onSubmit={handleConfirmDelete}>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removePoints}
                    onChange={(e) => setRemovePoints(e.target.checked)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Remove {taskToDelete.points_earned} points from {getMemberName(taskToDelete.family_member_id)}
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-7 mt-1">
                  {removePoints
                    ? '⚠️ Points will be deducted from the member\'s total'
                    : 'Points will remain with the member'
                  }
                </p>
              </div>

              {localStorage.getItem('hasPassword') === 'true' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter Password to Confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border-2 border-red-300 focus:ring-2 focus:ring-red-500"
                    placeholder="Enter password"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setTaskToDelete(null)
                    setDeletePassword('')
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold"
                >
                  Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
