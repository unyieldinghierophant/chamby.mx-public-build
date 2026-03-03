import { cn } from "@/lib/utils";

interface ChambyHouseIconProps {
  className?: string;
}

const ChambyHouseIcon = ({ className }: ChambyHouseIconProps) => (
  <svg
    className={cn("flex-shrink-0", className)}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
  >
    {/* House body */}
    <path
      d="M50 12L15 42V82C15 86.4 18.6 90 23 90H77C81.4 90 85 86.4 85 82V42L50 12Z"
      fill="currentColor"
    />
    {/* Left eye */}
    <circle cx="38" cy="55" r="5.5" fill="white" />
    {/* Right eye */}
    <circle cx="62" cy="55" r="5.5" fill="white" />
    {/* Smile */}
    <path
      d="M36 68C36 68 42 78 50 78C58 78 64 68 64 68"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export default ChambyHouseIcon;
