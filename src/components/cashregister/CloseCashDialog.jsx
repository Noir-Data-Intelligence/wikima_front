import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/api/client';
import { useLanguage } from '../LanguageContext';
import { toast } from 'sonner';
import { Lock, TrendingUp, TrendingDown } from 'lucide-react';

const CURRENCY_SYMBOLS = { EUR: '€', AOA: 'Kz', USD: '$', BRL: 'R$', GBP: '£' };

export default function CloseCashDialog({ open, onClose, onSuccess, cashRegister }) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ closing_amount: '', closing_notes: '' });

  const sym = CURRENCY_SYMBOLS[cashRegister?.currency] || cashRegister?.currency || '';
  const closing = parseFloat(formData.closing_amount) || 0;
  const difference = formData.closing_amount ? closing - cashRegister.opening_amount : null;
  const hasDiff = difference !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.closing_amount) {
      toast.error(language === 'pt' ? 'Insira o valor de fecho' : 'Enter the closing amount');
      return;
    }
    setLoading(true);
    try {
      const user = await api.auth.me();
      await api.entities.CashRegister.update(cashRegister.id, {
        ...cashRegister,
        closing_amount: closing,
        closing_notes: formData.closing_notes,
        status: 'closed',
        closed_by: user.email,
        closed_at: new Date().toISOString(),
        difference
      });
      toast.success(language === 'pt' ? 'Caixa fechada!' : 'Register closed!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(language === 'pt' ? 'Erro ao fechar caixa' : 'Error closing register');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-background border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50 h-8 mt-1";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            {language === 'pt' ? 'Fechar Caixa' : 'Close Register'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {/* Summary row */}
          <div className="bg-background border border-border rounded-lg px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{language === 'pt' ? 'Saldo de abertura' : 'Opening balance'}</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{sym}{cashRegister?.opening_amount?.toFixed(2)}</span>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">{language === 'pt' ? 'Saldo de Fecho (contagem física)' : 'Closing Balance (physical count)'} *</Label>
            <Input
              type="number" min="0" step="0.01"
              value={formData.closing_amount}
              onChange={e => setFormData(p => ({ ...p, closing_amount: e.target.value }))}
              placeholder="0.00" required className={inputCls}
            />
          </div>

          {/* Difference preview */}
          {hasDiff && (
            <div className={`rounded-lg px-3 py-2.5 border ${difference >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {difference >= 0
                    ? <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                  <span className={`text-xs font-medium ${difference >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                    {language === 'pt' ? 'Diferença' : 'Difference'}
                  </span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${difference >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                  {difference >= 0 ? '+' : ''}{sym}{difference.toFixed(2)}
                </span>
              </div>
              {difference < 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {language === 'pt' ? 'Deficit — verifique os registos de movimentos.' : 'Deficit — check movement records.'}
                </p>
              )}
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">{language === 'pt' ? 'Notas de fecho (opcional)' : 'Closing notes (optional)'}</Label>
            <Textarea
              value={formData.closing_notes}
              onChange={e => setFormData(p => ({ ...p, closing_notes: e.target.value }))}
              placeholder={language === 'pt' ? 'Observações...' : 'Observations...'}
              rows={2}
              className="bg-background border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50 mt-1 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} className="h-8 text-xs text-muted-foreground hover:text-foreground">
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading} className="bg-rose-600/80 hover:bg-rose-600 h-8 text-xs gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {loading ? (language === 'pt' ? 'A fechar...' : 'Closing...') : (language === 'pt' ? 'Fechar Caixa' : 'Close Register')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}