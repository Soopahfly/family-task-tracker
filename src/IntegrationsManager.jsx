import { useState } from 'react'
import { Zap, Wifi, Plus, X, Check, AlertCircle, Lightbulb as LightbulbIcon } from 'lucide-react'
import {
  calculateTrafficLightStatus,
  testHomeAssistantConnection,
  testWLEDConnection,
  syncAllLights
} from './integrations'

export default function IntegrationsManager({ kids, tasks, integrations, setIntegrations }) {
  const [showForm, setShowForm] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState(null)
  const [formData, setFormData] = useState({
    kidId: '',
    type: 'homeassistant',
    enabled: true,
    // Home Assistant fields
    haUrl: '',
    haToken: '',
    entityId: '',
    // WLED fields
    wledUrl: '',
    segment: 0
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newIntegration = {
      id: Date.now().toString(),
      ...formData,
      segment: parseInt(formData.segment)
    }

    setIntegrations([...integrations, newIntegration])
    setFormData({
      kidId: '',
      type: 'homeassistant',
      enabled: true,
      haUrl: '',
      haToken: '',
      entityId: '',
      wledUrl: '',
      segment: 0
    })
    setShowForm(false)
  }

  const handleTest = async (integration) => {
    setTesting(integration.id)
    try {
      let result
      if (integration.type === 'homeassistant') {
        result = await testHomeAssistantConnection(integration.haUrl, integration.haToken)
      } else {
        result = await testWLEDConnection(integration.wledUrl)
      }

      if (result) {
        alert('Connection successful!')
      } else {
        alert('Connection failed. Check your settings.')
      }
    } catch (error) {
      alert(`Error testing connection: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      const results = await syncAllLights(kids, tasks, integrations)
      setLastSyncResult(results)
      alert(`Synced ${results.filter(r => r.status === 'success').length} lights successfully!`)
    } catch (error) {
      alert(`Error syncing lights: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = (integrationId) => {
    if (confirm('Remove this light integration?')) {
      setIntegrations(integrations.filter(i => i.id !== integrationId))
    }
  }

  const toggleEnabled = (integrationId) => {
    setIntegrations(integrations.map(i =>
      i.id === integrationId ? { ...i, enabled: !i.enabled } : i
    ))
  }

  const getKidById = (kidId) => kids.find(k => k.id === kidId)

  const getStatusColor = (kidId) => {
    const kid = getKidById(kidId)
    if (!kid) return 'gray'
    return calculateTrafficLightStatus(kid, tasks)
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Smart Light Integrations</h2>
        <p className="text-gray-600">
          Connect lights to display task status for each kid using a traffic light system:
          <span className="ml-2 text-green-600 font-semibold">Green</span> = All done,
          <span className="ml-2 text-yellow-600 font-semibold">Yellow</span> = 1-2 tasks left,
          <span className="ml-2 text-red-600 font-semibold">Red</span> = 3+ tasks pending
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Light Integration
        </button>

        {integrations.length > 0 && (
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
          >
            <Zap size={20} />
            {syncing ? 'Syncing...' : 'Sync All Lights Now'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-purple-50 p-6 rounded-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to Kid</label>
              <select
                required
                value={formData.kidId}
                onChange={(e) => setFormData({...formData, kidId: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a kid</option>
                {kids.map(kid => (
                  <option key={kid.id} value={kid.id}>{kid.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Integration Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="homeassistant">Home Assistant</option>
                <option value="wled">WLED</option>
              </select>
            </div>
          </div>

          {formData.type === 'homeassistant' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Home Assistant URL
                </label>
                <input
                  type="text"
                  required
                  value={formData.haUrl}
                  onChange={(e) => setFormData({...formData, haUrl: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="http://192.168.1.100:8123"
                />
                <p className="text-xs text-gray-500 mt-1">Example: http://homeassistant.local:8123 or http://192.168.1.100:8123</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Long-Lived Access Token
                </label>
                <input
                  type="password"
                  required
                  value={formData.haToken}
                  onChange={(e) => setFormData({...formData, haToken: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your Home Assistant token"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Create in Home Assistant: Profile → Long-Lived Access Tokens → Create Token
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Light Entity ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.entityId}
                  onChange={(e) => setFormData({...formData, entityId: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="light.bedroom_light"
                />
                <p className="text-xs text-gray-500 mt-1">Example: light.kids_room or light.desk_lamp</p>
              </div>
            </>
          )}

          {formData.type === 'wled' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  WLED Device URL
                </label>
                <input
                  type="text"
                  required
                  value={formData.wledUrl}
                  onChange={(e) => setFormData({...formData, wledUrl: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="http://192.168.1.101"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: http://wled-kids.local or http://192.168.1.101
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Segment Number (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={formData.segment}
                  onChange={(e) => setFormData({...formData, segment: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use 0 for single strip. Use different segments if you have multiple LEDs on one controller.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700"
            >
              Add Integration
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
        {integrations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <LightbulbIcon size={64} className="mx-auto mb-4 opacity-50" />
            <p>No light integrations configured yet.</p>
            <p className="text-sm mt-2">Add Home Assistant or WLED lights to display task status!</p>
          </div>
        ) : (
          integrations.map(integration => {
            const kid = getKidById(integration.kidId)
            const status = getStatusColor(integration.kidId)
            const statusColors = {
              green: 'bg-green-500',
              yellow: 'bg-yellow-500',
              red: 'bg-red-500',
              gray: 'bg-gray-400'
            }

            return (
              <div
                key={integration.id}
                className={`border-2 rounded-xl p-4 ${integration.enabled ? 'border-gray-200' : 'border-gray-300 opacity-60'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full ${statusColors[status]}`} />
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {kid ? kid.name : 'Unknown Kid'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {integration.type === 'homeassistant' ? (
                            <>
                              <Wifi size={14} className="inline mr-1" />
                              Home Assistant: {integration.entityId}
                            </>
                          ) : (
                            <>
                              <Zap size={14} className="inline mr-1" />
                              WLED: {integration.wledUrl}
                              {integration.segment > 0 && ` (Segment ${integration.segment})`}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-white font-semibold ${statusColors[status]}`}>
                        {status.toUpperCase()}
                      </span>
                      <span className="text-gray-500">
                        {integration.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTest(integration)}
                      disabled={testing === integration.id}
                      className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm font-semibold disabled:bg-gray-400"
                    >
                      {testing === integration.id ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      onClick={() => toggleEnabled(integration.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                        integration.enabled
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {integration.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(integration.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
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

      {lastSyncResult && lastSyncResult.length > 0 && (
        <div className="mt-6 bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Check size={20} className="text-green-600" />
            Last Sync Results
          </h3>
          <div className="space-y-1">
            {lastSyncResult.map((result, idx) => (
              <div key={idx} className="text-sm">
                {result.status === 'success' ? (
                  <span className="text-green-600">
                    ✓ {result.kid}: {result.color}
                  </span>
                ) : (
                  <span className="text-red-600">
                    ✗ {result.kid}: {result.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <AlertCircle size={18} />
          Auto-Sync Information
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          Lights will automatically update when:
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>A task is marked as complete or incomplete</li>
          <li>New tasks are added</li>
          <li>Tasks are deleted</li>
        </ul>
        <p className="text-sm text-gray-600 mt-3">
          You can also manually sync all lights using the "Sync All Lights Now" button.
        </p>
      </div>
    </div>
  )
}
