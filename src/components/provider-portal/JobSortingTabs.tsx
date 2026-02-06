import { cn } from "@/lib/utils";
import { Target, MapPin, DollarSign, Sparkles } from "lucide-react";

export type SortOption = 'for-you' | 'closest' | 'highest-paid' | 'newest';

interface JobSortingTabsProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const JobSortingTabs = ({ activeSort, onSortChange }: JobSortingTabsProps) => {
  const sortOptions: { id: SortOption; label: string; icon: React.ReactNode }[] = [
    { id: 'for-you', label: 'Para ti', icon: <Target className="w-4 h-4" /> },
    { id: 'closest', label: 'Más cerca', icon: <MapPin className="w-4 h-4" /> },
    { id: 'highest-paid', label: 'Mejor pagados', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'newest', label: 'Nuevos', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
      {sortOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onSortChange(option.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
            activeSort === option.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
};
