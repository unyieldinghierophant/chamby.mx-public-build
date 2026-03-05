import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, DollarSign, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateJobPayment, formatMXN } from "@/utils/pricingConfig";
import { toast } from "sonner";

interface ProviderQuoteFormProps {
  jobId: string;
  onQuoteSubmitted: () => void;
}

export const ProviderQuoteForm = ({ jobId, onQuoteSubmitted }: ProviderQuoteFormProps) => {
  const [quotePesos, setQuotePesos] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const quoteCents = useMemo(() => {
    const parsed = parseFloat(quotePesos);
    if (isNaN(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100);
  }, [quotePesos]);

  const breakdown = useMemo(() => {
    if (quoteCents <= 0) return null;
    return calculateJobPayment(quoteCents);
  }, [quoteCents]);

  const isValid = quoteCents > 0 && quoteCents <= 10_000_000;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-quote", {
        body: { job_id: jobId, provider_quote_cents: quoteCents },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setSubmitted(true);
      toast.success("Cotización enviada exitosamente");
      onQuoteSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Error al enviar cotización");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Cotización enviada</p>
          <p className="text-xs text-muted-foreground">Esperando respuesta del cliente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Enviar cotización
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Input */}
        <div className="space-y-1.5">
          <Label htmlFor="quote-amount" className="text-xs text-muted-foreground">
            Monto de tu cotización (MXN)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              id="quote-amount"
              type="number"
              min="1"
              max="100000"
              step="1"
              placeholder="1,000"
              value={quotePesos}
              onChange={(e) => setQuotePesos(e.target.value)}
              className="pl-7 text-lg font-semibold h-12"
            />
          </div>
          {quotePesos && !isValid && quoteCents > 10_000_000 && (
            <p className="text-xs text-destructive">Máximo $100,000 MXN</p>
          )}
        </div>

        {/* Live preview */}
        {breakdown && isValid && (
          <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tu cotización</span>
              <span className="font-semibold">{formatMXN(breakdown.providerQuoteCents)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Comisión Chamby (10%)</span>
              <span>-{formatMXN(breakdown.providerDeduction)}</span>
            </div>
            <div className="flex justify-between font-semibold text-primary border-t border-border/50 pt-1.5">
              <span>Tú recibirás</span>
              <span>{formatMXN(breakdown.providerPayout)}</span>
            </div>
            <div className="border-t border-border/50 pt-1.5 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal cliente</span>
                <span>{formatMXN(breakdown.subtotalBeforeIVA)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>IVA (16%)</span>
                <span>{formatMXN(breakdown.ivaAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span>El cliente pagará</span>
                <span>~{formatMXN(breakdown.clientTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full h-11 gap-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          {submitting ? "Enviando..." : "Enviar cotización"}
        </Button>
      </CardContent>
    </Card>
  );
};
