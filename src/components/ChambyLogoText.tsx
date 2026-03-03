import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import ChambyHouseIcon from "@/components/ChambyHouseIcon";

interface ChambyLogoTextProps {
  className?: string;
  to?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl md:text-4xl",
  xl: "text-4xl md:text-5xl",
};

const ChambyLogoText = ({
  className,
  to,
  onClick,
  size = "lg",
}: ChambyLogoTextProps) => {
  const content = (
    <span className={cn("flex items-center gap-[0.2rem]", sizeClasses[size], className)}>
      <ChambyHouseIcon className="h-[1.15em] w-auto" />
      <span
        className="font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight text-foreground select-none -translate-y-[0.05em]"
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
