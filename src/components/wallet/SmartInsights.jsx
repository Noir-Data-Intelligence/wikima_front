import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

export default function SmartInsights({ transactions, language }) {
  const insights = [];
  
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthTransactions = transactions.filter(t => new Date(t.date) >= thisMonth);
  const lastMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= lastMonth && d <= lastMonthEnd;
  });

  const thisMonthExpenses = thisMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const lastMonthExpenses = lastMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const thisMonthIncome = thisMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const thisMonthBalance = thisMonthIncome - thisMonthExpenses;
  const lastMonthBalance = lastMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - lastMonthExpenses;

  // Insight 1: Savings comparison
  if (lastMonthBalance > 0 && thisMonthBalance > lastMonthBalance) {
    const diff = ((thisMonthBalance - lastMonthBalance) / lastMonthBalance * 100).toFixed(0);
    insights.push({
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      message: language === 'pt' 
        ? `✅ Ótimo! Poupou ${diff}% mais do que o mês passado.`
        : `✅ Great! You saved ${diff}% more than last month.`
    });
  }

  // Insight 2: Category analysis
  const categoryTotals = {};
  thisMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  
  const lastMonthCategoryTotals = {};
  lastMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
    lastMonthCategoryTotals[t.category] = (lastMonthCategoryTotals[t.category] || 0) + t.amount;
  });

  Object.keys(categoryTotals).forEach(category => {
    const thisAmount = categoryTotals[category];
    const lastAmount = lastMonthCategoryTotals[category] || 0;
    if (lastAmount > 0 && thisAmount > lastAmount * 1.2) {
      const increase = ((thisAmount - lastAmount) / lastAmount * 100).toFixed(0);
      insights.push({
        icon: TrendingUp,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        message: language === 'pt'
          ? `📊 As suas despesas em ${category} aumentaram ${increase}%.`
          : `📊 Your ${category} expenses increased ${increase}%.`
      });
    }
  });

  // Insight 3: Budget warning
  if (thisMonthIncome > 0 && thisMonthExpenses > thisMonthIncome * 0.9) {
    insights.push({
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      message: language === 'pt'
        ? `⚠️ Atenção: Está perto de exceder o seu orçamento mensal.`
        : `⚠️ Warning: You are close to exceeding your monthly budget.`
    });
  }

  // Insight 4: Positive balance
  if (thisMonthBalance > 0 && thisMonthExpenses > 0) {
    const savingsRate = ((thisMonthBalance / thisMonthIncome) * 100).toFixed(0);
    if (savingsRate >= 20) {
      insights.push({
        icon: Sparkles,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        message: language === 'pt'
          ? `💎 Excelente! Está a poupar ${savingsRate}% da sua receita.`
          : `💎 Excellent! You're saving ${savingsRate}% of your income.`
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      icon: Sparkles,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      message: language === 'pt'
        ? '💡 Adicione mais transações para receber insights inteligentes sobre os seus gastos.'
        : '💡 Add more transactions to receive smart insights about your spending.'
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        {language === 'pt' ? 'Insights Inteligentes' : 'Smart Insights'}
      </h3>
      <div className="grid md:grid-cols-2 gap-3">
        {insights.slice(0, 4).map((insight, idx) => (
          <Card key={idx} className={`${insight.bgColor} border-none shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <insight.icon className={`w-5 h-5 ${insight.color} flex-shrink-0 mt-0.5`} />
                <p className="text-sm text-gray-800">{insight.message}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}