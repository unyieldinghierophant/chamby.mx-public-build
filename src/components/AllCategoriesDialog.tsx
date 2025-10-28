import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { categoryServicesMap } from '@/data/categoryServices';

interface AllCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AllCategoriesDialog = ({ open, onOpenChange }: AllCategoriesDialogProps) => {
  const navigate = useNavigate();

  const handleServiceClick = (category: string, serviceName: string, description: string) => {
    navigate('/book-job', {
      state: {
        category,
        service: serviceName,
        description
      }
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Categorías de Servicios</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {Object.entries(categoryServicesMap).map(([category, services]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
                  {category}
                </h3>
                <div className="grid gap-2">
                  {services.map((service, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-accent hover:border-primary transition-all"
                      onClick={() => handleServiceClick(category, service.name, service.description)}
                    >
                      <div className="font-medium text-sm">{service.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {service.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
