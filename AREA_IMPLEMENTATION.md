# Area/Location Auto-Suggestion Implementation

## Overview
This implementation adds a required "Area / Location" field to the Customer Profile with auto-suggestion functionality for Jaipur areas within 50km.

## Features Implemented

### 1. Frontend Components
- **AreaAutoSuggest.tsx**: React component with typeahead functionality
  - Debounced input (200ms)
  - Fuzzy matching with Levenshtein distance
  - Geolocation support for proximity-based sorting
  - Highlighted matched text
  - Up to 8 suggestions with distance and meta info
  - Keyboard navigation support

### 2. Backend API
- **GET /api/areas**: Area suggestions endpoint
  - Query parameter for search term
  - Optional lat/lng for proximity sorting
  - Returns array of suggestions with distance and meta info
- **GET /api/customer/profile**: Get customer profile
- **PUT /api/customer/profile**: Update customer profile with area
- **POST /admin/areas**: Admin-only area management
- **PUT /admin/areas/:id**: Admin-only area updates

### 3. Database Schema
- Added `area` field to `users` table for customer profiles
- Updated storage interface with `updateUserArea` method

### 4. Data
- **jaipur_areas_50km.json**: Preloaded list of 85+ Jaipur areas
- Includes major and minor localities within ~50km radius

## Usage

### For Customers
1. Navigate to Profile page (`/customer/profile`)
2. Click "Edit Profile"
3. Use the Area/Location field with auto-suggestions
4. Type to see matching areas
5. Select an area from the dropdown
6. Save changes

### For Developers
```typescript
// Using the AreaAutoSuggest component
<AreaAutoSuggest
  value={area}
  onChange={setArea}
  required={true}
  placeholder="Type your area (e.g. Vaishali Nagar, Sirsi Road)"
/>
```

### API Usage
```bash
# Get area suggestions
GET /api/areas?query=vaishali&lat=26.9124&lng=75.7873

# Update customer area
PUT /api/customer/profile
{
  "area": "Vaishali Nagar"
}
```

## Matching Algorithm

### 1. Exact Match (Score: 100)
- Perfect case-insensitive match

### 2. Prefix Match (Score: 80)
- Area starts with query

### 3. Contains Match (Score: 60)
- Area contains query anywhere

### 4. Fuzzy Match (Score: 0-40)
- Levenshtein distance with 60% similarity threshold
- Handles typos and similar spellings

### 5. Proximity Sorting
- If coordinates provided, sort by distance to user
- Otherwise, sort by relevance score

## Validation
- Server-side validation against preloaded area list
- Rejects values not in the allowed areas
- Required field for customer profiles

## Integration Points

### Freelancer Filtering
- Customer's saved area is used to filter available freelancers
- Shows freelancers whose `workingAreas` match customer's area
- Prioritizes freelancers with paid plans

### Search Page
- Customer search uses saved area from profile
- Area can be updated via profile page
- No direct area editing in search page

## Admin Features
- Protected routes for area management
- Add new areas to the system
- Update existing area names
- Admin-only access (no customer UI)

## Testing
- Unit tests for suggestion algorithm
- Test cases for exact, prefix, contains, and fuzzy matching
- Case-insensitive matching tests
- No-match scenarios

## Files Modified/Created

### New Files
- `client/src/components/AreaAutoSuggest.tsx`
- `server/data/jaipur_areas_50km.json`
- `tests/area-suggestions.test.js`
- `AREA_IMPLEMENTATION.md`

### Modified Files
- `shared/schema.ts` - Added area field to users table
- `server/routes.ts` - Added areas API and customer profile routes
- `server/storage.ts` - Added updateUserArea method
- `client/src/pages/profile.tsx` - Added area field for customers
- `client/src/pages/customer-search.tsx` - Updated to use profile area

## Database Migration
To apply the schema changes:
```bash
npm run db:push
```

## Edge Cases Handled
- No suggestions found: Shows "No available area found in Jaipur 50 km"
- Geolocation fails: Falls back to relevance-based sorting
- Invalid areas: Server rejects non-listed values
- Empty queries: No suggestions shown
- Network errors: Graceful error handling

## Performance Considerations
- Debounced API calls (200ms)
- Limited to 8 suggestions
- Efficient fuzzy matching algorithm
- Cached area list in JSON file
