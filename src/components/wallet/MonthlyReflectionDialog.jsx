import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Sparkles, TrendingUp, Heart } from 'lucide-react';

const FEELING_LABELS = {
  necessary:  { pt: 'Necessário',   en: 'Necessary',   color: 'text-blue-400' },
  important:  { pt: 'Importante',   en: 'Important',   color: 'text-indigo-400' },
  investment: { pt: 'Investimento', en: 'Investment',  color: 'text-emerald-400' },
  impulse:    { pt: 'Impulso',      en: 'Impulse',     color: 'text-rose-400' },
  comfort:    { pt: 'Conforto',     en: 'Comfort',     color: 'text-amber-400' },
};

const CAT_EMOJI = {
  Food:'🥗', Transport:'🚗', Family:'👨‍👩‍👧', Health:'❤️', Shopping:'🛍️',
  Work:'💼', Leisure:'🎉', Kids:'🧒', Bills:'🧾', Other:'📌',
  Salary:'💵', Sales:'📊', Freelance:'🔧', Gift:'🎁',
};

export default function MonthlyReflectionDialog({ open, onClose, onSave, language, monthData, transactions = [] }) {
  const [step, setStep] = useState(0);
  const [reflection, setReflection] = useState({
    reached_intention: '',
    what_went_well: '',
    what_to_change: ''
  });

  const income   = monthData?.income   || 0;
  const expenses = monthData?.expenses || 0;
  const balance  = income - expenses;
  const balanceOk = balance >= 0;

  // Category breakdown from real transactions
  const categoryBreakdown = useMemo(() => {
    const expenseT = transactions.filter(t => t.type === 'expense');
    const map = {};
    expenseT.forEach(t => {
      map[t.category] = (map[t.category] || 0) + (t.amount || 0);
    });
    return Object.entries(map)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 5)
      .map(([cat, amt]) => ({ cat, amt, pct: expenses > 0 ? Math.round((amt / expenses) * 100) : 0 }));
  }, [transactions, expenses]);

  // Feeling breakdown
  const feelingBreakdown = useMemo(() => {
    const expenseT = transactions.filter(t => t.type === 'expense' && t.feeling);
    const map = {};
    expenseT.forEach(t => { map[t.feeling] = (map[t.feeling] || 0) + 1; });
    return Object.entries(map).sort(([,a],[,b]) => b - a);
  }, [transactions]);

  // AI-style insights
  const insights = useMemo(() => {
    const list = [];
    if (categoryBreakdown.length > 0) {
      list.push(language === 'pt'
        ? `Gastaste mais em ${categoryBreakdown[0].cat} este mês (${categoryBreakdown[0].pct}% do total).`
        : `You spent most on ${categoryBreakdown[0].cat} this month (${categoryBreakdown[0].pct}% of total).`);
    }
    const impulses = transactions.filter(t => t.feeling === 'impulse').length;
    if (impulses > 0) list.push(language === 'pt'
      ? `Registaste ${impulses} compra(s) por impulso. Vale a pena refletir.`
      : `You recorded ${impulses} impulse purchase(s). Worth reflecting on.`);
    if (balanceOk && balance > 0) list.push(language === 'pt'
      ? `Conseguiste manter €${balance.toFixed(0)} este mês. Bom trabalho!`
      : `You kept €${balance.toFixed(0)} this month. Good work!`);
    if (!balanceOk) list.push(language === 'pt'
      ? 'Este mês gastaste mais do que recebeste. Tudo bem, o próximo pode ser diferente.'
      : "You spent more than you received this month. That's okay, next month can be different.");
    return list.slice(0, 3);
  }, [categoryBreakdown, transactions, balance, balanceOk, language]);

  const handleSave = () => {
    onSave(reflection);
    setReflection({ reached_intention: '', what_went_well: '', what_to_change: '' });
    setStep(0);
    onClose();
  };

  const handleClose = () => { setStep(0); onClose(); };

  const steps = [
    language === 'pt' ? 'Este mês' : 'This month',
    language === 'pt' ? 'Análise' : 'Analysis',
    language === 'pt' ? 'Reflexão' : 'Reflection',
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm bg-card border border-border text-foreground p-0 gap-0 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {language === 'pt' ? 'Reflexão do Mês' : 'Monthly Reflection'}
                </p>
                <p className="text-[10px] text-muted-foreground">{steps[step]}</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Steps */}
          <div className="flex gap-1.5">
            {steps.map((s, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-violet-500' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        <div className="px-5 py-5 max-h-[62vh] overflow-y-auto">

          {/* Step 0: Numbers */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === 'pt'
                  ? 'Um momento de pausa para ver como correu este mês.'
                  : 'A quiet moment to see how this month went.'}
              </p>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: language === 'pt' ? 'Recebi' : 'Received', value: income, color: 'text-emerald-300' },
                  { label: language === 'pt' ? 'Gastei' : 'Spent',    value: expenses, color: 'text-foreground' },
                  { label: language === 'pt' ? 'Guardei' : 'Kept',    value: Math.abs(balance), color: balanceOk ? 'text-primary' : 'text-amber-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                    <p className={`text-xl font-bold tabular-nums ${s.color}`}>€{s.value.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Balance message */}
              <div className={`rounded-xl px-4 py-3 border text-sm ${
                balanceOk
                  ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/8 border-amber-500/20 text-amber-300'
              }`}>
                {balanceOk
                  ? (language === 'pt'
                      ? `Ficaste com um resultado positivo de €${balance.toFixed(0)}. Ótimo trabalho.`
                      : `You ended with a positive balance of €${balance.toFixed(0)}. Great work.`)
                  : (language === 'pt'
                      ? `Gastaste €${Math.abs(balance).toFixed(0)} a mais este mês. O próximo será diferente.`
                      : `You spent €${Math.abs(balance).toFixed(0)} more than you received. Next month can improve.`)}
              </div>

              <Button onClick={() => setStep(1)}
                className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-500 transition-all">
                {language === 'pt' ? 'Ver análise' : 'See analysis'} →
              </Button>
            </div>
          )}

          {/* Step 1: Spending analysis */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Category breakdown */}
              {categoryBreakdown.length > 0 ? (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2.5">
                    {language === 'pt' ? 'Para onde foi o teu dinheiro' : 'Where your money went'}
                  </p>
                  <div className="space-y-2">
                    {categoryBreakdown.map(({ cat, amt, pct }) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span>{CAT_EMOJI[cat] || '📌'}</span>{cat}
                          </span>
                          <span className="text-xs text-foreground tabular-nums">€{amt.toFixed(0)} <span className="text-muted-foreground">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500/70 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {language === 'pt' ? 'Sem registos de despesas este mês.' : 'No expense records this month.'}
                </div>
              )}

              {/* Feelings breakdown */}
              {feelingBreakdown.length > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
                    {language === 'pt' ? 'Contexto emocional das despesas' : 'Emotional context of expenses'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {feelingBreakdown.map(([feeling, count]) => {
                      const fl = FEELING_LABELS[feeling];
                      return fl ? (
                        <span key={feeling} className={`text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border ${fl.color}`}>
                          {language === 'pt' ? fl.pt : fl.en} ×{count}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* AI insights */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {language === 'pt' ? 'Insights' : 'Insights'}
                  </p>
                </div>
                <div className="space-y-2">
                  {insights.map((ins, i) => (
                    <p key={i} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l border-violet-500/30">
                      {ins}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(0)} className="flex-1 h-10 rounded-xl text-muted-foreground hover:text-foreground">←</Button>
                <Button onClick={() => setStep(2)} className="flex-[3] h-10 rounded-xl bg-violet-600 hover:bg-violet-500">
                  {language === 'pt' ? 'Refletir' : 'Reflect'} →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Written reflection */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === 'pt'
                  ? 'Escreve com calma. Não há respostas certas ou erradas.'
                  : 'Take your time. There are no right or wrong answers.'}
              </p>

              {[
                { key: 'what_went_well', label: language === 'pt' ? 'O que correu bem este mês?' : 'What went well this month?', placeholder: language === 'pt' ? 'Pequenas ou grandes conquistas...' : 'Small or big wins...' },
                { key: 'reached_intention', label: language === 'pt' ? 'Alcancei a minha intenção?' : 'Did I reach my intention?', placeholder: language === 'pt' ? 'Sim, não, ou parcialmente...' : 'Yes, no, or partially...' },
                { key: 'what_to_change', label: language === 'pt' ? 'O que quero melhorar no próximo mês?' : 'What will I improve next month?', placeholder: language === 'pt' ? 'Uma ou duas coisas concretas...' : 'One or two concrete things...' },
              ].map(field => (
                <div key={field.key}>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">{field.label}</p>
                  <textarea
                    rows={2}
                    value={reflection[field.key]}
                    onChange={e => setReflection({...reflection, [field.key]: e.target.value})}
                    placeholder={field.placeholder}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border resize-none transition-colors"
                  />
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-10 rounded-xl text-muted-foreground hover:text-foreground">←</Button>
                <Button onClick={handleSave} className="flex-[3] h-10 rounded-xl bg-violet-600 hover:bg-violet-500">
                  {language === 'pt' ? 'Guardar reflexão' : 'Save reflection'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}