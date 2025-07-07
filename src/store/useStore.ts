import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDashboardData, getProjects, getSettings } from '../services/api';

export interface Project {
  id: number;
  name: string;
  description: string;
  category: string;
  storage: 'local' | 'yandex';
  thumbnail_size: 'small' | 'medium' | 'large';
  tags: string[];
  created_at: string;
  updated_at: string;
  files_count: number;
  processed_count: number;
  error_count: number;
  status: 'active' | 'processing' | 'completed' | 'error' | 'paused';
  // UI поля (добавленные через маппинг)
  filesCount?: number;
  processed?: number;
  errors?: number;
  updated?: string;
}

export interface FileData {
  id: number;
  projectId: number;
  filename: string;
  newNamePhoto: string;
  titleAdobe: string;
  size: string;
  uploaded: string;
  status: 'completed' | 'processing' | 'error' | 'queued';
  description: string;
  keywords: string[];
  prompt: string;
  keysAdobe: string[];
  adobeCategory: string;
  attempts: number;
  processingTime: string;
  thumbnail: string;
  notes: string;
  error?: string;
  tags: string[];
}

export interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  prompt: string;
  variables: string[];
  isDefault: boolean;
  usageCount: number;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  category: 'processing' | 'system' | 'project' | 'api' | 'storage';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface Settings {
  openai_api_key?: string;
  openai_model: string;
  max_tokens: number;
  temperature: number;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  yandex_disk_token?: string;
  yandex_base_folder: string;
  max_file_size: number;
  allowed_formats: string[];
  concurrent_processing: number;
  queue_check_interval: number;
  max_retries: number;
  retry_delay: number;
  timeout: number;
  default_thumbnail_size: 'small' | 'medium' | 'large';
  thumbnail_quality: number;
  notifications_enabled: boolean;
  telegram_notifications: boolean;
  yandex_storage_enabled: boolean;
}

interface DashboardData {
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalFiles: number;
    processedFiles: number;
    successRate: number;
    avgProcessingTime: string;
  };
  recentFiles: FileData[];
  queueStats: {
    totalInQueue: number;
    processing: number;
    completed: number;
    failed: number;
    queueStatus: string;
  };
  apiUsage: {
    tokensUsedToday: number;
    requestsToday: number;
    costToday: number;
    tokensLimit: number;
  };
  recentActivity: any[];
  systemHealth: {
    status: string;
    uptime: number;
    memoryUsage: any;
    lastUpdate: string;
  };
}

interface AppState {
  // Data
  projects: Project[];
  files: FileData[];
  templates: Template[];
  notifications: Notification[];
  settings: Settings;
  dashboardData: DashboardData | null;
  
  // UI State
  selectedFiles: number[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadDashboardData: () => Promise<void>;
  loadProjects: () => Promise<void>;
  loadSettings: () => Promise<void>;
  
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
  updateProject: (id: number, updates: Partial<Project>) => void;
  deleteProject: (id: number) => void;
  
  addFiles: (files: Omit<FileData, 'id'>[]) => void;
  updateFile: (id: number, updates: Partial<FileData>) => void;
  updateFiles: (updates: { id: number; data: Partial<FileData> }[]) => void;
  deleteFiles: (ids: number[]) => void;
  setSelectedFiles: (ids: number[]) => void;
  
  addTemplate: (template: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'usageCount'>) => void;
  updateTemplate: (id: number, updates: Partial<Template>) => void;
  deleteTemplate: (id: number) => void;
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  
  updateSettings: (updates: Partial<Settings>) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultSettings: Settings = {
  openai_model: 'gpt-4-vision-preview',
  max_tokens: 1000,
  temperature: 0.7,
  yandex_base_folder: '/helper-for-jane',
  max_file_size: 10485760,
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
  concurrent_processing: 3,
  queue_check_interval: 30,
  max_retries: 3,
  retry_delay: 60,
  timeout: 120,
  default_thumbnail_size: 'medium',
  thumbnail_quality: 85,
  notifications_enabled: true,
  telegram_notifications: false,
  yandex_storage_enabled: false,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      files: [],
      templates: [],
      notifications: [],
      settings: defaultSettings,
      dashboardData: null,
      selectedFiles: [],
      isLoading: false,
      error: null,
      
      // Load data from API
      loadDashboardData: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await getDashboardData();
          set({ dashboardData: data, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || 'Failed to load dashboard data',
            isLoading: false 
          });
        }
      },

