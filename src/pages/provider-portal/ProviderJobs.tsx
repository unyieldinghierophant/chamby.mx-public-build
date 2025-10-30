import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign, User } from "lucide-react";

const ProviderJobs = () => {
  const [activeTab, setActiveTab] = useState("disponibles");

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trabajos</h1>
        <p className="text-muted-foreground">
          Gestiona tus trabajos disponibles, activos y futuros
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="disponibles">Disponibles</TabsTrigger>
          <TabsTrigger value="activos">Activos</TabsTrigger>
          <TabsTrigger value="futuros">Futuros</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="disponibles" className="space-y-4 mt-6">
          <div className="text-center py-8 text-muted-foreground">
            No hay trabajos disponibles en este momento
          </div>
        </TabsContent>

        <TabsContent value="activos" className="space-y-4 mt-6">
          <div className="text-center py-8 text-muted-foreground">
            No tienes trabajos activos
          </div>
        </TabsContent>

        <TabsContent value="futuros" className="space-y-4 mt-6">
          <div className="text-center py-8 text-muted-foreground">
            No tienes trabajos futuros programados
          </div>
        </TabsContent>

        <TabsContent value="historial" className="space-y-4 mt-6">
          <div className="text-center py-8 text-muted-foreground">
            No hay trabajos completados aún
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderJobs;
