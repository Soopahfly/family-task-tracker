import { useState } from 'react'
import { Timer } from 'lucide-react'
import { settingsAPI, familyMembersAPI } from '../utils/api'

function ScreenTimeManager({ familyMembers, setFamilyMembers, settings, setSettings }) {
  const [selectedKid, setSelectedKid] = useState(null)
  const [minutesToRedeem, setMinutesToRedeem] = useState(30)

  const handleSettingsChange = async (newSettings) => {
    try {
      await settingsAPI.update(newSettings)
      setSettings(newSettings)
    } catch (error) {
      console.error('Failed to update settings:', error)
      alert('Failed to update settings. Please try again.')
    }
  }

  const handleRedeemScreenTime = async (kid) => {
    const pointsCost = minutesToRedeem * settings.pointsPerMinute

    if (kid.points < pointsCost) {
      alert(`${kid.name} needs ${pointsCost} points for ${minutesToRedeem} minutes (currently has ${kid.points} points)`)
      return
    }

    if (confirm(`Redeem ${minutesToRedeem} minutes of screen time for ${kid.name}? This will cost ${pointsCost} points.`)) {
      try {
        const updatedKid = {
          ...kid,
          points: kid.points - pointsCost,
          screenTimeUsed: (kid.screenTimeUsed || 0) + minutesToRedeem
        }
        await familyMembersAPI.update(kid.id, updatedKid)

        setFamilyMembers(familyMembers.map(k =>
          k.id === kid.id ? updatedKid : k
        ))
        alert(`Success! ${kid.name} earned ${minutesToRedeem} minutes of screen time!`)
      } catch (error) {
        console.error('Failed to redeem screen time:', error)
        alert('Failed to redeem screen time. Please try again.')
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Screen Time Management</h2>

      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Timer size={20} />
          Settings
        </h3>
        <div className="flex items-center gap-4">
          <label className="font-semibold text-gray-700">Points per minute:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={settings.pointsPerMinute}
            onChange={(e) => handleSettingsChange({ ...settings, pointsPerMinute: parseInt(e.target.value) })}
            className="px-4 py-2 rounded-lg border border-gray-300 w-24"
          />
          <span className="text-gray-600 text-sm">
            (e.g., {settings.pointsPerMinute} points = 1 minute, {settings.pointsPerMinute * 30} points = 30 minutes)
          </span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block font-semibold text-gray-700 mb-2">Minutes to redeem:</label>
        <div className="flex gap-2">
          {[15, 30, 60, 120].map(min => (
            <button
              key={min}
              onClick={() => setMinutesToRedeem(min)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                minutesToRedeem === min
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {min} min
            </button>
          ))}
          <input
            type="number"
            min="1"
            value={minutesToRedeem}
            onChange={(e) => setMinutesToRedeem(parseInt(e.target.value))}
            className="px-4 py-2 rounded-lg border-2 border-gray-300 w-24"
          />
        </div>
      </div>

      <div className="space-y-4">
        {familyMembers.length === 0 ? (
          <p className="text-gray-400 italic text-center py-8">No family members added yet</p>
        ) : (
          familyMembers.map(kid => {
            const pointsCost = minutesToRedeem * settings.pointsPerMinute
            const canAfford = kid.points >= pointsCost
            const availableMinutes = Math.floor(kid.points / settings.pointsPerMinute)

            return (
              <div key={kid.id} className="border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: kid.color }}
                    >
                      {kid.avatar || kid.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{kid.name}</h3>
                      <p className="text-gray-600">{kid.points || 0} points available</p>
                      <p className="text-sm text-gray-500">= {availableMinutes} minutes of screen time</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRedeemScreenTime(kid)}
                    disabled={!canAfford}
                    className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                      canAfford
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Redeem {minutesToRedeem} min
                    <br />
                    <span className="text-sm">({pointsCost} points)</span>
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

export default ScreenTimeManager
