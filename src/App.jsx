import { useState, useEffect } from 'react'
import { Users, Trophy, ListTodo, Plus, Star, Check, X, Gift, TrendingUp, Clock, Lightbulb, Timer, BarChart3, Calendar, Flame, Eye, EyeOff, Zap, Settings, Database, Bell, Lock, LogOut } from 'lucide-react'

// Import new components
import AdminSettings from './components/AdminSettings'
import BackupManager from './components/BackupManager'
import DeadlineManager from './components/DeadlineManager'
import IntegrationsManager from './IntegrationsManager'
import PasswordLogin from './components/PasswordLogin'
import { getDefaultModuleStates } from './modules/moduleConfig'
import { formatDeadline, getDeadlineColor } from './utils/notificationManager'
import { isPasswordSet, verifyPassword, isSessionValid, logoutSession } from './utils/authManager'
import { runMigrations, needsMigration } from './utils/dataMigration'

function App() {
  const [familyMembers, setFamilyMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [rewards, setRewards] = useState([])
  const [rewardSuggestions, setRewardSuggestions] = useState([])
  const [settings, setSettings] = useState({ pointsPerMinute: 2 })
  const [integrations, setIntegrations] = useState([])
  const [activeView, setActiveView] = useState('dashboard')
  const [viewMode, setViewMode] = useState('parent') // 'parent' or 'kid'
  const [selectedKidView, setSelectedKidView] = useState(null)

  // Module state management - controls which features are enabled
  const [moduleStates, setModuleStates] = useState(() => {
    const saved = localStorage.getItem('moduleStates')
    return saved ? JSON.parse(saved) : getDefaultModuleStates()
  })

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if password is set and session is valid
    if (!isPasswordSet()) return true // No password set, allow access
    return isSessionValid()
  })
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)

  // Run data migration on first load
  useEffect(() => {
    if (needsMigration()) {
      console.log('Data migration needed...')
      const migrated = runMigrations()
      if (migrated) {
        console.log('✅ Data migrated successfully!')
        // Show user a notification
        setTimeout(() => {
          alert('✅ App updated! Your data has been migrated to the new version.')
        }, 500)
      }
    }
  }, [])

  // Load data from localStorage
  useEffect(() => {
    const savedFamilyMembers = localStorage.getItem('familyMembers')
    const savedTasks = localStorage.getItem('tasks')
    const savedRewards = localStorage.getItem('rewards')
    const savedSuggestions = localStorage.getItem('rewardSuggestions')
    const savedSettings = localStorage.getItem('settings')
    const savedIntegrations = localStorage.getItem('integrations')

    if (savedFamilyMembers) setFamilyMembers(JSON.parse(savedFamilyMembers))
    if (savedTasks) setTasks(JSON.parse(savedTasks))
    if (savedRewards) setRewards(JSON.parse(savedRewards))
    if (savedSuggestions) setRewardSuggestions(JSON.parse(savedSuggestions))
    if (savedSettings) setSettings(JSON.parse(savedSettings))
    if (savedIntegrations) setIntegrations(JSON.parse(savedIntegrations))
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('familyMembers', JSON.stringify(familyMembers))
  }, [familyMembers])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('rewards', JSON.stringify(rewards))
  }, [rewards])

  useEffect(() => {
    localStorage.setItem('rewardSuggestions', JSON.stringify(rewardSuggestions))
  }, [rewardSuggestions])

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem('integrations', JSON.stringify(integrations))
  }, [integrations])

  // Handle view mode switch - require authentication for parent view
  const handleViewModeChange = () => {
    const newMode = viewMode === 'parent' ? 'kid' : 'parent'

    if (newMode === 'parent' && isPasswordSet() && !isSessionValid()) {
      // Show password prompt
      setShowPasswordPrompt(true)
    } else {
      setViewMode(newMode)
    }
  }

  // Handle login
  const handleLogin = async (password) => {
    const result = await verifyPassword(password)
    if (result.success) {
      setIsAuthenticated(true)
      setShowPasswordPrompt(false)
      setViewMode('parent')
      return { success: true }
    }
    return result
  }

  // Handle logout
  const handleLogout = () => {
    logoutSession()
    setIsAuthenticated(false)
    setViewMode('kid')
  }

  // Check if password is currently set
  const passwordIsSet = isPasswordSet()

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header
          viewMode={viewMode}
          setViewMode={handleViewModeChange}
          onLogout={handleLogout}
          isPasswordProtected={passwordIsSet}
        />

        {/* Password Login Prompt */}
        {showPasswordPrompt && (
          <PasswordLogin
            onLogin={handleLogin}
            onCancel={() => setShowPasswordPrompt(false)}
          />
        )}

        {viewMode === 'parent' ? (
          <>
            <Navigation activeView={activeView} setActiveView={setActiveView} rewardSuggestions={rewardSuggestions} moduleStates={moduleStates} />

            {activeView === 'dashboard' && (
              <Dashboard
                familyMembers={familyMembers}
                tasks={tasks}
                setTasks={setTasks}
                rewards={rewards}
                setFamilyMembers={setFamilyMembers}
              />
            )}
            {activeView === 'familyMembers' && (
              <KidsManagement familyMembers={familyMembers} setFamilyMembers={setFamilyMembers} tasks={tasks} />
            )}
            {activeView === 'tasks' && (
              <TaskManagement
                familyMembers={familyMembers}
                tasks={tasks}
                setTasks={setTasks}
              />
            )}
            {activeView === 'rewards' && (
              <RewardsManagement
                rewards={rewards}
                setRewards={setRewards}
                familyMembers={familyMembers}
                setFamilyMembers={setFamilyMembers}
                rewardSuggestions={rewardSuggestions}
                setRewardSuggestions={setRewardSuggestions}
              />
            )}
            {activeView === 'screentime' && (
              <ScreenTimeManager
                familyMembers={familyMembers}
                setFamilyMembers={setFamilyMembers}
                settings={settings}
                setSettings={setSettings}
              />
            )}
            {activeView === 'stats' && (
              <Statistics familyMembers={familyMembers} tasks={tasks} />
            )}

            {activeView === 'integrations' && (
              <IntegrationsManager
                familyMembers={familyMembers}
                tasks={tasks}
                integrations={integrations}
                setIntegrations={setIntegrations}
              />
            )}

            {activeView === 'backup' && (
              <BackupManager />
            )}

            {activeView === 'deadlines' && (
              <DeadlineManager
                tasks={tasks}
                familyMembers={familyMembers}
              />
            )}

            {activeView === 'admin' && (
              <AdminSettings
                moduleStates={moduleStates}
                setModuleStates={setModuleStates}
              />
            )}
          </>
        ) : (
          <KidView
            familyMembers={familyMembers}
            tasks={tasks}
            setTasks={setTasks}
            rewards={rewards}
            rewardSuggestions={rewardSuggestions}
            setRewardSuggestions={setRewardSuggestions}
            selectedKid={selectedKidView}
            setSelectedKid={setSelectedKidView}
            settings={settings}
          />
        )}
      </div>
    </div>
  )
}

