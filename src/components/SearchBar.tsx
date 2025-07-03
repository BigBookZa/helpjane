import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Clock, 
  Tag, 
  Image, 
  FileText,
  Filter,
  Zap
} from 'lucide-react';

interface SearchSuggestion {
  type: 'filename' | 'tag' | 'keyword' | 'category' | 'description';
  value: string;
  count?: number;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onAdvancedFilters: () => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  placeholder?: string;
  hasActiveFilters?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onAdvancedFilters,
  suggestions = [],
  recentSearches = [],
  placeholder = "Search files...",
  hasActiveFilters = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.value.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 8);

  const filteredRecentSearches = recentSearches.filter(search =>
    search.toLowerCase().includes(value.toLowerCase()) && search !== value
  ).slice(0, 5);

  const allItems = [
    ...filteredSuggestions,
    ...filteredRecentSearches.map(search => ({ type: 'recent' as const, value: search }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          onChange(allItems[selectedIndex].value);
          setIsOpen(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion | { type: 'recent'; value: string }) => {
    onChange(suggestion.value);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'filename':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'tag':
        return <Tag className="w-4 h-4 text-green-500" />;
      case 'keyword':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'category':
        return <Image className="w-4 h-4 text-orange-500" />;
      case 'description':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'filename':
        return 'File';
      case 'tag':
        return 'Tag';
      case 'keyword':
        return 'Keyword';
      case 'category':
        return 'Category';
      case 'description':
        return 'Description';
      case 'recent':
        return 'Recent';
      default:
        return '';
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {value && (
            <button
              onClick={() => {
                onChange('');
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={onAdvancedFilters}
            className={`p-1 rounded transition-colors ${
              hasActiveFilters 
                ? 'text-blue-600 bg-blue-100' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Advanced filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Dropdown */}
      {isOpen && (filteredSuggestions.length > 0 || filteredRecentSearches.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {filteredSuggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">Suggestions</div>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    selectedIndex === index ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  {getTypeIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {highlightMatch(suggestion.value, value)}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{getTypeLabel(suggestion.type)}</span>
                      {suggestion.count && <span>• {suggestion.count} files</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredRecentSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">Recent Searches</div>
              {filteredRecentSearches.map((search, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleSuggestionClick({ type: 'recent', value: search })}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    selectedIndex === filteredSuggestions.length + index ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-700 truncate">
                      {highlightMatch(search, value)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search Tips */}
          {value.length === 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="text-xs font-medium text-gray-700 mb-2">Search Tips</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>• Type filename, keywords, or descriptions</div>
                <div>• Use quotes for exact phrases: "luxury watch"</div>
                <div>• Filter by status: status:completed</div>
                <div>• Filter by category: category:Objects</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;