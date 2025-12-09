import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCreateInvoice } from "@/hooks/useCreateInvoice";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  FileText, 
  DollarSign,
  Receipt,
  Percent,
  Wallet,
  Users
} from "lucide-react";

const lineItemSchema = z.object({
  description: z.string()
    .trim()
    .min(3, "La descripción debe tener al menos 3 caracteres")
    .max(200, "La descripción debe tener máximo 200 caracteres"),
  amount: z.number()
    .positive("El monto debe ser positivo")
    .max(1000000, "El monto es demasiado alto"),
  quantity: z.number()
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser positiva")
    .max(1000, "La cantidad es demasiado alta")
});

const invoiceSchema = z.object({
  description: z.string()
    .trim()
    .max(500, "La descripción debe tener máximo 500 caracteres")
    .optional(),
  line_items: z.array(lineItemSchema)
    .min(1, "Debes agregar al menos un concepto")
    .max(50, "Máximo 50 conceptos por factura")
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceBuilderProps {
  jobId: string;
  jobTitle: string;
  clientName: string;
}

export function InvoiceBuilder({ jobId, jobTitle, clientName }: InvoiceBuilderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createInvoice, loading: isSubmitting } = useCreateInvoice();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      description: "",
      line_items: [
        { description: "", amount: 0, quantity: 1 }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items"
  });

  const watchedItems = form.watch("line_items");

  // Calculate commission breakdown
  const commissionBreakdown = useMemo(() => {
    const subtotal = watchedItems.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (amount * quantity);
    }, 0);

    const providerFee = Math.round(subtotal * 0.10 * 100) / 100;
    const customerFee = Math.round(subtotal * 0.10 * 100) / 100;
    const chambyCommission = providerFee + customerFee;
    const totalCustomerAmount = subtotal + customerFee;
    const subtotalProviderNet = subtotal - providerFee;

    return {
      subtotal,
      providerFee,
      customerFee,
      chambyCommission,
      totalCustomerAmount,
      subtotalProviderNet
    };
  }, [watchedItems]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (commissionBreakdown.subtotal <= 0) {
      toast({
        title: "Error",
        description: "El total de la factura debe ser mayor a cero",
        variant: "destructive",
      });
      return;
    }

    const lineItems = data.line_items.map(item => ({
      description: item.description.trim(),
      amount: Number(item.amount),
      quantity: Number(item.quantity)
    }));

    const result = await createInvoice(jobId, lineItems, data.description || undefined);

    if (result.success && result.invoice) {
      toast({
        title: "✅ Factura creada",
        description: `Factura creada por $${formatCurrency(commissionBreakdown.totalCustomerAmount)} MXN`,
      });

      // Navigate to invoice preview/payment page
      navigate(`/invoice/${result.invoice.id}`);
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo crear la factura",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Info Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Trabajo</p>
              <h2 className="text-xl font-semibold text-foreground">{jobTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                <Users className="inline-block h-4 w-4 mr-1" />
                Cliente: {clientName}
              </p>
            </div>
            <Receipt className="h-10 w-10 text-primary/60" />
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción general (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Descripción adicional del trabajo realizado..."
                    className="resize-none"
                    rows={3}
                    maxLength={500}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-semibold">Conceptos</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", amount: 0, quantity: 1 })}
                disabled={fields.length >= 50}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar concepto
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="border-border/50">
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Descripción del concepto (ej: Reparación de tubería)"
                                maxLength={200}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`line_items.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Precio unitario (MXN)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`line_items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Cantidad</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="1"
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Subtotal: ${formatCurrency(
                          (form.watch(`line_items.${index}.amount`) || 0) * 
                          (form.watch(`line_items.${index}.quantity`) || 0)
                        )} MXN
                      </div>
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Commission Summary */}
          <Card className="bg-muted/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Resumen de comisiones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (conceptos)</span>
                <span className="font-medium">${formatCurrency(commissionBreakdown.subtotal)} MXN</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="text-destructive">−</span> Comisión proveedor (10%)
                </span>
                <span className="text-destructive">−${formatCurrency(commissionBreakdown.providerFee)} MXN</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="text-primary">+</span> Cargo al cliente (10%)
                </span>
                <span className="text-primary">+${formatCurrency(commissionBreakdown.customerFee)} MXN</span>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total comisión Chamby (20%)</span>
                <span>${formatCurrency(commissionBreakdown.chambyCommission)} MXN</span>
              </div>
              
              <Separator />
              
              {/* Customer Total */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">Cliente paga</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  ${formatCurrency(commissionBreakdown.totalCustomerAmount)} MXN
                </span>
              </div>
              
              {/* Provider Net */}
              <div className="flex justify-between items-center bg-green-500/10 rounded-lg p-3 -mx-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">Tú recibes</span>
                </div>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${formatCurrency(commissionBreakdown.subtotalProviderNet)} MXN
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || commissionBreakdown.subtotal <= 0}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando factura...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Crear Factura
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
