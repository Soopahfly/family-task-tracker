// Dynamic Module Loader
// Conditionally loads and renders modules based on enabled state

import { lazy, Suspense } from 'react'
import { isModuleEnabled } from './moduleConfig'

// Lazy load module components for better performance
const IntegrationsManager = lazy(() => import('../IntegrationsManager'))
const ScreenTimeManager = lazy(() => import('../components/ScreenTimeManager'))
const Statistics = lazy(() => import('../components/Statistics'))

// Loading fallback component
function ModuleLoading() {
  return (
    <div className="bg-white rounded-2xl p-12 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading module...</p>
    </div>
  )
}

// Module wrapper that handles loading and error states
export function LoadModule({ moduleId, component: Component, moduleStates, ...props }) {
  if (!isModuleEnabled(moduleId, moduleStates)) {
    return null // Module is disabled, don't render
  }

  return (
    <Suspense fallback={<ModuleLoading />}>
      <Component {...props} />
    </Suspense>
  )
}

// Specific module loaders

export function SmartLightsModule({ moduleStates, ...props }) {
  return (
    <LoadModule
      moduleId="smartLights"
      component={IntegrationsManager}
      moduleStates={moduleStates}
      {...props}
    />
  )
}

export function ScreenTimeModule({ moduleStates, ...props }) {
  return (
    <LoadModule
      moduleId="screenTime"
      component={ScreenTimeManager}
      moduleStates={moduleStates}
      {...props}
    />
  )
}

export function StatisticsModule({ moduleStates, ...props }) {
  return (
    <LoadModule
      moduleId="statistics"
      component={Statistics}
      moduleStates={moduleStates}
      {...props}
    />
  )
}

// Navigation item helper - only show tabs for enabled modules
export function getEnabledNavItems(moduleStates, baseNavItems) {
  const moduleNavMapping = {
    smartLights: 'integrations',
    screenTime: 'screentime',
    statistics: 'stats',
  }

  return baseNavItems.filter(item => {
    // Always show core items
    if (['dashboard', 'kids', 'tasks', 'rewards', 'admin'].includes(item.id)) {
      return true
    }

    // Check if the module for this nav item is enabled
    const moduleId = Object.keys(moduleNavMapping).find(
      key => moduleNavMapping[key] === item.id
    )

    if (moduleId) {
      return isModuleEnabled(moduleId, moduleStates)
    }

    return true
  })
}

// Helper to check if a feature should be shown
export function shouldShowFeature(featureId, moduleStates) {
  const featureModuleMapping = {
    streakBadge: 'streaks',
    rewardSuggestionButton: 'rewardSuggestions',
    recurringOption: 'recurringTasks',
    kidViewButton: 'kidView',
    screenTimeDisplay: 'screenTime',
  }

  const moduleId = featureModuleMapping[featureId]
  if (!moduleId) return true // Unknown feature, show by default

  return isModuleEnabled(moduleId, moduleStates)
}

// Helper to get module settings
export function useModuleSettings(moduleId, moduleStates) {
  return moduleStates[moduleId]?.settings || {}
}
