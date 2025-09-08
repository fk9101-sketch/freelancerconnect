// Fallback areas data when database is not accessible
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read areas from JSON file
const areasPath = path.join(__dirname, 'data', 'jaipur_areas_50km.json');

let areasData = [];
try {
  if (fs.existsSync(areasPath)) {
    const data = fs.readFileSync(areasPath, 'utf8');
    areasData = JSON.parse(data);
  }
} catch (error) {
  console.error('Error reading areas data:', error);
}

// Fallback areas search function
function searchAreasFallback(query, limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }
  
  const lowerQuery = query.toLowerCase();
  const filteredAreas = areasData
    .filter(area => area.toLowerCase().includes(lowerQuery))
    .slice(0, limit)
    .map(area => ({
      name: area,
      city: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      distance_km: undefined,
      meta: `Jaipur • Rajasthan`
    }));
  
  return filteredAreas;
}

export {
  searchAreasFallback,
  areasData
};
