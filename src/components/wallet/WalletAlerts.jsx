import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Target, CheckCircle } from 'lucide-react';

export default function WalletAlerts({ expenses, previousWeekExpenses, goals, language }) {
  const todayExpenses = expenses.filter(e => e.date === new Date().toISOString().split('T')[0]);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const weekTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const prevWeekTotal = previousWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
  const weekChange = prevWeekTotal > 0 ? ((weekTotal - prevWeekTotal) / prevWeekTotal) * 100 : 0;

  const alerts = [];

  // High spending alert
  if (todayTotal > 100) {
    alerts.push({
      icon: AlertCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      message: language === 'pt' 
        ? `As tuas despesas hoje (€${todayTotal.toFixed(2)}) estão acima do normal.`
        : `Your spending today (€${todayTotal.toFixed(2)}) is higher than usual.`
    });
  }

  // Week over week increase
  if (weekChange > 20) {
    alerts.push({
      icon: TrendingUp,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      message: language === 'pt'
        ? `As tuas despesas aumentaram ${weekChange.toFixed(0)}% comparado à semana passada.`
        : `Your expenses increased ${weekChange.toFixed(0)}% compared to last week.`
    });
  }

  // Goal progress
  goals.forEach(goal => {
    const progress = (goal.current_amount / goal.target_amount) * 100;
    if (progress >= 80 && progress < 100) {
      alerts.push({
        icon: Target,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        message: language === 'pt'
          ? `Faltam apenas €${(goal.target_amount - goal.current_amount).toFixed(2)} para o objetivo "${goal.title}".`
          : `Only €${(goal.target_amount - goal.current_amount).toFixed(2)} remaining for "${goal.title}".`
      });
    }
  });

  if (alerts.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-900">
            {language === 'pt' ? 'Tudo sob controlo! Continue assim.' : 'Everything is under control! Keep it up.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => (
        <Card key={idx} className={`${alert.bg} border ${alert.border}`}>
          <CardContent className="p-4 flex items-start gap-3">
            <alert.icon className={`w-5 h-5 ${alert.color} mt-0.5`} />
            <p className="text-sm text-gray-900">{alert.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}