import { useState, useMemo, useCallback } from 'react';
import { FileData } from '../store/useStore';
import { FilterOptions } from '../components/AdvancedFilters';

interface SearchHook {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  filteredFiles: FileData[];
  searchSuggestions: Array<{
    type: 'filename' | 'tag' | 'keyword' | 'category' | 'description';
    value: string;
    count: number;
  }>;
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

const defaultFilters: FilterOptions = {
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

export const useSearch = (files: FileData[]): SearchHook => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch {
      return [];
    }
  });

  const addRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(search => search !== term);
      const updated = [term, ...filtered].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  // Parse search term for special filters
  const parseSearchTerm = useCallback((term: string) => {
    const specialFilters: Record<string, string> = {};
    let cleanTerm = term;

    // Extract special filters like status:completed, category:Objects
    const filterRegex = /(\w+):(\w+)/g;
    let match;
    
    while ((match = filterRegex.exec(term)) !== null) {
      specialFilters[match[1]] = match[2];
      cleanTerm = cleanTerm.replace(match[0], '').trim();
    }

    return { cleanTerm, specialFilters };
  }, []);

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    const suggestions = new Map<string, { type: string; count: number }>();

    files.forEach(file => {
  // Filenames
  if (typeof file.filename === 'string' && file.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
    const key = `filename:${file.filename}`;
    suggestions.set(key, { 
      type: 'filename', 
      count: (suggestions.get(key)?.count || 0) + 1 
    });
  }

  // Tags
  (file.tags || []).forEach(tag => {
    if (typeof tag === 'string' && tag.toLowerCase().includes(searchTerm.toLowerCase())) {
      const key = `tag:${tag}`;
      suggestions.set(key, { 
        type: 'tag', 
        count: (suggestions.get(key)?.count || 0) + 1 
      });
    }
  });

  // Keywords
  (file.keywords || []).forEach(keyword => {
    if (typeof keyword === 'string' && keyword.toLowerCase().includes(searchTerm.toLowerCase())) {
      const key = `keyword:${keyword}`;
      suggestions.set(key, { 
        type: 'keyword', 
        count: (suggestions.get(key)?.count || 0) + 1 
      });
    }
  });

  // Adobe categories
  if (typeof file.adobeCategory === 'string' && file.adobeCategory.toLowerCase().includes(searchTerm.toLowerCase())) {
    const key = `category:${file.adobeCategory}`;
    suggestions.set(key, { 
      type: 'category', 
      count: (suggestions.get(key)?.count || 0) + 1 
    });
  }

  // Descriptions
  if (typeof file.description === 'string' && file.description.toLowerCase().includes(searchTerm.toLowerCase())) {
    const words = file.description.split(' ').filter(word => 
      typeof word === 'string' && word.length > 3 && word.toLowerCase().includes(searchTerm.toLowerCase())
    );
    words.forEach(word => {
      const key = `description:${word}`;
      suggestions.set(key, { 
        type: 'description', 
        count: (suggestions.get(key)?.count || 0) + 1 
      });
    });
  }
});


    return Array.from(suggestions.entries())
      .map(([key, data]) => ({
        type: data.type as 'filename' | 'tag' | 'keyword' | 'category' | 'description',
        value: key.split(':')[1],
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [files, searchTerm]);

  // Filter files based on search term and filters
  const filteredFiles = useMemo(() => {
    const { cleanTerm, specialFilters } = parseSearchTerm(searchTerm);

    return files.filter(file => {
      // Text search
      if (cleanTerm) {
        const searchFields = [
          file.filename,
          file.newNamePhoto,
          file.titleAdobe,
          file.description,
          ...file.keywords,
          ...file.keysAdobe,
          ...file.tags,
          file.adobeCategory,
          file.notes
        ].filter(Boolean);

        const matchesText = searchFields.some(field =>
          typeof field === 'string' && field.toLowerCase().includes(cleanTerm.toLowerCase())
        );

        if (!matchesText) return false;
      }

      // Special filters from search term
      if (specialFilters.status && file.status !== specialFilters.status) {
        return false;
      }
      if (specialFilters.category && file.adobeCategory !== specialFilters.category) {
        return false;
      }

      // Advanced filters
      if (filters.status.length > 0 && !filters.status.includes(file.status)) {
        return false;
      }

      if (filters.dateRange.start || filters.dateRange.end) {
        const fileDate = new Date(file.uploaded);
        if (filters.dateRange.start && fileDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && fileDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      if (filters.adobeCategories.length > 0 && !filters.adobeCategories.includes(file.adobeCategory)) {
        return false;
      }

      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => file.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      if (filters.keywords.length > 0) {
        const hasMatchingKeyword = filters.keywords.some(keyword => 
          file.keywords.includes(keyword) || file.keysAdobe.includes(keyword)
        );
        if (!hasMatchingKeyword) return false;
      }

      // File size filter (convert MB to bytes for comparison)
      const fileSizeInMB = parseFloat(file.size.replace(/[^\d.]/g, ''));
      if (fileSizeInMB < filters.sizeRange.min || fileSizeInMB > filters.sizeRange.max) {
        return false;
      }

      // Content filters
      if (filters.hasDescription !== null) {
        const hasDescription = Boolean(file.description && file.description.trim());
        if (filters.hasDescription !== hasDescription) return false;
      }

      if (filters.hasKeywords !== null) {
        const hasKeywords = file.keywords.length > 0;
        if (filters.hasKeywords !== hasKeywords) return false;
      }

      if (filters.hasAdobeKeys !== null) {
        const hasAdobeKeys = file.keysAdobe.length > 0;
        if (filters.hasAdobeKeys !== hasAdobeKeys) return false;
      }

      return true;
    });
  }, [files, searchTerm, filters, parseSearchTerm]);

  return {
    searchTerm,
    setSearchTerm: useCallback((term: string) => {
      setSearchTerm(term);
      if (term.trim()) {
        addRecentSearch(term);
      }
    }, [addRecentSearch]),
    filters,
    setFilters,
    filteredFiles,
    searchSuggestions,
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  };
};