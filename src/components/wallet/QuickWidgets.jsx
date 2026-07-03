import React from 'react';
import { Target, TrendingDown, Calendar } from 'lucide-react';

const EXPENSE_CAT_EMOJI = {
  Food:'🥗', Transport:'🚗', Family:'👨‍👩‍👧', Health:'❤️', Shopping:'🛍️',
  Work:'💼', Leisure:'🎉', Kids:'🧒', Bills:'🧾', Other:'📌',
};

export default function QuickWidgets({ transactions = [], savingsGoals = [], upcomingPayments = [], language }) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExp = expenses.reduce((s, t) => s + (t.amount || 0), 0);

  // Top category
  const catMap = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + (t.amount || 0); });
  const topCat = Object.entries(catMap).sort(([,a],[,b]) => b - a)[0];

  // This week spending
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekExp = expenses.filter(t => new Date(t.date) >= weekStart).reduce((s, t) => s + (t.amount || 0), 0);
  
  // Last week comparison
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekExp = expenses.filter(t => {
    const d = new Date(t.date);
    return d >= lastWeekStart && d < weekStart;
  }).reduce((s, t) => s + (t.amount || 0), 0);
  const weekDiff = lastWeekExp > 0 ? Math.round(((weekExp - lastWeekExp) / lastWeekExp) * 100) : 0;

  // Most frequent category (by count)
  const catCountMap = {};
  expenses.forEach(t => { catCountMap[t.category] = (catCountMap[t.category] || 0) + 1; });
  const freqCat = Object.entries(catCountMap).sort(([,a],[,b]) => b - a)[0];

  // Active savings goal
  const activeGoal = savingsGoals.find(g => g.status === 'active');

  const widgets = [];

  if (topCat) {
    const pct = totalExp > 0 ? Math.round((topCat[1] / totalExp) * 100) : 0;
    widgets.push({
      icon: EXPENSE_CAT_EMOJI[topCat[0]] || '📌',
      label: language === 'pt' ? 'Maior categoria' : 'Top category',
      value: topCat[0],
      sub: `${pct}% ${language === 'pt' ? 'do total' : 'of total'}`,
    });
  }

  const weekWidgets = {
    icon: '📅',
    label: language === 'pt' ? 'Esta semana' : 'This week',
    value: `€${weekExp.toFixed(0)}`,
    sub: weekDiff !== 0 
      ? (weekDiff > 0 
          ? (language === 'pt' ? `+${weekDiff}% vs semana passada` : `+${weekDiff}% vs last week`)
          : (language === 'pt' ? `${weekDiff}% vs semana passada` : `${weekDiff}% vs last week`))
      : (language === 'pt' ? 'em despesas' : 'in expenses'),
    highlight: Math.abs(weekDiff) > 0,
    trend: weekDiff > 0 ? 'up' : 'down',
  };
  widgets.push(weekWidgets);

  if (freqCat && freqCat[0] !== topCat?.[0]) {
    widgets.push({
      icon: EXPENSE_CAT_EMOJI[freqCat[0]] || '📌',
      label: language === 'pt' ? 'Categoria mais frequente' : 'Most frequent',
      value: freqCat[0],
      sub: `${freqCat[1]}×`,
    });
  }

  if (activeGoal) {
    const pct = activeGoal.target_amount > 0
      ? Math.min(100, Math.round(((activeGoal.current_amount || 0) / activeGoal.target_amount) * 100))
      : 0;
    widgets.push({
      icon: activeGoal.emoji || '🎯',
      label: language === 'pt' ? 'Poupança ativa' : 'Active saving',
      value: activeGoal.name,
      sub: `${pct}% ${language === 'pt' ? 'atingida' : 'reached'}`,
      bar: pct,
    });
  }

  if (upcomingPayments.length > 0) {
    const next = upcomingPayments[0];
    widgets.push({
      icon: '🔔',
      label: language === 'pt' ? 'Próximo pagamento' : 'Next payment',
      value: next.name,
      sub: `€${(next.amount || 0).toFixed(0)} · ${next.next_due_date}`,
    });
  }

  if (widgets.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {widgets.slice(0, 4).map((w, i) => (
        <div key={i} className={`rounded-2xl p-4 border transition-all ${
          w.highlight 
            ? w.trend === 'down'
              ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20'
              : 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20'
            : 'bg-background border-border'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{w.icon}</span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none font-medium">{w.label}</p>
          </div>
          <p className="text-base font-bold text-foreground truncate">{w.value}</p>
          {w.bar !== undefined ? (
            <>
              <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full" style={{ width: `${w.bar}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1">{w.sub}</p>
            </>
          ) : (
            <p className={`text-[10px] mt-1 ${w.highlight ? 'text-muted-foreground font-medium' : 'text-muted-foreground/70'}`}>
              {w.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}