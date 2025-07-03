import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Copy, 
  Trash2, 
  Star,
  Tag,
  MessageSquare,
  Code,
  Settings,
  Play,
  Eye,
  Filter
} from 'lucide-react';
import { useStore } from '../store/useStore';
import TemplateEditor from '../components/TemplateEditor';

const Templates: React.FC = () => {
  const templates = useStore((state) => state.templates);
  const addTemplate = useStore((state) => state.addTemplate);
  const updateTemplate = useStore((state) => state.updateTemplate);
  const deleteTemplate = useStore((state) => state.deleteTemplate);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showVariables, setShowVariables] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'ecommerce', name: 'E-commerce', count: templates.filter(t => t.category === 'ecommerce').length },
    { id: 'photography', name: 'Photography', count: templates.filter(t => t.category === 'photography').length },
    { id: 'realestate', name: 'Real Estate', count: templates.filter(t => t.category === 'realestate').length },
    { id: 'medical', name: 'Medical', count: templates.filter(t => t.category === 'medical').length },
    { id: 'general', name: 'General', count: templates.filter(t => t.category === 'general').length },
    { id: 'art', name: 'Art & Design', count: templates.filter(t => t.category === 'art').length },
    { id: 'nature', name: 'Nature', count: templates.filter(t => t.category === 'nature').length },
    { id: 'documents', name: 'Documents', count: templates.filter(t => t.category === 'documents').length }
  ];

  const availableVariables = [
    { name: '{filename}', description: 'Original filename of the uploaded image' },
    { name: '{newNamePhoto}', description: 'New photo name assigned by user' },
    { name: '{titleAdobe}', description: 'Adobe title for the image' },
    { name: '{project_name}', description: 'Name of the current project' },
    { name: '{file_size}', description: 'Size of the uploaded file' },
    { name: '{upload_date}', description: 'Date and time when file was uploaded' },
    { name: '{user_name}', description: 'Name of the user who uploaded the file' },
    { name: '{category}', description: 'Project category' },
    { name: '{storage_type}', description: 'Storage location (local/yandex)' },
    { name: '{adobeCategory}', description: 'Adobe category for the image' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateEditor(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = (templateData: any) => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, templateData);
    } else {
      addTemplate(templateData);
    }
    setShowTemplateEditor(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateId: number) => {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      deleteTemplate(templateId);
    }
  };

  const handleCopyTemplate = (template: any) => {
    const newTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      isDefault: false
    };
    delete newTemplate.id;
    delete newTemplate.created;
    delete newTemplate.updated;
    delete newTemplate.usageCount;
    
    addTemplate(newTemplate);
  };

  const handleUseTemplate = (template: any) => {
    // This will be implemented when AI integration is added
    alert(`Template "${template.name}" will be applied to selected files when AI integration is implemented.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prompt Templates</h1>
          <p className="text-gray-600 mt-1">Manage AI prompt templates for image analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Code className="w-4 h-4" />
            <span>Variables</span>
          </button>
          <button 
            onClick={handleCreateTemplate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Variables Panel */}
      {showVariables && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Variables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableVariables.map((variable) => (
              <div key={variable.name} className="p-3 bg-gray-50 rounded-lg">
                <code className="text-sm font-mono text-blue-600">{variable.name}</code>
                <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories Sidebar */}
        <div className="w-full lg:w-64 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      {template.isDefault && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          <Star className="w-3 h-3" />
                          <span>Default</span>
                        </div>
                      )}
                      <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
                        {template.category}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setPreviewTemplate(template)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Preview template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleCopyTemplate(template)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Copy template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEditTemplate(template)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Edit template"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Prompt Template</span>
                  </div>
                  <p className="text-sm text-gray-700 font-mono leading-relaxed line-clamp-4">
                    {template.prompt}
                  </p>
                </div>

                {template.variables.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Variables Used</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable) => (
                        <code key={variable} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-mono">
                          {variable}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <span>Used {template.usageCount?.toLocaleString() || 0} times</span>
                    <span>Created {new Date(template.created).toLocaleDateString()}</span>
                    <span>Updated {new Date(template.updated).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => handleUseTemplate(template)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Play className="w-3 h-3" />
                    <span>Use Template</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first template to get started'}
              </p>
              <button 
                onClick={searchTerm ? () => setSearchTerm('') : handleCreateTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {searchTerm ? 'Clear Search' : 'Create Template'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Template Editor Modal */}
      <TemplateEditor
        template={editingTemplate}
        isOpen={showTemplateEditor}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowTemplateEditor(false);
          setEditingTemplate(null);
        }}
      />

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{previewTemplate.name}</h2>
                  <p className="text-sm text-gray-600">{previewTemplate.description}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Template Prompt</h3>
                <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono leading-relaxed">
                  {previewTemplate.prompt}
                </pre>
              </div>
              
              {previewTemplate.variables.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Variables Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.variables.map((variable: string) => (
                      <code key={variable} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-mono">
                        {variable}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;