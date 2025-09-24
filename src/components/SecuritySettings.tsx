import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import SecurityAlert from './SecurityAlert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const SecuritySettings: React.FC = () => {
  const { recentActivity, loading, error } = useSecurityMonitoring();

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <SecurityAlert title="Configuración de Seguridad">
        Tu cuenta cuenta con protecciones de seguridad avanzadas incluyendo 
        auditoría de acciones y limitación de intentos.
      </SecurityAlert>

      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente de Seguridad</CardTitle>
          <CardDescription>
            Registro de las últimas acciones realizadas en tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando actividad...</p>
            </div>
          )}

          {error && (
            <SecurityAlert variant="destructive">
              Error al cargar la actividad de seguridad: {error}
            </SecurityAlert>
          )}

          {!loading && !error && recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay actividad reciente registrada
            </p>
          )}

          {!loading && !error && recentActivity.length > 0 && (
            <div className="space-y-3">
              {recentActivity.map((event, index) => (
                <div key={event.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant={getActionColor(event.action)}>
                        {event.action}
                      </Badge>
                      <span className="text-sm font-medium">
                        {event.table_name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {index < recentActivity.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SecurityAlert variant="default" title="Configuración Pendiente">
        Para completar la configuración de seguridad, habilita la protección contra 
        contraseñas filtradas en el panel de Supabase (Authentication → Settings → Password Security).
      </SecurityAlert>
    </div>
  );
};

export default SecuritySettings;