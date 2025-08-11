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
  if (name.includes('electric')) return 'bg-yellow-500/20 text-yellow-400';
  if (name.includes('plumb')) return 'bg-blue-500/20 text-blue-400';
  if (name.includes('carpen')) return 'bg-green-500/20 text-green-400';
  if (name.includes('paint')) return 'bg-purple-500/20 text-purple-400';
  if (name.includes('mechanic')) return 'bg-red-500/20 text-red-400';
  if (name.includes('ac') || name.includes('appliance')) return 'bg-cyan-500/20 text-cyan-400';
  if (name.includes('weld')) return 'bg-orange-500/20 text-orange-400';
  if (name.includes('mason')) return 'bg-gray-500/20 text-gray-400';
  if (name.includes('garden')) return 'bg-emerald-500/20 text-emerald-400';
  if (name.includes('clean')) return 'bg-teal-500/20 text-teal-400';
  if (name.includes('interior') || name.includes('design')) return 'bg-pink-500/20 text-pink-400';
  if (name.includes('driver')) return 'bg-indigo-500/20 text-indigo-400';
  if (name.includes('tutor')) return 'bg-violet-500/20 text-violet-400';
  if (name.includes('photo')) return 'bg-slate-500/20 text-slate-400';
  if (name.includes('makeup')) return 'bg-rose-500/20 text-rose-400';
  if (name.includes('it') || name.includes('technician')) return 'bg-blue-500/20 text-blue-400';
  if (name.includes('event')) return 'bg-amber-500/20 text-amber-400';
  if (name.includes('pest')) return 'bg-lime-500/20 text-lime-400';
  if (name.includes('mover') || name.includes('packer')) return 'bg-stone-500/20 text-stone-400';
  return 'bg-primary/20 text-primary';
};

export default function CategoryGrid({ categories, onCategorySelect }: CategoryGridProps) {
  // Ensure we don't show more than 6 categories, with "More" as the 6th item
  const displayCategories = categories.slice(0, 5);
  const hasMore = categories.length > 5;

  return (
    <div className="grid grid-cols-3 gap-4">
      {displayCategories.map((category) => (
        <div
          key={category.id}
          onClick={() => onCategorySelect(category.id)}
          className="bg-card rounded-2xl p-5 shadow-lg border border-border text-center cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 card-hover"
          data-testid={`category-${category.id}`}
        >
          <div className={`w-14 h-14 ${getCategoryColor(category.name)} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
            <i className={`${getCategoryIcon(category.name)} text-xl`}></i>
          </div>
          <p className="text-xs font-semibold text-card-foreground leading-tight">
            {category.name}
          </p>
        </div>
      ))}
      
      {hasMore && (
        <div
          onClick={() => {/* TODO: Show all categories */}}
          className="bg-card rounded-2xl p-5 shadow-lg border border-border text-center cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 card-hover"
          data-testid="category-more"
        >
          <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
            <i className="fas fa-ellipsis-h text-muted-foreground text-xl"></i>
          </div>
          <p className="text-xs font-semibold text-card-foreground">More</p>
        </div>
      )}
    </div>
  );
}
