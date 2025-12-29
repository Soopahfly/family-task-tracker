import { useState, useEffect } from 'react'
import { Users, Trophy, ListTodo, Plus, Star, Check, X, Gift, TrendingUp, Clock, Lightbulb, Timer, BarChart3, Calendar, Flame, Eye, EyeOff, Zap, Settings, Database, Bell, Lock, LogOut, Layers } from 'lucide-react'

// Import new components
import AdminSettings from './components/AdminSettings'
import BackupManager from './components/BackupManager'
import DeadlineManager from './components/DeadlineManager'
import IntegrationsManager from './IntegrationsManager'
import PasswordLogin from './components/PasswordLogin'
import TaskPool from './components/TaskPool'
import EnhancedDashboard from './components/EnhancedDashboard'
import ReturnTaskDialog from './components/ReturnTaskDialog'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Header'
import Navigation from './components/Navigation'
import KidView from './components/KidView'
import TaskManagement from './components/TaskManagement'
import RewardsManagement from './components/RewardsManagement'
import ScreenTimeManager from './components/ScreenTimeManager'
import Statistics from './components/Statistics'
import KidsManagement from './components/KidsManagement'
import MeritManagement from './components/MeritManagement'
import WhatsNew from './components/WhatsNew'
import { getDefaultModuleStates } from './modules/moduleConfig'
import { formatDeadline, getDeadlineColor } from './utils/notificationManager'
import { loadPasswordStatus, verifyPassword, isSessionValid, logoutSession } from './utils/authManager'
import { runMigrations, needsMigration } from './utils/dataMigration'
import { familyMembersAPI, tasksAPI, rewardsAPI, rewardSuggestionsAPI, settingsAPI, integrationsAPI, moduleStatesAPI, meritTypesAPI, meritsAPI } from './utils/api'

