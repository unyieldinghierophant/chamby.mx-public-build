import { cn } from "@/lib/utils";
import chambyIcon from "@/assets/chamby-icon.png";

interface ChambyHouseIconProps {
  className?: string;
}

const ChambyHouseIcon = ({ className }: ChambyHouseIconProps) => (
  <img
    src={chambyIcon}
    alt="Chamby"
    className={cn("flex-shrink-0 object-contain", className)}
    draggable={false}
  />
);

export default ChambyHouseIcon;
