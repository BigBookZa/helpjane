import React, { useState } from 'react';
import { Save, X, Code, Eye, TestTube, Copy, Tag, Wand2 } from 'lucide-react';
import { Template } from '../store/useStore';

interface TemplateEditorProps {
  template?: Template;
  onSave: (template: Omit<Template, 'id' | 'created' | 'updated' | 'usageCount'>) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  isOpen
}) => {
  const [formData, setFormData] = useState<Omit<Template, 'id' | 'created' | 'updated' | 'usageCount'>>({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'general',
    prompt: template?.prompt || '',
    variables: template?.variables || [],
    isDefault: template?.isDefault || false,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableVariables = [
    { name: '{filename}', description: 'Original filename of the uploaded image', sample: 'product_001.jpg' },
    { name: '{newNamePhoto}', description: 'New photo name assigned by user', sample: 'luxury-watch-gold' },
    { name: '{titleAdobe}', description: 'Adobe title for the image', sample: 'Luxury Gold Watch on White Background' },
    { name: '{project_name}', description: 'Name of the current project', sample: 'E-commerce Products' },
    { name: '{file_size}', description: 'Size of the uploaded file', sample: '2.4 MB' },
    { name: '{upload_date}', description: 'Date and time when file was uploaded', sample: '2024-01-18 14:30' },
    { name: '{user_name}', description: 'Name of the user who uploaded the file', sample: 'Jane Doe' },
    { name: '{category}', description: 'Project category', sample: 'E-commerce' },
    { name: '{storage_type}', description: 'Storage location (local/yandex)', sample: 'Local' },
    { name: '{adobeCategory}', description: 'Adobe category for the image', sample: 'Objects' }
  ];

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'photography', label: 'Photography' },
    { value: 'realestate', label: 'Real Estate' },
    { value: 'medical', label: 'Medical' },
    { value: 'documents', label: 'Documents' },
    { value: 'art', label: 'Art & Design' },
    { value: 'nature', label: 'Nature' }
  ];

  const presetTemplates = [
    {
      name: 'E-commerce Product Description',
      prompt: 'Analyze this product image ({filename}) and provide:\n\n1. Product Name: [Descriptive name based on what you see]\n2. Detailed Description: [150-200 words describing the product, materials, features, and benefits]\n3. Key Features: [5-7 bullet points of main features]\n4. Target Audience: [Who would buy this product]\n5. SEO Keywords: [10-15 relevant keywords for search optimization]\n\nFormat the response clearly with each section labeled.',
      category: 'ecommerce'
    },
    {
      name: 'Stock Photography Keywords',
      prompt: 'Generate comprehensive metadata for this stock photo ({filename}):\n\n1. Title: [Concise, descriptive title under 60 characters]\n2. Description: [Detailed 150-200 word description]\n3. Keywords: [25-30 relevant keywords separated by commas]\n4. Technical Details: [Camera settings, lighting, composition style if visible]\n5. Mood/Emotion: [Emotional tone and atmosphere]\n6. Usage Suggestions: [Potential commercial uses]',
      category: 'photography'
    },
    {
      name: 'Real Estate Property Analysis',
      prompt: 'Analyze this property image ({filename}) for real estate listing:\n\n1. Property Type: [House/Apartment/Commercial/Land]\n2. Architectural Style: [Modern/Traditional/Contemporary/etc.]\n3. Key Features: [Notable architectural and design elements]\n4. Room/Space Analysis: [What room or area is shown, key features]\n5. Condition Assessment: [New/Renovated/Well-maintained/etc.]\n6. Marketing Highlights: [What makes this property attractive to buyers]\n7. Suggested Description: [2-3 sentences for listing]',
      category: 'realestate'
    }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt template is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('prompt-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newPrompt = formData.prompt.substring(0, start) + variable + formData.prompt.substring(end);
      
      setFormData(prev => ({ 
        ...prev, 
        prompt: newPrompt,
        variables: [...new Set([...prev.variables, variable])]
      }));
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const generatePreview = () => {
    let preview = formData.prompt;
    availableVariables.forEach(variable => {
      preview = preview.replace(
        new RegExp(variable.name.replace(/[{}]/g, '\\$&'), 'g'), 
        variable.sample
      );
    });
    return preview;
  };

  const loadPresetTemplate = (preset: typeof presetTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      name: preset.name,
      prompt: preset.prompt,
      category: preset.category,
      variables: extractVariablesFromPrompt(preset.prompt)
    }));
  };

  const extractVariablesFromPrompt = (prompt: string): string[] => {
    const matches = prompt.match(/\{[^}]+\}/g);
    return matches ? [...new Set(matches)] : [];
  };

  // Update variables when prompt changes
  React.useEffect(() => {
    const variables = extractVariablesFromPrompt(formData.prompt);
    setFormData(prev => ({ ...prev, variables }));
  }, [formData.prompt]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {template ? 'Edit Template' : 'Create New Template'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(95vh-140px)]">
          {/* Main Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Preset Templates */}
              {!template && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">Quick Start Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {presetTemplates.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => loadPresetTemplate(preset)}
                        className="text-left p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium text-blue-900 text-sm">{preset.name}</div>
                        <div className="text-xs text-blue-600 capitalize">{preset.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter template name"
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe what this template does"
                />
                {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Prompt Template *
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{showPreview ? 'Edit' : 'Preview'}</span>
                    </button>
                    <button
                      onClick={() => alert('Test functionality will be implemented with AI integration')}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      <TestTube className="w-3 h-3" />
                      <span>Test</span>
                    </button>
                  </div>
                </div>
                
                {showPreview ? (
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 min-h-[300px]">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preview with sample data:</h4>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap font-mono leading-relaxed">
                      {generatePreview()}
                    </div>
                  </div>
                ) : (
                  <textarea
                    id="prompt-textarea"
                    value={formData.prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                    rows={12}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                      errors.prompt ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your prompt template here. Use variables like {filename} to insert dynamic content."
                  />
                )}
                {errors.prompt && <p className="text-xs text-red-600 mt-1">{errors.prompt}</p>}
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Set as default template for new projects</span>
                </label>
              </div>
            </div>
          </div>

          {/* Variables Sidebar */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Variables</h3>
            <div className="space-y-3">
              {availableVariables.map((variable) => (
                <div key={variable.name} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono text-blue-600">{variable.name}</code>
                    <button
                      onClick={() => insertVariable(variable.name)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="Insert variable"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{variable.description}</p>
                  <p className="text-xs text-gray-500 font-mono">Example: {variable.sample}</p>
                </div>
              ))}
            </div>

            {formData.variables.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Used Variables</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.variables.map((variable) => (
                    <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-mono">
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Tips</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Use clear, specific instructions</li>
                <li>• Number your requirements for better structure</li>
                <li>• Include format specifications</li>
                <li>• Test with sample images</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{template ? 'Update Template' : 'Create Template'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;