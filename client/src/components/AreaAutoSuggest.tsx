import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AreaSuggestion {
  name: string;
  distance_km?: number;
  meta?: string;
}

interface AreaAutoSuggestProps {
  value: string;
  onChange: (value: string) => void;
  onAreaSelect?: (area: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  isFilter?: boolean; // New prop to indicate if this is used for filtering
}

// Levenshtein distance calculation for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// Highlight matched text
function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <span key={index} className="font-semibold text-primary bg-primary/10 px-1 rounded">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export function AreaAutoSuggest({
  value,
  onChange,
  onAreaSelect,
  onBlur,
  placeholder = "Type your area (e.g. Vaishali Nagar, Sirsi Road)",
  className,
  disabled = false,
  error = false,
  required = false,
  isFilter = false
}: AreaAutoSuggestProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<AreaSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Debounced search function using dedicated search API
  const searchAreas = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({ query });
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
      }

      console.log('Searching areas with query:', query);
      
      const response = await fetch(`/api/areas/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received suggestions:', data);
      
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Error fetching area suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
      toast({
        title: "Search Error",
        description: "Failed to search areas. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      searchAreas(newValue);
    }, 200);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: AreaSuggestion) => {
    setInputValue(suggestion.name);
    onChange(suggestion.name);
    onAreaSelect?.(suggestion.name);
    setShowSuggestions(false);
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
    onBlur?.();
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

  // Clear input when value is cleared externally
  useEffect(() => {
    if (!value) {
      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
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
              "bg-background border-border text-foreground rounded-2xl pr-10",
              error && "border-red-500 focus-visible:ring-red-500",
              className
            )}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <MapPin className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {suggestions.length > 0 ? (
              <div className="py-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm">
                          {highlightText(suggestion.name, inputValue)}
                        </div>
                        {suggestion.meta && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {suggestion.meta}
                          </div>
                        )}
                      </div>
                      {suggestion.distance_km && (
                        <div className="text-xs text-muted-foreground ml-2">
                          {suggestion.distance_km.toFixed(1)} km
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No matching results
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Label className="text-sm font-semibold text-card-foreground mb-2 block">
        Area / Location {required && <span className="text-red-500">*</span>}
      </Label>
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
            "bg-background border-border text-foreground rounded-2xl pr-10",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm">
                        {highlightText(suggestion.name, inputValue)}
                      </div>
                      {suggestion.meta && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {suggestion.meta}
                        </div>
                      )}
                    </div>
                    {suggestion.distance_km && (
                      <div className="text-xs text-muted-foreground ml-2">
                        {suggestion.distance_km.toFixed(1)} km
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matching results
            </div>
          )}
        </div>
      )}
    </div>
  );
}
