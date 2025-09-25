import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  ArrowLeft, 
  FileText,
  Database,
  Calendar,
  MessageSquare,
  CreditCard,
  CheckCircle
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { toast } from 'sonner';

const DataExport = () => {
  const { user } = useAuth();
  const [selectedData, setSelectedData] = useState<string[]>(['profile']);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const dataTypes = [
    {
      id: 'profile',
      name: 'Información del Perfil',
      description: 'Datos personales, foto de perfil, biografía',
      icon: Database,
      size: '2.1 KB'
    },
    {
      id: 'bookings',
      name: 'Historial de Reservas',
      description: 'Todas tus reservas pasadas y futuras',
      icon: Calendar,
      size: '45.7 KB'
    },
    {
      id: 'messages',
      name: 'Conversaciones',
      description: 'Historial de mensajes con proveedores',
      icon: MessageSquare,
      size: '12.3 KB'
    },
    {
      id: 'payments',
      name: 'Información de Pagos',
      description: 'Historial de transacciones y métodos de pago',
      icon: CreditCard,
      size: '8.9 KB'
    },
    {
      id: 'reviews',
      name: 'Reseñas y Calificaciones',
      description: 'Reseñas que has dado y recibido',
      icon: FileText,
      size: '3.2 KB'
    }
  ];

  const handleDataToggle = (dataType: string) => {
    setSelectedData(prev => {
      if (prev.includes(dataType)) {
        return prev.filter(id => id !== dataType);
      } else {
        return [...prev, dataType];
      }
    });
  };

  const handleExport = async () => {
    if (selectedData.length === 0) {
      toast.error('Selecciona al menos un tipo de datos para exportar');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    // Simulate export process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setExportProgress(i);
    }

    setIsExporting(false);
    setExportComplete(true);
    toast.success('Exportación completada. Descarga iniciada automáticamente.');
    
    // Simulate file download
    const blob = new Blob(['Datos exportados de tu cuenta'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chamby-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTotalSize = () => {
    return selectedData.reduce((total, dataType) => {
      const item = dataTypes.find(d => d.id === dataType);
      if (item) {
        const size = parseFloat(item.size.replace(/[^\d.]/g, ''));
        return total + size;
      }
      return total;
    }, 0).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Link to="/profile/general" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Volver a Configuración General
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Exportar Mis Datos</h1>
            <p className="text-muted-foreground">
              Descarga una copia de todos tus datos almacenados en Chamby
            </p>
          </div>

          <div className="space-y-6">
            {/* Export Status */}
            {exportComplete && (
              <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-green-800 dark:text-green-200">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <h3 className="font-semibold">Exportación Completada</h3>
                      <p className="text-sm">Tu archivo ha sido descargado automáticamente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Progress */}
            {isExporting && (
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 animate-pulse text-primary" />
                      <div>
                        <h3 className="font-semibold">Exportando datos...</h3>
                        <p className="text-sm text-muted-foreground">
                          Preparando tu archivo de exportación
                        </p>
                      </div>
                    </div>
                    <Progress value={exportProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      {exportProgress}% completado
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Selection */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Selecciona los datos a exportar
                </CardTitle>
                <CardDescription>
                  Elige qué información quieres incluir en tu exportación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dataTypes.map((dataType) => (
                  <div 
                    key={dataType.id}
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={dataType.id}
                      checked={selectedData.includes(dataType.id)}
                      onCheckedChange={() => handleDataToggle(dataType.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <dataType.icon className="w-4 h-4 text-primary" />
                        <Label 
                          htmlFor={dataType.id} 
                          className="font-medium cursor-pointer"
                        >
                          {dataType.name}
                        </Label>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {dataType.size}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dataType.description}
                      </p>
                    </div>
                  </div>
                ))}

                {selectedData.length > 0 && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {selectedData.length} elemento(s) seleccionado(s)
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Tamaño total: ~{getTotalSize()} KB
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Information */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle>Información sobre la Exportación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Los datos se exportarán en formato JSON</li>
                  <li>• El archivo incluirá únicamente tus datos personales</li>
                  <li>• La descarga comenzará automáticamente cuando esté lista</li>
                  <li>• Puedes realizar una nueva exportación en cualquier momento</li>
                  <li>• Los datos son una instantánea de la información actual</li>
                </ul>
                
                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={handleExport}
                    disabled={selectedData.length === 0 || isExporting}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Exportando...' : 'Iniciar Exportación'}
                  </Button>
                  
                  {selectedData.length === 0 && (
                    <p className="text-sm text-muted-foreground self-center">
                      Selecciona al menos un tipo de datos
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DataExport;