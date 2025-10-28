import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ServiceOption {
  name: string;
  description: string;
}

interface CategoryServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  services: ServiceOption[];
}

export const CategoryServicesDialog = ({ 
  open, 
  onOpenChange, 
  category, 
  services 
}: CategoryServicesDialogProps) => {
  const navigate = useNavigate();

  const handleServiceClick = (service: ServiceOption) => {
    navigate('/book-job', {
      state: {
        category,
        service: service.name,
        description: service.description
      }
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {category}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-2">
            {services.map((service, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-4 hover:bg-primary/10 hover:border-primary transition-all"
                onClick={() => handleServiceClick(service)}
              >
                <div>
                  <div className="font-semibold text-base">{service.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {service.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
