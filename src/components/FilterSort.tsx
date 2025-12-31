import { Button } from '@/components/ui/button';
import type { SortOption } from '@/types/movie';

interface FilterSortProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function FilterSort({ sortBy, onSortChange }: FilterSortProps) {
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'popularity', label: 'Popular' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'release_date', label: 'Latest' },
  ];

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {sortOptions.map((option) => (
        <Button
          key={option.value}
          onClick={() => onSortChange(option.value)}
          variant={sortBy === option.value ? 'default' : 'outline'}
          className={
            sortBy === option.value
              ? 'glass glass-hover bg-white/20 border-white/40'
              : 'glass glass-hover border-white/20 text-white hover:bg-white/20'
          }
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
