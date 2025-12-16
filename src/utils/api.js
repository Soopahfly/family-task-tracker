// In production, API is served from same origin. In dev, proxy handles /api requests.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Family Members
export const familyMembersAPI = {
  getAll: () => apiCall('/api/family-members'),
  create: (member) => apiCall('/api/family-members', {
    method: 'POST',
    body: JSON.stringify(member),
  }),
  update: (id, member) => apiCall(`/api/family-members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(member),
  }),
  delete: (id) => apiCall(`/api/family-members/${id}`, {
    method: 'DELETE',
  }),
};

// Tasks
export const tasksAPI = {
  getAll: () => apiCall('/api/tasks'),
  create: (task) => apiCall('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  update: (id, task) => apiCall(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task),
  }),
  delete: (id) => apiCall(`/api/tasks/${id}`, {
    method: 'DELETE',
  }),
};

// Rewards
export const rewardsAPI = {
  getAll: () => apiCall('/api/rewards'),
  create: (reward) => apiCall('/api/rewards', {
    method: 'POST',
    body: JSON.stringify(reward),
  }),
  update: (id, reward) => apiCall(`/api/rewards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(reward),
  }),
  delete: (id) => apiCall(`/api/rewards/${id}`, {
    method: 'DELETE',
  }),
};

// Reward Suggestions
export const rewardSuggestionsAPI = {
  getAll: () => apiCall('/api/reward-suggestions'),
  create: (suggestion) => apiCall('/api/reward-suggestions', {
    method: 'POST',
    body: JSON.stringify(suggestion),
  }),
  update: (id, suggestion) => apiCall(`/api/reward-suggestions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(suggestion),
  }),
  delete: (id) => apiCall(`/api/reward-suggestions/${id}`, {
    method: 'DELETE',
  }),
};

// Settings
export const settingsAPI = {
  get: () => apiCall('/api/settings'),
  update: (settings) => apiCall('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
};

// Integrations
export const integrationsAPI = {
  getAll: () => apiCall('/api/integrations'),
  create: (integration) => apiCall('/api/integrations', {
    method: 'POST',
    body: JSON.stringify(integration),
  }),
  update: (id, integration) => apiCall(`/api/integrations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(integration),
  }),
  delete: (id) => apiCall(`/api/integrations/${id}`, {
    method: 'DELETE',
  }),
};

// Module States
export const moduleStatesAPI = {
  get: () => apiCall('/api/module-states'),
  update: (states) => apiCall('/api/module-states', {
    method: 'PUT',
    body: JSON.stringify(states),
  }),
};
