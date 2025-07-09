// ProjectDetail.tsx
// ВАЖНО: Убедитесь, что в интерфейсе FileData добавлено поле:
// original_filename?: string;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Upload,
  Settings,
  Download,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Image,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Edit3,
  Tag,
  FileText,
  X,
  MoreHorizontal,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Copy,
  ExternalLink,
  Info,
  Zap,
  AlertTriangle,
  Loader,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSearch } from '../hooks/useSearch';
import FileUpload from '../components/FileUpload';
import FileEditModal from '../components/FileEditModal';
import BulkEditModal from '../components/BulkEditModal';
import AdvancedFilters from '../components/AdvancedFilters';
import SearchBar from '../components/SearchBar';
import ImportExportModal from '../components/ImportExportModal';
import { exportToCSV } from '../utils/csvUtils';

type SortField = 'filename' | 'uploaded' | 'status' | 'size' | 'titleAdobe';
type SortDirection = 'asc' | 'desc';

interface FileWithDetails extends FileData {
  processingProgress?: number;
  errorDetails?: string;
  lastModified?: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const projectId = parseInt(id || '0');
  
  const files = useStore((state) => state.files.filter(f => f.projectId === projectId));
  const loadProjectFiles = useStore((state) => state.loadProjectFiles);
  const projects = useStore((state) => state.projects);
  const selectedFiles = useStore((state) => state.selectedFiles);
  const setSelectedFiles = useStore((state) => state.setSelectedFiles);
  const updateFile = useStore((state) => state.updateFile);
  const updateFiles = useStore((state) => state.updateFiles);
  const deleteFiles = useStore((state) => state.deleteFiles);
  const addFiles = useStore((state) => state.addFiles);

  // Enhanced search with better performance
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    filteredFiles,
    searchSuggestions,
    recentSearches
  } = useSearch(files);

  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'detailed'>('detailed');
  const [sortField, setSortField] = useState<SortField>('uploaded');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showUpload, setShowUpload] = useState(false);
  const [editingFile, setEditingFile] = useState<any>(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export'>('export');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [undoStack, setUndoStack] = useState<Array<{ action: string; data: any }>>([]);

  // Load files with better error handling
  useEffect(() => {
    if (projectId) {
      loadProjectFiles(projectId).catch(console.error);
    }
  }, [projectId, loadProjectFiles]);

  const project = projects.find(p => p.id === projectId);

  // Memoized sorted and filtered files
  const sortedAndFilteredFiles = useMemo(() => {
    const sorted = [...filteredFiles].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (sortField === 'uploaded') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (sortField === 'size') {
        aVal = parseFloat(aVal?.replace(/[^\d.]/g, '') || '0');
        bVal = parseFloat(bVal?.replace(/[^\d.]/g, '') || '0');
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    return sorted;
  }, [filteredFiles, sortField, sortDirection]);

  // Enhanced file stats
  const fileStats = useMemo(() => {
    const stats = {
      total: files.length,
      completed: files.filter(f => f.status === 'completed').length,
      processing: files.filter(f => f.status === 'processing').length,
      queued: files.filter(f => f.status === 'queued').length,
      error: files.filter(f => f.status === 'error').length,
      filtered: filteredFiles.length,
      avgProcessingTime: 0,
      totalSize: 0
    };
    
    const completedWithTime = files.filter(f => f.status === 'completed' && f.processingTime);
    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((sum, f) => {
        const time = parseFloat(f.processingTime?.replace(/[^\d.]/g, '') || '0');
        return sum + time;
      }, 0);
      stats.avgProcessingTime = totalTime / completedWithTime.length;
    }
    
    stats.totalSize = files.reduce((sum, f) => {
      const size = parseFloat(f.size?.replace(/[^\d.]/g, '') || '0');
      return sum + size;
    }, 0);
    
    return stats;
  }, [files, filteredFiles]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The requested project could not be found.</p>
        </div>
      </div>
    );
  }

  // Enhanced status icons with more detail
  const getStatusIcon = (file: FileWithDetails) => {
    switch (file.status) {
      case 'completed':
        return (
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            {file.processingTime && (
              <span className="text-xs text-gray-500">{file.processingTime}</span>
            )}
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center space-x-2">
            <Loader className="w-4 h-4 text-blue-500 animate-spin" />
            {file.processingProgress && (
              <div className="w-16 bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all"
                  style={{ width: `${file.processingProgress}%` }}
                />
              </div>
            )}
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-1" title={file.errorDetails}>
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600">
              {file.attempts ? `Attempt ${file.attempts}` : 'Failed'}
            </span>
          </div>
        );
      case 'queued':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectFile = useCallback((fileId: number) => {
    setSelectedFiles(
      selectedFiles.includes(fileId) 
        ? selectedFiles.filter(id => id !== fileId)
        : [...selectedFiles, fileId]
    );
  }, [selectedFiles, setSelectedFiles]);

  const handleSelectAll = useCallback(() => {
    setSelectedFiles(
      selectedFiles.length === sortedAndFilteredFiles.length 
        ? [] 
        : sortedAndFilteredFiles.map(file => file.id)
    );
  }, [selectedFiles.length, sortedAndFilteredFiles, setSelectedFiles]);

  const toggleCardExpansion = (fileId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedCards(newExpanded);
  };

  const handleFilesUploaded = useCallback((uploadedFiles: any[]) => {
    const newFiles = uploadedFiles.map(file => ({
      projectId: projectId,
      filename: file.name,
      original_filename: file.originalName || file.name, // Сохраняем оригинальное имя
      newNamePhoto: '',
      titleAdobe: '',
      size: file.size ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : '',
      uploaded: new Date().toISOString(),
      status: 'queued' as const,
      description: '',
      keywords: [],
      prompt: '',
      keysAdobe: [],
      adobeCategory: '',
      attempts: 0,
      processingTime: '',
      thumbnail: file.thumbnail || file.thumbnailUrl || '',
      notes: '',
      tags: [],
      processingProgress: 0
    }));

    addFiles(newFiles);
    setShowUpload(false);
  }, [projectId, addFiles]);

  const handleBulkAction = (action: string) => {
    // Save current state for undo
    setUndoStack(prev => [...prev, { 
      action: `bulk_${action}`, 
      data: selectedFiles.map(id => files.find(f => f.id === id)) 
    }]);

    switch (action) {
      case 'reprocess':
        const updates = selectedFiles.map(id => ({
          id,
          data: { status: 'queued', attempts: 0 }
        }));
        updateFiles(updates);
        break;
      case 'delete':
        deleteFiles(selectedFiles);
        break;
    }
    setSelectedFiles([]);
  };

  // Get unique values for filter options
  const availableTags = [...new Set(files.flatMap(f => f.tags))].sort();
  const availableKeywords = [...new Set(files.flatMap(f => [...f.keywords, ...f.keysAdobe]))].sort();
  const availableAdobeCategories = [...new Set(files.map(f => f.adobeCategory).filter(Boolean))].sort();

  const hasActiveFilters = () => {
    return (
      filters.status.length > 0 ||
      filters.dateRange.start ||
      filters.dateRange.end ||
      filters.adobeCategories.length > 0 ||
      filters.tags.length > 0 ||
      filters.keywords.length > 0 ||
      filters.sizeRange.min > 0 ||
      filters.sizeRange.max < 100 ||
      filters.hasDescription !== null ||
      filters.hasKeywords !== null ||
      filters.hasAdobeKeys !== null
    );
  };

  const selectedFileObjects = sortedAndFilteredFiles.filter(f => selectedFiles.includes(f.id));

  // Enhanced File Card Component
  const FileCard = ({ file }: { file: FileWithDetails }) => {
    const isExpanded = expandedCards.has(file.id);
    const isSelected = selectedFiles.includes(file.id);
    
    // Debug: показываем все поля файла в консоли
    console.log('File object:', file);
    console.log('Available fields:', Object.keys(file));
    console.log('original_filename:', file.original_filename);
    console.log('filename:', file.filename);
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'
      }`}>
        <div className="p-4">
          {/* Header with selection and actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectFile(file.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={file.thumbnail}
                  alt={file.original_filename || file.filename}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {getStatusIcon(file)}
              <button 
                onClick={() => setEditingFile(file)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Edit file"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* File Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium text-gray-900 flex-1 pr-2">
                {file.newNamePhoto || file.original_filename || file.filename}
              </h4>
              <button
                onClick={() => toggleCardExpansion(file.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {file.titleAdobe && (
              <p className="text-xs text-blue-600 truncate">{file.titleAdobe}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{file.size}</span>
              <span>{new Date(file.uploaded).toLocaleDateString()}</span>
            </div>
            
            {/* Status specific info */}
            {file.status === 'error' && file.errorDetails && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="font-medium">Error:</span>
                </div>
                <p className="mt-1">{file.errorDetails}</p>
              </div>
            )}
            
            {/* Adobe Category */}
            {file.adobeCategory && (
              <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                {file.adobeCategory}
              </span>
            )}
            
            {/* Quick preview of content */}
            {!isExpanded && file.description && (
              <p className="text-xs text-gray-600 line-clamp-2">{file.description}</p>
            )}
            
            {/* Tags preview */}
            {!isExpanded && file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {file.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    {tag}
                  </span>
                ))}
                {file.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{file.tags.length - 3}</span>
                )}
              </div>
            )}
            
            {/* Keywords preview */}
            {!isExpanded && file.keysAdobe.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {file.keysAdobe.slice(0, 4).map((key) => (
                  <span key={key} className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                    {key}
                  </span>
                ))}
                {file.keysAdobe.length > 4 && (
                  <span className="text-xs text-gray-500">+{file.keysAdobe.length - 4}</span>
                )}
              </div>
            )}
          </div>
          
          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              {file.description && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Description:</p>
                  <p className="text-xs text-gray-600">{file.description}</p>
                </div>
              )}
              
              {file.keywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {file.keywords.map((keyword) => (
                      <span key={keyword} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {file.keysAdobe.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Adobe Keys:</p>
                  <div className="flex flex-wrap gap-1">
                    {file.keysAdobe.map((key) => (
                      <span key={key} className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                        {key}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {file.prompt && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">AI Prompt:</p>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{file.prompt}</p>
                </div>
              )}
              
              {file.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Notes:</p>
                  <p className="text-xs text-gray-600">{file.notes}</p>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
                <button className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
                <button className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                  <ExternalLink className="w-3 h-3" />
                  <span>Open</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              setImportExportMode('import');
              setShowImportExportModal(true);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg"
            title="Import to project"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              setImportExportMode('export');
              setShowImportExportModal(true);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg"
            title="Export project"
          >
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowUpload(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Enhanced Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <Image className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-xl font-bold text-gray-900">{fileStats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 rounded-lg p-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{fileStats.completed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <Loader className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-xl font-bold text-gray-900">{fileStats.processing}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 rounded-lg p-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-xl font-bold text-gray-900">{fileStats.error}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 rounded-lg p-2">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Filtered</p>
              <p className="text-xl font-bold text-gray-900">{fileStats.filtered}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 rounded-lg p-2">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Time</p>
              <p className="text-xl font-bold text-gray-900">
                {fileStats.avgProcessingTime > 0 ? `${fileStats.avgProcessingTime.toFixed(1)}s` : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-lg">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onAdvancedFilters={() => setShowAdvancedFilters(true)}
              suggestions={searchSuggestions}
              recentSearches={recentSearches}
              placeholder="Search by name, keywords, description, tags..."
              hasActiveFilters={hasActiveFilters()}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Sort controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="uploaded">Upload Date</option>
                <option value="filename">Name</option>
                <option value="status">Status</option>
                <option value="size">Size</option>
                <option value="titleAdobe">Adobe Title</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
            
            {/* View mode controls */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`p-2 ${viewMode === 'detailed' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Detailed view"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  {filters.status.map(status => (
                    <span key={status} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Status: {status}
                    </span>
                  ))}
                  {filters.adobeCategories.map(category => (
                    <span key={category} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      Category: {category}
                    </span>
                  ))}
                  {filters.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Tag: {tag}
                    </span>
                  ))}
                  {(filters.dateRange.start || filters.dateRange.end) && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      Date range
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setFilters({
                  status: [],
                  dateRange: { start: '', end: '' },
                  adobeCategories: [],
                  tags: [],
                  keywords: [],
                  sizeRange: { min: 0, max: 100 },
                  hasDescription: null,
                  hasKeywords: null,
                  hasAdobeKeys: null
                })}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Selection and Bulk Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFiles.length === sortedAndFilteredFiles.length && sortedAndFilteredFiles.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Select all visible</span>
              </label>
              
              {selectedFiles.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
                    {selectedFiles.length} selected
                  </span>
                  <button 
                    onClick={() => setShowBulkEdit(true)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Bulk Edit</span>
                  </button>
                  <button 
                    onClick={() => handleBulkAction('reprocess')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    <Play className="w-3 h-3" />
                    <span>Reprocess</span>
                  </button>
                  <button 
                    onClick={() => setShowBulkPreview(true)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                  <button 
                    onClick={() => handleBulkAction('delete')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Showing {sortedAndFilteredFiles.length} of {files.length} files
              </span>
              
              {/* Queue controls */}
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                  <Pause className="w-4 h-4" />
                  <span>Pause Queue</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Failed</span>
                </button>
              </div>

              {/* Undo action */}
              {undoStack.length > 0 && (
                <button 
                  onClick={() => {
                    // Implement undo logic
                    setUndoStack(prev => prev.slice(0, -1));
                  }}
                  className="flex items-center space-x-1 px-2 py-1 text-sm text-orange-600 hover:text-orange-700 bg-orange-50 rounded"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Undo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {viewMode === 'list' ? (
        /* Enhanced List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 p-4">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === sortedAndFilteredFiles.length && sortedAndFilteredFiles.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Preview</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100" 
                      onClick={() => handleSort('filename')}>
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {sortField === 'filename' && (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}>
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Adobe Title</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Keywords</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('size')}>
                    <div className="flex items-center space-x-1">
                      <span>Size</span>
                      {sortField === 'size' && (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('uploaded')}>
                    <div className="flex items-center space-x-1">
                      <span>Uploaded</span>
                      {sortField === 'uploaded' && (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedAndFilteredFiles.map((file) => (
                  <tr key={file.id} className={`hover:bg-gray-50 ${
                    selectedFiles.includes(file.id) ? 'bg-blue-50' : ''
                  }`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleSelectFile(file.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={file.thumbnail}
                          alt={file.original_filename || file.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {file.newNamePhoto || file.original_filename || file.filename}
                        </p>
                        {file.original_filename && file.original_filename !== file.filename && (
                          <p className="text-xs text-gray-500">Original: {file.original_filename}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(file)}
                        <span className="text-sm capitalize">{file.status}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-900 truncate max-w-xs">
                        {file.titleAdobe || '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      {file.adobeCategory ? (
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          {file.adobeCategory}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {file.keysAdobe.slice(0, 2).map((key) => (
                          <span key={key} className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            {key}
                          </span>
                        ))}
                        {file.keysAdobe.length > 2 && (
                          <span className="text-xs text-gray-500">+{file.keysAdobe.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{file.size}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(file.uploaded).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingFile(file)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="More actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Enhanced Grid/Detailed View */
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
        }>
          {sortedAndFilteredFiles.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedAndFilteredFiles.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || hasActiveFilters() ? 'No files match your search' : 'No files found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || hasActiveFilters() 
              ? 'Try adjusting your search terms or filters' 
              : 'Upload your first files to get started'
            }
          </p>
          {searchTerm || hasActiveFilters() ? (
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  status: [],
                  dateRange: { start: '', end: '' },
                  adobeCategories: [],
                  tags: [],
                  keywords: [],
                  sizeRange: { min: 0, max: 100 },
                  hasDescription: null,
                  hasKeywords: null,
                  hasAdobeKeys: null
                });
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              Clear search and filters
            </button>
          ) : (
            <button 
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Upload Files
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      
      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upload Files</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <FileUpload
                projectId={projectId}
                onFilesUploaded={handleFilesUploaded}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Preview Modal */}
      {showBulkPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Preview Selected Files ({selectedFiles.length})
              </h2>
              <button
                onClick={() => setShowBulkPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedFileObjects.map((file) => (
                  <div key={file.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                      <img
                        src={file.thumbnail}
                        alt={file.original_filename || file.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {file.original_filename || file.filename}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{file.size}</span>
                      {getStatusIcon(file)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Modal */}
      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
        availableKeywords={availableKeywords}
        availableAdobeCategories={availableAdobeCategories}
      />

      {/* Edit Modal */}
      {editingFile && (
        <FileEditModal
          file={editingFile}
          isOpen={!!editingFile}
          onClose={() => setEditingFile(null)}
          onSave={(updates) => {
            updateFile(editingFile.id, updates);
            setEditingFile(null);
          }}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <BulkEditModal
          files={selectedFileObjects}
          isOpen={showBulkEdit}
          onClose={() => setShowBulkEdit(false)}
          onSave={(updates) => {
            updateFiles(updates);
            setShowBulkEdit(false);
            setSelectedFiles([]);
          }}
        />
      )}

      {/* Import/Export Modal */}
      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        mode={importExportMode}
        projectId={projectId}
      />
    </div>
  );
};

export default ProjectDetail;