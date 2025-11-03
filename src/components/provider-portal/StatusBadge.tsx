import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "default" | "lg";
}

export const StatusBadge = ({ status, size = "default" }: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          label: 'Pendiente',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300',
          icon: Clock
        };
      case 'confirmed':
        return {
          label: 'Confirmado',
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300',
          icon: CheckCircle2
        };
      case 'in_progress':
        return {
          label: 'En Progreso',
          className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-300',
          icon: Loader2
        };
      case 'completed':
        return {
          label: 'Completado',
          className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-300',
          icon: CheckCircle2
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-300',
          icon: XCircle
        };
      case 'rescheduled':
        return {
          label: 'Reprogramado',
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-300',
          icon: AlertCircle
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-300',
          icon: AlertCircle
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} flex items-center gap-1 ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 
        size === 'lg' ? 'text-base px-4 py-1.5' : 
        'text-sm px-3 py-1'
      }`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </Badge>
  );
};