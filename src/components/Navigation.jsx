import { Users, Trophy, ListTodo, TrendingUp, Timer, BarChart3, Zap, Database, Bell, Settings, Layers, Award, Sparkles, Star, Calendar } from 'lucide-react'

function Navigation({ activeView, setActiveView, rewardSuggestions, moduleStates }) {
  const pendingSuggestions = rewardSuggestions.filter(s => s.status === 'pending').length

  // Helper function to check if a module is enabled
  const isEnabled = (moduleId) => {
    return moduleStates[moduleId]?.enabled !== false
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'familyMembers', label: 'Family', icon: Users },
    { id: 'taskPool', label: 'Task Pool', icon: Layers },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'rewards', label: 'Rewards', icon: Trophy, badge: pendingSuggestions },
    { id: 'merits', label: 'Merits', icon: Award },
    { id: 'achievements', label: 'Achievements', icon: Star },
    { id: 'templates', label: 'Templates', icon: Layers },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    // Conditional tabs based on module states
    ...(isEnabled('screenTime') ? [{ id: 'screentime', label: 'Screen Time', icon: Timer }] : []),
    ...(isEnabled('statistics') ? [{ id: 'stats', label: 'Statistics', icon: BarChart3 }] : []),
    ...(isEnabled('smartLights') ? [{ id: 'integrations', label: 'Smart Lights', icon: Zap }] : []),
    ...(isEnabled('backupRestore') ? [{ id: 'backup', label: 'Backup', icon: Database }] : []),
    ...(isEnabled('deadlineReminders') ? [{ id: 'deadlines', label: 'Deadlines', icon: Bell }] : []),
    // Admin and What's New are always visible
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'whatsnew', label: "What's New", icon: Sparkles },
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

export default Navigation
