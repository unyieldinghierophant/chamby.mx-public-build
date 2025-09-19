import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modernButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        primary: "bg-gradient-button text-primary-foreground shadow-raised hover:shadow-floating hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        glass: "bg-gradient-glass backdrop-blur-glass border border-white/20 text-foreground shadow-soft hover:shadow-raised hover:bg-gradient-to-r hover:from-white/30 hover:to-white/10 hover:scale-[1.02] active:scale-[0.98]",
        glow: "bg-gradient-button text-primary-foreground shadow-glow hover:shadow-[0_0_40px_hsl(150_60%_45%/0.6)] hover:scale-[1.02] active:scale-[0.98] animate-pulse",
        outline: "border-2 border-primary/20 bg-gradient-card text-primary hover:bg-gradient-button hover:text-primary-foreground shadow-soft hover:shadow-raised hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        xl: "h-16 px-10 py-5 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ModernButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof modernButtonVariants> {
  asChild?: boolean
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(modernButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
ModernButton.displayName = "ModernButton"

export { ModernButton, modernButtonVariants }