import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

export type SortOption = 'for-you' | 'closest' | 'highest-paid' | 'newest';

interface JobSortingTabsProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const JobSortingTabs = ({ activeSort, onSortChange }: JobSortingTabsProps) => {
  const sortOptions: { id: SortOption; label: string; showIcon?: boolean }[] = [
    { id: 'for-you', label: 'Para ti' },
    { id: 'closest', label: 'Más cerca', showIcon: true },
    { id: 'highest-paid', label: 'Mejor pagados' },
    { id: 'newest', label: 'Nuevos' },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 border-b border-border/50">
      {sortOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onSortChange(option.id)}
          className={cn(
            "flex items-center gap-1 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all duration-200 relative",
            activeSort === option.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.showIcon && <MapPin className="w-3 h-3" />}
          {option.label}
          {/* Active underline */}
          {activeSort === option.id && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};
