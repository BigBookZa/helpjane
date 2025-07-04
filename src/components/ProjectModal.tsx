import React, { useState } from 'react';
import { Save, X, FolderOpen, HardDrive, Cloud, Tag } from 'lucide-react';
import { useStore, Project } from '../store/useStore';
import { createProject } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

interface ProjectModalProps {
  project?: Project;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const updateProject = useStore((state) => state.updateProject);
  const loadProjects = useStore((state) => state.loadProjects);
  const { showSuccess, showError } = useNotifications();
  
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    category: project?.category || 'general',
    storage: project?.storage || 'local' as 'local' | 'yandex',
    thumbnail_size: project?.thumbnail_size || 'medium' as 'small' | 'medium' | 'large',
    tags: project?.tags || [],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

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

  const thumbnailSizes = [
    { value: 'small', label: 'Small (150x150)', description: 'Faster loading, less storage' },
    { value: 'medium', label: 'Medium (300x300)', description: 'Balanced quality and size' },
    { value: 'large', label: 'Large (500x500)', description: 'High quality, more storage' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (project) {
        // Update existing project
        updateProject(project.id, formData);
        showSuccess('Project updated successfully');
      } else {
        // Create new project via API
        await createProject(formData);
        showSuccess('Project created successfully');
        // Reload projects to get the new one from server
        await loadProjects();
      }
      onClose();
    } catch (error: any) {
      console.error('Project save error:', error);
      showError(error.response?.data?.error || 'Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {project ? 'Edit Project' : 'Create New Project'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter project name"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={isLoading}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe your project"
              />
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Location
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="storage"
                      value="local"
                      checked={formData.storage === 'local'}
                      onChange={(e) => setFormData(prev => ({ ...prev, storage: e.target.value as 'local' | 'yandex' }))}
                      disabled={isLoading}
                      className="text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <HardDrive className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Local Storage</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="storage"
                      value="yandex"
                      checked={formData.storage === 'yandex'}
                      onChange={(e) => setFormData(prev => ({ ...prev, storage: e.target.value as 'local' | 'yandex' }))}
                      disabled={isLoading}
                      className="text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <Cloud className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Yandex Disk</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail Size
              </label>
              <div className="space-y-2">
                {thumbnailSizes.map(size => (
                  <label key={size.value} className="flex items-start space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="thumbnailSize"
                      value={size.value}
                      checked={formData.thumbnail_size === size.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_size: e.target.value as 'small' | 'medium' | 'large' }))}
                      disabled={isLoading}
                      className="text-blue-600 focus:ring-blue-500 mt-0.5 disabled:opacity-50"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{size.label}</div>
                      <div className="text-xs text-gray-500">{size.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Add a tag"
                />
                <button
                  onClick={addTag}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Tag className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => removeTag(tag)}
                        disabled={isLoading}
                        className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;