import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import ChambyHouseIcon from "@/components/ChambyHouseIcon";

interface ChambyLogoTextProps {
  className?: string;
  to?: string;
  onClick?: () => void;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl md:text-4xl",
  xl: "text-4xl md:text-5xl",
};

const iconSizeClasses = {
  sm: "w-6 h-6",
  md: "w-7 h-7",
  lg: "w-8 h-8 md:w-10 md:h-10",
  xl: "w-10 h-10 md:w-12 md:h-12",
};

const ChambyLogoText = ({
  className,
  to,
  onClick,
  size = "lg",
}: ChambyLogoTextProps) => {
  const content = (
    <span className={cn("flex items-center gap-1.5", className)}>
      <ChambyHouseIcon className={cn("text-primary", iconSizeClasses[size])} />
      <span
        className={cn(
          "font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight text-foreground select-none",
          sizeClasses[size]
        )}
      >
        chamby
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="hover:opacity-80 transition-opacity cursor-pointer"
      >
        {content}
      </button>
    );
  }

  if (to) {
    return (
      <Link to={to} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};

export default ChambyLogoText;
