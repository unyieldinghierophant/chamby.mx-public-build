import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import chambyLogo from "@/assets/chamby-logo-new-horizontal.png";

export function ProviderTopBar() {
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  

  const handleSignOut = async () => {
    await signOut();
    navigate("/provider-landing");
  };

  // Hide entire header on mobile - navigation moved to bottom nav and floating hamburger
  return (
    <header className="hidden md:flex h-14 border-b border-border bg-background/95 backdrop-blur-lg px-6 items-center justify-between sticky top-0 z-20 w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        {/* Logo */}
        <img 
          src={chambyLogo} 
          alt="Chamby" 
          className="h-12 cursor-pointer flex-shrink-0" 
          onClick={() => navigate('/provider-portal')}
        />
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Active requests button */}
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => navigate('/provider-portal/jobs')}
        >
          Ver solicitudes activas
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-1 px-1.5 h-9">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-xs">
                  {profile?.full_name?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-lg z-50">
            <DropdownMenuItem onClick={() => navigate("/provider-portal/profile")}>
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/provider-portal/verification")}>
              Verificación
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/provider-portal/earnings")}>
              Mis Ganancias
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
