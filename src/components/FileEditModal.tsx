// FileEditModal.tsx
// ВАЖНО: Убедитесь, что в интерфейсе FileData добавлено поле:
// original_filename?: string;

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Image, 
  Tag, 
  FileText, 
  Hash, 
  Folder,
  Copy,
  Eye,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Upload,
  Download,
  Maximize2,
  Minimize2,
  History,
  Wand2,
  Sparkles
} from 'lucide-react';
import { FileData } from '../store/useStore';

interface FileEditModalProps {
  file: FileData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<FileData>) => void;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ChangeHistory {
  timestamp: Date;
  field: string;
  oldValue: string;
  newValue: string;
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

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'ai' | 'history'>('basic');
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [changeHistory, setChangeHistory] = useState<ChangeHistory[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<{
    keywords: string[];
    description: string;
    title: string;
  } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const initialFormDataRef = useRef(formData);

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

  // Track changes for dirty state
  useEffect(() => {
    const hasChanges = Object.keys(formData).some(
      key => formData[key as keyof typeof formData] !== initialFormDataRef.current[key as keyof typeof formData]
    );
    setIsDirty(hasChanges);
  }, [formData]);

  // Enhanced validation
  const validateForm = (): ValidationError[] => {
    const newErrors: ValidationError[] = [];

    if (!formData.newNamePhoto.trim()) {
      newErrors.push({ field: 'newNamePhoto', message: 'New photo name is required' });
    } else if (formData.newNamePhoto.length < 3) {
      newErrors.push({ field: 'newNamePhoto', message: 'Photo name must be at least 3 characters' });
    }

    if (!formData.titleAdobe.trim()) {
      newErrors.push({ field: 'titleAdobe', message: 'Adobe title is required' });
    } else if (formData.titleAdobe.length < 5) {
      newErrors.push({ field: 'titleAdobe', message: 'Adobe title must be at least 5 characters' });
    }

    if (!formData.adobeCategory) {
      newErrors.push({ field: 'adobeCategory', message: 'Adobe category is required' });
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.push({ field: 'description', message: 'Description must be less than 1000 characters' });
    }

    // Validate keywords format
    if (formData.keywords) {
      const keywordList = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
      if (keywordList.length > 20) {
        newErrors.push({ field: 'keywords', message: 'Maximum 20 keywords allowed' });
      }
    }

    return newErrors;
  };

  const handleFieldChange = (field: string, value: string) => {
    const oldValue = formData[field as keyof typeof formData];
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Track change history
    if (oldValue !== value) {
      setChangeHistory(prev => [...prev, {
        timestamp: new Date(),
        field,
        oldValue,
        newValue: value
      }]);
    }
    
    // Clear errors for this field
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleSave = () => {
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

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
    setIsDirty(false);
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      resetAndClose();
    }
  };

  const resetAndClose = () => {
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
    setErrors([]);
    setIsDirty(false);
    setShowUnsavedWarning(false);
    setChangeHistory([]);
    onClose();
  };

  const generateAIsuggestions = async () => {
    setIsGeneratingAI(true);
    try {
      // Simulate AI API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI suggestions based on image analysis
      setAiSuggestions({
        keywords: ['professional', 'business', 'modern', 'corporate', 'clean'],
        description: 'Professional business photo featuring clean modern design with corporate aesthetic',
        title: 'Modern Professional Business Photography'
      });
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const applyAISuggestion = (type: 'keywords' | 'description' | 'title') => {
    if (!aiSuggestions) return;
    
    switch (type) {
      case 'keywords':
        const existingKeywords = formData.keysAdobe.split(',').map(k => k.trim()).filter(k => k);
        const newKeywords = [...existingKeywords, ...aiSuggestions.keywords].filter((keyword, index, arr) => arr.indexOf(keyword) === index);
        handleFieldChange('keysAdobe', newKeywords.join(', '));
        break;
      case 'description':
        handleFieldChange('description', aiSuggestions.description);
        break;
      case 'title':
        handleFieldChange('titleAdobe', aiSuggestions.title);
        break;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-xl transition-all duration-300 ${
        isFullscreen 
          ? 'w-full h-full max-w-none max-h-none' 
          : 'max-w-6xl w-full max-h-[95vh]'
      } overflow-hidden`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <span>Edit File</span>
                {isDirty && <div className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />}
              </h2>
              <p className="text-sm text-gray-600">{file.original_filename || file.filename}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advanced
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'ai'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Assistant</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
          </nav>
        </div>

        <div className="flex h-[calc(95vh-200px)]">
          {/* Image Preview */}
          <div className="w-1/3 p-6 border-r border-gray-200 bg-gray-50">
            <div className="h-full flex flex-col">
              <div className="flex-1 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                <img
                  src={file.thumbnail}
                  alt={file.original_filename || file.filename}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="text-sm">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-600">Original:</span>
                    <span className="font-medium truncate ml-2">{file.original_filename || file.filename}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{file.size}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-600">Uploaded:</span>
                    <span className="font-medium">{new Date(file.uploaded).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium capitalize ${
                      file.status === 'completed' ? 'text-green-600' :
                      file.status === 'error' ? 'text-red-600' :
                      'text-orange-600'
                    }`}>
                      {file.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Photo Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.newNamePhoto}
                        onChange={(e) => handleFieldChange('newNamePhoto', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          getFieldError('newNamePhoto') ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter new photo name"
                      />
                      <button
                        onClick={() => copyToClipboard(formData.newNamePhoto)}
                        className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    {getFieldError('newNamePhoto') && (
                      <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{getFieldError('newNamePhoto')}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.newNamePhoto.length}/100 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adobe Title *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.titleAdobe}
                        onChange={(e) => handleFieldChange('titleAdobe', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          getFieldError('titleAdobe') ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter Adobe title"
                      />
                      <button
                        onClick={() => copyToClipboard(formData.titleAdobe)}
                        className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    {getFieldError('titleAdobe') && (
                      <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{getFieldError('titleAdobe')}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.titleAdobe.length}/200 characters
                    </p>
                  </div>
                </div>

                {/* Adobe Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adobe Category *
                  </label>
                  <select
                    value={formData.adobeCategory}
                    onChange={(e) => handleFieldChange('adobeCategory', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      getFieldError('adobeCategory') ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Adobe category</option>
                    {adobeCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {getFieldError('adobeCategory') && (
                    <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{getFieldError('adobeCategory')}</span>
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        getFieldError('description') ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter description"
                    />
                    <button
                      onClick={() => copyToClipboard(formData.description)}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {getFieldError('description') && (
                    <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{getFieldError('description')}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/1000 characters
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.keywords}
                      onChange={(e) => handleFieldChange('keywords', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        getFieldError('keywords') ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter keywords separated by commas"
                    />
                    <button
                      onClick={() => copyToClipboard(formData.keywords)}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {getFieldError('keywords') && (
                    <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{getFieldError('keywords')}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.keywords.split(',').filter(k => k.trim()).length}/20 keywords
                  </p>
                </div>

                {/* Adobe Keys */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adobe Keys
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.keysAdobe}
                      onChange={(e) => handleFieldChange('keysAdobe', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter Adobe keys separated by commas"
                    />
                    <button
                      onClick={() => copyToClipboard(formData.keysAdobe)}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.keysAdobe.split(',').filter(k => k.trim()).length} Adobe keys
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleFieldChange('tags', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter tags separated by commas"
                    />
                    <button
                      onClick={() => copyToClipboard(formData.tags)}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Prompt
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.prompt}
                      onChange={(e) => handleFieldChange('prompt', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter prompt used for AI processing"
                    />
                    <button
                      onClick={() => copyToClipboard(formData.prompt)}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add your notes here"
                    />
                    <button
                      onClick={() => copyToClipboard(formData.notes)}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                      <p className="text-sm text-gray-600">Generate content suggestions based on your image</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={generateAIsuggestions}
                    disabled={isGeneratingAI}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Generate AI Suggestions</span>
                      </>
                    )}
                  </button>
                </div>

                {aiSuggestions && (
                  <div className="space-y-4">
                    {/* AI Keywords Suggestion */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Suggested Keywords</h4>
                        <button
                          onClick={() => applyAISuggestion('keywords')}
                          className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                        >
                          Apply
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.keywords.map((keyword, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Title Suggestion */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Suggested Title</h4>
                        <button
                          onClick={() => applyAISuggestion('title')}
                          className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                        >
                          Apply
                        </button>
                      </div>
                      <p className="text-gray-700">{aiSuggestions.title}</p>
                    </div>

                    {/* AI Description Suggestion */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Suggested Description</h4>
                        <button
                          onClick={() => applyAISuggestion('description')}
                          className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                        >
                          Apply
                        </button>
                      </div>
                      <p className="text-gray-700">{aiSuggestions.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {changeHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Changes Yet</h3>
                    <p className="text-gray-600">Changes you make will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {changeHistory.slice().reverse().map((change, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 capitalize">
                            {change.field.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {change.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <div className="text-red-600 mb-1">
                            <span className="font-medium">From:</span> {change.oldValue || '(empty)'}
                          </div>
                          <div className="text-green-600">
                            <span className="font-medium">To:</span> {change.newValue || '(empty)'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            {errors.length > 0 && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.length} error(s) found</span>
              </div>
            )}
            {isDirty && (
              <div className="flex items-center space-x-2 text-orange-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span className="text-sm">Unsaved changes</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
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
                setErrors([]);
                setChangeHistory([]);
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={errors.length > 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
                  <p className="text-sm text-gray-600">You have unsaved changes. What would you like to do?</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUnsavedWarning(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Continue Editing
                </button>
                <button
                  onClick={() => {
                    handleSave();
                    setShowUnsavedWarning(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save & Close
                </button>
                <button
                  onClick={resetAndClose}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileEditModal;