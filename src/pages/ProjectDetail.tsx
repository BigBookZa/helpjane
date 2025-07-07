import React, { useState } from 'react';
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
  X
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

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const projectId = parseInt(id || '0');
  
  const files = useStore((state) => state.files.filter(f => f.projectId === projectId));
  const projects = useStore((state) => state.projects);
  const selectedFiles = useStore((state) => state.selectedFiles);
  const setSelectedFiles = useStore((state) => state.setSelectedFiles);
  const updateFile = useStore((state) => state.updateFile);
  const updateFiles = useStore((state) => state.updateFiles);
  const deleteFiles = useStore((state) => state.deleteFiles);
  const addFiles = useStore((state) => state.addFiles);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    filteredFiles,
    searchSuggestions,
    recentSearches
  } = useSearch(files);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [editingFile, setEditingFile] = useState<any>(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export'>('export');

  const project = projects.find(p => p.id === projectId);

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

  // Get unique values for filter options
  const availableTags = [...new Set(files.flatMap(f => f.tags))].sort();
  const availableKeywords = [...new Set(files.flatMap(f => [...f.keywords, ...f.keysAdobe]))].sort();
  const availableAdobeCategories = [...new Set(files.map(f => f.adobeCategory).filter(Boolean))].sort();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-orange-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleSelectFile = (fileId: number) => {
    setSelectedFiles(
      selectedFiles.includes(fileId) 
        ? selectedFiles.filter(id => id !== fileId)
        : [...selectedFiles, fileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFiles(
      selectedFiles.length === filteredFiles.length 
        ? [] 
        : filteredFiles.map(file => file.id)
    );
  };

  const handleFilesUploaded = (uploadedFiles: any[]) => {
  const newFiles = uploadedFiles.map(file => ({
    projectId: projectId,
    filename: file.name,
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
    thumbnail: file.thumbnail || file.thumbnailUrl || '',// ПУТЬ С СЕРВЕРА // <-- если сервер отдаёт ссылку, иначе пусть будет пусто
    notes: '',
    tags: []
  }));

  addFiles(newFiles);
  setShowUpload(false);
};


  const handleExportCSV = () => {
    const exportData = filteredFiles.map(file => ({
      id: file.id,
      filename: file.filename,
      newNamePhoto: file.newNamePhoto,
      titleAdobe: file.titleAdobe,
      description: file.description,
      keywords: file.keywords,
      prompt: file.prompt,
      keysAdobe: file.keysAdobe,
      adobeCategory: file.adobeCategory,
      notes: file.notes,
      tags: file.tags,
      status: file.status,
      uploaded: file.uploaded,
      size: file.size
    }));

    exportToCSV(exportData, `${project.name}-files-${Date.now()}.csv`);
  };

  const handleBulkEdit = (updates: { id: number; data: Partial<any> }[]) => {
    updateFiles(updates);
    setShowBulkEdit(false);
  };

  const handleExportProject = () => {
    setImportExportMode('export');
    setShowImportExportModal(true);
  };

  const handleImportProject = () => {
    setImportExportMode('import');
    setShowImportExportModal(true);
  };

  const selectedFileObjects = filteredFiles.filter(f => selectedFiles.includes(f.id));

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
            onClick={handleImportProject}
            className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg"
            title="Import to project"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button 
            onClick={handleExportProject}
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

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <Image className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-xl font-bold text-gray-900">{files.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 rounded-lg p-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Processed</p>
              <p className="text-xl font-bold text-gray-900">{files.filter(f => f.status === 'completed').length}</p>
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
              <p className="text-xl font-bold text-gray-900">{files.filter(f => f.status === 'error').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 rounded-lg p-2">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Filtered Results</p>
              <p className="text-xl font-bold text-gray-900">{filteredFiles.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-lg">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onAdvancedFilters={() => setShowAdvancedFilters(true)}
              suggestions={searchSuggestions}
              recentSearches={recentSearches}
              placeholder="Search files by name, keywords, description..."
              hasActiveFilters={hasActiveFilters()}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedFiles.length > 0 && (
              <>
                <span className="text-sm text-gray-600">{selectedFiles.length} selected</span>
                <button 
                  onClick={() => setShowBulkEdit(true)}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  <FileText className="w-3 h-3 inline mr-1" />
                  Bulk Edit
                </button>
                <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                  <Play className="w-3 h-3 inline mr-1" />
                  Reprocess
                </button>
                <button 
                  onClick={() => deleteFiles(selectedFiles)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  Delete
                </button>
              </>
            )}
            
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <div className="w-4 h-4 flex flex-col space-y-0.5">
                  <div className="bg-current h-0.5 rounded-sm"></div>
                  <div className="bg-current h-0.5 rounded-sm"></div>
                  <div className="bg-current h-0.5 rounded-sm"></div>
                </div>
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

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Select all visible</span>
            </label>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Showing {filteredFiles.length} of {files.length} files
              </span>
              <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                <Pause className="w-4 h-4" />
                <span>Pause Queue</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                <RefreshCw className="w-4 h-4" />
                <span>Retry Failed</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Files Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${
              selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {viewMode === 'grid' ? (
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => handleSelectFile(file.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(file.status)}
                    <button 
                      onClick={() => setEditingFile(file)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  <img
                    src={file.thumbnail}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {file.newNamePhoto || file.filename}
                  </h4>
                  {file.titleAdobe && (
                    <p className="text-xs text-blue-600 truncate">{file.titleAdobe}</p>
                  )}
                  <p className="text-xs text-gray-500">{file.size} • {new Date(file.uploaded).toLocaleDateString()}</p>
                  
                  {file.adobeCategory && (
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      {file.adobeCategory}
                    </span>
                  )}
                  
                  {file.status === 'completed' && file.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{file.description}</p>
                  )}
                  
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-600">{file.error}</p>
                  )}
                  
                  {file.keysAdobe.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {file.keysAdobe.slice(0, 3).map((key) => (
                        <span key={key} className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          {key}
                        </span>
                      ))}
                      {file.keysAdobe.length > 3 && (
                        <span className="text-xs text-gray-500">+{file.keysAdobe.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => handleSelectFile(file.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={file.thumbnail}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {file.newNamePhoto || file.filename}
                    </h4>
                    {getStatusIcon(file.status)}
                  </div>
                  {file.titleAdobe && (
                    <p className="text-xs text-blue-600 truncate mb-1">{file.titleAdobe}</p>
                  )}
                  <p className="text-xs text-gray-500 mb-1">{file.size} • {new Date(file.uploaded).toLocaleDateString()}</p>
                  {file.adobeCategory && (
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      {file.adobeCategory}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setEditingFile(file)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Tag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
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
          onSave={handleBulkEdit}
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