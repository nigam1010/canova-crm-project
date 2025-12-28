const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  register: async (data) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  }
};

// User/Employee APIs
export const userAPI = {
  getAll: async (page = 1, limit = 8) => {
    const response = await fetch(`${API_URL}/users?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  search: async (query) => {
    const response = await fetch(`${API_URL}/users/search?q=${query}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to create user');
    }
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },

  bulkDelete: async (ids) => {
    const response = await fetch(`${API_URL}/users/bulk-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids })
    });
    if (!response.ok) throw new Error('Failed to delete users');
    return response.json();
  }
};

// Lead APIs
export const leadAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/leads`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch leads');
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create lead');
    return response.json();
  },

  uploadCSV: async (csvContent) => {
    const response = await fetch(`${API_URL}/leads/upload-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/csv',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: csvContent
    });
    if (!response.ok) throw new Error('CSV upload failed');
    return response.json();
  },

  assignLead: async (leadId, userId) => {
    const response = await fetch(`${API_URL}/leads/${leadId}/assign`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignedTo: userId })
    });
    if (!response.ok) throw new Error('Failed to assign lead');
    return response.json();
  }
};

// Dashboard APIs
export const dashboardAPI = {
  getMetrics: async () => {
    const response = await fetch(`${API_URL}/dashboard/metrics`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  },

  getSalesGraph: async () => {
    const response = await fetch(`${API_URL}/dashboard/sales-graph`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch graph data');
    return response.json();
  },

  getActiveSales: async () => {
    const response = await fetch(`${API_URL}/dashboard/active-sales`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch active sales');
    return response.json();
  }
};

// Activity APIs
export const activityAPI = {
  getRecent: async () => {
    const response = await fetch(`${API_URL}/activities/recent`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  }
};