function Header({ viewMode, setViewMode, onLogout, isPasswordProtected }) {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="w-32 flex gap-2">
          {viewMode === 'parent' && isPasswordProtected && onLogout && (
            <button
              onClick={onLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
              title="Logout from Parent View"
            >
              <LogOut size={20} />
              Logout
            </button>
          )}
        </div>
        <h1 className="text-5xl font-bold text-white flex items-center gap-3">
          <Star className="text-yellow-300" size={48} />
          Family Task Tracker
          <Star className="text-yellow-300" size={48} />
        </h1>
        <button
          onClick={() => setViewMode(viewMode === 'parent' ? 'kid' : 'parent')}
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
        >
          {viewMode === 'parent' ? <Eye size={20} /> : <EyeOff size={20} />}
          {viewMode === 'parent' ? 'Kid View' : 'Parent View'}
        </button>
      </div>
      <p className="text-white/90 text-lg">
        {viewMode === 'parent' ? 'Manage tasks, track progress, award points!' : 'Complete tasks, earn rewards!'}
      </p>
    </div>
  )
}

function Navigation({ activeView, setActiveView, rewardSuggestions, moduleStates }) {
  const pendingSuggestions = rewardSuggestions.filter(s => s.status === 'pending').length

  // Helper function to check if a module is enabled
  const isEnabled = (moduleId) => {
    return moduleStates[moduleId]?.enabled !== false
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'familyMembers', label: 'Family', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'rewards', label: 'Rewards', icon: Trophy, badge: pendingSuggestions },
    // Conditional tabs based on module states
    ...(isEnabled('screenTime') ? [{ id: 'screentime', label: 'Screen Time', icon: Timer }] : []),
    ...(isEnabled('statistics') ? [{ id: 'stats', label: 'Statistics', icon: BarChart3 }] : []),
    ...(isEnabled('smartLights') ? [{ id: 'integrations', label: 'Smart Lights', icon: Zap }] : []),
    ...(isEnabled('backupRestore') ? [{ id: 'backup', label: 'Backup', icon: Database }] : []),
    ...(isEnabled('deadlineReminders') ? [{ id: 'deadlines', label: 'Deadlines', icon: Bell }] : []),
    // Admin is always visible
    { id: 'admin', label: 'Admin', icon: Settings },
  ]

  return (
    <div className="flex gap-2 mb-6 flex-wrap justify-center">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={`relative flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeView === item.id
              ? 'bg-white text-purple-600 shadow-lg scale-105'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          <item.icon size={20} />
          {item.label}
          {item.badge > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function KidView({ familyMembers, tasks, setTasks, rewards, rewardSuggestions, setRewardSuggestions, selectedKid, setSelectedKid, settings }) {
  const [showSuggestionForm, setShowSuggestionForm] = useState(false)
  const [suggestionTitle, setSuggestionTitle] = useState('')

  if (!selectedKid && familyMembers.length > 0) {
    return (
      <div className="bg-white rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Who are you?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {familyMembers.map(kid => (
            <button
              key={kid.id}
              onClick={() => setSelectedKid(kid)}
              className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 rounded-2xl hover:shadow-xl transition-all hover:scale-105"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white mx-auto mb-3"
                style={{ backgroundColor: kid.color }}
              >
                {kid.avatar || kid.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-2xl font-bold text-gray-800">{kid.name}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!selectedKid) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <Users size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No family members added yet. Ask a parent to add you!</p>
      </div>
    )
  }

  const myTasks = tasks.filter(t => t.kidId === selectedKid.id)
  const pendingTasks = myTasks.filter(t => !t.completed)
  const completedToday = myTasks.filter(t => {
    if (!t.completed || !t.completedAt) return false
    const today = new Date().toDateString()
    const completedDate = new Date(t.completedAt).toDateString()
    return today === completedDate
  })

  const affordableRewards = rewards.filter(r => selectedKid.points >= r.pointsCost)
  const screenTimeAvailable = Math.floor(selectedKid.points / settings.pointsPerMinute)

  const handleSuggestReward = (e) => {
    e.preventDefault()
    const newSuggestion = {
      id: Date.now().toString(),
      kidId: selectedKid.id,
      kidName: selectedKid.name,
      title: suggestionTitle,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    setRewardSuggestions([...rewardSuggestions, newSuggestion])
    setSuggestionTitle('')
    setShowSuggestionForm(false)
    alert('Reward suggestion sent to parent!')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
              style={{ backgroundColor: selectedKid.color }}
            >
              {selectedKid.avatar || selectedKid.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Hi, {selectedKid.name}!</h2>
              <p className="text-gray-500">Keep up the great work!</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedKid(null)}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold"
          >
            Switch Kid
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Star size={24} />
              <span className="font-semibold">Your Points</span>
            </div>
            <p className="text-4xl font-bold">{selectedKid.points || 0}</p>
          </div>

          <div className="bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={24} />
              <span className="font-semibold">Screen Time</span>
            </div>
            <p className="text-4xl font-bold">{screenTimeAvailable} <span className="text-xl">min</span></p>
          </div>

          <div className="bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Check size={24} />
              <span className="font-semibold">Done Today</span>
            </div>
            <p className="text-4xl font-bold">{completedToday.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ListTodo size={24} />
            Your Tasks ({pendingTasks.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingTasks.length === 0 ? (
              <p className="text-gray-400 italic text-center py-8">All caught up! Great job!</p>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                  <h4 className="font-bold text-lg text-gray-800">{task.title}</h4>
                  {task.description && (
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                      +{task.points} points
                    </span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      {task.category}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Gift size={24} />
            Available Rewards
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {affordableRewards.length === 0 ? (
              <p className="text-gray-400 italic text-center py-8">
                Keep completing tasks to unlock rewards!
              </p>
            ) : (
              affordableRewards.map(reward => (
                <div key={reward.id} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{reward.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800">{reward.title}</h4>
                      {reward.description && (
                        <p className="text-gray-600 text-sm">{reward.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 bg-green-600 text-white text-center py-2 rounded-lg font-bold">
                    {reward.pointsCost} points - Ask parent to redeem!
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            {!showSuggestionForm ? (
              <button
                onClick={() => setShowSuggestionForm(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Lightbulb size={20} />
                Suggest a Reward
              </button>
            ) : (
              <form onSubmit={handleSuggestReward} className="space-y-3">
                <input
                  type="text"
                  required
                  value={suggestionTitle}
                  onChange={(e) => setSuggestionTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="What reward would you like?"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSuggestionForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ familyMembers, tasks, setTasks, rewards, setFamilyMembers }) {
  const handleCompleteTask = (taskId, kidId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const updatedTasks = tasks.map(t =>
      t.id === taskId
        ? { ...t, completed: true, completedAt: new Date().toISOString() }
        : t
    )
    setTasks(updatedTasks)

    // Award points and update streak
    setFamilyMembers(familyMembers.map(k => {
      if (k.id === kidId) {
        const newPoints = (k.points || 0) + task.points
        // Check for streak
        const todaysTasks = updatedTasks.filter(t =>
          t.kidId === kidId &&
          t.completed &&
          t.completedAt &&
          new Date(t.completedAt).toDateString() === new Date().toDateString()
        )

        return { ...k, points: newPoints, tasksCompletedToday: todaysTasks.length }
      }
      return k
    }))
  }

  const handleUncompleteTask = (taskId, kidId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    setTasks(tasks.map(t =>
      t.id === taskId
        ? { ...t, completed: false, completedAt: null }
        : t
    ))

    setFamilyMembers(familyMembers.map(k =>
      k.id === kidId
        ? { ...k, points: Math.max(0, (k.points || 0) - task.points) }
        : k
    ))
  }

  if (familyMembers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <Users size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No family members added yet</h2>
        <p className="text-gray-500 mb-4">Get started by adding your first kid profile!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {familyMembers.map(kid => (
          <KidCard
            key={kid.id}
            kid={kid}
            tasks={tasks.filter(t => t.kidId === kid.id)}
            onCompleteTask={handleCompleteTask}
            onUncompleteTask={handleUncompleteTask}
          />
        ))}
      </div>
    </div>
  )
}

function KidCard({ kid, tasks, onCompleteTask, onUncompleteTask }) {
  const pendingTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  // Calculate streak
  const completedToday = tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false
    const today = new Date().toDateString()
    const completedDate = new Date(t.completedAt).toDateString()
    return today === completedDate
  }).length

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: kid.color }}
          >
            {kid.avatar || kid.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{kid.name}</h3>
            <p className="text-sm text-gray-500">Age {kid.age}</p>
          </div>
        </div>
        {completedToday >= 3 && (
          <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
            <Flame className="text-orange-500" size={16} />
            <span className="text-orange-700 font-bold text-sm">{completedToday}</span>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between text-white">
          <span className="font-semibold">Total Points</span>
          <span className="text-3xl font-bold">{kid.points || 0}</span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <ListTodo size={16} />
          Pending Tasks ({pendingTasks.length})
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {pendingTasks.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No pending tasks</p>
          ) : (
            pendingTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{task.title}</p>
                  <p className="text-sm text-gray-500">+{task.points} points</p>
                </div>
                <button
                  onClick={() => onCompleteTask(task.id, kid.id)}
                  className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                  title="Mark as complete"
                >
                  <Check size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {completedTasks.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Check size={16} className="text-green-600" />
            Completed ({completedTasks.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {completedTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between bg-green-50 p-2 rounded-lg opacity-75"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800 line-through text-sm">{task.title}</p>
                </div>
                <button
                  onClick={() => onUncompleteTask(task.id, kid.id)}
                  className="text-red-500 p-1 hover:bg-red-50 rounded"
                  title="Undo"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KidsManagement({ familyMembers, setFamilyMembers, tasks }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', age: '', color: '#FF6B6B', avatar: '', role: 'child' })

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']

  const handleSubmit = (e) => {
    e.preventDefault()
    const newKid = {
      id: Date.now().toString(),
      name: formData.name,
      age: parseInt(formData.age),
      color: formData.color,
      avatar: formData.avatar,
      role: formData.role,
      points: 0,
      createdAt: new Date().toISOString()
    }
    setFamilyMembers([...familyMembers, newKid])
    setFormData({ name: '', age: '', color: '#FF6B6B', avatar: '', role: 'child' })
    setShowForm(false)
  }

  const handleDelete = (kidId) => {
    if (confirm('Are you sure you want to remove this kid? All their tasks will also be removed.')) {
      setFamilyMembers(familyMembers.filter(k => k.id !== kidId))
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
              <input
                type="number"
                required
                min="1"
                max="18"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter age"
              />
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
          const kidTasks = tasks.filter(t => t.kidId === kid.id)
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

  const handleSubmit = (e) => {
    e.preventDefault()
    const newTask = {
      id: Date.now().toString(),
      ...formData,
      points: parseInt(formData.points),
      completed: false,
      createdAt: new Date().toISOString()
    }
    setTasks([...tasks, newTask])
    setFormData({ title: '', description: '', points: 10, kidId: '', category: 'chore', recurring: 'none' })
    setShowForm(false)
  }

  const handleDelete = (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(t => t.id !== taskId))
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
            const kid = familyMembers.find(k => k.id === task.kidId)
            return (
              <div
                key={task.id}
                className={`border-2 rounded-xl p-4 ${
                  task.completed ? 'bg-green-50 border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className={`font-bold text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                      {task.recurring !== 'none' && (
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Calendar size={12} />
                          {task.recurring}
                        </span>
                      )}
                      {task.completed && (
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
                      {kid && (
                        <span className="text-gray-500">
                          Assigned to: <span className="font-semibold">{kid.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
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

  const handleSubmit = (e) => {
    e.preventDefault()
    const newReward = {
      id: Date.now().toString(),
      ...formData,
      pointsCost: parseInt(formData.pointsCost),
      createdAt: new Date().toISOString()
    }
    setRewards([...rewards, newReward])
    setFormData({ title: '', description: '', pointsCost: 50, icon: '🎁', rewardType: 'prize' })
    setShowForm(false)
  }

  const handleDelete = (rewardId) => {
    if (confirm('Are you sure you want to delete this reward?')) {
      setRewards(rewards.filter(r => r.id !== rewardId))
    }
  }

  const handleRedeem = (reward, kid) => {
    if (kid.points < reward.pointsCost) {
      alert(`${kid.name} doesn't have enough points for this reward!`)
      return
    }

    if (confirm(`Redeem "${reward.title}" for ${kid.name}? This will deduct ${reward.pointsCost} points.`)) {
      setFamilyMembers(familyMembers.map(k =>
        k.id === kid.id
          ? { ...k, points: k.points - reward.pointsCost }
          : k
      ))
      alert(`Success! ${kid.name} redeemed "${reward.title}"!`)
    }
  }

  const handleApproveSuggestion = (suggestion) => {
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
    setRewards([...rewards, newReward])
    setRewardSuggestions(rewardSuggestions.map(s =>
      s.id === suggestion.id ? { ...s, status: 'approved' } : s
    ))
    alert(`Reward approved and added!`)
  }

  const handleDenySuggestion = (suggestionId) => {
    if (confirm('Deny this reward suggestion?')) {
      setRewardSuggestions(rewardSuggestions.map(s =>
        s.id === suggestionId ? { ...s, status: 'denied' } : s
      ))
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
              {familyMembers.map(kid => (
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

function ScreenTimeManager({ familyMembers, setFamilyMembers, settings, setSettings }) {
  const [selectedKid, setSelectedKid] = useState(null)
  const [minutesToRedeem, setMinutesToRedeem] = useState(30)

  const handleRedeemScreenTime = (kid) => {
    const pointsCost = minutesToRedeem * settings.pointsPerMinute

    if (kid.points < pointsCost) {
      alert(`${kid.name} needs ${pointsCost} points for ${minutesToRedeem} minutes (currently has ${kid.points} points)`)
      return
    }

    if (confirm(`Redeem ${minutesToRedeem} minutes of screen time for ${kid.name}? This will cost ${pointsCost} points.`)) {
      setFamilyMembers(familyMembers.map(k =>
        k.id === kid.id
          ? { ...k, points: k.points - pointsCost, screenTimeUsed: (k.screenTimeUsed || 0) + minutesToRedeem }
          : k
      ))
      alert(`Success! ${kid.name} earned ${minutesToRedeem} minutes of screen time!`)
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
            onChange={(e) => setSettings({ ...settings, pointsPerMinute: parseInt(e.target.value) })}
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

function Statistics({ familyMembers, tasks }) {
  const getKidStats = (kid) => {
    const kidTasks = tasks.filter(t => t.kidId === kid.id)
    const completed = kidTasks.filter(t => t.completed)
    const pending = kidTasks.filter(t => !t.completed)

    const completedThisWeek = completed.filter(t => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(t.completedAt) >= weekAgo
    })

    const pointsEarned = completed.reduce((sum, t) => sum + t.points, 0)

    return {
      total: kidTasks.length,
      completed: completed.length,
      pending: pending.length,
      completedThisWeek: completedThisWeek.length,
      pointsEarned,
      completionRate: kidTasks.length > 0 ? Math.round((completed.length / kidTasks.length) * 100) : 0
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BarChart3 size={28} />
        Statistics & Progress
      </h2>

      {familyMembers.length === 0 ? (
        <p className="text-gray-400 italic text-center py-8">No family members added yet</p>
      ) : (
        <div className="space-y-6">
          {familyMembers.map(kid => {
            const stats = getKidStats(kid)

            return (
              <div key={kid.id} className="border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: kid.color }}
                  >
                    {kid.avatar || kid.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{kid.name}</h3>
                    <p className="text-gray-600">Current Points: {kid.points || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-purple-600">{stats.completionRate}%</p>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg">
                    <p className="text-lg font-semibold text-gray-700">This Week</p>
                    <p className="text-2xl font-bold text-cyan-600">{stats.completedThisWeek} tasks completed</p>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                    <p className="text-lg font-semibold text-gray-700">Total Points Earned</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pointsEarned} points</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default App
