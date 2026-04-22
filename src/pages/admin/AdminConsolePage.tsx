import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CancelacionesTab } from "./tabs/CancelacionesTab";
import { DisputasTab } from "./tabs/DisputasTab";
import { ReagendamientosTab } from "./tabs/ReagendamientosTab";
import { UsuariosTab } from "./tabs/UsuariosTab";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

const AdminConsolePage = () => {
  const navigate = useNavigate();
  const { markAllRead } = useAdminNotifications(true);

  // Mark all notifications as read when admin opens the console
  useEffect(() => { markAllRead(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Consola de Conflictos</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Panel Admin
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="cancelaciones">
          <TabsList className="mb-6">
            <TabsTrigger value="cancelaciones">Cancelaciones</TabsTrigger>
            <TabsTrigger value="disputas">Disputas</TabsTrigger>
            <TabsTrigger value="reagendamientos">Reagendamientos</TabsTrigger>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          </TabsList>

          <TabsContent value="cancelaciones">
            <CancelacionesTab />
          </TabsContent>

          <TabsContent value="disputas">
            <DisputasTab />
          </TabsContent>

          <TabsContent value="reagendamientos">
            <ReagendamientosTab />
          </TabsContent>

          <TabsContent value="usuarios">
            <UsuariosTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminConsolePage;
