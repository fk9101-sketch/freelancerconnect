import type { Category } from "@shared/schema";

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
}

const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  if (name.includes('electric')) return 'fas fa-bolt';
  if (name.includes('plumb')) return 'fas fa-wrench';
  if (name.includes('carpen')) return 'fas fa-hammer';
  if (name.includes('paint')) return 'fas fa-paint-brush';
  if (name.includes('mechanic')) return 'fas fa-car';
  if (name.includes('ac') || name.includes('appliance')) return 'fas fa-snowflake';
  if (name.includes('weld')) return 'fas fa-fire';
  if (name.includes('mason')) return 'fas fa-brick-wall';
  if (name.includes('garden')) return 'fas fa-leaf';
  if (name.includes('clean')) return 'fas fa-broom';
  if (name.includes('interior') || name.includes('design')) return 'fas fa-couch';
  if (name.includes('driver')) return 'fas fa-taxi';
  if (name.includes('tutor')) return 'fas fa-book';
  if (name.includes('photo')) return 'fas fa-camera';
  if (name.includes('makeup')) return 'fas fa-palette';
  if (name.includes('it') || name.includes('technician')) return 'fas fa-laptop';
  if (name.includes('event')) return 'fas fa-calendar';
  if (name.includes('pest')) return 'fas fa-bug';
  if (name.includes('mover') || name.includes('packer')) return 'fas fa-truck';
  return 'fas fa-tools';
};

const getCategoryColor = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  if (name.includes('electric')) return 'bg-yellow-100 text-yellow-600';
  if (name.includes('plumb')) return 'bg-blue-100 text-blue-600';
  if (name.includes('carpen')) return 'bg-green-100 text-green-600';
  if (name.includes('paint')) return 'bg-purple-100 text-primary';
  if (name.includes('mechanic')) return 'bg-red-100 text-red-600';
  if (name.includes('ac') || name.includes('appliance')) return 'bg-cyan-100 text-cyan-600';
  if (name.includes('weld')) return 'bg-orange-100 text-orange-600';
  if (name.includes('mason')) return 'bg-gray-100 text-gray-600';
  if (name.includes('garden')) return 'bg-emerald-100 text-emerald-600';
  if (name.includes('clean')) return 'bg-teal-100 text-teal-600';
  if (name.includes('interior') || name.includes('design')) return 'bg-pink-100 text-pink-600';
  if (name.includes('driver')) return 'bg-indigo-100 text-indigo-600';
  if (name.includes('tutor')) return 'bg-violet-100 text-violet-600';
  if (name.includes('photo')) return 'bg-slate-100 text-slate-600';
  if (name.includes('makeup')) return 'bg-rose-100 text-rose-600';
  if (name.includes('it') || name.includes('technician')) return 'bg-blue-100 text-blue-600';
  if (name.includes('event')) return 'bg-amber-100 text-amber-600';
  if (name.includes('pest')) return 'bg-lime-100 text-lime-600';
  if (name.includes('mover') || name.includes('packer')) return 'bg-stone-100 text-stone-600';
  return 'bg-gray-100 text-gray-600';
};

export default function CategoryGrid({ categories, onCategorySelect }: CategoryGridProps) {
  // Ensure we don't show more than 6 categories, with "More" as the 6th item
  const displayCategories = categories.slice(0, 5);
  const hasMore = categories.length > 5;

  return (
    <div className="grid grid-cols-3 gap-3">
      {displayCategories.map((category) => (
        <div
          key={category.id}
          onClick={() => onCategorySelect(category.id)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center cursor-pointer hover:shadow-md transition-shadow card-hover"
          data-testid={`category-${category.id}`}
        >
          <div className={`w-12 h-12 ${getCategoryColor(category.name)} rounded-xl flex items-center justify-center mx-auto mb-2`}>
            <i className={`${getCategoryIcon(category.name)} text-xl`}></i>
          </div>
          <p className="text-xs font-medium text-gray-700 leading-tight">
            {category.name}
          </p>
        </div>
      ))}
      
      {hasMore && (
        <div
          onClick={() => {/* TODO: Show all categories */}}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center cursor-pointer hover:shadow-md transition-shadow card-hover"
          data-testid="category-more"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <i className="fas fa-ellipsis-h text-gray-600 text-xl"></i>
          </div>
          <p className="text-xs font-medium text-gray-700">More</p>
        </div>
      )}
    </div>
  );
}
