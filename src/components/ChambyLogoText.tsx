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
    <span className={cn("inline-flex flex-row items-center gap-2", sizeClasses[size], className)}>
      <ChambyHouseIcon className="h-[1.3em] w-auto shrink-0" />
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
        className="inline-flex p-0 m-0 border-0 bg-transparent hover:opacity-80 transition-opacity cursor-pointer leading-none appearance-none"
      >
        {content}
      </button>
    );
  }

  if (to) {
    return (
      <Link to={to} className="inline-flex hover:opacity-80 transition-opacity leading-none">
        {content}
      </Link>
    );
  }

  return content;
};

export default ChambyLogoText;