function App() {
  const [familyMembers, setFamilyMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [rewards, setRewards] = useState([])
  const [rewardSuggestions, setRewardSuggestions] = useState([])
  const [settings, setSettings] = useState({ pointsPerMinute: 2 })
  const [integrations, setIntegrations] = useState([])
  const [meritTypes, setMeritTypes] = useState([])
  const [merits, setMerits] = useState([])
  const [activeView, setActiveView] = useState('dashboard')
  const [viewMode, setViewMode] = useState('parent') // 'parent' or 'kid'
  const [selectedKidView, setSelectedKidView] = useState(null)

  // Module state management - controls which features are enabled
  const [moduleStates, setModuleStates] = useState(getDefaultModuleStates())
  const [loading, setLoading] = useState(true)

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [passwordProtected, setPasswordProtected] = useState(false)

  // Load all data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load data with individual error handling - if one fails, others still work
        const [membersData, tasksData, rewardsData, suggestionsData, settingsData, integrationsData, moduleStatesData, passwordSet, meritTypesData, meritsData] = await Promise.allSettled([
          familyMembersAPI.getAll(),
          tasksAPI.getAll(),
          rewardsAPI.getAll(),
          rewardSuggestionsAPI.getAll(),
          settingsAPI.get(),
          integrationsAPI.getAll(),
          moduleStatesAPI.get(),
          loadPasswordStatus(),
          meritTypesAPI.getAll(),
          meritsAPI.getAll()
        ]);

        // Only set data if the API call succeeded
        if (membersData.status === 'fulfilled') setFamilyMembers(membersData.value);
        if (tasksData.status === 'fulfilled') setTasks(tasksData.value);
        if (rewardsData.status === 'fulfilled') setRewards(rewardsData.value);
        if (suggestionsData.status === 'fulfilled') setRewardSuggestions(suggestionsData.value);
        if (settingsData.status === 'fulfilled') {
          setSettings(Object.keys(settingsData.value).length > 0 ? settingsData.value : { pointsPerMinute: 2 });
        }
        if (integrationsData.status === 'fulfilled') setIntegrations(integrationsData.value);
        if (moduleStatesData.status === 'fulfilled') {
          setModuleStates(Object.keys(moduleStatesData.value).length > 0 ? moduleStatesData.value : getDefaultModuleStates());
        }
        if (passwordSet.status === 'fulfilled') setPasswordProtected(passwordSet.value);
        if (meritTypesData.status === 'fulfilled') setMeritTypes(meritTypesData.value);
        if (meritsData.status === 'fulfilled') setMerits(meritsData.value);

        // Set authentication state based on password status
        const passwordIsSet = passwordSet.status === 'fulfilled' ? passwordSet.value : false;
        if (!passwordIsSet) {
          setIsAuthenticated(true); // No password set, allow access
        } else {
          setIsAuthenticated(isSessionValid()); // Check if session is valid
        }

        // Log any errors but don't block the app
        const failedCalls = [membersData, tasksData, rewardsData, suggestionsData, settingsData, integrationsData, moduleStatesData, passwordSet, meritTypesData, meritsData]
          .filter(result => result.status === 'rejected');

        if (failedCalls.length > 0) {
          console.warn(`${failedCalls.length} API call(s) failed, but app is still functional:`, failedCalls);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // Don't show blocking alert - let the app continue
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [])

  // Handle view mode switch - require authentication for parent view
  const handleViewModeChange = () => {
    const newMode = viewMode === 'parent' ? 'kid' : 'parent'

    if (newMode === 'parent' && passwordProtected && !isSessionValid()) {
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header
          viewMode={viewMode}
          setViewMode={handleViewModeChange}
          onLogout={handleLogout}
          isPasswordProtected={passwordProtected}
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
              <ErrorBoundary sectionName="Dashboard">
                <EnhancedDashboard
                  familyMembers={familyMembers}
                  tasks={tasks}
                  setTasks={setTasks}
                  setFamilyMembers={setFamilyMembers}
                />
              </ErrorBoundary>
            )}
            {activeView === 'familyMembers' && (
              <ErrorBoundary sectionName="Family Members">
                <KidsManagement familyMembers={familyMembers} setFamilyMembers={setFamilyMembers} tasks={tasks} />
              </ErrorBoundary>
            )}
            {activeView === 'taskPool' && (
              <ErrorBoundary sectionName="Task Pool">
                <TaskPool
                  familyMembers={familyMembers}
                  tasks={tasks}
                  setTasks={setTasks}
                />
              </ErrorBoundary>
            )}
            {activeView === 'tasks' && (
              <ErrorBoundary sectionName="Tasks">
                <TaskManagement
                  familyMembers={familyMembers}
                  tasks={tasks}
                  setTasks={setTasks}
                />
              </ErrorBoundary>
            )}
            {activeView === 'rewards' && (
              <ErrorBoundary sectionName="Rewards">
                <RewardsManagement
                  rewards={rewards}
                  setRewards={setRewards}
                  familyMembers={familyMembers}
                  setFamilyMembers={setFamilyMembers}
                  rewardSuggestions={rewardSuggestions}
                  setRewardSuggestions={setRewardSuggestions}
                />
              </ErrorBoundary>
            )}
            {activeView === 'merits' && (
              <ErrorBoundary sectionName="Merits">
                <MeritManagement
                  familyMembers={familyMembers}
                  setFamilyMembers={setFamilyMembers}
                  meritTypes={meritTypes}
                  setMeritTypes={setMeritTypes}
                  merits={merits}
                  setMerits={setMerits}
                />
              </ErrorBoundary>
            )}
            {activeView === 'screentime' && (
              <ErrorBoundary sectionName="Screen Time">
                <ScreenTimeManager
                  familyMembers={familyMembers}
                  setFamilyMembers={setFamilyMembers}
                  settings={settings}
                  setSettings={setSettings}
                />
              </ErrorBoundary>
            )}
            {activeView === 'stats' && (
              <ErrorBoundary sectionName="Statistics">
                <Statistics familyMembers={familyMembers} tasks={tasks} />
              </ErrorBoundary>
            )}

            {activeView === 'integrations' && (
              <ErrorBoundary sectionName="Integrations">
                <IntegrationsManager
                  familyMembers={familyMembers}
                  tasks={tasks}
                  integrations={integrations}
                  setIntegrations={setIntegrations}
                />
              </ErrorBoundary>
            )}

            {activeView === 'backup' && (
              <ErrorBoundary sectionName="Backup & Restore">
                <BackupManager />
              </ErrorBoundary>
            )}

            {activeView === 'deadlines' && (
              <ErrorBoundary sectionName="Deadlines">
                <DeadlineManager
                  tasks={tasks}
                  familyMembers={familyMembers}
                />
              </ErrorBoundary>
            )}

            {activeView === 'admin' && (
              <ErrorBoundary sectionName="Admin Settings">
                <AdminSettings
                  moduleStates={moduleStates}
                  setModuleStates={setModuleStates}
                />
              </ErrorBoundary>
            )}

            {activeView === 'whatsnew' && (
              <ErrorBoundary sectionName="What's New">
                <WhatsNew />
              </ErrorBoundary>
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
            meritTypes={meritTypes}
            setFamilyMembers={setFamilyMembers}
            merits={merits}
            setMerits={setMerits}
          />
        )}
      </div>
    </div>
  )
}

function Dashboard({ familyMembers, tasks, setTasks, rewards, setFamilyMembers }) {
  const handleCompleteTask = async (taskId, kidId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    try {
      const updatedTask = { ...task, completed: true, completedAt: new Date().toISOString() }
      await tasksAPI.update(taskId, updatedTask)

      const updatedTasks = tasks.map(t =>
        t.id === taskId ? updatedTask : t
      )
      setTasks(updatedTasks)

      // Award points and update streak
      const updatedMembers = familyMembers.map(k => {
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
      })

      // Update the family member in the API
      const updatedKid = updatedMembers.find(k => k.id === kidId)
      if (updatedKid) {
        await familyMembersAPI.update(kidId, updatedKid)
      }

      setFamilyMembers(updatedMembers)
    } catch (error) {
      console.error('Failed to complete task:', error)
      alert('Failed to complete task. Please try again.')
    }
  }

  const handleUncompleteTask = async (taskId, kidId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    try {
      const updatedTask = { ...task, completed: false, completedAt: null }
      await tasksAPI.update(taskId, updatedTask)

      setTasks(tasks.map(t =>
        t.id === taskId ? updatedTask : t
      ))

      const updatedMembers = familyMembers.map(k =>
        k.id === kidId
          ? { ...k, points: Math.max(0, (k.points || 0) - task.points) }
          : k
      )

      // Update the family member in the API
      const updatedKid = updatedMembers.find(k => k.id === kidId)
      if (updatedKid) {
        await familyMembersAPI.update(kidId, updatedKid)
      }

      setFamilyMembers(updatedMembers)
    } catch (error) {
      console.error('Failed to uncomplete task:', error)
      alert('Failed to uncomplete task. Please try again.')
    }
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


export default App
