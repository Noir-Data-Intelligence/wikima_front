import { useState } from 'react';

function Ring({ pct = 0, size = 48, stroke = 4, color = '#34d399' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, pct)) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(120,120,120,0.18)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

export default function SavingsInvestmentPanel({ income, transactions, language }) {
  const [savingsPct, setSavingsPct] = useState(10);
  const [investPct, setInvestPct] = useState(20);

  const savedThisMonth = transactions
    .filter(t => t.type === 'savings' || t.category === 'Savings')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const investedThisMonth = transactions
    .filter(t => t.type === 'investment' || t.category === 'Investments')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const savingsTarget = income * (savingsPct / 100);
  const investTarget  = income * (investPct / 100);

  const savedPct  = savingsTarget > 0 ? Math.min(100, Math.round((savedThisMonth / savingsTarget) * 100)) : 0;
  const investPct2 = investTarget > 0 ? Math.min(100, Math.round((investedThisMonth / investTarget) * 100)) : 0;

  const panels = [
    {
      emoji: '🪴',
      label: language === 'pt' ? 'Poupança' : 'Savings',
      pct: savingsPct,
      setPct: setSavingsPct,
      target: savingsTarget,
      actual: savedThisMonth,
      progress: savedPct,
      color: '#34d399',
      colorSoft: 'rgba(52,211,153,0.1)',
      colorBorder: 'rgba(52,211,153,0.15)',
      tip: language === 'pt'
        ? `Meta: ${savingsPct}% do rendimento`
        : `Target: ${savingsPct}% of income`,
    },
    {
      emoji: '📈',
      label: language === 'pt' ? 'Investimento' : 'Investments',
      pct: investPct,
      setPct: setInvestPct,
      target: investTarget,
      actual: investedThisMonth,
      progress: investPct2,
      color: '#fbbf24',
      colorSoft: 'rgba(251,191,36,0.1)',
      colorBorder: 'rgba(251,191,36,0.15)',
      tip: language === 'pt'
        ? `Meta: ${investPct}% do rendimento`
        : `Target: ${investPct}% of income`,
    },
  ];

  return (
    <div className="rounded-2xl bg-background border border-border overflow-hidden shadow-xl shadow-black/20">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          {language === 'pt' ? 'Poupança & Investimento' : 'Savings & Investments'}
        </p>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {panels.map(p => (
          <div key={p.label} className="rounded-xl p-4 border transition-all"
            style={{ background: p.colorSoft, borderColor: p.colorBorder }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{p.emoji} {p.label}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{p.tip}</p>
              </div>
              <div className="relative">
                <Ring pct={p.progress} size={44} stroke={4} color={p.color} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-bold" style={{ color: p.color }}>{p.progress}%</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-foreground tabular-nums font-medium">
              €{p.actual.toFixed(0)}
              <span className="text-muted-foreground/60 ml-1">/ €{p.target.toFixed(0)}</span>
            </div>

            {/* Slider to adjust % */}
            {income > 0 && (
              <div className="mt-3">
                <input
                  type="range"
                  min={1} max={50} value={p.pct}
                  onChange={e => p.setPct(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: p.color }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {income === 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground/60 text-center">
            {language === 'pt'
              ? 'Regista uma receita para ver as tuas metas automáticas.'
              : 'Record income to see your automatic targets.'}
          </p>
        </div>
      )}
    </div>
  );
}