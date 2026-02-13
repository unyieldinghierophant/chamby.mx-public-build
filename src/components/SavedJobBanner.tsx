import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { startBooking } from '@/lib/booking';

export const SavedJobBanner = () => {
  const [hasSavedJob, setHasSavedJob] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's saved form data
    const savedData = localStorage.getItem('job_booking_form');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Only show if data was saved within last 24 hours
        const savedTime = new Date(parsedData.timestamp).getTime();
        const now = new Date().getTime();
        const hoursSinceLastSave = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave < 24) {
          setHasSavedJob(true);
          setIsVisible(true);
        } else {
          // Clear expired data
          localStorage.removeItem('job_booking_form');
        }
      } catch (e) {
        console.error('Error parsing saved job data:', e);
      }
    }
  }, []);

  const handleContinue = () => {
    startBooking(navigate, { entrySource: 'saved_job_banner' });
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Don't delete the data, just hide the banner
    // User might want to resume later
  };

  if (!hasSavedJob || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-primary/95 to-primary/90 backdrop-blur-md text-primary-foreground rounded-2xl shadow-elegant border border-primary/20 p-4 md:p-5">
        <div className="flex items-center gap-4">
          <div className="bg-primary-foreground/10 p-3 rounded-full flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg mb-1">
              Tienes una solicitud de trabajo guardada
            </h3>
            <p className="text-sm text-primary-foreground/80 line-clamp-1">
              ¿Quieres continuar donde lo dejaste?
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleContinue}
              size="sm"
              className="bg-background text-primary hover:bg-background/90 font-medium"
            >
              Continuar
            </Button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
