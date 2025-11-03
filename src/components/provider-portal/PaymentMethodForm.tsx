import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentMethodFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (method: {
    bank_name: string;
    account_number: string;
    clabe: string;
    account_holder_name: string;
  }) => Promise<void>;
}

export const PaymentMethodForm = ({
  open,
  onOpenChange,
  onSubmit,
}: PaymentMethodFormProps) => {
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    clabe: "",
    account_holder_name: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        bank_name: "",
        account_number: "",
        clabe: "",
        account_holder_name: "",
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Método de Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bank_name">Nombre del Banco</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) =>
                setFormData({ ...formData, bank_name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="account_holder">Titular de la Cuenta</Label>
            <Input
              id="account_holder"
              value={formData.account_holder_name}
              onChange={(e) =>
                setFormData({ ...formData, account_holder_name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="account_number">Número de Cuenta</Label>
            <Input
              id="account_number"
              value={formData.account_number}
              onChange={(e) =>
                setFormData({ ...formData, account_number: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="clabe">CLABE Interbancaria</Label>
            <Input
              id="clabe"
              value={formData.clabe}
              onChange={(e) =>
                setFormData({ ...formData, clabe: e.target.value })
              }
              maxLength={18}
              placeholder="18 dígitos"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
