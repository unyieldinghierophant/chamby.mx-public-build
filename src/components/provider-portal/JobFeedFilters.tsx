import { useState } from "react";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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

const DATE_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: 'Hoy', value: 'today' },
  { label: 'Próximos 3 días', value: '3days' },
  { label: 'Esta semana', value: 'week' },
];

export const JobFeedFilters = ({
  category,
  onCategoryChange,
  dateFilter,
  onDateFilterChange,
}: JobFeedFiltersProps) => {
  const [open, setOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState<CategoryFilter>(category);
  const [tempDate, setTempDate] = useState<DateFilter>(dateFilter);
  const isMobile = useIsMobile();

  const activeCount = (category ? 1 : 0) + (dateFilter ? 1 : 0);

  const handleOpen = () => {
    setTempCategory(category);
    setTempDate(dateFilter);
    setOpen(true);
  };

  const handleApply = () => {
    onCategoryChange(tempCategory);
    onDateFilterChange(tempDate);
    setOpen(false);
  };

  const handleClear = () => {
    setTempCategory(null);
    setTempDate(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="gap-1.5 rounded-full text-xs h-8"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filtros
        {activeCount > 0 && (
          <span className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={cn(
          isMobile && "rounded-t-2xl max-h-[85vh]"
        )}>
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              Los trabajos se ordenan automáticamente del más cercano al más lejano.
            </SheetDescription>
          </SheetHeader>

          <div className="py-5 space-y-6 overflow-y-auto">
            {/* Category */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Tipo de trabajo</h4>
              <div className="space-y-2.5">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Checkbox
                      checked={tempCategory === cat}
                      onCheckedChange={(checked) =>
                        setTempCategory(checked ? cat : null)
                      }
                    />
                    <span className="text-sm text-foreground">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Tiempo</h4>
              <div className="flex flex-wrap gap-2">
                {DATE_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setTempDate(tempDate === d.value ? null : d.value)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                      tempDate === d.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="flex-1"
              disabled={!tempCategory && !tempDate}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Limpiar
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1"
            >
              Aplicar filtros
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};
