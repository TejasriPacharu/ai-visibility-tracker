/**
 * API Client
 * Handles all HTTP requests to the backend
 */

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data
    );
  }

  return data;
}

// Projects API
export const projects = {
  list: () => request('/projects'),
  
  get: (id) => request(`/projects/${id}`),
  
  create: (data) => request('/projects', {
    method: 'POST',
    body: data,
  }),
  
  update: (id, data) => request(`/projects/${id}`, {
    method: 'PATCH',
    body: data,
  }),
  
  delete: (id) => request(`/projects/${id}`, {
    method: 'DELETE',
  }),
  
  // Prompts
  getPrompts: (projectId) => request(`/projects/${projectId}/prompts`),
  
  addPrompt: (projectId, data) => request(`/projects/${projectId}/prompts`, {
    method: 'POST',
    body: data,
  }),
  
  updatePrompt: (projectId, promptId, data) => request(`/projects/${projectId}/prompts/${promptId}`, {
    method: 'PATCH',
    body: data,
  }),
  
  deletePrompt: (projectId, promptId) => request(`/projects/${projectId}/prompts/${promptId}`, {
    method: 'DELETE',
  }),
  
  generatePrompts: (projectId, options) => request(`/projects/${projectId}/prompts/generate`, {
    method: 'POST',
    body: options,
  }),
  
  // Brands
  addBrand: (projectId, data) => request(`/projects/${projectId}/brands`, {
    method: 'POST',
    body: data,
  }),
  
  deleteBrand: (projectId, brandId) => request(`/projects/${projectId}/brands/${brandId}`, {
    method: 'DELETE',
  }),
};

// Analysis API
export const analysis = {
  run: (projectId) => request(`/analysis/${projectId}/run`, {
    method: 'POST',
  }),
  
  getRuns: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analysis/${projectId}/runs${query ? `?${query}` : ''}`);
  },
  
  getRun: (projectId, runId) => request(`/analysis/${projectId}/runs/${runId}`),
  
  getLatest: (projectId) => request(`/analysis/${projectId}/latest`),
  
  getResults: (projectId, runId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analysis/${projectId}/runs/${runId}/results${query ? `?${query}` : ''}`);
  },
  
  deleteRun: (projectId, runId) => request(`/analysis/${projectId}/runs/${runId}`, {
    method: 'DELETE',
  }),
  
  // SSE stream for progress
  streamProgress: (projectId, runId, onMessage, onError) => {
    const eventSource = new EventSource(`${API_BASE}/analysis/${projectId}/runs/${runId}/stream`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
      
      if (data.type === 'complete') {
        eventSource.close();
      }
    };
    
    eventSource.onerror = (error) => {
      onError?.(error);
      eventSource.close();
    };
    
    return () => eventSource.close();
  },
};

// Dashboard API
export const dashboard = {
  get: (projectId, runId) => {
    const query = runId ? `?runId=${runId}` : '';
    return request(`/dashboard/${projectId}${query}`);
  },
  
  getPrompts: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/dashboard/${projectId}/prompts${query ? `?${query}` : ''}`);
  },
  
  getCitations: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/dashboard/${projectId}/citations${query ? `?${query}` : ''}`);
  },
  
  getTrends: (projectId) => request(`/dashboard/${projectId}/trends`),
  
  getCompetitors: (projectId, runId) => {
    const query = runId ? `?runId=${runId}` : '';
    return request(`/dashboard/${projectId}/competitors${query}`);
  },
};

export default { projects, analysis, dashboard };