      loadProjects: async () => {
      try {
        set({ isLoading: true, error: null });
        const apiProjects = await getProjects();
        
        // Преобразуем данные из API в формат UI
        const projects = apiProjects.map((project: any) => ({
          ...project,
          filesCount: project.files_count,
          processed: project.processed_count,
          errors: project.error_count,
          updated: project.updated_at
        }));
        
        set({ projects, isLoading: false });
          } catch (error: any) {
            set({
              error: error.response?.data?.error || 'Failed to load projects',
              isLoading: false
            });
          }
      },

      loadSettings: async () => {
        try {
          const settings = await getSettings();
          set({ settings: { ...defaultSettings, ...settings } });
        } catch (error: any) {
          console.error('Failed to load settings:', error);
        }
      },
      
      // Project actions
      addProject: (projectData) => {
        const newProject: Project = {
          ...projectData,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          files_count: 0,
          processed_count: 0,
          error_count: 0,
          status: 'active',
        };
        
        set((state) => ({
          projects: [...state.projects, newProject],
        }));

        get().addNotification({
          type: 'success',
          title: 'Project Created',
          message: `Project "${newProject.name}" has been created successfully.`,
          category: 'project'
        });
      },
      
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, ...updates, updated_at: new Date().toISOString() }
              : project
          ),
        }));
      },
      
      deleteProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          files: state.files.filter((file) => file.projectId !== id),
        }));

        if (project) {
          get().addNotification({
            type: 'info',
            title: 'Project Deleted',
            message: `Project "${project.name}" and all its files have been deleted.`,
            category: 'project'
          });
        }
      },
      
      // File actions
      addFiles: (filesData) => {
        const newFiles = filesData.map((fileData) => ({
          ...fileData,
          id: Date.now() + Math.random(),
        }));
        
        set((state) => ({
          files: [...state.files, ...newFiles],
        }));
        
        const projectId = filesData[0]?.projectId;
        if (projectId) {
          const project = get().projects.find((p) => p.id === projectId);
          if (project) {
            get().updateProject(projectId, {
              files_count: project.files_count + newFiles.length,
            });

            get().addNotification({
              type: 'success',
              title: 'Files Uploaded',
              message: `${newFiles.length} files uploaded to "${project.name}".`,
              category: 'processing'
            });
          }
        }
      },
      
      updateFile: (id, updates) => {
        set((state) => ({
          files: state.files.map((file) =>
            file.id === id ? { ...file, ...updates } : file
          ),
        }));
      },

      updateFiles: (updates) => {
        set((state) => ({
          files: state.files.map((file) => {
            const update = updates.find(u => u.id === file.id);
            return update ? { ...file, ...update.data } : file;
          }),
        }));

        get().addNotification({
          type: 'success',
          title: 'Bulk Edit Completed',
          message: `${updates.length} files have been updated successfully.`,
          category: 'processing'
        });
      },
      
      deleteFiles: (ids) => {
        set((state) => ({
          files: state.files.filter((file) => !ids.includes(file.id)),
          selectedFiles: state.selectedFiles.filter((id) => !ids.includes(id)),
        }));

        get().addNotification({
          type: 'info',
          title: 'Files Deleted',
          message: `${ids.length} files have been deleted.`,
          category: 'processing'
        });
      },
      
      setSelectedFiles: (ids) => {
        set({ selectedFiles: ids });
      },
      
      // Template actions
      addTemplate: (templateData) => {
        const newTemplate: Template = {
          ...templateData,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          usageCount: 0,
        };
        
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));

        get().addNotification({
          type: 'success',
          title: 'Template Created',
          message: `Template "${newTemplate.name}" has been created.`,
          category: 'system'
        });
      },
      
      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id
              ? { ...template, ...updates, updated_at: new Date().toISOString() }
              : template
          ),
        }));
      },
      
      deleteTemplate: (id) => {
        const template = get().templates.find(t => t.id === id);
        
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id),
        }));

        if (template) {
          get().addNotification({
            type: 'info',
            title: 'Template Deleted',
            message: `Template "${template.name}" has been deleted.`,
            category: 'system'
          });
        }
      },

      // Notification actions
      addNotification: (notificationData) => {
        const newNotification: Notification = {
          ...notificationData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          read: false,
          archived: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100),
        }));
      },

      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        }));
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      // Settings actions
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));

        get().addNotification({
          type: 'success',
          title: 'Settings Updated',
          message: 'Your settings have been saved successfully.',
          category: 'system'
        });
      },
      
      // UI actions
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      setError: (error) => {
        set({ error });
        
        if (error) {
          get().addNotification({
            type: 'error',
            title: 'Error Occurred',
            message: error,
            category: 'system'
          });
        }
      },
    }),
    {
      name: 'helper-for-jane-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        selectedFiles: state.selectedFiles,
      }),
    }
  )
);