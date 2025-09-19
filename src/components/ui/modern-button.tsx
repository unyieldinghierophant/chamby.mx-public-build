import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modernButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        primary: "bg-gradient-button text-primary-foreground shadow-floating hover:shadow-[0_16px_50px_-8px_hsl(210_15_50%/0.4),0_0_0_1px_hsl(210_15_80%),inset_0_1px_0_hsl(150_60_55%)] hover:scale-[1.02] active:scale-[0.98] active:shadow-raised before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/25 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity transform-gpu",
        glass: "bg-gradient-glass backdrop-blur-glass border border-white/30 text-foreground shadow-raised hover:shadow-floating hover:bg-gradient-to-r hover:from-white/35 hover:to-white/15 hover:scale-[1.02] active:scale-[0.98] active:shadow-soft transform-gpu inset-shadow",
        glow: "bg-gradient-button text-primary-foreground shadow-[0_0_32px_hsl(150_60_45%/0.5),0_16px_40px_-8px_hsl(210_15_50%/0.3),inset_0_1px_0_hsl(150_60_55%)] hover:shadow-[0_0_48px_hsl(150_60_45%/0.7),0_20px_50px_-8px_hsl(210_15_50%/0.4)] hover:scale-[1.02] active:scale-[0.98] transform-gpu",
        outline: "border-2 border-primary/30 bg-gradient-card text-primary hover:bg-gradient-button hover:text-primary-foreground shadow-raised hover:shadow-floating hover:scale-[1.02] active:scale-[0.98] active:shadow-soft transform-gpu inset-shadow",
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