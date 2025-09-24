import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecurityAlertProps {
  variant?: 'default' | 'destructive';
  title?: string;
  children: React.ReactNode;
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({ 
  variant = 'default', 
  title,
  children 
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Alert variant={variant}>
      {getIcon()}
      {title && <h4 className="font-semibold mb-1">{title}</h4>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
};

export default SecurityAlert;