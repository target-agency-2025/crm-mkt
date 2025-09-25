// API Base Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Generic API request handler
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const defaultOptions: RequestInit = {
    headers: defaultHeaders,
    ...options,
  };

  // Don't set Content-Type for FormData (file uploads)
  if (options.body instanceof FormData) {
    const { 'Content-Type': _, ...headersWithoutContentType } = defaultHeaders;
    defaultOptions.headers = headersWithoutContentType;
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Client API
export const clientsAPI = {
  // Get all clients
  getAll: () => apiRequest('/clients'),
  
  // Get client by ID
  getById: (id: string) => apiRequest(`/clients/${id}`),
  
  // Create new client
  create: (clientData: FormData) => apiRequest('/clients', {
    method: 'POST',
    body: clientData,
  }),
  
  // Update client
  update: (id: string, clientData: FormData) => apiRequest(`/clients/${id}`, {
    method: 'PUT',
    body: clientData,
  }),
  
  // Delete client
  delete: (id: string) => apiRequest(`/clients/${id}`, {
    method: 'DELETE',
  }),
};

// Calendar Events API
export const calendarAPI = {
  // Get all events (optionally filtered by client)
  getEvents: (clientId?: string) => {
    const params = clientId ? `?client_id=${clientId}` : '';
    return apiRequest(`/calendar-events${params}`);
  },
  
  // Create new event
  createEvent: (eventData: any) => apiRequest('/calendar-events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  }),
  
  // Update event
  updateEvent: (id: string, eventData: any) => apiRequest(`/calendar-events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  }),
  
  // Delete event
  deleteEvent: (id: string) => apiRequest(`/calendar-events/${id}`, {
    method: 'DELETE',
  }),
};

// Quotes API (placeholder for future implementation)
export const quotesAPI = {
  getAll: () => apiRequest('/quotes'),
  create: (quoteData: any) => apiRequest('/quotes', {
    method: 'POST',
    body: JSON.stringify(quoteData),
  }),
  update: (id: string, quoteData: any) => apiRequest(`/quotes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(quoteData),
  }),
  delete: (id: string) => apiRequest(`/quotes/${id}`, {
    method: 'DELETE',
  }),
};

// Tasks API (placeholder for future implementation)
export const tasksAPI = {
  getAll: () => apiRequest('/tasks'),
  create: (taskData: any) => apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }),
  update: (id: string, taskData: any) => apiRequest(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  }),
  delete: (id: string) => apiRequest(`/tasks/${id}`, {
    method: 'DELETE',
  }),
};

// Invoices API (placeholder for future implementation)
export const invoicesAPI = {
  getAll: () => apiRequest('/invoices'),
  create: (invoiceData: any) => apiRequest('/invoices', {
    method: 'POST',
    body: JSON.stringify(invoiceData),
  }),
  update: (id: string, invoiceData: any) => apiRequest(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(invoiceData),
  }),
  delete: (id: string) => apiRequest(`/invoices/${id}`, {
    method: 'DELETE',
  }),
};

// Budget API (placeholder for future implementation)
export const budgetAPI = {
  getCategories: () => apiRequest('/budget-categories'),
  getEntries: () => apiRequest('/budget-entries'),
  createCategory: (categoryData: any) => apiRequest('/budget-categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  }),
  createEntry: (entryData: any) => apiRequest('/budget-entries', {
    method: 'POST',
    body: JSON.stringify(entryData),
  }),
};

// Credentials API (placeholder for future implementation)
export const credentialsAPI = {
  getAll: () => apiRequest('/credentials'),
  create: (credentialData: any) => apiRequest('/credentials', {
    method: 'POST',
    body: JSON.stringify(credentialData),
  }),
  update: (id: string, credentialData: any) => apiRequest(`/credentials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(credentialData),
  }),
  delete: (id: string) => apiRequest(`/credentials/${id}`, {
    method: 'DELETE',
  }),
};

// Utility function to create FormData for client creation/update
export const createClientFormData = (clientData: any, profilePhoto?: File) => {
  const formData = new FormData();
  
  Object.keys(clientData).forEach(key => {
    if (clientData[key] !== null && clientData[key] !== undefined) {
      formData.append(key, clientData[key]);
    }
  });
  
  if (profilePhoto) {
    formData.append('profilePhoto', profilePhoto);
  }
  
  return formData;
};

export default {
  clients: clientsAPI,
  calendar: calendarAPI,
  quotes: quotesAPI,
  tasks: tasksAPI,
  invoices: invoicesAPI,
  budget: budgetAPI,
  credentials: credentialsAPI,
};