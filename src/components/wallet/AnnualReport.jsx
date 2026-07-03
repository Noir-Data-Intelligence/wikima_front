import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';
import { TrendingUp, TrendingDown, PiggyBank, Target, Star, Award, Heart, Leaf, Calendar, Sparkles } from 'lucide-react';
import { KAKEBO_CATEGORIES } from './KakeboCategories';

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AnnualReport({ expenses, financialGoals, monthlyReviews, language }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const monthNames = language === 'pt' ? MONTHS_PT : MONTHS_EN;
  const shortMonthNames = language === 'pt' ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const year = currentYear - 1; // Last year's report

  // Filter data for the selected year
  const yearExpenses = useMemo(() => {
    return expenses.filter(e => {
      const date = new Date(e.date);
      return date.getFullYear() === year;
    });
  }, [expenses, year]);

  const yearGoals = useMemo(() => {
    return financialGoals.filter(g => g.month?.startsWith(year.toString()));
  }, [financialGoals, year]);

  const yearReviews = useMemo(() => {
    return monthlyReviews.filter(r => r.month?.startsWith(year.toString()));
  }, [monthlyReviews, year]);

  // Complete yearly analysis
  const yearlyAnalysis = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`;
      const monthTransactions = yearExpenses.filter(e => e.date?.startsWith(monthStr));
      const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
      const exp = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
      const savings = monthTransactions.filter(t => t.type === 'savings' || t.category === 'Savings').reduce((s, t) => s + (t.amount || 0), 0);
      const investments = monthTransactions.filter(t => t.type === 'investment' || t.category === 'Investments').reduce((s, t) => s + (t.amount || 0), 0);
      const balance = income - exp;
      
      return { month: i, income, expenses: exp, savings, investments, balance, count: monthTransactions.length };
    });

    const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
    const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
    const totalSavings = monthlyData.reduce((s, m) => s + m.savings, 0);
    const totalInvested = monthlyData.reduce((s, m) => s + m.investments, 0);
    const totalBalance = totalIncome - totalExpenses;
    
    const positiveMonths = monthlyData.filter(m => m.balance > 0 && m.count > 0).length;
    const negativeMonths = monthlyData.filter(m => m.balance < 0 && m.count > 0).length;
    
    const bestMonth = monthlyData.reduce((best, m) => m.balance > best.balance ? m : best, monthlyData[0]);
    const worstMonth = monthlyData.reduce((worst, m) => m.balance < worst.balance && m.count > 0 ? m : worst, monthlyData[0]);
    const highestExpenseMonth = monthlyData.reduce((highest, m) => m.expenses > highest.expenses ? m : highest, monthlyData[0]);
    const bestSavingMonth = monthlyData.reduce((best, m) => m.savings > best.savings ? m : best, monthlyData[0]);
    
    // Category breakdown
    const categoryTotals = {};
    yearExpenses.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (t.amount || 0);
    });
    const sortedCategories = Object.entries(categoryTotals).sort(([,a],[,b]) => b - a);
    const topCategory = sortedCategories[0];
    
    // Savings consistency
    const savingsConsistency = monthlyData.filter(m => m.savings > 0).length;
    
    // Monthly reflections count
    const reflectionsCount = yearReviews.length;
    
    return {
      monthlyData,
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
      sortedCategories,
      topCategory,
      savingsConsistency,
      reflectionsCount,
    };
  }, [yearExpenses, yearReviews]);

  // Generate emotional narrative
  const narrative = useMemo(() => {
    const t = language === 'pt';
    const sections = [];

    // Opening
    sections.push({
      type: 'intro',
      emoji: '📖',
      title: t ? `O Teu Ano Financeiro de ${year}` : `Your Financial Year of ${year}`,
      text: t
        ? 'Cada decisão financeira conta uma história. Aqui está a tua jornada de crescimento, desafios e conquistas.'
        : 'Every financial decision tells a story. Here\'s your journey of growth, challenges, and achievements.',
    });

    // Big picture
    if (yearlyAnalysis.totalBalance > 0) {
      sections.push({
        type: 'achievement',
        emoji: '🎉',
        title: t ? 'Balanço Positivo' : 'Positive Balance',
        text: t
          ? `Terminaste o ano com €${yearlyAnalysis.totalBalance.toFixed(0)} positivos. Cada euro poupado é um passo em direção aos teus sonhos.`
          : `You finished the year with €${yearlyAnalysis.totalBalance.toFixed(0)} positive. Every euro saved is a step toward your dreams.`,
      });
    } else {
      sections.push({
        type: 'gentle',
        emoji: '🌱',
        title: t ? 'Um Ano de Aprendizagem' : 'A Year of Learning',
        text: t
          ? 'Este ano teve desafios, mas cada mês difícil ensina algo valioso. O próximo ano é uma nova página em branco.'
          : 'This year had challenges, but every difficult month teaches something valuable. Next year is a blank page.',
      });
    }

    // Savings celebration
    if (yearlyAnalysis.totalSavings > 0) {
      sections.push({
        type: 'celebration',
        emoji: '🪴',
        title: t ? 'Sementes Plantadas' : 'Seeds Planted',
        text: t
          ? `Poupaste €${yearlyAnalysis.totalSavings.toFixed(0)} ao longo do ano. Estás a construir um futuro mais seguro, um mês de cada vez.`
          : `You saved €${yearlyAnalysis.totalSavings.toFixed(0)} throughout the year. You\'re building a safer future, one month at a time.`,
      });
    }

    // Investment growth
    if (yearlyAnalysis.totalInvested > 0) {
      sections.push({
        type: 'celebration',
        emoji: '📈',
        title: t ? 'O Dinheiro a Trabalhar' : 'Money Working for You',
        text: t
          ? `Investiste €${yearlyAnalysis.totalInvested.toFixed(0)}. O teu dinheiro está a crescer em silêncio, como uma árvore que plantaste.`
          : `You invested €${yearlyAnalysis.totalInvested.toFixed(0)}. Your money is growing silently, like a tree you planted.`,
      });
    }

    // Consistency recognition
    if (yearlyAnalysis.savingsConsistency >= 6) {
      sections.push({
        type: 'achievement',
        emoji: '🔥',
        title: t ? 'Consistência Notável' : 'Remarkable Consistency',
        text: t
          ? `Poupaste em ${yearlyAnalysis.savingsConsistency} meses diferentes. Esta consistência é o verdadeiro superpoder financeiro.`
          : `You saved in ${yearlyAnalysis.savingsConsistency} different months. This consistency is the real financial superpower.`,
      });
    }

    // Reflection wisdom
    if (yearlyAnalysis.reflectionsCount >= 3) {
      sections.push({
        type: 'wisdom',
        emoji: '🌙',
        title: t ? 'Autoconsciência Financeira' : 'Financial Self-Awareness',
        text: t
          ? `Refletiste sobre ${yearlyAnalysis.reflectionsCount} meses. Esta prática de awareness é o que transforma hábitos financeiros.`
          : `You reflected on ${yearlyAnalysis.reflectionsCount} months. This awareness practice is what transforms financial habits.`,
      });
    }

    // Top category insight
    if (yearlyAnalysis.topCategory) {
      const catMeta = KAKEBO_CATEGORIES.find(c => c.key === yearlyAnalysis.topCategory[0]);
      const catName = catMeta ? (t ? catMeta.pt : catMeta.en) : yearlyAnalysis.topCategory[0];
      const pct = Math.round((yearlyAnalysis.topCategory[1] / yearlyAnalysis.totalExpenses) * 100);
      sections.push({
        type: 'insight',
        emoji: '📊',
        title: t ? 'Onde o Dinheiro Foi' : 'Where the Money Went',
        text: t
          ? `${catName} representou ${pct}% das tuas despesas. Entender isto é o primeiro passo para decisões mais conscientes.`
          : `${catName} represented ${pct}% of your spending. Understanding this is the first step to more conscious decisions.`,
      });
    }

    // Best month celebration
    if (yearlyAnalysis.bestMonth.count > 0) {
      sections.push({
        type: 'celebration',
        emoji: '🌟',
        title: t ? 'O Teu Melhor Momento' : 'Your Best Moment',
        text: t
          ? `${monthNames[yearlyAnalysis.bestMonth.month]} foi excecional — ficaste com +€${yearlyAnalysis.bestMonth.balance.toFixed(0)}. Lembra-te desse sentimento.`
          : `${monthNames[yearlyAnalysis.bestMonth.month]} was exceptional — you kept +€${yearlyAnalysis.bestMonth.balance.toFixed(0)}. Remember that feeling.`,
      });
    }

    // Gentle encouragement for difficult months
    if (yearlyAnalysis.negativeMonths > 0) {
      sections.push({
        type: 'gentle',
        emoji: '☁️',
        title: t ? 'Meses Desafiante' : 'Challenging Months',
        text: t
          ? `Tiveste ${yearlyAnalysis.negativeMonths} meses com balanço negativo. Não são falhas — são dados. Usá-los para crescer.`
          : `You had ${yearlyAnalysis.negativeMonths} months with negative balance. These aren\'t failures — they\'re data. Use them to grow.`,
      });
    }

    return sections;
  }, [yearlyAnalysis, year, language]);

  return (
    <div className="space-y-6 pb-8">
      
      {/* Report header */}
      <div className="rounded-3xl bg-gradient-to-br from-card to-muted border border-border p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-amber-400/70" />
          <h1 className="text-xl font-bold text-foreground">
            {language === 'pt' ? `Relatório Anual ${year}` : `Annual Report ${year}`}
          </h1>
          <Sparkles className="w-5 h-5 text-amber-400/70" />
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {language === 'pt'
            ? 'Uma visão completa da tua jornada financeira, conquistas e aprendizados.'
            : 'A complete view of your financial journey, achievements, and learnings.'}
        </p>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4 text-emerald-400/70" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Total Poupado' : 'Total Saved'}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-300">€{yearlyAnalysis.totalSavings.toFixed(0)}</p>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/15 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-violet-400/70" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Total Investido' : 'Total Invested'}</span>
          </div>
          <p className="text-2xl font-bold text-violet-300">€{yearlyAnalysis.totalInvested.toFixed(0)}</p>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/15 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-blue-400/70" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Meses Positivos' : 'Positive Months'}</span>
          </div>
          <p className="text-2xl font-bold text-blue-300">{yearlyAnalysis.positiveMonths}<span className="text-sm text-muted-foreground">/12</span></p>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/15 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-400/70" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Balanço' : 'Balance'}</span>
          </div>
          <p className={`text-2xl font-bold ${yearlyAnalysis.totalBalance >= 0 ? 'text-emerald-300' : 'text-muted-foreground'}`}>
            {yearlyAnalysis.totalBalance >= 0 ? '+' : ''}€{yearlyAnalysis.totalBalance.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Financial narrative */}
      <div className="space-y-3">
        {narrative.map((section, i) => (
          <div key={i} className={`rounded-2xl p-5 border ${
            section.type === 'achievement' || section.type === 'celebration' ? 'bg-emerald-500/6 border-emerald-500/12' :
            section.type === 'gentle' ? 'bg-amber-500/6 border-amber-500/12' :
            section.type === 'wisdom' ? 'bg-indigo-500/6 border-indigo-500/12' :
            'bg-card border-border'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{section.emoji}</span>
              <div>
                <h3 className={`text-sm font-semibold mb-1.5 ${
                  section.type === 'achievement' || section.type === 'celebration' ? 'text-emerald-200' :
                  section.type === 'gentle' ? 'text-amber-200' :
                  section.type === 'wisdom' ? 'text-indigo-200' :
                  'text-foreground/80'
                }`}>
                  {section.title}
                </h3>
                <p className={`text-xs leading-relaxed ${
                  section.type === 'achievement' || section.type === 'celebration' ? 'text-emerald-300/70' :
                  section.type === 'gentle' ? 'text-amber-300/60' :
                  section.type === 'wisdom' ? 'text-indigo-300/70' :
                  'text-muted-foreground'
                }`}>
                  {section.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly evolution visualization */}
      <div className="rounded-3xl bg-card border border-border overflow-hidden p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            {language === 'pt' ? 'Evolução Mensal' : 'Monthly Evolution'}
          </p>
        </div>
        
        <div className="flex items-end gap-1 h-20 mb-3">
          {yearlyAnalysis.monthlyData.map((m, i) => {
            const hasData = m.count > 0;
            const maxVal = Math.max(...yearlyAnalysis.monthlyData.map(x => Math.max(x.income, x.expenses)), 1);
            const incH = maxVal > 0 ? Math.round((m.income / maxVal) * 100) : 0;
            const expH = maxVal > 0 ? Math.round((m.expenses / maxVal) * 100) : 0;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end gap-px h-16">
                  <div
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: hasData ? `${Math.max(2, incH)}%` : '2%',
                      background: 'rgba(52,211,153,0.3)',
                    }}
                  />
                  <div
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: hasData ? `${Math.max(2, expH)}%` : '2%',
                      background: 'rgba(139,92,246,0.25)',
                    }}
                  />
                </div>
                <span className="text-[7px] text-muted-foreground">{shortMonthNames[i]}</span>
              </div>
            );
          })}
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-emerald-400/50" />
            <span className="text-[9px] text-muted-foreground">{language === 'pt' ? 'Receita' : 'Income'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-violet-400/40" />
            <span className="text-[9px] text-muted-foreground">{language === 'pt' ? 'Despesa' : 'Expenses'}</span>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="rounded-3xl bg-card border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-4 h-4 text-emerald-400/70" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            {language === 'pt' ? 'Para Onde Foi o Dinheiro' : 'Where the Money Went'}
          </p>
        </div>
        
        <div className="space-y-3">
          {yearlyAnalysis.sortedCategories.slice(0, 6).map(([cat, amount], i) => {
            const catMeta = KAKEBO_CATEGORIES.find(c => c.key === cat);
            const pct = Math.round((amount / yearlyAnalysis.totalExpenses) * 100);
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-lg w-6 text-center">{catMeta?.emoji || '📌'}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {catMeta ? (language === 'pt' ? catMeta.pt : catMeta.en) : cat}
                    </span>
                    <span className="text-foreground/45 tabular-nums">€{amount.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: catMeta?.color || 'rgba(139,92,246,0.5)',
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestones grid */}
      <div className="rounded-3xl bg-card border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-amber-400/70" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            {language === 'pt' ? 'Marcos do Ano' : 'Year Milestones'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-500/6 border border-emerald-500/12 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-300/70" />
              <span className="text-[8px] text-muted-foreground uppercase">{language === 'pt' ? 'Melhor Mês' : 'Best Month'}</span>
            </div>
            <p className="text-sm font-semibold text-emerald-200">
              {monthNames[yearlyAnalysis.bestMonth.month]}
            </p>
            <p className="text-[9px] text-emerald-300/50 mt-0.5">
              +€{yearlyAnalysis.bestMonth.balance.toFixed(0)}
            </p>
          </div>
          
          <div className="rounded-xl bg-violet-500/6 border border-violet-500/12 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <PiggyBank className="w-3 h-3 text-violet-300/70" />
              <span className="text-[8px] text-muted-foreground uppercase">{language === 'pt' ? 'Maior Poupança' : 'Best Savings'}</span>
            </div>
            <p className="text-sm font-semibold text-violet-200">
              {monthNames[yearlyAnalysis.bestSavingMonth.month]}
            </p>
            <p className="text-[9px] text-violet-300/50 mt-0.5">
              €{yearlyAnalysis.bestSavingMonth.savings.toFixed(0)}
            </p>
          </div>
          
          <div className="rounded-xl bg-blue-500/6 border border-blue-500/12 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3 h-3 text-blue-300/70" />
              <span className="text-[8px] text-muted-foreground uppercase">{language === 'pt' ? 'Consistência' : 'Consistency'}</span>
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {yearlyAnalysis.savingsConsistency} {language === 'pt' ? 'meses' : 'months'}
            </p>
            <p className="text-[9px] text-blue-300/50 mt-0.5">
              {language === 'pt' ? 'a poupar' : 'saving'}
            </p>
          </div>
          
          <div className="rounded-xl bg-amber-500/6 border border-amber-500/12 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-3 h-3 text-amber-300/70" />
              <span className="text-[8px] text-muted-foreground uppercase">{language === 'pt' ? 'Reflexões' : 'Reflections'}</span>
            </div>
            <p className="text-sm font-semibold text-amber-200">
              {yearlyAnalysis.reflectionsCount}
            </p>
            <p className="text-[9px] text-amber-300/50 mt-0.5">
              {language === 'pt' ? 'meses refletidos' : 'months reflected'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}