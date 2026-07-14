import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/api/client';
import { useLanguage } from '../LanguageContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import { enUS } from 'date-fns/locale/en-US';
import { LockOpen, User, Clock, Calendar } from 'lucide-react';

export default function OpenCashDialog({ open, onClose, onSuccess }) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [now] = useState(new Date());
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    opening_amount: '',
    currency: 'EUR',
    opening_notes: ''
  });

  useEffect(() => {
    if (open) {
      api.auth.me().then(u => setCurrentUser(u)).catch(() => {});
    }
  }, [open]);

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  // DD/MM/YYYY display for the date field label
  const displayDate = formData.date
    ? format(new Date(formData.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: language === 'pt' ? pt : enUS })
    : '';

  const openingTime = format(now, 'HH:mm');
  const userName = currentUser?.full_name || currentUser?.email || '—';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.opening_amount) {
      toast.error(language === 'pt' ? 'Insira o valor de abertura' : 'Enter the opening amount');
      return;
    }
    setLoading(true);
    try {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;

      const existing = await api.entities.CashRegister.filter({ workspace_id: wsId, date: formData.date });
      if (existing.length > 0) {
        toast.error(language === 'pt' ? 'Sessão de caixa já aberta para esta data' : 'Cash session already opened for this date');
        return;
      }

      await api.entities.CashRegister.create({
        workspace_id: wsId,
        date: formData.date,
        opening_amount: parseFloat(formData.opening_amount),
        currency: formData.currency,
        opening_notes: formData.opening_notes,
        status: 'open',
        opened_by: user.full_name || user.email,
        opened_at: now.toISOString()
      });

      toast.success(language === 'pt' ? 'Sessão de caixa aberta!' : 'Cash session opened!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(language === 'pt' ? 'Erro ao abrir sessão' : 'Error opening session');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-background border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50 h-7 mt-1";
  const selectCls = "bg-background border-border text-foreground text-sm h-7 mt-1";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[380px] bg-card border-border p-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <LockOpen className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              {language === 'pt' ? 'Abrir Sessão de Caixa' : 'Open Cash Session'}
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground ml-9">
            {language === 'pt'
              ? 'Inicia o controlo diário de movimentos de caixa.'
              : 'Starts the daily cash flow control session.'}
          </p>
        </div>

        {/* Session metadata */}
        <div className="px-5 py-3 border-b border-border bg-card grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <User className="w-2.5 h-2.5" />
              {language === 'pt' ? 'Aberto por' : 'Opened by'}
            </span>
            <span className="text-[11px] text-muted-foreground truncate font-medium">{userName}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {language === 'pt' ? 'Hora' : 'Time'}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium tabular-nums">{openingTime}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {language === 'pt' ? 'Data' : 'Date'}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium tabular-nums">{displayDate}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground">{language === 'pt' ? 'Data da sessão' : 'Session date'} *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={e => set('date', e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">{language === 'pt' ? 'Moeda' : 'Currency'}</Label>
              <Select value={formData.currency} onValueChange={v => set('currency', v)}>
                <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="AOA">AOA (Kz)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">{language === 'pt' ? 'Saldo de Abertura' : 'Opening Balance'} *</Label>
            <Input
              type="number" min="0" step="0.01"
              value={formData.opening_amount}
              onChange={e => set('opening_amount', e.target.value)}
              placeholder="0.00"
              required
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">{language === 'pt' ? 'Observações (opcional)' : 'Observations (optional)'}</Label>
            <Textarea
              value={formData.opening_notes}
              onChange={e => set('opening_notes', e.target.value)}
              placeholder={language === 'pt' ? 'Notas operacionais...' : 'Operational notes...'}
              rows={2}
              className="bg-background border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50 mt-1 resize-none text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-7 text-xs border-border text-muted-foreground hover:text-foreground hover:border-slate-500 bg-transparent"
            >
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 h-7 text-xs gap-1.5 px-3"
            >
              <LockOpen className="w-3 h-3" />
              {loading
                ? (language === 'pt' ? 'A abrir...' : 'Opening...')
                : (language === 'pt' ? 'Abrir Sessão' : 'Open Session')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}