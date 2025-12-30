import { useState } from 'react'
import { Users, Plus, X } from 'lucide-react'
import { familyMembersAPI } from '../utils/api'

export default function KidsManagement({ familyMembers, setFamilyMembers, tasks }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', age: '', date_of_birth: '', useDateOfBirth: false, color: '#FF6B6B', avatar: '', role: 'child' })

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const calculatedAge = formData.useDateOfBirth && formData.date_of_birth ? calculateAge(formData.date_of_birth) : parseInt(formData.age);

    const newKid = {
      id: Date.now().toString(),
      name: formData.name,
      age: calculatedAge,
      date_of_birth: formData.useDateOfBirth ? formData.date_of_birth : null,
      color: formData.color,
      avatar: formData.avatar,
      role: formData.role,
      points: 0,
      createdAt: new Date().toISOString()
    }

    try {
      await familyMembersAPI.create(newKid)
      setFamilyMembers([...familyMembers, newKid])
      setFormData({ name: '', age: '', date_of_birth: '', useDateOfBirth: false, color: '#FF6B6B', avatar: '', role: 'child' })
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create family member:', error)
      alert('Failed to add family member. Please try again.')
    }
  }

  const handleDelete = async (kidId) => {
    if (confirm('Are you sure you want to remove this kid? All their tasks will also be removed.')) {
      try {
        await familyMembersAPI.delete(kidId)
        setFamilyMembers(familyMembers.filter(k => k.id !== kidId))
      } catch (error) {
        console.error('Failed to delete family member:', error)
        alert('Failed to delete family member. Please try again.')
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Family</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-purple-50 p-6 rounded-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter name"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-semibold text-gray-700">Age</label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.useDateOfBirth}
                    onChange={(e) => setFormData({...formData, useDateOfBirth: e.target.checked})}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Use date of birth (auto-updates)</span>
                </label>
              </div>
              {formData.useDateOfBirth ? (
                <>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {formData.date_of_birth && (
                    <p className="text-xs text-gray-500 mt-1">
                      Age: {calculateAge(formData.date_of_birth)} years old
                    </p>
                  )}
                </>
              ) : (
                <>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.role === 'parent' || formData.role === 'other' ? "120" : "18"}
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={formData.role === 'parent' || formData.role === 'other' ? "Enter age" : "1-18"}
                  />
                  {formData.role === 'parent' || formData.role === 'other' ? (
                    <p className="text-xs text-gray-500 mt-1">Ages 1-120 allowed for {formData.role}s</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Ages 1-18 for children and teens</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Avatar (emoji or letter)</label>
            <input
              type="text"
              maxLength="2"
              value={formData.avatar}
              onChange={(e) => setFormData({...formData, avatar: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., 🚀 or A"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <div className="grid grid-cols-4 gap-2">
              {['child', 'parent', 'teen', 'other'].map(roleType => (
                <button
                  key={roleType}
                  type="button"
                  onClick={() => setFormData({...formData, role: roleType})}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.role === roleType
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {roleType === 'child' ? '👧' :
                     roleType === 'parent' ? '👨' :
                     roleType === 'teen' ? '🧑' : '👤'}
                  </div>
                  <div className="text-xs font-semibold capitalize">
                    {roleType}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({...formData, color})}
                  className={`w-12 h-12 rounded-full transition-transform ${
                    formData.color === color ? 'ring-4 ring-purple-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700"
            >
              Add Member
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {familyMembers.map(kid => {
          const kidTasks = tasks.filter(t => t.kidId === kid.id || t.assigned_to === kid.id)
          const completedCount = kidTasks.filter(t => t.completed).length

          return (
            <div key={kid.id} className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                    style={{ backgroundColor: kid.color }}
                  >
                    {kid.avatar || kid.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{kid.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        kid.role === 'child' ? 'bg-blue-100 text-blue-800' :
                        kid.role === 'parent' ? 'bg-purple-100 text-purple-800' :
                        kid.role === 'teen' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {kid.role === 'child' ? '👧 Child' :
                         kid.role === 'parent' ? '👨 Parent' :
                         kid.role === 'teen' ? '🧑 Teen' : '👤 Other'}
                      </span>
                      <p className="text-sm text-gray-500">Age {kid.age}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(kid.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3 text-center mb-2">
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-yellow-700">{kid.points || 0}</p>
              </div>
              <div className="text-sm text-gray-600 text-center">
                {completedCount} of {kidTasks.length} tasks completed
              </div>
            </div>
          )
        })}
      </div>

      {familyMembers.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">
          <Users size={64} className="mx-auto mb-4 opacity-50" />
          <p>No family members added yet. Click "Add Member" to get started!</p>
        </div>
      )}
    </div>
  )
}
