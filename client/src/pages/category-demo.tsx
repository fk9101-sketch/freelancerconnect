import React, { useState } from 'react';
import { CategoryAutoSuggest } from '@/components/CategoryAutoSuggest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CategoryDemo() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategory(categoryName);
    setCustomCategory('');
    console.log('Selected category:', { id: categoryId, name: categoryName });
  };

  const handleCustomCategoryChange = (customCategoryName: string) => {
    setCustomCategory(customCategoryName);
    setSelectedCategoryId('');
    setSelectedCategory('');
    console.log('Custom category:', customCategoryName);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Category Auto-Suggest Demo
          </h1>
          <p className="text-muted-foreground">
            Test the comprehensive freelancer categories system with auto-suggestions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Category Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CategoryAutoSuggest
              value={selectedCategory || customCategory}
              onChange={(categoryId) => {
                if (categoryId) {
                  // If we got a category ID, find the category name
                  const category = categories.find(cat => cat.id === categoryId);
                  if (category) {
                    setSelectedCategory(category.name);
                    setSelectedCategoryId(categoryId);
                    setCustomCategory('');
                  }
                } else {
                  // If no category ID, treat as custom category
                  setCustomCategory('');
                }
              }}
              onCategorySelect={handleCategorySelect}
              onCustomCategoryChange={handleCustomCategoryChange}
              placeholder="Type your service category (e.g. plumber, electrician)"
              required={true}
              showCustomOption={true}
            />

            {/* Display Results */}
            <div className="space-y-3">
              {selectedCategoryId && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Selected Category:</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ID: {selectedCategoryId}
                    </Badge>
                    <Badge variant="outline" className="text-green-700">
                      {selectedCategory}
                    </Badge>
                  </div>
                </div>
              )}

              {customCategory && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">Custom Category:</h4>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {customCategory}
                  </Badge>
                </div>
              )}

              {!selectedCategoryId && !customCategory && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 text-sm">
                    Start typing to see category suggestions or select "Other" for custom categories
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Auto-suggestions after typing 2+ characters</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Comprehensive list of 100+ professional categories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Custom category support with "Other" option</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Debounced search for better performance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Keyboard navigation support</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Badge variant="secondary" className="text-xs">Plumber</Badge>
              <Badge variant="secondary" className="text-xs">Electrician</Badge>
              <Badge variant="secondary" className="text-xs">Carpenter</Badge>
              <Badge variant="secondary" className="text-xs">Painter</Badge>
              <Badge variant="secondary" className="text-xs">Cleaner</Badge>
              <Badge variant="secondary" className="text-xs">AC Repair</Badge>
              <Badge variant="secondary" className="text-xs">Mechanic</Badge>
              <Badge variant="secondary" className="text-xs">Tutor</Badge>
              <Badge variant="secondary" className="text-xs">Designer</Badge>
              <Badge variant="secondary" className="text-xs">Developer</Badge>
              <Badge variant="secondary" className="text-xs">Photographer</Badge>
              <Badge variant="secondary" className="text-xs">Event Manager</Badge>
              <Badge variant="secondary" className="text-xs">Makeup Artist</Badge>
              <Badge variant="secondary" className="text-xs">Driver</Badge>
              <Badge variant="secondary" className="text-xs">Gardener</Badge>
              <Badge variant="secondary" className="text-xs">Tailor</Badge>
              <Badge variant="outline" className="text-xs text-gray-600">+ 80+ more...</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
