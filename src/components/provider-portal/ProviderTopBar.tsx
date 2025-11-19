import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function ProviderTopBar() {
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/tasker");
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 lg:px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="availability"
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
          />
          <Label htmlFor="availability" className="cursor-pointer">
            <span className={isAvailable ? "text-green-600 font-medium" : "text-muted-foreground"}>
              {isAvailable ? "Disponible" : "No disponible"}
            </span>
          </Label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          variant="default" 
          size="sm" 
          className="hidden md:flex"
          onClick={() => navigate('/provider-portal/jobs')}
        >
          Ver solicitudes activas
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback>
                  {profile?.full_name?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block">
                {profile?.full_name || "Proveedor"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/provider-portal/profile")}>
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/provider-portal/verification")}>
              Verificación
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
