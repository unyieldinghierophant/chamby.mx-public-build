import { cn } from "@/lib/utils";
import { Target, MapPin, DollarSign, Sparkles } from "lucide-react";

export type SortOption = 'for-you' | 'closest' | 'highest-paid' | 'newest';

interface JobSortingTabsProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const JobSortingTabs = ({ activeSort, onSortChange }: JobSortingTabsProps) => {
  const sortOptions: { id: SortOption; label: string; icon: React.ReactNode }[] = [
    { id: 'for-you', label: 'Para ti', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'closest', label: 'Más cerca', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'highest-paid', label: 'Mejor pagados', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'newest', label: 'Nuevos', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
      {sortOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onSortChange(option.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 min-h-[32px]",
            activeSort === option.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground active:bg-muted/80"
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
};
