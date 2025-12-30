import { useState, useRef, useEffect } from 'react'
import { Users, Trophy, ListTodo, TrendingUp, Timer, BarChart3, Zap, Database, Bell, Settings, Layers, Award, Sparkles, Star, Calendar, ChevronDown, Menu, CheckCircle } from 'lucide-react'

function NavigationGrouped({ activeView, setActiveView, rewardSuggestions, moduleStates }) {
  const [openDropdown, setOpenDropdown] = useState(null)
  const dropdownRef = useRef(null)

  const pendingSuggestions = rewardSuggestions.filter(s => s.status === 'pending').length

  // Helper function to check if a module is enabled
  const isEnabled = (moduleId) => {
    return moduleStates[moduleId]?.enabled !== false
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navGroups = [
    {
      id: 'overview',
      label: 'Overview',
      icon: TrendingUp,
      color: 'blue',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
      ]
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: ListTodo,
      color: 'purple',
      items: [
        { id: 'taskPool', label: 'Task Pool', icon: Layers },
        { id: 'tasks', label: 'All Tasks', icon: ListTodo },
        { id: 'templates', label: 'Templates', icon: Layers },
        { id: 'calendar', label: 'History', icon: Calendar },
        { id: 'completedTasks', label: 'Completed Tasks', icon: CheckCircle },
      ]
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: Star,
      color: 'yellow',
      items: [
        { id: 'achievements', label: 'Achievements', icon: Star },
        { id: 'rewards', label: 'Rewards', icon: Trophy, badge: pendingSuggestions },
        { id: 'merits', label: 'Merits', icon: Award },
        ...(isEnabled('statistics') ? [{ id: 'stats', label: 'Statistics', icon: BarChart3 }] : []),
      ]
    },
    {
      id: 'family',
      label: 'Family',
      icon: Users,
      color: 'green',
      items: [
        { id: 'familyMembers', label: 'Members', icon: Users },
        ...(isEnabled('screenTime') ? [{ id: 'screentime', label: 'Screen Time', icon: Timer }] : []),
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'gray',
      items: [
        { id: 'admin', label: 'Admin', icon: Settings },
        ...(isEnabled('smartLights') ? [{ id: 'integrations', label: 'Smart Lights', icon: Zap }] : []),
        ...(isEnabled('backupRestore') ? [{ id: 'backup', label: 'Backup', icon: Database }] : []),
        ...(isEnabled('deadlineReminders') ? [{ id: 'deadlines', label: 'Deadlines', icon: Bell }] : []),
        { id: 'whatsnew', label: "What's New", icon: Sparkles },
      ]
    },
  ]

  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      purple: isActive ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      yellow: isActive ? 'bg-yellow-600 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
      green: isActive ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
      gray: isActive ? 'bg-gray-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
    }
    return colors[color] || colors.gray
  }

  const handleItemClick = (itemId) => {
    setActiveView(itemId)
    setOpenDropdown(null)
  }

  const isGroupActive = (group) => {
    return group.items.some(item => item.id === activeView)
  }

  return (
    <div className="flex gap-2 mb-6 flex-wrap justify-center" ref={dropdownRef}>
      {navGroups.map(group => {
        const isActive = isGroupActive(group)
        const Icon = group.icon
        const isOpen = openDropdown === group.id

        return (
          <div key={group.id} className="relative">
            <button
              onClick={() => setOpenDropdown(isOpen ? null : group.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                isActive
                  ? 'bg-white text-purple-600 shadow-lg scale-105'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Icon size={20} />
              {group.label}
              <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-gray-200 py-2 z-50">
                {group.items.map(item => {
                  const ItemIcon = item.icon
                  const itemActive = activeView === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`relative w-full flex items-center gap-3 px-4 py-2.5 transition-all ${
                        itemActive
                          ? getColorClasses(group.color, true)
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ItemIcon size={18} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default NavigationGrouped
