import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const GOAL_CATEGORIES = {
  pt: [
    { value: 'emergency', label: '🆘 Fundo de Emergência', emoji: '🆘' },
    { value: 'vacation', label: '✈️ Férias', emoji: '✈️' },
    { value: 'car', label: '🚗 Carro', emoji: '🚗' },
    { value: 'investment', label: '📈 Investimento', emoji: '📈' },
    { value: 'education', label: '🎓 Educação', emoji: '🎓' },
    { value: 'home', label: '🏠 Casa', emoji: '🏠' },
    { value: 'health', label: '❤️ Saúde', emoji: '❤️' },
    { value: 'other', label: '🎯 Outro', emoji: '🎯' }
  ],
  en: [
    { value: 'emergency', label: '🆘 Emergency Fund', emoji: '🆘' },
    { value: 'vacation', label: '✈️ Vacation', emoji: '✈️' },
    { value: 'car', label: '🚗 Car', emoji: '🚗' },
    { value: 'investment', label: '📈 Investment', emoji: '📈' },
    { value: 'education', label: '🎓 Education', emoji: '🎓' },
    { value: 'home', label: '🏠 Home', emoji: '🏠' },
    { value: 'health', label: '❤️ Health', emoji: '❤️' },
    { value: 'other', label: '🎯 Other', emoji: '🎯' }
  ]
};

const defaultForm = { name: '', category: 'other', target_amount: '', current_amount: '', target_date: '', notes: '', emoji: '🎯' };

export default function SavingsGoalDialog({ open, onClose, onSave, language, editData }) {
  const [form, setForm] = useState(editData || defaultForm);

  React.useEffect(() => {
    setForm(editData || defaultForm);
  }, [editData, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cats = GOAL_CATEGORIES[language] || GOAL_CATEGORIES.en;

  const handleCatChange = (v) => {
    const cat = cats.find(c => c.value === v);
    set('category', v);
    if (cat) set('emoji', cat.emoji);
  };

  const handleSave = () => {
    if (!form.name || !form.target_amount) return;
    onSave({
      ...form,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount || 0)
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{language === 'pt' ? '🎯 Nova Meta de Poupança' : '🎯 New Savings Goal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">{language === 'pt' ? 'Nome da meta' : 'Goal name'}</Label>
            <Input placeholder={language === 'pt' ? 'ex. Viagem a Lisboa, Fundo de emergência...' : 'e.g. Trip to Paris, Emergency fund...'} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">{language === 'pt' ? 'Tipo' : 'Type'}</Label>
            <div className="flex flex-wrap gap-2">
              {cats.map(c => (
                <button key={c.value} onClick={() => handleCatChange(c.value)} className={`px-3 py-1.5 rounded-xl text-xs transition-all border ${form.category === c.value ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'border-border text-muted-foreground hover:text-muted-foreground'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{language === 'pt' ? 'Objetivo (€)' : 'Target (€)'}</Label>
              <Input type="number" placeholder="0" value={form.target_amount} onChange={e => set('target_amount', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{language === 'pt' ? 'Poupado até agora (€)' : 'Saved so far (€)'}</Label>
              <Input type="number" placeholder="0" value={form.current_amount} onChange={e => set('current_amount', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">{language === 'pt' ? 'Data alvo (opcional)' : 'Target date (optional)'}</Label>
            <Input type="date" value={form.target_date} onChange={e => set('target_date', e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{language === 'pt' ? 'Cancelar' : 'Cancel'}</Button>
          <Button onClick={handleSave} disabled={!form.name || !form.target_amount} className="bg-purple-600 hover:bg-purple-700">
            {language === 'pt' ? 'Guardar' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}