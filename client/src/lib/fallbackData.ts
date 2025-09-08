// Fallback data for when API is not available
export const fallbackAreas = [
  "Adarsh Nagar", "Agra Road", "Ajmer Road", "Ajmeri Gate", "Ambabari", "Amer", "Amer Road",
  "Bais Godam", "Bajaj Nagar", "Bani Park", "Bapu Bazaar", "Bapu Nagar", "Barkat Nagar",
  "Bhawani Singh Road", "Biseswarji", "Bindayaka", "Brahmapuri", "Bagru", "Chandpol",
  "Chhoti Chaupar", "Civil Lines", "C-Scheme", "Durgapura", "Dholai", "Gangori Bazaar",
  "Ghat Darwaza", "Goner", "Gopalpura", "Gopalpura Bypass", "Govindpura", "Hathroi",
  "Indira Bazar", "Jagatpura", "Jalupura", "Jamdoli", "Jamwa Ramgarh", "Janata Colony",
  "Jawahar Nagar", "Jawaharlal Nehru Marg", "Jhotwara", "Jhotwara Industrial Area",
  "Jhotwara Road", "Johari Bazar", "Jyothi Nagar", "Kalwar Road", "Kanakapura", "Kanota",
  "Kartarpura", "Khatipura", "Kukas", "Mahesh Nagar", "Malviya Nagar", "Mansarovar",
  "Mansarovar Extension", "MI Road", "Mirza Ismail Road", "Moti Doongri", "Muralipura",
  "New Colony", "New Sanganer Road", "Nirman Nagar", "Patrakar Colony", "Pink City",
  "Pratap Nagar", "Raja Park", "Ramnagar", "Samode", "Sanganer", "Sansar Chandra Road",
  "Sethi Colony", "Shastri Nagar", "Shyam Nagar", "Sikar Road", "Sirsi Road", "Sitapura",
  "Sitapura Industrial Area", "Sodala", "Subhash Nagar", "Sudharshanpura Industrial Area",
  "Surajpol Bazar", "Tilak Nagar", "Tonk Phatak", "Tonk Road", "Transport Nagar",
  "Tripolia Bazaar", "Vaishali Nagar", "Vidhyadhar Nagar", "Vishwakarma Industrial Area"
];

export const fallbackCategories = [
  { id: '1', name: 'Web Development', icon: '💻', color: '#3B82F6', isActive: true },
  { id: '2', name: 'Mobile Development', icon: '📱', color: '#10B981', isActive: true },
  { id: '3', name: 'Design', icon: '🎨', color: '#F59E0B', isActive: true },
  { id: '4', name: 'Writing', icon: '✍️', color: '#8B5CF6', isActive: true },
  { id: '5', name: 'Marketing', icon: '📈', color: '#EF4444', isActive: true },
  { id: '6', name: 'Consulting', icon: '💼', color: '#06B6D4', isActive: true },
  { id: '7', name: 'Other', icon: '🔧', color: '#6B7280', isActive: true }
];

export function searchAreasFallback(query: string, limit: number = 10) {
  if (!query || query.length < 2) {
    return [];
  }
  
  const lowerQuery = query.toLowerCase();
  const filteredAreas = fallbackAreas
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
