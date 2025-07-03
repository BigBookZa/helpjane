import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileText, 
  Database, 
  AlertCircle, 
  CheckCircle,
  Folder,
  Image,
  Settings,
  Archive,
  FileDown,
  FileUp,
  HardDrive,
  Cloud
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportToCSV, parseCSVFile, validateCSVData } from '../utils/csvUtils';
import { downloadFile } from '../utils/fileUtils';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
  projectId?: number;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  mode,
  projectId
}) => {
  const projects = useStore((state) => state.projects);
  const files = useStore((state) => state.files);
  const templates = useStore((state) => state.templates);
  const settings = useStore((state) => state.settings);
  const addProject = useStore((state) => state.addProject);
  const addFiles = useStore((state) => state.addFiles);
  const addTemplate = useStore((state) => state.addTemplate);
  const updateSettings = useStore((state) => state.updateSettings);

  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportScope, setExportScope] = useState<'project' | 'all' | 'settings' | 'templates'>('project');
  const [includeFiles, setIncludeFiles] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(false);
  const [includeTemplates, setIncludeTemplates] = useState(false);
  
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentProject = projectId ? projects.find(p => p.id === projectId) : null;
  const projectFiles = projectId ? files.filter(f => f.projectId === projectId) : [];

  const handleExport = async () => {
    setIsProcessing(true);
    
    try {
      let exportData: any = {};
      let filename = '';

      switch (exportScope) {
        case 'project':
          if (!currentProject) {
            throw new Error('Project not found');
          }
          exportData = {
            project: currentProject,
            files: includeFiles ? projectFiles : [],
            exportedAt: new Date().toISOString(),
            version: '1.0'
          };
          filename = `${currentProject.name.replace(/[^a-zA-Z0-9]/g, '_')}_export`;
          break;

        case 'all':
          exportData = {
            projects,
            files: includeFiles ? files : [],
            templates: includeTemplates ? templates : [],
            settings: includeSettings ? settings : undefined,
            exportedAt: new Date().toISOString(),
            version: '1.0'
          };
          filename = 'all_projects_export';
          break;

        case 'settings':
          exportData = {
            settings,
            exportedAt: new Date().toISOString(),
            version: '1.0'
          };
          filename = 'settings_export';
          break;

        case 'templates':
          exportData = {
            templates,
            exportedAt: new Date().toISOString(),
            version: '1.0'
          };
          filename = 'templates_export';
          break;
      }

      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        downloadFile(blob, `${filename}.json`);
      } else {
        // CSV export
        if (exportScope === 'project' || exportScope === 'all') {
          const csvData = (exportScope === 'project' ? projectFiles : files).map(file => ({
            id: file.id,
            projectId: file.projectId,
            filename: file.filename,
            newNamePhoto: file.newNamePhoto,
            titleAdobe: file.titleAdobe,
            size: file.size,
            uploaded: file.uploaded,
            status: file.status,
            description: file.description,
            keywords: file.keywords.join('; '),
            prompt: file.prompt,
            keysAdobe: file.keysAdobe.join('; '),
            adobeCategory: file.adobeCategory,
            notes: file.notes,
            tags: file.tags.join('; ')
          }));
          exportToCSV(csvData, `${filename}.csv`);
        } else {
          throw new Error('CSV format is only available for project and all data exports');
        }
      }

      onClose();
    } catch (error) {
      setImportErrors([error instanceof Error ? error.message : 'Export failed']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportErrors([]);
    setImportPreview(null);

    try {
      let data: any;
      
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        const csvData = await parseCSVFile(file);
        data = { files: csvData };
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV files.');
      }

      // Validate data structure
      const errors = validateImportData(data);
      if (errors.length > 0) {
        setImportErrors(errors);
        return;
      }

      setImportPreview(data);
    } catch (error) {
      setImportErrors([error instanceof Error ? error.message : 'Failed to parse file']);
    }
  };

  const validateImportData = (data: any): string[] => {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Invalid file format');
      return errors;
    }

    // Validate version compatibility
    if (data.version && data.version !== '1.0') {
      errors.push(`Unsupported version: ${data.version}. Expected version 1.0.`);
    }

    // Validate project structure
    if (data.project) {
      const requiredProjectFields = ['name', 'description', 'category'];
      const missingFields = requiredProjectFields.filter(field => !data.project[field]);
      if (missingFields.length > 0) {
        errors.push(`Project missing required fields: ${missingFields.join(', ')}`);
      }
    }

    // Validate files structure
    if (data.files && Array.isArray(data.files)) {
      const requiredFileFields = ['filename', 'size', 'uploaded'];
      data.files.forEach((file: any, index: number) => {
        const missingFields = requiredFileFields.filter(field => !file[field]);
        if (missingFields.length > 0) {
          errors.push(`File ${index + 1} missing required fields: ${missingFields.join(', ')}`);
        }
      });
    }

    return errors;
  };

  const handleImport = async () => {
    if (!importPreview) return;

    setIsProcessing(true);
    
    try {
      // Import project
      if (importPreview.project) {
        const projectData = {
          ...importPreview.project,
          storage: importPreview.project.storage || 'local',
          thumbnailSize: importPreview.project.thumbnailSize || 'medium',
          tags: importPreview.project.tags || []
        };
        delete projectData.id;
        delete projectData.created;
        delete projectData.updated;
        delete projectData.filesCount;
        delete projectData.processed;
        delete projectData.errors;
        delete projectData.status;
        
        addProject(projectData);
      }

      // Import multiple projects
      if (importPreview.projects && Array.isArray(importPreview.projects)) {
        importPreview.projects.forEach((project: any) => {
          const projectData = {
            ...project,
            storage: project.storage || 'local',
            thumbnailSize: project.thumbnailSize || 'medium',
            tags: project.tags || []
          };
          delete projectData.id;
          delete projectData.created;
          delete projectData.updated;
          delete projectData.filesCount;
          delete projectData.processed;
          delete projectData.errors;
          delete projectData.status;
          
          addProject(projectData);
        });
      }

      // Import files
      if (importPreview.files && Array.isArray(importPreview.files)) {
        const filesData = importPreview.files.map((file: any) => ({
          ...file,
          projectId: projectId || Date.now(), // Use current project or create new
          keywords: typeof file.keywords === 'string' 
            ? file.keywords.split(';').map((k: string) => k.trim()).filter((k: string) => k)
            : file.keywords || [],
          keysAdobe: typeof file.keysAdobe === 'string'
            ? file.keysAdobe.split(';').map((k: string) => k.trim()).filter((k: string) => k)
            : file.keysAdobe || [],
          tags: typeof file.tags === 'string'
            ? file.tags.split(';').map((t: string) => t.trim()).filter((t: string) => t)
            : file.tags || [],
          status: 'queued',
          attempts: 0,
          processingTime: '',
          thumbnail: file.thumbnail || '/placeholder-image.jpg'
        }));
        
        addFiles(filesData);
      }

      // Import templates
      if (importPreview.templates && Array.isArray(importPreview.templates)) {
        importPreview.templates.forEach((template: any) => {
          const templateData = {
            ...template,
            variables: template.variables || [],
            isDefault: false
          };
          delete templateData.id;
          delete templateData.created;
          delete templateData.updated;
          delete templateData.usageCount;
          
          addTemplate(templateData);
        });
      }

      // Import settings
      if (importPreview.settings) {
        const settingsData = {
          ...importPreview.settings,
          // Preserve sensitive data
          apiKey: settings.apiKey,
          telegramBotToken: settings.telegramBotToken,
          yandexToken: settings.yandexToken
        };
        updateSettings(settingsData);
      }

      onClose();
    } catch (error) {
      setImportErrors([error instanceof Error ? error.message : 'Import failed']);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPreviewStats = () => {
    if (!importPreview) return null;

    const stats = {
      projects: 0,
      files: 0,
      templates: 0,
      hasSettings: false
    };

    if (importPreview.project) stats.projects = 1;
    if (importPreview.projects) stats.projects = importPreview.projects.length;
    if (importPreview.files) stats.files = importPreview.files.length;
    if (importPreview.templates) stats.templates = importPreview.templates.length;
    if (importPreview.settings) stats.hasSettings = true;

    return stats;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              mode === 'export' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {mode === 'export' ? (
                <Download className={`w-5 h-5 ${mode === 'export' ? 'text-green-600' : 'text-blue-600'}`} />
              ) : (
                <Upload className={`w-5 h-5 ${mode === 'export' ? 'text-green-600' : 'text-blue-600'}`} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'export' ? 'Export Project Data' : 'Import Project Data'}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === 'export' 
                  ? 'Export your projects and data for backup or sharing'
                  : 'Import projects and data from backup files'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {mode === 'export' ? (
            <div className="space-y-6">
              {/* Export Scope */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">What to Export</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportScope"
                      value="project"
                      checked={exportScope === 'project'}
                      onChange={(e) => setExportScope(e.target.value as any)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                      disabled={!currentProject}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Folder className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-900">Current Project</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {currentProject ? currentProject.name : 'No project selected'}
                      </p>
                      {currentProject && (
                        <p className="text-xs text-gray-500 mt-1">
                          {projectFiles.length} files
                        </p>
                      )}
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportScope"
                      value="all"
                      checked={exportScope === 'all'}
                      onChange={(e) => setExportScope(e.target.value as any)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Database className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-gray-900">All Projects</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Export all projects and data
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {projects.length} projects, {files.length} files
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportScope"
                      value="settings"
                      checked={exportScope === 'settings'}
                      onChange={(e) => setExportScope(e.target.value as any)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Settings className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-900">Settings Only</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Export application settings
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportScope"
                      value="templates"
                      checked={exportScope === 'templates'}
                      onChange={(e) => setExportScope(e.target.value as any)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-gray-900">Templates Only</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Export prompt templates
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {templates.length} templates
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Export Options */}
              {(exportScope === 'project' || exportScope === 'all') && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={includeFiles}
                        onChange={(e) => setIncludeFiles(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Image className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Include file data and metadata</span>
                      </div>
                    </label>

                    {exportScope === 'all' && (
                      <>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={includeTemplates}
                            onChange={(e) => setIncludeTemplates(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">Include prompt templates</span>
                          </div>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={includeSettings}
                            onChange={(e) => setIncludeSettings(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-2">
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">Include application settings</span>
                          </div>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Export Format */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Export Format</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <FileDown className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-900">JSON Format</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Complete data with full structure preservation
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended for backup and migration
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                      disabled={exportScope === 'settings' || exportScope === 'templates'}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-gray-900">CSV Format</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Spreadsheet-compatible file data only
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        For analysis and external processing
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Import File</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="import-file"
                  />
                  <label htmlFor="import-file" className="cursor-pointer">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileUp className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Choose file to import
                    </h4>
                    <p className="text-sm text-gray-600">
                      Supports JSON and CSV files exported from Helper for Jane
                    </p>
                  </label>
                </div>
              </div>

              {/* Import Errors */}
              {importErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Import Errors</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {importErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Preview */}
              {importPreview && importErrors.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-800 mb-3">Import Preview</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(() => {
                          const stats = getPreviewStats();
                          return (
                            <>
                              {stats?.projects > 0 && (
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-700">{stats.projects}</div>
                                  <div className="text-xs text-green-600">Projects</div>
                                </div>
                              )}
                              {stats?.files > 0 && (
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-700">{stats.files}</div>
                                  <div className="text-xs text-green-600">Files</div>
                                </div>
                              )}
                              {stats?.templates > 0 && (
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-700">{stats.templates}</div>
                                  <div className="text-xs text-green-600">Templates</div>
                                </div>
                              )}
                              {stats?.hasSettings && (
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-700">✓</div>
                                  <div className="text-xs text-green-600">Settings</div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      {importPreview.exportedAt && (
                        <p className="text-xs text-green-600 mt-2">
                          Exported: {new Date(importPreview.exportedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          
          {mode === 'export' ? (
            <button
              onClick={handleExport}
              disabled={isProcessing || (exportScope === 'project' && !currentProject)}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isProcessing ? 'Exporting...' : 'Export Data'}</span>
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={isProcessing || !importPreview || importErrors.length > 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isProcessing ? 'Importing...' : 'Import Data'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;