import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function WalletStats({ income, expenses, balance, language }) {
  const stats = [
    {
      title: language === 'pt' ? 'Receita Este Mês' : 'Income This Month',
      subtitle: language === 'pt' ? 'O que recebeu' : 'What you received',
      value: `€${income.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-700',
      bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600',
      cardBg: 'bg-green-50'
    },
    {
      title: language === 'pt' ? 'Despesas Este Mês' : 'Expenses This Month',
      subtitle: language === 'pt' ? 'O que gastou' : 'What you spent',
      value: `€${expenses.toFixed(2)}`,
      icon: TrendingDown,
      color: 'text-red-700',
      bgColor: 'bg-gradient-to-br from-red-500 to-rose-600',
      cardBg: 'bg-red-50'
    },
    {
      title: language === 'pt' ? 'Saldo Este Mês' : 'Balance This Month',
      subtitle: language === 'pt' ? 'O que guardou' : 'What you kept',
      value: `€${balance.toFixed(2)}`,
      icon: Wallet,
      color: balance >= 0 ? 'text-amber-700' : 'text-red-700',
      bgColor: balance >= 0 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-600',
      cardBg: balance >= 0 ? 'bg-amber-50' : 'bg-red-50'
    }
  ];

  return (
    <Link to={createPageUrl('TransactionHistory')} className="block group">
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <Card key={idx} className={`shadow-lg group-hover:shadow-xl transition-all border-2 ${stat.cardBg} group-hover:scale-[1.02]`}>
            <CardContent className="p-6">
            <div className={`w-16 h-16 rounded-2xl ${stat.bgColor} flex items-center justify-center mb-4 shadow-md`}>
              <stat.icon className="w-8 h-8 text-foreground" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm font-semibold text-gray-800 mb-1">{stat.title}</p>
            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Link>
  );
}