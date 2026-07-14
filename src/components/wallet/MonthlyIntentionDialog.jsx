import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Target, Sparkles } from 'lucide-react';

export default function MonthlyIntentionDialog({ open, onClose, onSave, language }) {
  const [step, setStep] = useState(0); // 0=income, 1=save, 2=why
  const [intention, setIntention] = useState({
    expected_income: '',
    expected_expenses: '',
    amount_to_keep: '',
    why_this_matters: ''
  });

  const handleSave = () => {
    if (!intention.expected_income || !intention.amount_to_keep) return;
    onSave(intention);
    setIntention({ expected_income: '', expected_expenses: '', amount_to_keep: '', why_this_matters: '' });
    setStep(0);
    onClose();
  };

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  const income = parseFloat(intention.expected_income) || 0;
  const keep   = parseFloat(intention.amount_to_keep)   || 0;
  const spend  = income > 0 && keep > 0 ? Math.max(0, income - keep) : 0;
  const savePct = income > 0 ? Math.round((keep / income) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm bg-card border border-border text-foreground p-0 gap-0 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {language === 'pt' ? 'Intenção do Mês' : 'Monthly Intention'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {language === 'pt' ? 'O teu plano financeiro para este mês' : 'Your financial plan for this month'}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step dots */}
          <div className="flex gap-1.5 mt-4">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-500' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">

          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === 'pt'
                  ? 'Quanto esperas receber este mês? Mesmo que seja uma estimativa.'
                  : 'How much do you expect to receive this month? Even an estimate is fine.'}
              </p>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
                  {language === 'pt' ? 'Receita esperada' : 'Expected income'}
                </p>
                <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-4 py-3 focus-within:border-primary/40 transition-colors">
                  <span className="text-muted-foreground text-lg">€</span>
                  <input
                    type="number"
                    step="1"
                    autoFocus
                    value={intention.expected_income}
                    onChange={e => setIntention({...intention, expected_income: e.target.value})}
                    className="bg-transparent text-2xl font-bold text-foreground outline-none w-full tabular-nums placeholder:text-muted-foreground"
                    placeholder="0"
                  />
                </div>
              </div>
              <Button
                onClick={() => setStep(1)}
                disabled={!intention.expected_income}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-muted/50 disabled:text-muted-foreground transition-all">
                {language === 'pt' ? 'Continuar' : 'Continue'} →
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === 'pt'
                  ? 'Qual é o valor que queres guardar no final do mês?'
                  : 'How much do you want to keep by the end of the month?'}
              </p>

              {/* Visual saving target */}
              {income > 0 && keep > 0 && (
                <div className="rounded-xl bg-muted/50 border border-border p-3 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{language === 'pt' ? 'Para gastar' : 'To spend'}</span>
                    <span>{language === 'pt' ? 'Para guardar' : 'To save'}</span>
                  </div>
                  <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden flex">
                    <div className="bg-rose-500/70 rounded-l-full transition-all duration-500"
                      style={{ width: `${Math.min(100, 100 - savePct)}%` }} />
                    <div className="bg-indigo-500 rounded-r-full transition-all duration-500"
                      style={{ width: `${savePct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-rose-300">€{spend.toFixed(0)}</span>
                    <span className="text-indigo-300">{savePct}% poupado</span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
                  {language === 'pt' ? 'Quero guardar' : 'I want to save'}
                </p>
                <div className="flex items-center gap-2 bg-muted/50 border border-indigo-500/30 rounded-xl px-4 py-3 focus-within:border-indigo-400/50 transition-colors">
                  <span className="text-muted-foreground text-lg">€</span>
                  <input
                    type="number"
                    step="1"
                    autoFocus
                    value={intention.amount_to_keep}
                    onChange={e => setIntention({...intention, amount_to_keep: e.target.value})}
                    className="bg-transparent text-2xl font-bold text-indigo-300 outline-none w-full tabular-nums placeholder:text-muted-foreground"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(0)} className="flex-1 h-10 rounded-xl text-muted-foreground hover:text-foreground">
                  ←
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!intention.amount_to_keep}
                  className="flex-[3] h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-muted/50 disabled:text-muted-foreground">
                  {language === 'pt' ? 'Continuar' : 'Continue'} →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {language === 'pt'
                    ? 'O porquê torna a intenção real. Escreve algo que te motiva, mesmo que seja só uma frase.'
                    : 'The "why" makes the intention real. Write something that motivates you, even one sentence.'}
                </p>
              </div>

              {/* Summary pill */}
              <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{language === 'pt' ? 'Meta de poupança' : 'Savings goal'}</p>
                  <p className="text-lg font-bold text-indigo-300">€{parseFloat(intention.amount_to_keep || 0).toFixed(0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{language === 'pt' ? 'Este mês' : 'This month'}</p>
                  <p className="text-sm text-muted-foreground">{savePct}% {language === 'pt' ? 'da receita' : 'of income'}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
                  {language === 'pt' ? 'A minha motivação' : 'My motivation'}
                </p>
                <textarea
                  autoFocus
                  rows={3}
                  value={intention.why_this_matters}
                  onChange={e => setIntention({...intention, why_this_matters: e.target.value})}
                  placeholder={language === 'pt'
                    ? 'Ex: Quero criar uma reserva de emergência para me sentir mais seguro...'
                    : 'E.g. I want to build an emergency fund so I feel more secure...'}
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border resize-none transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-10 rounded-xl text-muted-foreground hover:text-foreground">
                  ←
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-[3] h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500">
                  {language === 'pt' ? 'Guardar intenção' : 'Save intention'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}