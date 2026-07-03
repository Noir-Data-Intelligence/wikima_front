import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';
import { TrendingUp, TrendingDown, PiggyBank, Target, Star, Award, Heart, Leaf } from 'lucide-react';
import { KAKEBO_CATEGORIES } from './KakeboCategories';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function YearlyJourney({ expenses, language }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const monthNames = language === 'pt' ? MONTHS_PT : MONTHS_EN;

  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Filter expenses for selected year
  const yearExpenses = useMemo(() => {
    return expenses.filter(e => {
      const date = new Date(e.date);
      return date.getFullYear() === selectedYear;
    });
  }, [expenses, selectedYear]);

  // Monthly data with full breakdown
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
      const monthTransactions = yearExpenses.filter(e => e.date?.startsWith(monthStr));
      const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
      const exp = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
      const savings = monthTransactions.filter(t => t.type === 'savings' || t.category === 'Savings').reduce((s, t) => s + (t.amount || 0), 0);
      const investments = monthTransactions.filter(t => t.type === 'investment' || t.category === 'Investments').reduce((s, t) => s + (t.amount || 0), 0);
      const balance = income - exp;
      
      // Category breakdown for this month
      const byCategory = {};
      monthTransactions.filter(t => t.type === 'expense').forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + (t.amount || 0);
      });
      
      return {
        month: i,
        monthStr,
        income,
        expenses: exp,
        savings,
        investments,
        balance,
        count: monthTransactions.length,
        byCategory,
      };
    });
  }, [yearExpenses, selectedYear]);

  // Yearly totals
  const yearlyTotals = useMemo(() => {
    const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
    const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
    const totalSavings = monthlyData.reduce((s, m) => s + m.savings, 0);
    const totalInvested = monthlyData.reduce((s, m) => s + m.investments, 0);
    const totalBalance = totalIncome - totalExpenses;
    const positiveMonths = monthlyData.filter(m => m.balance > 0 && m.count > 0).length;
    const negativeMonths = monthlyData.filter(m => m.balance < 0 && m.count > 0).length;
    
    // Best and worst months
    const bestMonth = monthlyData.reduce((best, m) => m.balance > best.balance ? m : best, monthlyData[0]);
    const worstMonth = monthlyData.reduce((worst, m) => m.balance < worst.balance ? m : worst, monthlyData[0]);
    const highestExpenseMonth = monthlyData.reduce((highest, m) => m.expenses > highest.expenses ? m : highest, monthlyData[0]);
    const bestSavingMonth = monthlyData.reduce((best, m) => m.savings > best.savings ? m : best, monthlyData[0]);
    
    // Category yearly totals
    const categoryTotals = {};
    yearExpenses.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (t.amount || 0);
    });
    const topCategory = Object.entries(categoryTotals).sort(([,a],[,b]) => b - a)[0];
    
    // Savings consistency (months where savings > 0)
    const savingsConsistency = monthlyData.filter(m => m.savings > 0).length;
    
    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      totalInvested,
      totalBalance,
      positiveMonths,
      negativeMonths,
      bestMonth,
      worstMonth,
      highestExpenseMonth,
      bestSavingMonth,
      categoryTotals,
      topCategory,
      savingsConsistency,
    };
  }, [monthlyData, yearExpenses]);

  // Generate intelligent insights
  const insights = useMemo(() => {
    const list = [];
    const t = language === 'pt';
    
    // Savings insight
    if (yearlyTotals.totalSavings > 0) {
      list.push({
        type: 'positive',
        emoji: '🪴',
        text: t
          ? `Poupaste €${yearlyTotals.totalSavings.toFixed(0)} este ano — estás a construir o teu futuro.`
          : `You saved €${yearlyTotals.totalSavings.toFixed(0)} this year — building your future.`,
      });
    }
    
    // Investment insight
    if (yearlyTotals.totalInvested > 0) {
      list.push({
        type: 'positive',
        emoji: '📈',
        text: t
          ? `Investiste €${yearlyTotals.totalInvested.toFixed(0)} — o teu dinheiro está a trabalhar para ti.`
          : `You invested €${yearlyTotals.totalInvested.toFixed(0)} — your money is working for you.`,
      });
    }
    
    // Balance insight
    if (yearlyTotals.totalBalance > 0) {
      list.push({
        type: 'positive',
        emoji: '✅',
        text: t
          ? `Terminaste o ano com €${yearlyTotals.totalBalance.toFixed(0)} positivos — excelente gestão.`
          : `You finished the year with €${yearlyTotals.totalBalance.toFixed(0)} positive — excellent management.`,
      });
    } else if (yearlyTotals.totalBalance < 0) {
      list.push({
        type: 'gentle',
        emoji: '🌱',
        text: t
          ? 'Este ano foi desafiante, mas cada mês é uma nova oportunidade para aprender.'
          : 'This year was challenging, but every month is a fresh opportunity to learn.',
      });
    }
    
    // Top category insight
    if (yearlyTotals.topCategory) {
      const catMeta = KAKEBO_CATEGORIES.find(c => c.key === yearlyTotals.topCategory[0]);
      const catName = catMeta ? (t ? catMeta.pt : catMeta.en) : yearlyTotals.topCategory[0];
      const pct = Math.round((yearlyTotals.topCategory[1] / yearlyTotals.totalExpenses) * 100);
      list.push({
        type: 'neutral',
        emoji: '📊',
        text: t
          ? `${catName} foi a tua maior categoria (${pct}% das despesas).`
          : `${catName} was your biggest category (${pct}% of spending).`,
      });
    }
    
    // Consistency insight
    if (yearlyTotals.savingsConsistency >= 6) {
      list.push({
        type: 'positive',
        emoji: '🔥',
        text: t
          ? `Poupaste em ${yearlyTotals.savingsConsistency} meses consecutivos — consistência incrível!`
          : `You saved in ${yearlyTotals.savingsConsistency} months — incredible consistency!`,
      });
    }
    
    // Best month insight
    if (yearlyTotals.bestMonth.count > 0) {
      list.push({
        type: 'positive',
        emoji: '🌟',
        text: t
          ? `${monthNames[yearlyTotals.bestMonth.month]} foi o teu melhor mês financeiramente.`
          : `${monthNames[yearlyTotals.bestMonth.month]} was your best financial month.`,
      });
    }
    
    return list;
  }, [yearlyTotals, language, monthNames]);

  // Chart scaling
  const maxIncome = Math.max(...monthlyData.map(m => m.income), 1);
  const maxExp = Math.max(...monthlyData.map(m => m.expenses), 1);
  const maxVal = Math.max(maxIncome, maxExp);

  return (
    <div className="space-y-4">
      
      {/* Year selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-emerald-400/70" />
          <h2 className="text-base font-semibold text-foreground">
            {language === 'pt' ? `Jornada Financeira ${selectedYear}` : `Financial Journey ${selectedYear}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            disabled={selectedYear <= currentYear - 2}
            className="w-8 h-8 rounded-xl bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-muted-foreground w-12 text-center">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= currentYear}
            className="w-8 h-8 rounded-xl bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            ›
          </button>
        </div>
      </div>

      {/* Yearly summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4 text-emerald-400/70" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Total Poupado' : 'Total Saved'}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-300">€{yearlyTotals.totalSavings.toFixed(0)}</p>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/15 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-violet-400/70" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Total Investido' : 'Total Invested'}</span>
          </div>
          <p className="text-2xl font-bold text-violet-300">€{yearlyTotals.totalInvested.toFixed(0)}</p>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/15 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-blue-400/70" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Meses Positivos' : 'Positive Months'}</span>
          </div>
          <p className="text-2xl font-bold text-blue-300">{yearlyTotals.positiveMonths}<span className="text-sm text-muted-foreground">/{Math.min(now.getMonth() + 1, 12)}</span></p>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/15 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-400/70" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Melhor Mês' : 'Best Month'}</span>
          </div>
          <p className="text-lg font-bold text-amber-300">{yearlyTotals.bestMonth.count > 0 ? monthNames[yearlyTotals.bestMonth.month] : '—'}</p>
        </div>
      </div>

      {/* Monthly evolution chart */}
      <div className="rounded-3xl bg-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            {language === 'pt' ? 'Evolução Mensal' : 'Monthly Evolution'}
          </p>
        </div>
        
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-end gap-1 h-24">
            {monthlyData.map((m, i) => {
              const isCurrent = m.month === now.getMonth() && selectedYear === currentYear;
              const hasData = m.count > 0;
              const incH = maxVal > 0 ? Math.round((m.income / maxVal) * 100) : 0;
              const expH = maxVal > 0 ? Math.round((m.expenses / maxVal) * 100) : 0;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex items-end gap-0.5 h-20">
                    <div
                      className="flex-1 rounded-t-md transition-all duration-700 group-hover:opacity-80"
                      style={{
                        height: hasData ? `${Math.max(3, incH)}%` : '3%',
                        background: isCurrent ? 'rgba(52,211,153,0.8)' : 'rgba(52,211,153,0.3)',
                      }}
                      title={`${language === 'pt' ? 'Receita' : 'Income'}: €${m.income.toFixed(0)}`}
                    />
                    <div
                      className="flex-1 rounded-t-md transition-all duration-700 group-hover:opacity-80"
                      style={{
                        height: hasData ? `${Math.max(3, expH)}%` : '3%',
                        background: isCurrent ? 'rgba(139,92,246,0.7)' : 'rgba(139,92,246,0.25)',
                      }}
                      title={`${language === 'pt' ? 'Despesa' : 'Expenses'}: €${m.expenses.toFixed(0)}`}
                    />
                  </div>
                  <span className={`text-[8px] ${isCurrent ? 'text-muted-foreground font-semibold' : 'text-muted-foreground'}`}>
                    {monthNames[i]}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-4 mt-3 pb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400/50" />
              <span className="text-[9px] text-muted-foreground">{language === 'pt' ? 'Receita' : 'Income'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-violet-400/40" />
              <span className="text-[9px] text-muted-foreground">{language === 'pt' ? 'Despesa' : 'Expenses'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligent insights */}
      {insights.length > 0 && (
        <div className="rounded-3xl bg-card border border-border p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-rose-400/70" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              {language === 'pt' ? 'Insights do Ano' : 'Yearly Insights'}
            </p>
          </div>
          {insights.map((insight, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${
              insight.type === 'positive' ? 'bg-emerald-500/6 border border-emerald-500/12' :
              insight.type === 'gentle' ? 'bg-amber-500/6 border border-amber-500/12' :
              'bg-muted/40 border border-border'
            }`}>
              <span className="text-lg">{insight.emoji}</span>
              <p className={`text-xs leading-relaxed ${
                insight.type === 'positive' ? 'text-emerald-200/80' :
                insight.type === 'gentle' ? 'text-amber-200/70' :
                'text-muted-foreground'
              }`}>
                {insight.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Category breakdown */}
      <div className="rounded-3xl bg-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            {language === 'pt' ? 'Despesas por Categoria' : 'Expenses by Category'}
          </p>
        </div>
        
        <div className="p-5 space-y-3">
          {Object.entries(yearlyTotals.categoryTotals)
            .sort(([,a],[,b]) => b - a)
            .slice(0, 8)
            .map(([cat, amount]) => {
              const catMeta = KAKEBO_CATEGORIES.find(c => c.key === cat);
              const pct = Math.round((amount / yearlyTotals.totalExpenses) * 100);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xl w-7 text-center">{catMeta?.emoji || '📌'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-medium">
                        {catMeta ? (language === 'pt' ? catMeta.pt : catMeta.en) : cat}
                      </span>
                      <span className="text-muted-foreground tabular-nums">€{amount.toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: catMeta?.color || 'rgba(139,92,246,0.5)',
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Financial milestones */}
      <div className="rounded-3xl bg-card border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-amber-400/70" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            {language === 'pt' ? 'Marcos Financeiros' : 'Financial Milestones'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-500/6 border border-emerald-500/12 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300/70" />
              <span className="text-[9px] text-muted-foreground uppercase">{language === 'pt' ? 'Melhor Mês' : 'Best Month'}</span>
            </div>
            <p className="text-sm font-semibold text-emerald-200">
              {yearlyTotals.bestMonth.count > 0 ? monthNames[yearlyTotals.bestMonth.month] : '—'}
            </p>
            <p className="text-[10px] text-emerald-300/50 mt-0.5">
              +€{yearlyTotals.bestMonth.balance.toFixed(0)}
            </p>
          </div>
          
          <div className="rounded-xl bg-violet-500/6 border border-violet-500/12 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <PiggyBank className="w-3.5 h-3.5 text-violet-300/70" />
              <span className="text-[9px] text-muted-foreground uppercase">{language === 'pt' ? 'Maior Poupança' : 'Best Savings'}</span>
            </div>
            <p className="text-sm font-semibold text-violet-200">
              {yearlyTotals.bestSavingMonth.count > 0 ? monthNames[yearlyTotals.bestSavingMonth.month] : '—'}
            </p>
            <p className="text-[10px] text-violet-300/50 mt-0.5">
              €{yearlyTotals.bestSavingMonth.savings.toFixed(0)}
            </p>
          </div>
          
          <div className="rounded-xl bg-blue-500/6 border border-blue-500/12 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5 text-blue-300/70" />
              <span className="text-[9px] text-muted-foreground uppercase">{language === 'pt' ? 'Consistência' : 'Consistency'}</span>
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {yearlyTotals.savingsConsistency} {language === 'pt' ? 'meses' : 'months'}
            </p>
            <p className="text-[10px] text-blue-300/50 mt-0.5">
              {language === 'pt' ? 'com poupança' : 'with savings'}
            </p>
          </div>
          
          <div className="rounded-xl bg-amber-500/6 border border-amber-500/12 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-3.5 h-3.5 text-amber-300/70" />
              <span className="text-[9px] text-muted-foreground uppercase">{language === 'pt' ? 'Top Categoria' : 'Top Category'}</span>
            </div>
            <p className="text-sm font-semibold text-amber-200 truncate">
              {yearlyTotals.topCategory ? (KAKEBO_CATEGORIES.find(c => c.key === yearlyTotals.topCategory[0])?.[language === 'pt' ? 'pt' : 'en'] || yearlyTotals.topCategory[0]) : '—'}
            </p>
            <p className="text-[10px] text-amber-300/50 mt-0.5">
              €{yearlyTotals.topCategory ? yearlyTotals.topCategory[1].toFixed(0) : '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}