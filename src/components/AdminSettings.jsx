import { useState } from 'react'
import { Settings, Zap, Timer, Lightbulb, BarChart3, Flame, Calendar, Eye, Gift, Wifi, ListTodo, Star, Layout, Save, RotateCcw, Check, X, AlertCircle } from 'lucide-react'
import { availableModules, moduleCategories, getModulesByCategory, canDisableModule, getDefaultModuleStates } from '../modules/moduleConfig'
import { moduleStatesAPI } from '../utils/api'
import PasswordSettings from './PasswordSettings'

const iconMap = {
  Zap, Timer, Lightbulb, BarChart3, Flame, Calendar, Eye, Gift, Wifi, ListTodo, Star, Layout, Settings
}

export default function AdminSettings({ moduleStates, setModuleStates }) {
  const [hasChanges, setHasChanges] = useState(false)
  const [expandedModule, setExpandedModule] = useState(null)

  const handleToggleModule = (moduleId) => {
    if (!moduleStates[moduleId].enabled) {
      // Enabling - always allow
      setModuleStates({
        ...moduleStates,
        [moduleId]: { ...moduleStates[moduleId], enabled: true }
      })
      setHasChanges(true)
    } else {
      // Disabling - check dependencies
      if (!canDisableModule(moduleId, moduleStates)) {
        alert('Cannot disable this module because other enabled modules depend on it.')
        return
      }
      setModuleStates({
        ...moduleStates,
        [moduleId]: { ...moduleStates[moduleId], enabled: false }
      })
      setHasChanges(true)
    }
  }

  const handleUpdateModuleSetting = (moduleId, settingKey, value) => {
    setModuleStates({
      ...moduleStates,
      [moduleId]: {
        ...moduleStates[moduleId],
        settings: {
          ...moduleStates[moduleId].settings,
          [settingKey]: value
        }
      }
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await moduleStatesAPI.update(moduleStates)
      setHasChanges(false)
      alert('Settings saved! Refresh the page to apply changes.')
    } catch (error) {
      console.error('Failed to save module states:', error)
      alert('Failed to save settings. Please try again.')
    }
  }

  const handleReset = async () => {
    if (confirm('Reset all modules to default settings? This will reload the page.')) {
      try {
        const defaultStates = getDefaultModuleStates()
        await moduleStatesAPI.update(defaultStates)
        window.location.reload()
      } catch (error) {
        console.error('Failed to reset module states:', error)
        alert('Failed to reset settings. Please try again.')
      }
    }
  }

  const categories = Object.keys(moduleCategories)

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings size={28} />
            Admin Settings
          </h2>
          <p className="text-gray-600 mt-1">
            Enable or disable features and customize their settings
          </p>
        </div>

        <div className="flex gap-2">
          {hasChanges && (
            <>
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
              >
                <Save size={20} />
                Save Changes
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 flex items-center gap-2"
              >
                <RotateCcw size={20} />
                Reset All
              </button>
            </>
          )}
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="text-yellow-600" size={20} />
          <p className="text-yellow-800 font-semibold">
            You have unsaved changes. Click "Save Changes" to apply them.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {categories.map(categoryId => {
          const category = moduleCategories[categoryId]
          const modules = getModulesByCategory(categoryId, moduleStates)

          if (modules.length === 0) return null

          const CategoryIcon = iconMap[category.icon] || Settings

          return (
            <div key={categoryId} className="border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <CategoryIcon size={24} className="text-purple-600" />
                {category.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{category.description}</p>

              <div className="space-y-3">
                {modules.map(module => {
                  const ModuleIcon = iconMap[module.icon] || Settings
                  const isExpanded = expandedModule === module.id
                  const hasSettings = Object.keys(module.settings).length > 0

                  return (
                    <div
                      key={module.id}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        moduleStates[module.id].enabled
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <ModuleIcon
                            size={24}
                            className={moduleStates[module.id].enabled ? 'text-purple-600' : 'text-gray-400'}
                          />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{module.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{module.description}</p>

                            {module.dependencies.length > 0 && (
                              <p className="text-xs text-gray-500 mt-2">
                                Depends on: {module.dependencies.join(', ')}
                              </p>
                            )}

                            {isExpanded && hasSettings && (
                              <div className="mt-4 space-y-3 bg-white p-4 rounded-lg border border-gray-200">
                                <h5 className="font-semibold text-gray-700 text-sm">Module Settings</h5>
                                {Object.entries(module.settings).map(([key, value]) => (
                                  <div key={key} className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </label>
                                    {typeof value === 'boolean' ? (
                                      <button
                                        onClick={() => handleUpdateModuleSetting(module.id, key, !value)}
                                        disabled={!moduleStates[module.id].enabled}
                                        className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                                          value
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-300 text-gray-700'
                                        } disabled:opacity-50`}
                                      >
                                        {value ? 'Enabled' : 'Disabled'}
                                      </button>
                                    ) : typeof value === 'number' ? (
                                      <input
                                        type="number"
                                        value={moduleStates[module.id].settings[key] || value}
                                        onChange={(e) => handleUpdateModuleSetting(module.id, key, parseInt(e.target.value))}
                                        disabled={!moduleStates[module.id].enabled}
                                        className="px-3 py-1 rounded-lg border border-gray-300 w-24 disabled:opacity-50"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={moduleStates[module.id].settings[key] || value}
                                        onChange={(e) => handleUpdateModuleSetting(module.id, key, e.target.value)}
                                        disabled={!moduleStates[module.id].enabled}
                                        className="px-3 py-1 rounded-lg border border-gray-300 w-48 disabled:opacity-50"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasSettings && (
                            <button
                              onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                              className="text-gray-500 hover:text-purple-600 p-2"
                              title="Settings"
                            >
                              <Settings size={18} />
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleModule(module.id)}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                              moduleStates[module.id].enabled
                                ? 'bg-purple-600'
                                : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                moduleStates[module.id].enabled
                                  ? 'translate-x-7'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Password Protection Settings */}
      <PasswordSettings />

      <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <AlertCircle size={18} />
          Module System Information
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Modules can be enabled or disabled independently</li>
          <li>• Some modules may depend on others (check dependencies before disabling)</li>
          <li>• Changes are saved to browser localStorage</li>
          <li>• Refresh the page after saving to see changes take effect</li>
          <li>• Module settings can be customized when the module is enabled</li>
        </ul>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Enabled modules: {Object.values(moduleStates).filter(m => m.enabled).length} / {Object.keys(moduleStates).length}
        </p>
      </div>
    </div>
  )
}
