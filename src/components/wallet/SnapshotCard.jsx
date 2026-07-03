import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function SnapshotCard({
  income, expenses, balance, balanceOk,
  savingsTarget, savingsPct,
  dayOfMonth, daysInMonth,
  lastMonthExpenses,
  insight,
  language,
  isFutureMonth
}) {
  const monthPct = Math.round((dayOfMonth / daysInMonth) * 100);

  const expenseDiff = lastMonthExpenses > 0
    ? Math.round(((expenses - lastMonthExpenses) / lastMonthExpenses) * 100)
    : null;

  const expenseDiffLabel = expenseDiff !== null
    ? (expenseDiff < -5
        ? (language === 'pt' ? `Gastaste menos do que no mês passado — bom sinal.` : `You spent less than last month — a good sign.`)
        : expenseDiff > 15
          ? (language === 'pt' ? 'As despesas foram um pouco mais elevadas do que no mês passado.' : 'Spending was a little higher than last month.')
          : null)
    : null;

  const balanceMessage = balanceOk
    ? (balance === 0
        ? (language === 'pt' ? 'Equilíbrio perfeito este mês.' : 'Perfect balance this month.')
        : balance >= 500
          ? (language === 'pt' ? `Este mês ficaste com €${balance.toFixed(0)} — ótimo resultado.` : `You kept €${balance.toFixed(0)} this month — great.`)
          : (language === 'pt' ? 'O teu resultado mensal está positivo.' : 'Your monthly result is positive.'))
    : (language === 'pt'
        ? 'Este mês as despesas foram superiores ao previsto. O próximo é uma nova oportunidade.'
        : 'Spending exceeded income this month. Next month is a fresh start.');

  const total = income + expenses;
  const incomeBarPct = total > 0 ? Math.round((income / total) * 100) : 50;
  const expenseBarPct = 100 - incomeBarPct;

  return (
    <Link to={createPageUrl('TransactionHistory')} className="block group">
      <div className="rounded-3xl bg-gradient-to-br from-card to-background border border-border overflow-hidden shadow-xl shadow-black/20 group-hover:border-border group-hover:shadow-2xl group-hover:shadow-black/30 transition-all duration-300">
        <div className="p-6 space-y-6">

        {isFutureMonth ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-sm font-semibold text-foreground mb-2">
              {language === 'pt' 
                ? 'O teu mês ainda não começou' 
                : 'Your journey hasn\'t started yet'}
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              {language === 'pt'
                ? 'Usa este tempo para planear e preparar o teu mês'
                : 'Use this time to plan and prepare for the month ahead'}
            </p>
          </div>
        ) : (
          <>
            {/* Numbers row - with better spacing and softer typography */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  {language === 'pt' ? 'Recebi' : 'Received'}
                </p>
                <p className="text-2xl font-medium text-emerald-400 tabular-nums leading-tight">
                  €{income.toLocaleString('en-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  {language === 'pt' ? 'Gastei' : 'Spent'}
                </p>
                <p className="text-2xl font-medium text-foreground tabular-nums leading-tight">
                  €{expenses.toLocaleString('en-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Dual bar - with gradient glow */}
        {(income > 0 || expenses > 0) && (
          <div className="space-y-2">
            <div className="h-3 bg-muted/60 rounded-full overflow-hidden flex gap-0.5 shadow-inner">
              {income > 0 && (
                <div className="h-full rounded-l-full transition-all duration-700 ease-out"
                  style={{
                    width: `${incomeBarPct}%`,
                    background: 'linear-gradient(90deg, rgba(52,211,153,0.8), rgba(52,211,153,0.6))',
                    boxShadow: '0 0 20px rgba(52,211,153,0.3)'
                  }} />
              )}
              {expenses > 0 && (
                <div className="h-full rounded-r-full transition-all duration-700 ease-out"
                  style={{
                    width: `${expenseBarPct}%`,
                    background: 'linear-gradient(90deg, rgba(139,92,246,0.7), rgba(99,102,241,0.5))',
                    boxShadow: '0 0 20px rgba(139,92,246,0.2)'
                  }} />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-[9px] text-emerald-400/70 font-medium">{language === 'pt' ? 'Receita' : 'Income'} {incomeBarPct}%</span>
              <span className="text-[9px] text-violet-400/70 font-medium">{language === 'pt' ? 'Despesa' : 'Expenses'} {expenseBarPct}%</span>
            </div>
          </div>
        )}

        {/* Balance - elevated with softer presentation */}
        <div className={`rounded-2xl px-5 py-5 ${
          balanceOk
            ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/25 shadow-lg shadow-emerald-500/5'
            : 'bg-muted/50 border border-border'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              {language === 'pt' ? 'Resultado do mês' : 'Monthly balance'}
            </p>
            <p className={`text-xl font-medium tabular-nums ${balanceOk ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {balanceOk ? '+' : ''}€{balance.toLocaleString('en-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <p className={`text-xs leading-relaxed ${balanceOk ? 'text-emerald-300/80' : 'text-muted-foreground/70'}`}>
            {balanceMessage}
          </p>
          {expenseDiffLabel && (
            <p className={`text-[10px] mt-2.5 ${expenseDiff < 0 ? 'text-emerald-400/70' : 'text-muted-foreground'}`}>
              {expenseDiffLabel}
            </p>
          )}
        </div>

        {/* Savings progress - with glow and smoother animation */}
        {savingsTarget > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">{language === 'pt' ? 'Meta de poupança' : 'Savings intention'}</span>
              <span className="text-indigo-400 font-medium">{Math.max(0, savingsPct)}%</span>
            </div>
            <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden shadow-inner">
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(0, Math.min(100, savingsPct))}%`,
                  background: 'linear-gradient(90deg, rgba(99,102,241,0.8), rgba(139,92,246,0.6))',
                  boxShadow: '0 0 15px rgba(99,102,241,0.25)'
                }} />
            </div>
            <p className="text-[10px] text-muted-foreground/70">
              €{Math.max(0, balance).toLocaleString('en-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {language === 'pt' ? 'de' : 'of'} €{savingsTarget.toLocaleString('en-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        )}

        {/* Insight */}
        {insight && (
          <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-border pl-3">
            {insight}
          </p>
        )}

        {/* Month progress */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground/70 mb-1.5">
            <span>{language === 'pt' ? `Dia ${dayOfMonth} de ${daysInMonth}` : `Day ${dayOfMonth} of ${daysInMonth}`}</span>
            <span>{monthPct}% {language === 'pt' ? 'do mês' : 'of month'}</span>
          </div>
          <div className="h-1 bg-muted/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary/50 to-primary/30 rounded-full transition-all duration-700"
              style={{ width: `${monthPct}%` }} />
          </div>
        </div>
        
        {/* Click hint */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors">
            <span>{language === 'pt' ? 'Ver detalhes →' : 'View details →'}</span>
          </div>
        </div>
        </div>
      </div>
    </Link>
  );
}