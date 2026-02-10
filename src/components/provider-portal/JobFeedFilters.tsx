import { cn } from "@/lib/utils";
import { MapPin, X } from "lucide-react";

export type CategoryFilter = string | null;
export type RadiusFilter = number | null;
export type DateFilter = 'today' | '3days' | 'week' | null;

interface JobFeedFiltersProps {
  category: CategoryFilter;
  onCategoryChange: (c: CategoryFilter) => void;
  radius: RadiusFilter;
  onRadiusChange: (r: RadiusFilter) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (d: DateFilter) => void;
  hasLocation: boolean;
}

const CATEGORIES = [
  'Fontanería',
  'Electricidad',
  'Jardinería',
  'Limpieza',
  'Handyman',
  'Mudanza',
];

const RADII = [
  { label: '1 km', value: 1 },
  { label: '3 km', value: 3 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
];

const DATE_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: 'Hoy', value: 'today' },
  { label: '3 días', value: '3days' },
  { label: 'Esta semana', value: 'week' },
];

const Chip = ({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-background text-muted-foreground border-border hover:border-foreground/30"
    )}
  >
    {icon}
    {children}
  </button>
);

export const JobFeedFilters = ({
  category,
  onCategoryChange,
  radius,
  onRadiusChange,
  dateFilter,
  onDateFilterChange,
  hasLocation,
}: JobFeedFiltersProps) => {
  const hasAnyFilter = category || radius || dateFilter;

  return (
    <div className="space-y-2">
      {/* Single scrollable row of filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {/* Clear all */}
        {hasAnyFilter && (
          <Chip
            active={false}
            onClick={() => {
              onCategoryChange(null);
              onRadiusChange(null);
              onDateFilterChange(null);
            }}
            icon={<X className="w-3 h-3" />}
          >
            Limpiar
          </Chip>
        )}

        {/* Categories */}
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            active={category === cat}
            onClick={() => onCategoryChange(category === cat ? null : cat)}
          >
            {cat}
          </Chip>
        ))}
      </div>

      {/* Second row: radius + date */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {hasLocation && RADII.map((r) => (
          <Chip
            key={r.value}
            active={radius === r.value}
            onClick={() => onRadiusChange(radius === r.value ? null : r.value)}
            icon={<MapPin className="w-3 h-3" />}
          >
            {r.label}
          </Chip>
        ))}

        {DATE_OPTIONS.map((d) => (
          <Chip
            key={d.value}
            active={dateFilter === d.value}
            onClick={() => onDateFilterChange(dateFilter === d.value ? null : d.value)}
          >
            {d.label}
          </Chip>
        ))}
      </div>
    </div>
  );
};
