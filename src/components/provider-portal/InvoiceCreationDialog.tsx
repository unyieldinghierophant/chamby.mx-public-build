import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Trash2, FileText, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

interface InvoiceCreationDialogProps {
  jobId: string;
  jobTitle: string;
  children?: React.ReactNode;
}

export function InvoiceCreationDialog({ 
  jobId, 
  jobTitle,
  children 
}: InvoiceCreationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  const calculateTotal = () => {
    const items = form.watch("line_items");
    return items.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (amount * quantity);
    }, 0);
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    
    try {
      const total = calculateTotal();
      
      if (total <= 0) {
        toast({
          title: "Error",
          description: "El total de la factura debe ser mayor a cero",
          variant: "destructive",
        });
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No autenticado");
      }

      const { data: response, error } = await supabase.functions.invoke(
        "create-visit-invoice",
        {
          body: {
            job_id: jobId,
            amount: total,
            description: data.description || undefined,
            line_items: data.line_items.map(item => ({
              description: item.description.trim(),
              amount: Number(item.amount),
              quantity: Number(item.quantity)
            }))
          },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }
      );

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || "Error al crear la factura");
      }

      toast({
        title: "✅ Factura creada",
        description: `Factura enviada al cliente por $${total.toLocaleString('es-MX', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} MXN`,
      });

      setOpen(false);
      form.reset();
      
      // Reload the page to show updated job status
      window.location.reload();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la factura",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="default" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Crear Factura
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Crear Factura
          </DialogTitle>
          <DialogDescription>
            Trabajo: <span className="font-medium text-foreground">{jobTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Conceptos</FormLabel>
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
                          Subtotal: ${(
                            (form.watch(`line_items.${index}.amount`) || 0) * 
                            (form.watch(`line_items.${index}.quantity`) || 0)
                          ).toLocaleString('es-MX', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} MXN
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

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg">Total</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    ${calculateTotal().toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} MXN
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  * El costo de la visita ($250 MXN) será reembolsado automáticamente al cliente cuando pague esta factura
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando factura...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Crear y enviar factura
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
