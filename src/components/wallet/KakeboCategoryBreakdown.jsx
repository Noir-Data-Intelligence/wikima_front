import { useMemo } from 'react';
import { KAKEBO_CATEGORIES } from './KakeboCategories';

export default function KakeboCategoryBreakdown({ transactions, language }) {
  const { catData, totalExpenses } = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((s, t) => s + (t.amount || 0), 0);
    const map = {};
    expenses.forEach(t => {
      map[t.category] = (map[t.category] || 0) + (t.amount || 0);
    });
    const sorted = Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
    return { catData: sorted, totalExpenses: total };
  }, [transactions]);

  if (catData.length === 0) return null;

  return (
    <div className="rounded-2xl bg-background border border-border overflow-hidden shadow-xl shadow-black/20">
      <div className="px-4 py-3.5 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
          {language === 'pt' ? 'Fluxo mensal de despesas' : 'Monthly Spending Flow'}
        </p>
      </div>
      <div className="p-4 space-y-4">
        {catData.map(([cat, amt], idx) => {
          const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
          const catMeta = KAKEBO_CATEGORIES.find(c => c.key === cat);
          const emoji = catMeta?.emoji || '📌';
          const label = catMeta ? (language === 'pt' ? catMeta.pt : catMeta.en) : cat;
          const barColor = catMeta?.color || 'rgba(99,102,241,0.45)';

          return (
            <div key={cat} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground/80 flex items-center gap-2 transition-colors group-hover:text-foreground">
                  <span className="text-base opacity-75">{emoji}</span>
                  {label}
                </span>
                <div className="text-right flex items-center gap-2">
                  <span className="text-sm text-foreground tabular-nums font-medium">€{amt.toLocaleString('en-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  <span className="text-[10px] text-muted-foreground w-7 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-muted/60 rounded-full overflow-hidden shadow-inner">
                <div className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 10px ${barColor.replace('rgba', 'rgba').replace('0.45', '0.25')}` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}