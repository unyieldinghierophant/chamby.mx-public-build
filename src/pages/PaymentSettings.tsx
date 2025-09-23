import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { CreditCard, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

const PaymentSettings = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    name: ''
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleAddCard = async () => {
    setIsAddingCard(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add mock card
      const newCard: PaymentMethod = {
        id: Date.now().toString(),
        type: 'card',
        last4: cardForm.cardNumber.slice(-4),
        brand: 'visa',
        expiryMonth: parseInt(cardForm.expiryMonth),
        expiryYear: parseInt(cardForm.expiryYear),
        isDefault: paymentMethods.length === 0
      };
      
      setPaymentMethods([...paymentMethods, newCard]);
      setCardForm({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvc: '',
        name: ''
      });
      
      toast.success("Tarjeta agregada correctamente");
    } catch (error) {
      toast.error("Error al agregar la tarjeta");
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    setPaymentMethods(paymentMethods.filter(card => card.id !== cardId));
    toast.success("Tarjeta eliminada");
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Volver a Mi Cuenta
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Configuración de Pagos</h1>
            <p className="text-muted-foreground">Gestiona tus métodos de pago y historial de transacciones</p>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Métodos de Pago
                </CardTitle>
                <CardDescription>
                  Gestiona tus tarjetas y métodos de pago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay métodos de pago</h3>
                    <p className="text-muted-foreground mb-4">
                      Agrega una tarjeta para comenzar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-6 h-6 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              •••• •••• •••• {method.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {method.brand?.toUpperCase()} • Expira {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                          {method.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Por defecto
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCard(method.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Método de Pago
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Agregar Tarjeta</DialogTitle>
                      <DialogDescription>
                        Ingresa los datos de tu tarjeta de crédito o débito
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="card-name">Nombre en la tarjeta</Label>
                        <Input
                          id="card-name"
                          value={cardForm.name}
                          onChange={(e) => setCardForm({...cardForm, name: e.target.value})}
                          placeholder="Juan Pérez"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="card-number">Número de tarjeta</Label>
                        <Input
                          id="card-number"
                          value={cardForm.cardNumber}
                          onChange={(e) => setCardForm({...cardForm, cardNumber: formatCardNumber(e.target.value)})}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="expiry-month">Mes</Label>
                          <Select
                            value={cardForm.expiryMonth}
                            onValueChange={(value) => setCardForm({...cardForm, expiryMonth: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                                <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                                  {month.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiry-year">Año</Label>
                          <Select
                            value={cardForm.expiryYear}
                            onValueChange={(value) => setCardForm({...cardForm, expiryYear: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="YYYY" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input
                            id="cvc"
                            value={cardForm.cvc}
                            onChange={(e) => setCardForm({...cardForm, cvc: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                            placeholder="123"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddCard}
                        disabled={isAddingCard || !cardForm.cardNumber || !cardForm.name || !cardForm.expiryMonth || !cardForm.expiryYear || !cardForm.cvc}
                      >
                        {isAddingCard ? "Agregando..." : "Agregar Tarjeta"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {profile?.is_tasker && (
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
                <CardHeader>
                  <CardTitle>Información de Facturación</CardTitle>
                  <CardDescription>
                    Resumen de tus ganancias y pagos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-medium mb-1">Ganancias Este Mes</p>
                      <p className="text-2xl font-bold text-primary">$0</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-medium mb-1">Total Disponible</p>
                      <p className="text-2xl font-bold text-green-600">$0</p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <h4 className="font-medium">Historial de Transacciones</h4>
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No hay transacciones recientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSettings;