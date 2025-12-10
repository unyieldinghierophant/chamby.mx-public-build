import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CreditCard, 
  XCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Receipt,
  ReceiptText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  VisitFeeStatus, 
  InvoiceStatus, 
  getVisitFeeLabel, 
  getInvoiceLabel 
} from "@/utils/jobPaymentStatus";

interface PaymentStatusBadgeProps {
  type: 'visit_fee' | 'invoice';
  status: VisitFeeStatus | InvoiceStatus;
  role?: 'customer' | 'provider';
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const PaymentStatusBadge = ({ 
  type, 
  status, 
  role = 'customer',
  size = 'sm',
  showIcon = true,
  className 
}: PaymentStatusBadgeProps) => {
  // Don't render anything for 'none' invoice status
  if (type === 'invoice' && status === 'none') {
    return null;
  }

  const getVariantAndIcon = () => {
    if (type === 'visit_fee') {
      const visitStatus = status as VisitFeeStatus;
      switch (visitStatus) {
        case 'captured':
          return {
            variant: 'success' as const,
            icon: ShieldCheck,
            bgClass: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
          };
        case 'authorized':
          return {
            variant: 'default' as const,
            icon: Shield,
            bgClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
          };
        case 'not_authorized':
          return {
            variant: 'destructive' as const,
            icon: ShieldAlert,
            bgClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
          };
        default:
          return {
            variant: 'secondary' as const,
            icon: Clock,
            bgClass: 'bg-muted text-muted-foreground',
          };
      }
    } else {
      const invoiceStatus = status as InvoiceStatus;
      switch (invoiceStatus) {
        case 'paid':
          return {
            variant: 'success' as const,
            icon: CheckCircle2,
            bgClass: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
          };
        case 'pending':
          return {
            variant: 'default' as const,
            icon: ReceiptText,
            bgClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
          };
        case 'draft':
          return {
            variant: 'secondary' as const,
            icon: Receipt,
            bgClass: 'bg-muted text-muted-foreground',
          };
        case 'failed':
          return {
            variant: 'destructive' as const,
            icon: XCircle,
            bgClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
          };
        default:
          return {
            variant: 'secondary' as const,
            icon: Clock,
            bgClass: 'bg-muted text-muted-foreground',
          };
      }
    }
  };

  const { icon: Icon, bgClass } = getVariantAndIcon();
  const label = type === 'visit_fee' 
    ? getVisitFeeLabel(status as VisitFeeStatus, role)
    : getInvoiceLabel(status as InvoiceStatus, role);

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : 'text-sm px-2.5 py-1 gap-1.5';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium border',
        bgClass,
        sizeClasses,
        className
      )}
    >
      {showIcon && <Icon className={iconSize} />}
      {label}
    </Badge>
  );
};

/**
 * Convenience component that shows both visit fee and invoice status
 */
interface JobPaymentStatusProps {
  visitFeeStatus: VisitFeeStatus;
  invoiceStatus?: InvoiceStatus;
  role?: 'customer' | 'provider';
  size?: 'sm' | 'md';
  className?: string;
}

export const JobPaymentStatusBadges = ({
  visitFeeStatus,
  invoiceStatus = 'none',
  role = 'customer',
  size = 'sm',
  className
}: JobPaymentStatusProps) => {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <PaymentStatusBadge 
        type="visit_fee" 
        status={visitFeeStatus} 
        role={role} 
        size={size}
      />
      {invoiceStatus !== 'none' && (
        <PaymentStatusBadge 
          type="invoice" 
          status={invoiceStatus} 
          role={role} 
          size={size}
        />
      )}
    </div>
  );
};
