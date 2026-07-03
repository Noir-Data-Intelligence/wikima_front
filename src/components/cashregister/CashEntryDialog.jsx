import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';

// This dialog logs a cash movement (income or expense) as a note/record
// Stored as a simple Expense entity (or could be a future CashMovement entity)
// For now it records the entry in the Expense entity with source = 'cash'
import { api } from '@/api/client';

const EXPENSE_CATEGORIES = {
  pt: ['Fornecedores', 'Material de escritório', 'Transportes', 'Refeições', 'Manutenção', 'Impostos', 'Outros'],
  en: ['Suppliers', 'Office supplies', 'Transport', 'Meals', 'Maintenance', 'Taxes', 'Other']
};

const INCOME_CATEGORIES = {
  pt: ['Venda a pronto', 'Serviço prestado', 'Outros'],
  en: ['Cash sale', 'Service rendered', 'Other']
};

export default function CashEntryDialog({ open, onClose, onSuccess, cashRegister, type, language }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    notes: ''
  });

  const isExpense = type === 'expense';
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const categories = isExpense ? (EXPENSE_CATEGORIES[language] || EXPENSE_CATEGORIES.en) : (INCOME_CATEGORIES[language] || INCOME_CATEGORIES.en);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      toast.error(language === 'pt' ? 'Preencha os campos obrigatórios' : 'Fill required fields');
      return;
    }
    setLoading(true);
    try {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;

      await api.entities.Expense.create({
        workspace_id: wsId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: cashRegister?.currency || 'EUR',
        category: formData.category || (isExpense ? 'other' : 'income'),
        date: cashRegister?.date || new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: [
          isExpense ? (language === 'pt' ? 'Despesa de caixa' : 'Cash expense') : (language === 'pt' ? 'Entrada de caixa' : 'Cash income'),
          formData.notes
        ].filter(Boolean).join(' — '),
        source: 'cash_register',
        cash_register_id: cashRegister?.id || null
      });

      toast.success(isExpense
        ? (language === 'pt' ? 'Despesa registada!' : 'Expense recorded!')
        : (language === 'pt' ? 'Entrada registada!' : 'Income recorded!'));

      setFormData({ description: '', amount: '', category: '', notes: '' });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(language === 'pt' ? 'Erro ao registar' : 'Error recording entry');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-background border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50 h-8 mt-1";
  const accentColor = isExpense ? 'text-rose-400' : 'text-green-400';
  const btnCls = isExpense ? 'bg-rose-600/80 hover:bg-rose-600' : 'bg-green-600/80 hover:bg-green-600';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className={`text-base font-semibold text-foreground flex items-center gap-2`}>
            {isExpense
              ? <ArrowDownCircle className={`w-4 h-4 ${accentColor}`} />
              : <ArrowUpCircle className={`w-4 h-4 ${accentColor}`} />}
            {isExpense
              ? (language === 'pt' ? 'Registar Despesa de Caixa' : 'Record Cash Expense')
              : (language === 'pt' ? 'Registar Entrada de Caixa' : 'Record Cash Income')}
          </DialogTitle>
        </DialogHeader>

        {cashRegister && (
          <div className="bg-background border border-border rounded-lg px-3 py-2 flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{language === 'pt' ? 'Sessão' : 'Session'}</span>
            <span className="text-xs text-muted-foreground">{cashRegister.date} · {cashRegister.currency}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">{language === 'pt' ? 'Descrição' : 'Description'} *</Label>
            <Input
              value={formData.description}
              onChange={e => set('description', e.target.value)}
              placeholder={isExpense ? (language === 'pt' ? 'Ex: Compra de material...' : 'e.g. Supplies purchase...') : (language === 'pt' ? 'Ex: Venda de produto...' : 'e.g. Product sale...')}
              required className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">{language === 'pt' ? 'Valor' : 'Amount'} *</Label>
              <Input type="number" min="0.01" step="0.01" value={formData.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" required className={inputCls} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{language === 'pt' ? 'Categoria' : 'Category'}</Label>
              <Select value={formData.category} onValueChange={v => set('category', v)}>
                <SelectTrigger className="bg-background border-border text-foreground text-sm h-8 mt-1">
                  <SelectValue placeholder={language === 'pt' ? 'Selecionar' : 'Select'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">{language === 'pt' ? 'Notas (opcional)' : 'Notes (optional)'}</Label>
            <Textarea
              value={formData.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder={language === 'pt' ? 'Observações...' : 'Observations...'}
              rows={2}
              className="bg-background border-border text-foreground text-sm placeholder:text-muted-foreground mt-1 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} className="h-8 text-xs text-muted-foreground hover:text-foreground">
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading} className={`h-8 text-xs gap-1.5 ${btnCls}`}>
              {isExpense ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
              {loading ? (language === 'pt' ? 'A guardar...' : 'Saving...') : (language === 'pt' ? 'Guardar' : 'Save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}