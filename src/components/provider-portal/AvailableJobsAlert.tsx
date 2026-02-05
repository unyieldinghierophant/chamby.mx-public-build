import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, Briefcase, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface AvailableJobsAlertProps {
  jobCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const AvailableJobsAlert = ({ jobCount, isOpen, onClose }: AvailableJobsAlertProps) => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

  useEffect(() => {
    if (isOpen && jobCount > 0 && !hasPlayedSound) {
      // Create and play alarm sound using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create a sequence of beeps for the alarm
        const playBeep = (startTime: number, frequency: number, duration: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + duration - 0.01);
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };

        const now = audioContext.currentTime;
        
        // Play 3 ascending beeps
        playBeep(now, 523.25, 0.15); // C5
        playBeep(now + 0.2, 659.25, 0.15); // E5
        playBeep(now + 0.4, 783.99, 0.25); // G5
        
        setHasPlayedSound(true);
      } catch (error) {
        console.log("Could not play notification sound:", error);
      }
    }
  }, [isOpen, jobCount, hasPlayedSound]);

  // Reset sound flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setHasPlayedSound(false);
    }
  }, [isOpen]);

  const handleViewJobs = () => {
    onClose();
    navigate("/provider-portal/available-jobs");
  };

  if (jobCount === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 relative">
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 0.5, 
                repeat: Infinity, 
                repeatDelay: 2 
              }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <BellRing className="w-10 h-10 text-primary" />
            </motion.div>
            <Badge 
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground animate-pulse"
            >
              {jobCount}
            </Badge>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-center">
            ¡Tienes {jobCount} {jobCount === 1 ? 'trabajo' : 'trabajos'} disponible{jobCount === 1 ? '' : 's'}!
          </DialogTitle>
          
          <DialogDescription className="text-center text-muted-foreground mt-2">
            Hay nuevas oportunidades de trabajo esperándote. ¡No las dejes escapar!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleViewJobs}
            size="lg"
            className="w-full bg-gradient-button hover:shadow-button-hover"
          >
            <Briefcase className="w-5 h-5 mr-2" />
            Ver Trabajos Disponibles
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClose}
            size="lg"
          >
            Ver más tarde
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
