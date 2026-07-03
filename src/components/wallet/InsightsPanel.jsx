import React, { useMemo } from 'react';
import { KAKEBO_CATEGORIES } from './KakeboCategories';

export default function InsightsPanel({
  transactions = [],
  lastMonthTransactions = [],
  savingsPct,
  hasIntention,
  balanceOk,
  language,
}) {
  const insights = useMemo(() => {
    const list = [];
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExp = expenses.reduce((s, t) => s + (t.amount || 0), 0);

    // Top category — human phrasing
    const catMap = {};
    expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + (t.amount || 0); });
    const sorted = Object.entries(catMap).sort(([, a], [, b]) => b - a);

    if (sorted.length > 0) {
      const [topCat, topAmt] = sorted[0];
      const pct = totalExp > 0 ? Math.round((topAmt / totalExp) * 100) : 0;
      const catMeta = KAKEBO_CATEGORIES.find(c => c.key === topCat);
      const label = catMeta ? (language === 'pt' ? catMeta.pt.toLowerCase() : catMeta.en.toLowerCase()) : topCat.toLowerCase();
      const emoji = catMeta?.emoji || '📌';

      if (pct >= 50) {
        list.push({
          emoji,
          text: language === 'pt'
            ? `Este mês, mais de metade dos gastos foi em ${label}. Vale a pena refletir se faz sentido.`
            : `This month, over half of your spending went to ${label}. Worth reflecting on.`,
        });
      } else if (pct >= 25) {
        list.push({
          emoji,
          text: language === 'pt'
            ? `A maior parte das tuas despesas foi em ${label} — ${pct}% do total.`
            : `Your largest spending area was ${label}, at ${pct}% of total expenses.`,
        });
      } else {
        list.push({
          emoji,
          text: language === 'pt'
            ? `As despesas estiveram bem distribuídas. A categoria com mais peso foi ${label}.`
            : `Your spending was well distributed. The leading category was ${label}.`,
        });
      }
    }

    // Compare to last month
    const lastExp = lastMonthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    if (lastExp > 0 && totalExp > 0) {
      const diff = Math.round(((totalExp - lastExp) / lastExp) * 100);
      if (diff <= -10) {
        list.push({
          emoji: '🌱',
          text: language === 'pt'
            ? `Gastaste menos ${Math.abs(diff)}% do que no mês passado. Uma tendência positiva.`
            : `You spent ${Math.abs(diff)}% less than last month — a positive trend.`,
        });
      } else if (diff >= 20) {
        list.push({
          emoji: '🔍',
          text: language === 'pt'
            ? `Este mês foi mais exigente do que o anterior (+${diff}%). Acontece — o próximo é uma nova página.`
            : `This month required more than last (+${diff}%). That happens — next month is a fresh start.`,
        });
      }
    }

    // Weekend spending
    const weekendExp = expenses
      .filter(t => { const d = new Date(t.date); return d.getDay() === 0 || d.getDay() === 6; })
      .reduce((s, t) => s + (t.amount || 0), 0);
    const weekendPct = totalExp > 0 ? Math.round((weekendExp / totalExp) * 100) : 0;
    if (weekendPct > 45 && expenses.length >= 5) {
      list.push({
        emoji: '🛋️',
        text: language === 'pt'
          ? `${weekendPct}% das despesas aconteceram ao fim de semana. Pode ser um momento de pausa consciente.`
          : `${weekendPct}% of spending happened on weekends — perhaps a moment for mindful pausing.`,
      });
    }

    // Impulse purchases — compassionate
    const impulses = expenses.filter(t => t.feeling === 'impulse');
    if (impulses.length === 1) {
      list.push({
        emoji: '💭',
        text: language === 'pt'
          ? `Identificaste uma compra por impulso (€${impulses[0].amount?.toFixed(0)}). Reconhecer já é um passo importante.`
          : `You flagged one impulse purchase (€${impulses[0].amount?.toFixed(0)}). Recognizing it is already progress.`,
      });
    } else if (impulses.length > 1) {
      const impulseTotal = impulses.reduce((s, t) => s + (t.amount || 0), 0);
      list.push({
        emoji: '💭',
        text: language === 'pt'
          ? `Tiveste ${impulses.length} compras por impulso (€${impulseTotal.toFixed(0)} no total). Sem julgamentos — a consciência é o primeiro passo.`
          : `You had ${impulses.length} impulse purchases totalling €${impulseTotal.toFixed(0)}. No judgment — awareness is step one.`,
      });
    }

    // Savings progress
    if (hasIntention && savingsPct >= 80 && balanceOk) {
      list.push({
        emoji: '🌿',
        text: language === 'pt'
          ? `Estás muito próximo da tua intenção de poupança este mês. Quase lá.`
          : `You're very close to your savings intention this month. Almost there.`,
      });
    }

    // Savings + investments logged
    const savedAmt = transactions.filter(t => t.category === 'Savings' || t.type === 'savings').reduce((s, t) => s + (t.amount || 0), 0);
    const investAmt = transactions.filter(t => t.category === 'Investments' || t.type === 'investment').reduce((s, t) => s + (t.amount || 0), 0);
    if (savedAmt > 0 || investAmt > 0) {
      list.push({
        emoji: '📈',
        text: language === 'pt'
          ? `Este mês guardaste €${savedAmt.toFixed(0)} e investiste €${investAmt.toFixed(0)}. Cada passo conta.`
          : `This month you saved €${savedAmt.toFixed(0)} and invested €${investAmt.toFixed(0)}. Every step counts.`,
      });
    }

    // Positive balance
    if (balanceOk && list.length < 2) {
      list.push({
        emoji: '☀️',
        text: language === 'pt'
          ? 'O resultado do mês é positivo. O hábito de registar é mais valioso do que a perfeição.'
          : 'Your monthly result is positive. The habit of tracking matters more than perfection.',
      });
    }

    // Empty state
    if (expenses.length === 0) {
      list.push({
        emoji: '🌱',
        text: language === 'pt'
          ? 'Ainda sem registos este mês. Cada gasto que anotas é um ato de consciência financeira.'
          : 'No records yet this month. Every expense you log is an act of financial awareness.',
      });
    }

    return list.slice(0, 4);
  }, [transactions, lastMonthTransactions, savingsPct, hasIntention, balanceOk, language]);

  if (insights.length === 0) return null;

  return (
    <div className="rounded-2xl bg-background border border-border overflow-hidden shadow-xl shadow-black/20">
      <div className="px-4 py-3.5 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
          {language === 'pt' ? 'Reflexão do mês' : 'Monthly reflection'}
        </p>
      </div>
      <div className="divide-y divide-border">
        {insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5 hover:bg-accent transition-colors">
            <span className="text-base leading-none mt-0.5 opacity-70 shrink-0">{ins.emoji}</span>
            <p className="text-sm text-foreground/80 leading-relaxed">{ins.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}