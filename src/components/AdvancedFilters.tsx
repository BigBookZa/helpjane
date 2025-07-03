import React, { useState } from 'react';
import { 
  Filter, 
  X, 
  Calendar, 
  Tag, 
  Image, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Search,
  RotateCcw,
  Folder
} from 'lucide-react';

export interface FilterOptions {
  status: string[];
  dateRange: {
    start: string;
    end: string;
  };
  adobeCategories: string[];
  tags: string[];
  keywords: string[];
  sizeRange: {
    min: number;
    max: number;
  };
  hasDescription: boolean | null;
  hasKeywords: boolean | null;
  hasAdobeKeys: boolean | null;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableTags: string[];
  availableKeywords: string[];
  availableAdobeCategories: string[];
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableTags,
  availableKeywords,
  availableAdobeCategories
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const statusOptions = [
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
    { value: 'processing', label: 'Processing', icon: Clock, color: 'text-orange-600' },
    { value: 'error', label: 'Error', icon: AlertCircle, color: 'text-red-600' },
    { value: 'queued', label: 'Queued', icon: Clock, color: 'text-blue-600' }
  ];

  const handleStatusToggle = (status: string) => {
    const newStatus = localFilters.status.includes(status)
      ? localFilters.status.filter(s => s !== status)
      : [...localFilters.status, status];
    
    setLocalFilters(prev => ({ ...prev, status: newStatus }));
  };

  const handleTagToggle = (tag: string) => {
    const newTags = localFilters.tags.includes(tag)
      ? localFilters.tags.filter(t => t !== tag)
      : [...localFilters.tags, tag];
    
    setLocalFilters(prev => ({ ...prev, tags: newTags }));
  };

  const handleKeywordToggle = (keyword: string) => {
    const newKeywords = localFilters.keywords.includes(keyword)
      ? localFilters.keywords.filter(k => k !== keyword)
      : [...localFilters.keywords, keyword];
    
    setLocalFilters(prev => ({ ...prev, keywords: newKeywords }));
  };

  const handleAdobeCategoryToggle = (category: string) => {
    const newCategories = localFilters.adobeCategories.includes(category)
      ? localFilters.adobeCategories.filter(c => c !== category)
      : [...localFilters.adobeCategories, category];
    
    setLocalFilters(prev => ({ ...prev, adobeCategories: newCategories }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters: FilterOptions = {
      status: [],
      dateRange: { start: '', end: '' },
      adobeCategories: [],
      tags: [],
      keywords: [],
      sizeRange: { min: 0, max: 100 },
      hasDescription: null,
      hasKeywords: null,
      hasAdobeKeys: null
    };
    setLocalFilters(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.status.length > 0) count++;
    if (localFilters.dateRange.start || localFilters.dateRange.end) count++;
    if (localFilters.adobeCategories.length > 0) count++;
    if (localFilters.tags.length > 0) count++;
    if (localFilters.keywords.length > 0) count++;
    if (localFilters.sizeRange.min > 0 || localFilters.sizeRange.max < 100) count++;
    if (localFilters.hasDescription !== null) count++;
    if (localFilters.hasKeywords !== null) count++;
    if (localFilters.hasAdobeKeys !== null) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Advanced Filters</h2>
              <p className="text-sm text-gray-600">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Status</span>
              </h3>
              <div className="space-y-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localFilters.status.includes(option.value)}
                        onChange={() => handleStatusToggle(option.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Icon className={`w-4 h-4 ${option.color}`} />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Upload Date</span>
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From</label>
                  <input
                    type="date"
                    value={localFilters.dateRange.start}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To</label>
                  <input
                    type="date"
                    value={localFilters.dateRange.end}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Adobe Categories Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <Folder className="w-4 h-4" />
                <span>Adobe Categories</span>
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {availableAdobeCategories.map((category) => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.adobeCategories.includes(category)}
                      onChange={() => handleAdobeCategoryToggle(category)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File Size Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <Image className="w-4 h-4" />
                <span>File Size (MB)</span>
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={localFilters.sizeRange.min || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      sizeRange: { ...prev.sizeRange, min: Number(e.target.value) || 0 }
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={localFilters.sizeRange.max || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      sizeRange: { ...prev.sizeRange, max: Number(e.target.value) || 100 }
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Tags</span>
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {availableTags.map((tag) => (
                  <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.tags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Keywords Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Keywords</span>
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {availableKeywords.slice(0, 20).map((keyword) => (
                  <label key={keyword} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.keywords.includes(keyword)}
                      onChange={() => handleKeywordToggle(keyword)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{keyword}</span>
                  </label>
                ))}
                {availableKeywords.length > 20 && (
                  <p className="text-xs text-gray-500 italic">
                    Showing first 20 keywords. Use search to find specific keywords.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content Filters */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Content Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">Has Description</label>
                <select
                  value={localFilters.hasDescription === null ? '' : localFilters.hasDescription.toString()}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    hasDescription: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2">Has Keywords</label>
                <select
                  value={localFilters.hasKeywords === null ? '' : localFilters.hasKeywords.toString()}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    hasKeywords: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2">Has Adobe Keys</label>
                <select
                  value={localFilters.hasAdobeKeys === null ? '' : localFilters.hasAdobeKeys.toString()}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    hasAdobeKeys: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;