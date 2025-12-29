import { useState } from 'react'
import { Award, Plus, X, Star, Trophy } from 'lucide-react'
import { meritTypesAPI, meritsAPI, familyMembersAPI } from '../utils/api'

function MeritManagement({ familyMembers, setFamilyMembers, meritTypes, setMeritTypes, merits, setMerits }) {
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [showAwardForm, setShowAwardForm] = useState(false)
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    points: 5,
    icon: '⭐'
  })
  const [awardFormData, setAwardFormData] = useState({
    kidId: '',
    meritTypeId: '',
    note: ''
  })

  const iconOptions = ['⭐', '🌟', '🏆', '🎖️', '🏅', '👍', '💯', '✨', '🎯', '💪', '🔥', '👏']

  const handleCreateType = async (e) => {
    e.preventDefault()
    const newType = {
      id: Date.now().toString(),
      name: typeFormData.name,
      points: parseInt(typeFormData.points),
      icon: typeFormData.icon,
      createdAt: new Date().toISOString()
    }

    try {
      await meritTypesAPI.create(newType)
      setMeritTypes([...meritTypes, newType])
      setTypeFormData({ name: '', points: 5, icon: '⭐' })
      setShowTypeForm(false)
      alert('Merit type created successfully!')
    } catch (error) {
      console.error('Failed to create merit type:', error)
      alert('Failed to create merit type. Please try again.')
    }
  }

  const handleDeleteType = async (typeId) => {
    const meritsUsingType = merits.filter(m => m.meritTypeId === typeId)
    if (meritsUsingType.length > 0) {
      if (!confirm(`This merit type has ${meritsUsingType.length} awarded merit(s). Deleting it will also delete the history. Continue?`)) {
        return
      }
      // Delete all merits using this type
      try {
        for (const merit of meritsUsingType) {
          await meritsAPI.delete(merit.id)
        }
        setMerits(merits.filter(m => m.meritTypeId !== typeId))
      } catch (error) {
        console.error('Failed to delete merits:', error)
        alert('Failed to delete associated merits. Please try again.')
        return
      }
    }

    if (confirm('Are you sure you want to delete this merit type?')) {
      try {
        await meritTypesAPI.delete(typeId)
        setMeritTypes(meritTypes.filter(t => t.id !== typeId))
      } catch (error) {
        console.error('Failed to delete merit type:', error)
        alert('Failed to delete merit type. Please try again.')
      }
    }
  }

  const handleAwardMerit = async (e) => {
    e.preventDefault()
    const meritType = meritTypes.find(t => t.id === awardFormData.meritTypeId)
    const kid = familyMembers.find(k => k.id === awardFormData.kidId)

    if (!meritType || !kid) {
      alert('Please select a valid kid and merit type.')
      return
    }

    const newMerit = {
      id: Date.now().toString(),
      kidId: awardFormData.kidId,
      kidName: kid.name,
      meritTypeId: awardFormData.meritTypeId,
      meritTypeName: meritType.name,
      meritTypeIcon: meritType.icon,
      points: meritType.points,
      note: awardFormData.note,
      awardedAt: new Date().toISOString(),
      logged_at_school: 0
    }

    try {
      await meritsAPI.create(newMerit)
      setMerits([...merits, newMerit])

      // Award points to kid
      const updatedKid = { ...kid, points: (kid.points || 0) + meritType.points }
      await familyMembersAPI.update(kid.id, updatedKid)
      setFamilyMembers(familyMembers.map(k => k.id === kid.id ? updatedKid : k))

      setAwardFormData({ kidId: '', meritTypeId: '', note: '' })
      setShowAwardForm(false)
      alert(`Merit awarded! ${kid.name} earned ${meritType.points} points for ${meritType.name}!`)
    } catch (error) {
      console.error('Failed to award merit:', error)
      alert('Failed to award merit. Please try again.')
    }
  }

  const handleDeleteMerit = async (meritId) => {
    const merit = merits.find(m => m.id === meritId)
    if (!merit) return

    if (confirm('Delete this merit? Points will be deducted from the kid.')) {
      try {
        await meritsAPI.delete(meritId)
        setMerits(merits.filter(m => m.id !== meritId))

        // Deduct points from kid
        const kid = familyMembers.find(k => k.id === merit.kidId)
        if (kid) {
          const updatedKid = { ...kid, points: Math.max(0, (kid.points || 0) - merit.points) }
          await familyMembersAPI.update(kid.id, updatedKid)
          setFamilyMembers(familyMembers.map(k => k.id === kid.id ? updatedKid : k))
        }
      } catch (error) {
        console.error('Failed to delete merit:', error)
        alert('Failed to delete merit. Please try again.')
      }
    }
  }

  const sortedMerits = [...merits].sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt))

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={28} />
          Merit Management
        </h2>
      </div>

      {/* Merit Types Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Star size={20} />
            Merit Types
          </h3>
          <button
            onClick={() => setShowTypeForm(!showTypeForm)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Merit Type
          </button>
        </div>

        {showTypeForm && (
          <form onSubmit={handleCreateType} className="bg-purple-50 p-6 rounded-xl mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Merit Name</label>
                <input
                  type="text"
                  required
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData({...typeFormData, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Good Behavior, Homework Star"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Points Value</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={typeFormData.points}
                  onChange={(e) => setTypeFormData({...typeFormData, points: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setTypeFormData({...typeFormData, icon})}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      typeFormData.icon === icon
                        ? 'bg-purple-200 ring-2 ring-purple-500 scale-110'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700"
              >
                Create Merit Type
              </button>
              <button
                type="button"
                onClick={() => setShowTypeForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meritTypes.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-400">
              <Award size={48} className="mx-auto mb-3 opacity-50" />
              <p>No merit types created yet. Click "Add Merit Type" to get started!</p>
            </div>
          ) : (
            meritTypes.map(type => (
              <div key={type.id} className="border-2 border-yellow-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-orange-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-4xl">{type.icon}</div>
                  <button
                    onClick={() => handleDeleteType(type.id)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded-lg"
                    title="Delete merit type"
                  >
                    <X size={20} />
                  </button>
                </div>
                <h4 className="font-bold text-lg text-gray-800 mb-1">{type.name}</h4>
                <div className="bg-yellow-500 text-white rounded-lg p-2 text-center font-bold">
                  +{type.points} points
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Award Merit Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Award size={20} />
            Award Merits
          </h3>
          <button
            onClick={() => setShowAwardForm(!showAwardForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Award Merit
          </button>
        </div>

        {showAwardForm && (
          <form onSubmit={handleAwardMerit} className="bg-green-50 p-6 rounded-xl mb-4">
            {meritTypes.length === 0 ? (
              <p className="text-gray-600 italic">Please create merit types first before awarding merits.</p>
            ) : familyMembers.length === 0 ? (
              <p className="text-gray-600 italic">Please add family members first before awarding merits.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Kid</label>
                    <select
                      required
                      value={awardFormData.kidId}
                      onChange={(e) => setAwardFormData({...awardFormData, kidId: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Choose a kid...</option>
                      {familyMembers.map(kid => (
                        <option key={kid.id} value={kid.id}>{kid.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Merit Type</label>
                    <select
                      required
                      value={awardFormData.meritTypeId}
                      onChange={(e) => setAwardFormData({...awardFormData, meritTypeId: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Choose merit type...</option>
                      {meritTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.icon} {type.name} (+{type.points} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Note (optional)</label>
                  <textarea
                    value={awardFormData.note}
                    onChange={(e) => setAwardFormData({...awardFormData, note: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="2"
                    placeholder="Add details about why this merit was earned..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Award Merit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAwardForm(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>

      {/* Merit History Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy size={20} />
          Merit History ({merits.length})
        </h3>

        {merits.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Trophy size={64} className="mx-auto mb-4 opacity-50" />
            <p>No merits awarded yet. Start recognizing great behavior!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedMerits.map(merit => (
              <div key={merit.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border-2 border-yellow-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-3xl">{merit.meritTypeIcon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800">{merit.kidName}</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-semibold text-gray-700">{merit.meritTypeName}</span>
                        {merit.logged_at_school === 1 && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                            School
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                          +{merit.points} points
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(merit.awardedAt).toLocaleDateString()} at {new Date(merit.awardedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {merit.note && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{merit.note}"</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMerit(merit.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg ml-2"
                    title="Delete merit"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MeritManagement
