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
    <span className={cn("flex items-center", sizeClasses[size], className)}>
      <ChambyHouseIcon className="h-[1.3em] w-auto mr-[0.02em] shrink-0 translate-y-[0.08em]" />
      <span
        className="font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight text-foreground select-none"
        style={{ lineHeight: '1' }}
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
