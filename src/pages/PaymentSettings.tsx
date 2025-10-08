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
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import { CreditCard, ArrowLeft, Plus, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
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

interface CardValidation {
  isValid: boolean;
  brand: string;
  errors: string[];
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
  
  const [cardValidation, setCardValidation] = useState<CardValidation>({
    isValid: false,
    brand: '',
    errors: []
  });

  // Card brand detection patterns
  const cardPatterns = {
    visa: /^4[0-9]{0,15}$/,
    mastercard: /^5[1-5][0-9]{0,14}$|^2[2-7][0-9]{0,14}$/,
    amex: /^3[47][0-9]{0,13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{0,12}$/,
    dinersclub: /^3[0689][0-9]{0,11}$/,
    jcb: /^(?:2131|1800|35\d{3})\d{0,11}$/
  };

  const cardBrandNames = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    dinersclub: 'Diners Club',
    jcb: 'JCB'
  };

  // Luhn algorithm for card number validation
  const validateCardNumber = (number: string): boolean => {
    const cleanNumber = number.replace(/\s/g, '');
    if (!/^\d+$/.test(cleanNumber) || cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Detect card brand
  const detectCardBrand = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    
    for (const [brand, pattern] of Object.entries(cardPatterns)) {
      if (pattern.test(cleanNumber)) {
        return brand;
      }
    }
    
    return '';
  };

  // Validate entire card form
  const validateCard = (cardNumber: string, expiryMonth: string, expiryYear: string, cvc: string): CardValidation => {
    const errors: string[] = [];
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const brand = detectCardBrand(cardNumber);
    
    // Card number validation
    if (!cleanNumber) {
      errors.push('Número de tarjeta requerido');
    } else if (!validateCardNumber(cleanNumber)) {
      errors.push('Número de tarjeta inválido');
    }
    
    // Expiry validation
    if (!expiryMonth || !expiryYear) {
      errors.push('Fecha de expiración requerida');
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const expYear = parseInt(expiryYear);
      const expMonth = parseInt(expiryMonth);
      
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        errors.push('La tarjeta ha expirado');
      }
    }
    
    // CVC validation
    if (!cvc) {
      errors.push('CVC requerido');
    } else {
      const expectedLength = brand === 'amex' ? 4 : 3;
      if (cvc.length !== expectedLength) {
        errors.push(`CVC debe tener ${expectedLength} dígitos`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      brand,
      errors
    };
  };

  // Update validation when form changes
  useEffect(() => {
    if (cardForm.cardNumber || cardForm.expiryMonth || cardForm.expiryYear || cardForm.cvc) {
      const validation = validateCard(cardForm.cardNumber, cardForm.expiryMonth, cardForm.expiryYear, cardForm.cvc);
      setCardValidation(validation);
    } else {
      setCardValidation({ isValid: false, brand: '', errors: [] });
    }
  }, [cardForm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/user" replace />;
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
    const brand = detectCardBrand(v);
    
    // American Express uses 4-6-5 format
    if (brand === 'amex') {
      const matches = v.match(/^(\d{0,4})(\d{0,6})(\d{0,5})$/);
      if (matches) {
        return [matches[1], matches[2], matches[3]].filter(Boolean).join(' ');
      }
    }
    
    // Standard 4-4-4-4 format for other cards
    const matches = v.match(/\d{1,4}/g);
    if (matches) {
      return matches.join(' ');
    }
    
    return v;
  };

  const getCardIcon = (brand: string) => {
    const icons = {
      visa: '💳',
      mastercard: '🔴',
      amex: '🔷',
      discover: '🟠',
      dinersclub: '🔵',
      jcb: '🟢'
    };
    return icons[brand as keyof typeof icons] || '💳';
  };

  const getCardGradient = (brand: string) => {
    const gradients = {
      visa: 'bg-gradient-to-r from-blue-600 to-blue-800',
      mastercard: 'bg-gradient-to-r from-red-500 to-orange-600',
      amex: 'bg-gradient-to-r from-green-600 to-teal-700',
      discover: 'bg-gradient-to-r from-orange-500 to-amber-600',
      dinersclub: 'bg-gradient-to-r from-purple-600 to-indigo-700',
      jcb: 'bg-gradient-to-r from-green-500 to-emerald-600'
    };
    return gradients[brand as keyof typeof gradients] || 'bg-gradient-to-r from-gray-600 to-gray-800';
  };

  // Animate card preview
  const CardPreview = ({ brand, cardNumber, name, expiryMonth, expiryYear }: {
    brand: string;
    cardNumber: string;
    name: string;
    expiryMonth: string;
    expiryYear: string;
  }) => (
    <div className="animate-scale-in">
      <div className={`relative w-80 h-48 rounded-xl shadow-2xl transform transition-all duration-500 hover:scale-105 ${getCardGradient(brand)}`}>
        {/* Card shine effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse"></div>
        
        {/* Card content */}
        <div className="relative p-6 h-full flex flex-col justify-between text-white">
          {/* Card brand and type */}
          <div className="flex justify-between items-start">
            <div className="text-sm font-light opacity-80">DÉBITO/CRÉDITO</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getCardIcon(brand)}</span>
              <span className="font-bold text-lg">
                {cardBrandNames[brand as keyof typeof cardBrandNames] || 'TARJETA'}
              </span>
            </div>
          </div>

          {/* Card number */}
          <div className="space-y-4">
            <div className="font-mono text-xl tracking-wider">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>
            
            {/* Card details */}
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="text-xs opacity-60">TITULAR</div>
                <div className="font-medium text-sm">
                  {name?.toUpperCase() || 'NOMBRE APELLIDO'}
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="text-xs opacity-60">VENCE</div>
                <div className="font-mono text-sm">
                  {expiryMonth && expiryYear ? `${expiryMonth}/${expiryYear.slice(-2)}` : 'MM/AA'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card pattern overlay */}
        <div className="absolute top-0 left-0 w-full h-full rounded-xl opacity-20">
          <div className="absolute top-4 right-4 w-12 h-8 bg-white/20 rounded-sm"></div>
          <div className="absolute bottom-8 left-6 w-8 h-6 bg-white/30 rounded-full"></div>
          <div className="absolute bottom-8 left-16 w-6 h-4 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );

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
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Agregar Tarjeta</DialogTitle>
                        <DialogDescription>
                          Ingresa los datos de tu tarjeta de crédito o débito
                        </DialogDescription>
                      </DialogHeader>

                      {/* Animated Card Preview */}
                      {cardValidation.brand && cardForm.cardNumber.replace(/\s/g, '').length >= 4 && (
                        <div className="flex justify-center mb-6 animate-fade-in">
                          <CardPreview
                            brand={cardValidation.brand}
                            cardNumber={cardForm.cardNumber}
                            name={cardForm.name}
                            expiryMonth={cardForm.expiryMonth}
                            expiryYear={cardForm.expiryYear}
                          />
                        </div>
                      )}
                    <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="card-name">Nombre en la tarjeta</Label>
                          <Input
                            id="card-name"
                            value={cardForm.name}
                            onChange={(e) => setCardForm({...cardForm, name: e.target.value.toUpperCase()})}
                            placeholder="JUAN PÉREZ"
                            className="uppercase"
                          />
                        </div>
                      <div className="space-y-2">
                        <Label htmlFor="card-number">Número de tarjeta</Label>
                        <div className="relative">
                          <Input
                            id="card-number"
                            value={cardForm.cardNumber}
                            onChange={(e) => setCardForm({...cardForm, cardNumber: formatCardNumber(e.target.value)})}
                            placeholder="1234 5678 9012 3456"
                            maxLength={cardValidation.brand === 'amex' ? 17 : 19}
                            className={`pr-12 ${cardValidation.brand && cardForm.cardNumber ? 'border-green-500' : ''}`}
                          />
                          {cardValidation.brand && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                {cardBrandNames[cardValidation.brand as keyof typeof cardBrandNames]}
                              </span>
                              <span>{getCardIcon(cardValidation.brand)}</span>
                            </div>
                          )}
                        </div>
                        {cardForm.cardNumber && !validateCardNumber(cardForm.cardNumber) && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Número de tarjeta inválido
                          </p>
                        )}
                        {cardForm.cardNumber && validateCardNumber(cardForm.cardNumber) && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Número válido
                          </p>
                        )}
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
                            onChange={(e) => {
                              const maxLength = cardValidation.brand === 'amex' ? 4 : 3;
                              setCardForm({...cardForm, cvc: e.target.value.replace(/\D/g, '').slice(0, maxLength)});
                            }}
                            placeholder={cardValidation.brand === 'amex' ? '1234' : '123'}
                            maxLength={cardValidation.brand === 'amex' ? 4 : 3}
                            className={cardForm.cvc && cardForm.cvc.length === (cardValidation.brand === 'amex' ? 4 : 3) ? 'border-green-500' : ''}
                          />
                          <p className="text-xs text-muted-foreground">
                            {cardValidation.brand === 'amex' ? '4 dígitos en el frente' : '3 dígitos en el reverso'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Validation Summary */}
                    {cardValidation.errors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1">
                            {cardValidation.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {cardValidation.isValid && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          ✅ Tarjeta {cardBrandNames[cardValidation.brand as keyof typeof cardBrandNames]} válida y lista para agregar
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <DialogFooter>
                      <Button
                        onClick={handleAddCard}
                        disabled={isAddingCard || !cardValidation.isValid || !cardForm.name}
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