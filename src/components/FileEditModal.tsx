import React, { useState } from 'react';
import { X, Save, Image, Tag, FileText, Hash, Folder } from 'lucide-react';
import { FileData } from '../store/useStore';

interface FileEditModalProps {
  file: FileData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<FileData>) => void;
}

const FileEditModal: React.FC<FileEditModalProps> = ({
  file,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    newNamePhoto: file.newNamePhoto || '',
    titleAdobe: file.titleAdobe || '',
    description: file.description || '',
    keywords: file.keywords.join(', '),
    prompt: file.prompt || '',
    keysAdobe: file.keysAdobe.join(', '),
    adobeCategory: file.adobeCategory || '',
    notes: file.notes || '',
    tags: file.tags.join(', ')
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const adobeCategories = [
    'Abstract',
    'Animals/Wildlife',
    'Arts',
    'Backgrounds/Textures',
    'Beauty/Fashion',
    'Buildings/Landmarks',
    'Business/Finance',
    'Celebrities',
    'Education',
    'Food and Drink',
    'Healthcare/Medical',
    'Holidays',
    'Industrial',
    'Interiors',
    'Miscellaneous',
    'Nature',
    'Objects',
    'Parks/Outdoor',
    'People',
    'Religion',
    'Science',
    'Signs/Symbols',
    'Sports/Recreation',
    'Technology',
    'Transportation',
    'Travel'
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.newNamePhoto.trim()) {
      newErrors.newNamePhoto = 'New photo name is required';
    }

    if (!formData.titleAdobe.trim()) {
      newErrors.titleAdobe = 'Adobe title is required';
    }

    if (!formData.adobeCategory) {
      newErrors.adobeCategory = 'Adobe category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const updates: Partial<FileData> = {
        newNamePhoto: formData.newNamePhoto.trim(),
        titleAdobe: formData.titleAdobe.trim(),
        description: formData.description.trim(),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        prompt: formData.prompt.trim(),
        keysAdobe: formData.keysAdobe.split(',').map(k => k.trim()).filter(k => k),
        adobeCategory: formData.adobeCategory,
        notes: formData.notes.trim(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };
      
      onSave(updates);
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData({
      newNamePhoto: file.newNamePhoto || '',
      titleAdobe: file.titleAdobe || '',
      description: file.description || '',
      keywords: file.keywords.join(', '),
      prompt: file.prompt || '',
      keysAdobe: file.keysAdobe.join(', '),
      adobeCategory: file.adobeCategory || '',
      notes: file.notes || '',
      tags: file.tags.join(', ')
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit File</h2>
              <p className="text-sm text-gray-600">{file.filename}</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Image Preview */}
          <div className="w-1/3 p-6 border-r border-gray-200">
            <div className="h-full flex flex-col">
              <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={file.thumbnail}
                  alt={file.filename}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Original:</strong> {file.filename}</p>
                <p><strong>Size:</strong> {file.size}</p>
                <p><strong>Uploaded:</strong> {file.uploaded}</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Photo Name *
                  </label>
                  <input
                    type="text"
                    value={formData.newNamePhoto}
                    onChange={(e) => setFormData(prev => ({ ...prev, newNamePhoto: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.newNamePhoto ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter new photo name"
                  />
                  {errors.newNamePhoto && <p className="text-xs text-red-600 mt-1">{errors.newNamePhoto}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adobe Title *
                  </label>
                  <input
                    type="text"
                    value={formData.titleAdobe}
                    onChange={(e) => setFormData(prev => ({ ...prev, titleAdobe: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.titleAdobe ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter Adobe title"
                  />
                  {errors.titleAdobe && <p className="text-xs text-red-600 mt-1">{errors.titleAdobe}</p>}
                </div>
              </div>

              {/* Adobe Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adobe Category *
                </label>
                <select
                  value={formData.adobeCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, adobeCategory: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.adobeCategory ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Adobe category</option>
                  {adobeCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.adobeCategory && <p className="text-xs text-red-600 mt-1">{errors.adobeCategory}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter description"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter keywords separated by commas"
                />
              </div>

              {/* Adobe Keys */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adobe Keys
                </label>
                <input
                  type="text"
                  value={formData.keysAdobe}
                  onChange={(e) => setFormData(prev => ({ ...prev, keysAdobe: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Adobe keys separated by commas"
                />
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter prompt used for AI processing"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tags separated by commas"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add your notes here"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileEditModal;