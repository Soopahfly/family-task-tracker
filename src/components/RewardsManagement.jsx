import { useState } from 'react'
import { Gift, Plus, X, Lightbulb } from 'lucide-react'
import { rewardsAPI, rewardSuggestionsAPI, familyMembersAPI } from '../utils/api'

function RewardsManagement({ rewards, setRewards, familyMembers, setFamilyMembers, rewardSuggestions, setRewardSuggestions }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointsCost: 50,
    icon: '🎁',
    rewardType: 'prize'
  })

  const iconOptions = ['🎁', '🍕', '🎮', '📱', '🎬', '🍦', '🎨', '⚽', '🎸', '📚', '🎪', '🎯']

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newReward = {
      id: Date.now().toString(),
      ...formData,
      pointsCost: parseInt(formData.pointsCost),
      createdAt: new Date().toISOString()
    }

    try {
      await rewardsAPI.create(newReward)
      setRewards([...rewards, newReward])
      setFormData({ title: '', description: '', pointsCost: 50, icon: '🎁', rewardType: 'prize' })
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create reward:', error)
      alert('Failed to create reward. Please try again.')
    }
  }

  const handleDelete = async (rewardId) => {
    if (confirm('Are you sure you want to delete this reward?')) {
      try {
        await rewardsAPI.delete(rewardId)
        setRewards(rewards.filter(r => r.id !== rewardId))
      } catch (error) {
        console.error('Failed to delete reward:', error)
        alert('Failed to delete reward. Please try again.')
      }
    }
  }

  const handleRedeem = async (reward, kid) => {
    if (kid.points < reward.pointsCost) {
      alert(`${kid.name} doesn't have enough points for this reward!`)
      return
    }

    if (confirm(`Redeem "${reward.title}" for ${kid.name}? This will deduct ${reward.pointsCost} points.`)) {
      try {
        const updatedKid = { ...kid, points: kid.points - reward.pointsCost }
        await familyMembersAPI.update(kid.id, updatedKid)

        setFamilyMembers(familyMembers.map(k =>
          k.id === kid.id ? updatedKid : k
        ))
        alert(`Success! ${kid.name} redeemed "${reward.title}"!`)
      } catch (error) {
        console.error('Failed to redeem reward:', error)
        alert('Failed to redeem reward. Please try again.')
      }
    }
  }

  const handleApproveSuggestion = async (suggestion) => {
    const pointsCost = prompt(`How many points should "${suggestion.title}" cost?`, '50')
    if (!pointsCost) return

    const newReward = {
      id: Date.now().toString(),
      title: suggestion.title,
      description: `Suggested by ${suggestion.kidName}`,
      pointsCost: parseInt(pointsCost),
      icon: '💡',
      rewardType: 'prize',
      createdAt: new Date().toISOString()
    }

    try {
      await rewardsAPI.create(newReward)
      setRewards([...rewards, newReward])

      const updatedSuggestion = { ...suggestion, status: 'approved' }
      await rewardSuggestionsAPI.update(suggestion.id, updatedSuggestion)

      setRewardSuggestions(rewardSuggestions.map(s =>
        s.id === suggestion.id ? updatedSuggestion : s
      ))
      alert(`Reward approved and added!`)
    } catch (error) {
      console.error('Failed to approve suggestion:', error)
      alert('Failed to approve suggestion. Please try again.')
    }
  }

  const handleDenySuggestion = async (suggestionId) => {
    if (confirm('Deny this reward suggestion?')) {
      try {
        const suggestion = rewardSuggestions.find(s => s.id === suggestionId)
        const updatedSuggestion = { ...suggestion, status: 'denied' }
        await rewardSuggestionsAPI.update(suggestionId, updatedSuggestion)

        setRewardSuggestions(rewardSuggestions.map(s =>
          s.id === suggestionId ? updatedSuggestion : s
        ))
      } catch (error) {
        console.error('Failed to deny suggestion:', error)
        alert('Failed to deny suggestion. Please try again.')
      }
    }
  }

  const pendingSuggestions = rewardSuggestions.filter(s => s.status === 'pending')

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Rewards</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Reward
        </button>
      </div>

      {pendingSuggestions.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Lightbulb className="text-yellow-600" size={20} />
            Reward Suggestions from familyMembers ({pendingSuggestions.length})
          </h3>
          <div className="space-y-2">
            {pendingSuggestions.map(suggestion => (
              <div key={suggestion.id} className="bg-white p-3 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{suggestion.title}</p>
                  <p className="text-sm text-gray-500">Suggested by {suggestion.kidName}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveSuggestion(suggestion)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDenySuggestion(suggestion.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-purple-50 p-6 rounded-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reward Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Extra screen time"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Points Cost</label>
              <input
                type="number"
                required
                min="1"
                value={formData.pointsCost}
                onChange={(e) => setFormData({...formData, pointsCost: e.target.value})}
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
              placeholder="Add details about the reward"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({...formData, icon})}
                  className={`text-3xl p-2 rounded-lg transition-all ${
                    formData.icon === icon
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
              Add Reward
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {rewards.map(reward => (
          <div key={reward.id} className="border-2 border-purple-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="flex items-start justify-between mb-3">
              <div className="text-5xl mb-2">{reward.icon}</div>
              <button
                onClick={() => handleDelete(reward.id)}
                className="text-red-500 hover:bg-red-50 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-1">{reward.title}</h3>
            {reward.description && (
              <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
            )}
            <div className="bg-purple-600 text-white rounded-lg p-2 text-center font-bold">
              {reward.pointsCost} points
            </div>
          </div>
        ))}
      </div>

      {rewards.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Gift size={64} className="mx-auto mb-4 opacity-50" />
          <p>No rewards created yet. Click "Add Reward" to get started!</p>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Redeem Rewards</h3>
          {familyMembers.length === 0 ? (
            <p className="text-gray-500 italic">Add familyMembers first to redeem rewards</p>
          ) : (
            <div className="space-y-4">
              {familyMembers.filter(member => member.role !== 'parent').map(kid => (
                <div key={kid.id} className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                      style={{ backgroundColor: kid.color }}
                    >
                      {kid.avatar || kid.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{kid.name}</h4>
                      <p className="text-sm text-gray-500">Available: {kid.points || 0} points</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {rewards.map(reward => {
                      const canAfford = (kid.points || 0) >= reward.pointsCost
                      return (
                        <button
                          key={reward.id}
                          onClick={() => handleRedeem(reward, kid)}
                          disabled={!canAfford}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            canAfford
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {reward.icon} {reward.title} ({reward.pointsCost})
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RewardsManagement
