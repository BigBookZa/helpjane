import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // КРИТИЧЕСКИ ВАЖНО для отправки credentials
});

// Request interceptor to add auth headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name: string, email: string, password: string) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const logout = async () => {
  await api.post('/auth/logout');
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
};

// Dashboard
export const getDashboardData = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const getSystemStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

// Projects
export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const createProject = async (projectData: any) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

export const updateProject = async (id: number, updates: any) => {
  const response = await api.put(`/projects/${id}`, updates);
  return response.data;
};

export const deleteProject = async (id: number) => {
  await api.delete(`/projects/${id}`);
};

export const getProject = async (id: number) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

// Files
export const uploadFiles = async (request: { files: File[]; projectId: number }) => {
  const formData = new FormData();
  request.files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('projectId', request.projectId.toString());

  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true, // Явно указываем для multipart запросов
  });
  
  return response.data;
};

export const getProjectFiles = async (projectId: number, params?: any) => {
  const response = await api.get(`/files/project/${projectId}`, { params });
  return response.data;
};

export const updateFile = async (id: number, updates: any) => {
  const response = await api.put(`/files/${id}`, updates);
  return response.data;
};

export const deleteFile = async (id: number) => {
  await api.delete(`/files/${id}`);
};

export const reprocessFile = async (id: number) => {
  const response = await api.post(`/files/${id}/reprocess`);
  return response.data;
};

// Templates
export const getTemplates = async () => {
  const response = await api.get('/templates');
  return response.data;
};

export const createTemplate = async (templateData: any) => {
  const response = await api.post('/templates', templateData);
  return response.data;
};

export const updateTemplate = async (id: number, updates: any) => {
  const response = await api.put(`/templates/${id}`, updates);
  return response.data;
};

export const deleteTemplate = async (id: number) => {
  await api.delete(`/templates/${id}`);
};

// Settings
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (settings: any) => {
  const response = await api.put('/settings', settings);
  return response.data;
};

export const testApiConnection = async (service: string, config: any) => {
  const response = await api.post('/settings/test', { service, config });
  return response.data;
};

export const exportSettings = async (): Promise<Blob> => {
  const response = await api.get('/settings/export', {
    responseType: 'blob',
    withCredentials: true, // Важно для blob запросов
  });
  return response.data;
};

export const importSettings = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  
  await api.post('/settings/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true, // Важно для multipart запросов
  });
};

// Queue operations
export const getQueueStatus = async () => {
  const response = await api.get('/queue/status');
  return response.data;
};

export const pauseQueue = async () => {
  await api.post('/queue/pause');
};

export const resumeQueue = async () => {
  await api.post('/queue/resume');
};

export const retryFailedFiles = async (fileIds?: number[]) => {
  await api.post('/queue/retry', { fileIds });
};

// Notifications
export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  await api.put(`/notifications/${id}/read`);
};

export const deleteNotification = async (id: string) => {
  await api.delete(`/notifications/${id}`);
};

// Telegram operations
export const sendTelegramNotification = async (message: string): Promise<void> => {
  await api.post('/telegram/notify', { message });
};

// Export/Import
export const exportProject = async (projectId: number, format: 'json' | 'csv'): Promise<Blob> => {
  const response = await api.get(`/projects/${projectId}/export`, {
    params: { format },
    responseType: 'blob',
    withCredentials: true, // Важно для blob запросов
  });
  return response.data;
};

export const importProject = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  
  await api.post('/projects/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true, // Важно для multipart запросов
  });
};