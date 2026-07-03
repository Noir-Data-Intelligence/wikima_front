import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = {
  pt: [
    { value: 'rent', label: '🏠 Renda' },
    { value: 'utilities', label: '💡 Serviços (água/luz/gás)' },
    { value: 'subscriptions', label: '📱 Subscrições' },
    { value: 'internet', label: '🌐 Internet / Telemóvel' },
    { value: 'school', label: '🎓 Escola / Educação' },
    { value: 'insurance', label: '🛡️ Seguro' },
    { value: 'loan', label: '💰 Empréstimo' },
    { value: 'taxes', label: '📋 Impostos' },
    { value: 'food', label: '🛒 Alimentação' },
    { value: 'transport', label: '🚗 Transporte' },
    { value: 'health', label: '❤️ Saúde' },
    { value: 'entertainment', label: '🎬 Lazer' },
    { value: 'other', label: '📌 Outro' }
  ],
  en: [
    { value: 'rent', label: '🏠 Rent' },
    { value: 'utilities', label: '💡 Utilities (water/electricity)' },
    { value: 'subscriptions', label: '📱 Subscriptions' },
    { value: 'internet', label: '🌐 Internet / Phone' },
    { value: 'school', label: '🎓 School / Education' },
    { value: 'insurance', label: '🛡️ Insurance' },
    { value: 'loan', label: '💰 Loan' },
    { value: 'taxes', label: '📋 Taxes' },
    { value: 'food', label: '🛒 Food' },
    { value: 'transport', label: '🚗 Transport' },
    { value: 'health', label: '❤️ Health' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'other', label: '📌 Other' }
  ]
};

const CYCLES = {
  pt: [
    { value: 'monthly', label: 'Mensal' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'yearly', label: 'Anual' }
  ],
  en: [
    { value: 'monthly', label: 'Monthly' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ]
};

const defaultForm = {
  name: '', category: 'other', amount: '', currency: 'EUR',
  billing_cycle: 'monthly', next_due_date: '', reminder_days_before: 3, notes: ''
};

export default function PaymentReminderDialog({ open, onClose, onSave, language, editData }) {
  const [form, setForm] = useState(editData || defaultForm);

  React.useEffect(() => {
    setForm(editData || defaultForm);
  }, [editData, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.name || !form.amount || !form.next_due_date) return;
    onSave({ ...form, amount: parseFloat(form.amount), reminder_days_before: parseInt(form.reminder_days_before) || 3 });
    onClose();
  };

  const cats = CATEGORIES[language] || CATEGORIES.en;
  const cycles = CYCLES[language] || CYCLES.en;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'pt' ? '🔔 Novo Pagamento Recorrente' : '🔔 New Recurring Payment'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">{language === 'pt' ? 'Nome' : 'Name'}</Label>
            <Input placeholder={language === 'pt' ? 'ex. Netflix, Renda, Eletricidade...' : 'e.g. Netflix, Rent, Electricity...'} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">{language === 'pt' ? 'Categoria' : 'Category'}</Label>
            <Select value={form.category} onValueChange={v => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {cats.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{language === 'pt' ? 'Valor (€)' : 'Amount (€)'}</Label>
              <Input type="number" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{language === 'pt' ? 'Frequência' : 'Frequency'}</Label>
              <Select value={form.billing_cycle} onValueChange={v => set('billing_cycle', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cycles.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">{language === 'pt' ? 'Próxima data de pagamento' : 'Next due date'}</Label>
            <Input type="date" value={form.next_due_date} onChange={e => set('next_due_date', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">{language === 'pt' ? 'Lembrar quantos dias antes?' : 'Remind how many days before?'}</Label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 5, 7].map(d => (
                <button key={d} onClick={() => set('reminder_days_before', d)} className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${form.reminder_days_before === d ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:text-muted-foreground'}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{language === 'pt' ? 'Cancelar' : 'Cancel'}</Button>
          <Button onClick={handleSave} disabled={!form.name || !form.amount || !form.next_due_date} className="bg-primary hover:bg-cyan-700">
            {language === 'pt' ? 'Guardar' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}