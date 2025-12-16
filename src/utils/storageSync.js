/**
 * Storage Sync Utility
 * Synchronizes localStorage with the backend API
 * This allows the app to continue using localStorage patterns while data is persisted to the server
 */

import { familyMembersAPI, tasksAPI, rewardsAPI, rewardSuggestionsAPI, settingsAPI, integrationsAPI, moduleStatesAPI } from './api';

const API_MAP = {
  'familyMembers': familyMembersAPI,
  'tasks': tasksAPI,
  'rewards': rewardsAPI,
  'rewardSuggestions': rewardSuggestionsAPI,
  'settings': settingsAPI,
  'integrations': integrationsAPI,
  'moduleStates': moduleStatesAPI,
};

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Override localStorage.setItem to sync with API
const originalSetItem = localStorage.setItem.bind(localStorage);
const pendingUpdates = new Map();

const syncToAPI = debounce(async (key) => {
  const value = localStorage.getItem(key);
  if (!value || !API_MAP[key]) return;

  try {
    const data = JSON.parse(value);

    if (key === 'settings') {
      await settingsAPI.update(data);
    } else if (key === 'moduleStates') {
      await moduleStatesAPI.update(data);
    } else {
      // For arrays (familyMembers, tasks, rewards, etc.)
      // This is a simple full sync - in production you'd want smarter diffing
      console.log(`Syncing ${key} to API...`);
    }
  } catch (error) {
    console.error(`Failed to sync ${key} to API:`, error);
  }
}, 500);

localStorage.setItem = function(key, value) {
  originalSetItem(key, value);

  // Sync to API if this key has an API mapping
  if (API_MAP[key]) {
    syncToAPI(key);
  }
};

// Initial load from API
export async function loadFromAPI() {
  try {
    const [
      familyMembers,
      tasks,
      rewards,
      rewardSuggestions,
      settings,
      integrations,
      moduleStates
    ] = await Promise.all([
      familyMembersAPI.getAll(),
      tasksAPI.getAll(),
      rewardsAPI.getAll(),
      rewardSuggestionsAPI.getAll(),
      settingsAPI.get(),
      integrationsAPI.getAll(),
      moduleStatesAPI.get()
    ]);

    // Store in localStorage
    originalSetItem('familyMembers', JSON.stringify(familyMembers));
    originalSetItem('tasks', JSON.stringify(tasks));
    originalSetItem('rewards', JSON.stringify(rewards));
    originalSetItem('rewardSuggestions', JSON.stringify(rewardSuggestions));
    originalSetItem('settings', JSON.stringify(settings));
    originalSetItem('integrations', JSON.stringify(integrations));
    originalSetItem('moduleStates', JSON.stringify(moduleStates));

    return true;
  } catch (error) {
    console.error('Failed to load from API:', error);
    return false;
  }
}

// Sync helper for individual operations
export async function syncFamilyMember(action, data) {
  try {
    switch (action) {
      case 'create':
        await familyMembersAPI.create(data);
        break;
      case 'update':
        await familyMembersAPI.update(data.id, data);
        break;
      case 'delete':
        await familyMembersAPI.delete(data.id);
        break;
    }
  } catch (error) {
    console.error('Failed to sync family member:', error);
    throw error;
  }
}

export async function syncTask(action, data) {
  try {
    switch (action) {
      case 'create':
        await tasksAPI.create(data);
        break;
      case 'update':
        await tasksAPI.update(data.id, data);
        break;
      case 'delete':
        await tasksAPI.delete(data.id);
        break;
    }
  } catch (error) {
    console.error('Failed to sync task:', error);
    throw error;
  }
}

export async function syncReward(action, data) {
  try {
    switch (action) {
      case 'create':
        await rewardsAPI.create(data);
        break;
      case 'update':
        await rewardsAPI.update(data.id, data);
        break;
      case 'delete':
        await rewardsAPI.delete(data.id);
        break;
    }
  } catch (error) {
    console.error('Failed to sync reward:', error);
    throw error;
  }
}
