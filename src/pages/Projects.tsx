import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Image,
  Calendar,
  HardDrive,
  Cloud,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit3,
  Trash2,
  Eye,
  Download,
  Upload,
  Grid3X3,
  List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import ProjectModal from '../components/ProjectModal';
import ImportExportModal from '../components/ImportExportModal';
import { useNotifications } from '../hooks/useNotifications';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { projects, deleteProject, loadProjects, isLoading } = useStore();
  const { showSuccess, showError } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export'>('export');
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Загружаем проекты при монтировании компонента
  useEffect(() => {
    loadProjects().catch(error => {
      console.error('Failed to load projects:', error);
      showError('Failed to load projects');
    });
  }, []);

  // Статические конфигурации для статусов
  const statusConfig = useMemo(() => ({
    completed: {
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      badge: 'bg-green-100 text-green-800'
    },
    processing: {
      icon: <Clock className="w-4 h-4 text-orange-500" />,
      badge: 'bg-orange-100 text-orange-800'
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      badge: 'bg-red-100 text-red-800'
    },
    paused: {
      icon: <Clock className="w-4 h-4 text-gray-400" />,
      badge: 'bg-gray-100 text-gray-800'
    }
  }), []);

  // Оптимизированные функции для получения статуса
  const getStatusIcon = useCallback((status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.icon || statusConfig.paused.icon;
  }, [statusConfig]);

  const getStatusBadge = useCallback((status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.badge || statusConfig.paused.badge;
  }, [statusConfig]);

  // Оптимизированная функция для расчета прогресса
  const getProgressPercentage = useCallback((processed: number, total: number) => {
    return total > 0 ? (processed / total) * 100 : 0;
  }, []);

  // Оптимизированная функция для форматирования даты
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }, []);

  // Оптимизированная фильтрация проектов с debounce
  const filteredProjects = useMemo(() => {
    if (!debouncedSearchTerm && filterStatus === 'all') {
      return projects;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    return projects.filter(project => {
      const matchesSearch = !debouncedSearchTerm || 
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [projects, debouncedSearchTerm, filterStatus]);

  // Мемоизированные обработчики событий
  const handleCreateProject = useCallback(() => {
    setEditingProject(null);
    setShowProjectModal(true);
  }, []);

  const handleEditProject = useCallback((project: any) => {
    setEditingProject(project);
    setShowProjectModal(true);
    setShowDropdown(null);
  }, []);

  const handleDeleteProject = useCallback((projectId: number) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        deleteProject(projectId);
        showSuccess('Project deleted successfully');
      } catch (error) {
        console.error('Failed to delete project:', error);
        showError('Failed to delete project');
      }
    }
    setShowDropdown(null);
  }, [deleteProject, showSuccess, showError]);

  const handleViewProject = useCallback((projectId: number) => {
    navigate(`/projects/${projectId}`);
  }, [navigate]);

  const handleExportProject = useCallback((projectId: number) => {
    setSelectedProjectId(projectId);
    setImportExportMode('export');
    setShowImportExportModal(true);
    setShowDropdown(null);
  }, []);

  const handleImportProjects = useCallback(() => {
    setSelectedProjectId(undefined);
    setImportExportMode('import');
    setShowImportExportModal(true);
  }, []);

  const handleExportAll = useCallback(() => {
    setSelectedProjectId(undefined);
    setImportExportMode('export');
    setShowImportExportModal(true);
  }, []);

  const handleCloseProjectModal = useCallback(() => {
    setShowProjectModal(false);
    setEditingProject(null);
  }, []);

  const handleCloseImportExportModal = useCallback(() => {
    setShowImportExportModal(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleDropdownToggle = useCallback((projectId: number) => {
    setShowDropdown(prev => prev === projectId ? null : projectId);
  }, []);

  const handleViewModeToggle = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  // Render функции (оставлены без изменений для безопасности)
  const renderProjectCard = (project: any) => (
    <div 
      key={project.id} 
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => handleViewProject(project.id)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              {getStatusIcon(project.status)}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDropdownToggle(project.id);
              }}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showDropdown === project.id && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[100]">
                <div className="py-1">
                  <button
                    onClick={() => handleViewProject(project.id)}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => handleEditProject(project)}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Project</span>
                  </button>
                  <button
                    onClick={() => handleExportProject(project.id)}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Project</span>
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Project</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {project.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-gray-600">
                <Image className="w-3 h-3" />
                <span>{project.filesCount}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                {project.storage === 'local' ? (
                  <HardDrive className="w-3 h-3" />
                ) : (
                  <Cloud className="w-3 h-3" />
                )}
                <span className="capitalize">{project.storage}</span>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(project.status)}`}>
              {project.status}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">
                {project.processed}/{project.filesCount}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage(project.processed, project.filesCount)}%` }}
              ></div>
            </div>
            {project.errors > 0 && (
              <p className="text-xs text-red-600 mt-1">{project.errors} errors</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Updated {formatDate(project.updated)}</span>
            </div>
            <div className="text-blue-600 font-medium">
              Click to view details
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjectListItem = (project: any) => (
    <div 
      key={project.id} 
      className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
      onClick={() => handleViewProject(project.id)}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 flex-1 min-w-0">
            {/* Project Name and Status */}
            <div className="flex items-center space-x-2 min-w-0 flex-1 max-w-xs">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
              {getStatusIcon(project.status)}
            </div>

            {/* Description */}
            <div className="min-w-0 flex-1 max-w-sm">
              <p className="text-sm text-gray-600 truncate">{project.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 min-w-0 w-40">
              {project.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full whitespace-nowrap">
                  {tag}
                </span>
              ))}
              {project.tags.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full whitespace-nowrap">
                  +{project.tags.length - 2}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6 flex-shrink-0">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Image className="w-3 h-3" />
                <span>{project.filesCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                {project.storage === 'local' ? (
                  <HardDrive className="w-3 h-3" />
                ) : (
                  <Cloud className="w-3 h-3" />
                )}
                <span className="capitalize">{project.storage}</span>
              </div>
            </div>

            <div className="w-24">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-900 font-medium">
                  {project.processed}/{project.filesCount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage(project.processed, project.filesCount)}%` }}
                ></div>
              </div>
            </div>

            <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusBadge(project.status)}`}>
              {project.status}
            </span>

            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(project.updated)}</span>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDropdownToggle(project.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showDropdown === project.id && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[100]">
                  <div className="py-1">
                    <button
                      onClick={() => handleViewProject(project.id)}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => handleEditProject(project)}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Project</span>
                    </button>
                    <button
                      onClick={() => handleExportProject(project.id)}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Project</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {project.errors > 0 && (
          <p className="text-xs text-red-600 mt-2">{project.errors} errors</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your AI image processing projects</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleImportProjects}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            onClick={handleExportAll}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export All</span>
          </button>
          <button
            onClick={handleCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters and View Toggle */}
          <div className="flex items-center space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="error">Error</option>
              <option value="paused">Paused</option>
            </select>

            <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
              <Filter className="w-4 h-4" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => handleViewModeToggle('grid')}
                className={`px-3 py-2 flex items-center space-x-1 transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="text-sm font-medium">Grid</span>
              </button>
              <button
                onClick={() => handleViewModeToggle('list')}
                className={`px-3 py-2 flex items-center space-x-1 border-l border-gray-300 transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
                <span className="text-sm font-medium">List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(renderProjectCard)}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {filteredProjects.map(renderProjectListItem)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first project to get started'}
          </p>
          <button
            onClick={searchTerm ? handleClearSearch : handleCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {searchTerm ? 'Clear Search' : 'Create Project'}
          </button>
        </div>
      )}

      {/* Modals */}
      <ProjectModal
        project={editingProject}
        isOpen={showProjectModal}
        onClose={handleCloseProjectModal}
      />

      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={handleCloseImportExportModal}
        mode={importExportMode}
        projectId={selectedProjectId}
      />
    </div>
  );
};

export default Projects;