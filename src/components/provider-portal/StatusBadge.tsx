import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Search, MapPin, FileText, ThumbsUp, CreditCard, Wrench, CheckCircle, Ban, AlertTriangle } from "lucide-react";
import { getStatusLabel, getStatusColor, JOB_STATUS_CONFIG } from "@/utils/jobStateMachine";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "default" | "lg";
}

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  searching: Search,
  assigned: CheckCircle2,
  on_site: MapPin,
  quoted: FileText,
  quote_accepted: ThumbsUp,
  quote_rejected: XCircle,
  job_paid: CreditCard,
  in_progress: Loader2,
  provider_done: Wrench,
  completed: CheckCircle,
  cancelled: Ban,
  disputed: AlertTriangle,
  no_match: AlertCircle,
};

export const StatusBadge = ({ status, size = "default" }: StatusBadgeProps) => {
  const config = JOB_STATUS_CONFIG[status];
  const label = getStatusLabel(status);
  const Icon = STATUS_ICONS[status] || AlertCircle;
  const className = config
    ? `${config.bg} ${config.text} hover:${config.bg} ${config.border}`
    : 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-300';

  return (
    <Badge 
      variant="outline" 
      className={`${className} flex items-center gap-1 ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 
        size === 'lg' ? 'text-base px-4 py-1.5' : 
        'text-sm px-3 py-1'
      }`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {label}
    </Badge>
  );
};
