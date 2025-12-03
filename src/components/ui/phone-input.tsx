import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MEXICO_COUNTRY_CODE, formatPhoneDisplay, getCleanPhone } from '@/utils/phoneValidation';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, error, className, ...props }, ref) => {
    // Format value for display
    const displayValue = formatPhoneDisplay(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      // Remove all non-digits and limit to 10 digits
      const cleaned = getCleanPhone(input);
      onChange(cleaned);
    };

    return (
      <div className="flex">
        <span className={cn(
          "inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm font-medium",
          error ? "border-destructive" : "border-input"
        )}>
          {MEXICO_COUNTRY_CODE}
        </span>
        <Input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder="55 1234 5678"
          className={cn(
            "rounded-l-none",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          maxLength={14} // 10 digits + 2 spaces for formatting
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
