import { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/api/client';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function MarkPaymentDialog({ open, onClose, invoice, onMarkPaid }) {
  const { language } = useLanguage();
  const [paymentData, setPaymentData] = useState({
    paid_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    payment_notes: ''
  });
  const [generateReceipt, setGenerateReceipt] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onMarkPaid(invoice, paymentData);

      // Auto-generate receipt if requested
      if (generateReceipt && invoice) {
        try {
          const currentUser = await api.auth.me();
          const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;

          // Build receipt number: RCPT-YYYY-XXXX
          const year = new Date().getFullYear();
          const existing = await api.entities.Receipt.filter({ workspace_id: workspaceId });
          const seq = String(existing.length + 1).padStart(4, '0');
          const receiptNumber = `RCPT-${year}-${seq}`;

          const paymentMethodMap = {
            bank_transfer: 'transfer',
            mbway: 'mobile',
            paypal: 'other',
            stripe: 'other',
            cash: 'cash',
            other: 'other'
          };

          await api.entities.Receipt.create({
            workspace_id: workspaceId,
            receipt_number: receiptNumber,
            client_id: invoice.client_id || '',
            client_name: invoice.client_name,
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            amount: invoice.total,
            currency: invoice.currency || 'EUR',
            payment_method: paymentMethodMap[paymentData.payment_method] || 'transfer',
            date: paymentData.paid_date,
            notes: paymentData.payment_notes || '',
            type: 'issued'
          });

          toast.success(
            language === 'pt'
              ? `✅ Recibo ${receiptNumber} gerado automaticamente!`
              : `✅ Receipt ${receiptNumber} automatically generated!`
          );
        } catch (err) {
          console.error('Receipt generation failed:', err);
          toast.error(language === 'pt' ? 'Pagamento registado, mas erro ao gerar recibo' : 'Payment saved, but receipt generation failed');
        }
      }

      onClose();
    } finally {
      setSaving(false);
    }
  };

  const paymentMethods = {
    bank_transfer: language === 'pt' ? 'Transferência Bancária' : 'Bank Transfer',
    mbway: 'MB Way',
    paypal: 'PayPal',
    stripe: 'Stripe',
    cash: language === 'pt' ? 'Dinheiro' : 'Cash',
    other: language === 'pt' ? 'Outro' : 'Other'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'pt' ? 'Marcar como Pago' : 'Mark as Paid'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {language === 'pt' ? 'Fatura:' : 'Invoice:'} {invoice?.invoice_number}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'pt' ? 'Cliente:' : 'Client:'} {invoice?.client_name}
            </p>
            <p className="text-lg font-bold text-gray-900 mt-2">
              {invoice?.currency} {invoice?.total?.toFixed(2)}
            </p>
          </div>

          <div>
            <Label htmlFor="paid_date">
              {language === 'pt' ? 'Data de Pagamento' : 'Payment Date'}
            </Label>
            <Input
              id="paid_date"
              type="date"
              value={paymentData.paid_date}
              onChange={(e) => setPaymentData({...paymentData, paid_date: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="payment_method">
              {language === 'pt' ? 'Método de Pagamento' : 'Payment Method'}
            </Label>
            <Select
              value={paymentData.payment_method}
              onValueChange={(value) => setPaymentData({...paymentData, payment_method: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethods).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment_notes">
              {language === 'pt' ? 'Notas (opcional)' : 'Notes (optional)'}
            </Label>
            <Textarea
              id="payment_notes"
              value={paymentData.payment_notes}
              onChange={(e) => setPaymentData({...paymentData, payment_notes: e.target.value})}
              placeholder={language === 'pt' ? 'Informações adicionais...' : 'Additional information...'}
              rows={3}
            />
          </div>

          {/* Auto-generate receipt toggle */}
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-green-800">
                {language === 'pt' ? 'Gerar recibo automaticamente' : 'Auto-generate receipt'}
              </p>
              <p className="text-xs text-green-600">
                {language === 'pt'
                  ? 'Cria um recibo RCPT-YYYY-XXXX ligado a esta fatura'
                  : 'Creates a RCPT-YYYY-XXXX receipt linked to this invoice'}
              </p>
            </div>
            <Switch
              checked={generateReceipt}
              onCheckedChange={setGenerateReceipt}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving
                ? (language === 'pt' ? 'A guardar...' : 'Saving...')
                : (language === 'pt' ? 'Confirmar Pagamento' : 'Confirm Payment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}