import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modernButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        primary: "bg-gradient-button text-primary-foreground shadow-button-3d hover:shadow-button-hover active:shadow-button-active transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-primary/20",
        accent: "bg-gradient-accent text-accent-foreground shadow-button-3d hover:shadow-button-hover hover:shadow-glow-silver active:shadow-button-active transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-accent/30",
        glass: "bg-gradient-glass-button backdrop-blur-glass border-[var(--glass-border-foggy)] text-foreground shadow-button-3d hover:shadow-button-hover active:shadow-button-active transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",
        outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground transition-all duration-200",
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
      variant: "glass",
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