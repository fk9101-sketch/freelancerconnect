import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { fallbackCategories } from '@/lib/fallbackData';

interface CategorySuggestion {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CategoryAutoSuggestProps {
  value: string;
  onChange: (value: string) => void;
  onCategorySelect?: (categoryId: string, categoryName: string) => void;
  onCustomCategoryChange?: (customCategory: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  showCustomOption?: boolean;
  isFilter?: boolean; // New prop to indicate if this is used for filtering
}

// Highlight matched text
function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <span key={index} className="font-bold text-blue-600 bg-blue-100 px-1 py-0.5 rounded-md">
        {part}
      </span>
    ) : (
      part
    )
  );
}

// Fallback category search function
function searchCategoriesFallback(query: string): CategorySuggestion[] {
  if (!query || query.length < 2) {
    return [];
  }
  
  const lowerQuery = query.toLowerCase();
  return fallbackCategories
    .filter(category => category.name.toLowerCase().includes(lowerQuery))
    .map(category => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color
    }));
}

export function CategoryAutoSuggest({
  value,
  onChange,
  onCategorySelect,
  onCustomCategoryChange,
  placeholder = "Type your service category (e.g. plumber, electrician)",
  className,
  disabled = false,
  error = false,
  required = false,
  showCustomOption = true,
  isFilter = false
}: CategoryAutoSuggestProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search function using dedicated search API
  const searchCategories = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Use fallback data immediately
    console.log('Using fallback categories for query:', query);
    const fallbackSuggestions = searchCategoriesFallback(query);
    setSuggestions(fallbackSuggestions);
    setShowSuggestions(fallbackSuggestions.length > 0 || showCustomOption);
    setIsLoading(false);

    // Try API call in background (optional)
    try {
      const response = await fetch(`/api/categories/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const categories = await response.json();
        console.log('Received API categories:', categories.length);
        setSuggestions(categories);
        setShowSuggestions(categories.length > 0 || showCustomOption);
      }
    } catch (error) {
      console.error('API call failed, using fallback:', error);
      // Fallback data is already set above
    }
  }, [showCustomOption]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // If input is cleared, hide suggestions immediately
    if (!newValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      searchCategories(newValue);
    }, 200);
  };

  // Handle category selection
  const handleCategorySelect = (category: CategorySuggestion) => {
    setInputValue(category.name);
    setSelectedCategoryId(category.id);
    onChange(category.id); // Changed from category.name to category.id
    setShowSuggestions(false);
    setShowCustomInput(false);
    onCategorySelect?.(category.id, category.name);
  };

  // Handle "Other" selection
  const handleOtherSelect = () => {
    setShowCustomInput(true);
    setShowSuggestions(false);
    setInputValue('');
    setSelectedCategoryId('');
    setCustomCategory('');
    onChange('');
  };

  // Handle custom category input with validation
  const handleCustomCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const customValue = e.target.value.trim();
    
    setCustomCategory(customValue);
    onChange(customValue);
    onCustomCategoryChange?.(customValue);
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Clear selection when value is cleared externally
  useEffect(() => {
    if (!value) {
      setSelectedCategoryId('');
      setShowCustomInput(false);
      setCustomCategory('');
    }
  }, [value]);

  // If this is a filter component, show a simplified version
  if (isFilter) {
    return (
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "bg-white border-gray-200 text-gray-900 rounded-2xl pr-12 h-12 text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500",
              className
            )}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto backdrop-blur-sm bg-white/95">
            <div className="py-2">
              {/* Category Suggestions */}
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none transition-all duration-200 ease-in-out border-b border-gray-100 last:border-b-0 active:scale-[0.98]"
                    onClick={() => handleCategorySelect(suggestion)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-sm"
                        style={{ backgroundColor: suggestion.color }}
                      >
                        <i className={suggestion.icon}></i>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {highlightText(suggestion.name, inputValue)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center">
                  <div className="text-gray-500 text-sm">No matching results</div>
                  <div className="text-gray-400 text-xs mt-1">Try a different search term</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full version for forms
  return (
    <div ref={containerRef} className="relative">
      <div className="space-y-3">
        {/* Main Category Input */}
        <div className="relative">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "bg-white border-gray-200 text-gray-900 rounded-2xl pr-12 h-12 text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500",
              className
            )}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Custom Category Input (shown when "Other" is selected) */}
        {showCustomInput && (
          <div className="relative">
            <Input
              type="text"
              value={customCategory}
              onChange={handleCustomCategoryChange}
              placeholder="Enter your custom service category..."
              className={cn(
                "bg-white border-gray-200 text-gray-900 rounded-2xl pr-12 h-12 text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
                customCategory.length > 0 && customCategory.length < 3 && "border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500"
              )}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Plus className="h-5 w-5 text-gray-400" />
            </div>
            {customCategory.length > 0 && customCategory.length < 3 && (
              <p className="text-xs text-yellow-600 mt-2 ml-3 font-medium">
                Category name should be at least 3 characters long
              </p>
            )}
          </div>
        )}

        {/* Selected Category Display */}
        {selectedCategoryId && !showCustomInput && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-sm font-medium text-blue-700">Selected:</span>
            <Badge variant="secondary" className="text-sm px-3 py-1 bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200">
              {inputValue}
            </Badge>
          </div>
        )}

        {/* Custom Category Display */}
        {showCustomInput && customCategory && (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
            <span className="text-sm font-medium text-green-700">Custom category:</span>
            <Badge variant="outline" className="text-sm px-3 py-1 bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
              {customCategory}
            </Badge>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto backdrop-blur-sm bg-white/95">
          <div className="py-2">
            {/* Category Suggestions */}
            {suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none transition-all duration-200 ease-in-out border-b border-gray-100 last:border-b-0 active:scale-[0.98]"
                  onClick={() => handleCategorySelect(suggestion)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-sm"
                      style={{ backgroundColor: suggestion.color }}
                    >
                      <i className={suggestion.icon}></i>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {highlightText(suggestion.name, inputValue)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <div className="text-gray-500 text-sm">No matching results</div>
                <div className="text-gray-400 text-xs mt-1">Try a different search term</div>
              </div>
            )}
            
            {/* "Other" Option - only show if there are suggestions or we want to show custom option */}
            {showCustomOption && (suggestions.length > 0 || showSuggestions) && (
              <button
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none border-t border-gray-200 transition-all duration-200 ease-in-out active:scale-[0.98]"
                onClick={handleOtherSelect}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm shadow-sm">
                    <Plus className="w-4 h-4" />
                    </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">
                      Other (Custom Category)
                    </div>
                    <div className="text-xs text-gray-500">
                      Enter your own service category
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
