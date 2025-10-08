import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Briefcase, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("home");

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/user-landing" || path === "/search" || path === "/jobs" && location.search.includes("q=")) {
      setActiveTab("home");
    } else if (path === "/mobile-jobs") {
      setActiveTab("jobs");
    } else if (path === "/mobile-favorites") {
      setActiveTab("favorites");
    } else if (path.startsWith("/profile") || path === "/mobile-profile") {
      setActiveTab("profile");
    }
  }, [location]);

  const tabs = [
    {
      id: "home",
      label: "Inicio",
      icon: Home,
      path: user ? "/dashboard/user" : "/user-landing",
    },
    {
      id: "jobs",
      label: "Trabajos",
      icon: Briefcase,
      path: user ? "/mobile-jobs" : "/auth/user",
    },
    {
      id: "favorites",
      label: "Favoritos",
      icon: Heart,
      path: user ? "/mobile-favorites" : "/auth/user",
    },
    {
      id: "profile",
      label: "Perfil",
      icon: User,
      path: user ? "/mobile-profile" : "/auth/user",
    },
  ];

  const handleTabClick = (tab: any) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-card backdrop-blur-glass border-t border-white/20 shadow-floating">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive
                  ? "bg-gradient-button text-primary-foreground shadow-glow scale-105"
                  : "text-muted-foreground hover:text-primary hover:bg-white/10"
              )}
            >
              <IconComponent 
                className={cn(
                  "h-5 w-5 mb-1 transition-transform duration-200",
                  isActive && "scale-110"
                )} 
              />
              <span className={cn(
                "text-xs font-medium transition-colors duration-200",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;