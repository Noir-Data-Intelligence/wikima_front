import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Utensils, 
  Car, 
  Home, 
  Briefcase, 
  Settings, 
  Code, 
  User, 
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  Building
} from 'lucide-react';

export default function CategoryBreakdown({ transactions, language }) {
  const categoryIcons = {
    'Food': Utensils,
    'Transport': Car,
    'Home': Home,
    'Business': Briefcase,
    'Services': Settings,
    'Software': Code,
    'Personal': User,
    'Other': MoreHorizontal,
    'Salary': DollarSign,
    'Sales': ShoppingBag,
    'Services Income': Settings,
    'Commission': Award,
    'Rent Income': Building,
    'Other Income': TrendingUp
  };

  const categoryColors = {
    'Food': 'bg-orange-500',
    'Transport': 'bg-blue-500',
    'Home': 'bg-purple-500',
    'Business': 'bg-indigo-500',
    'Services': 'bg-teal-500',
    'Software': 'bg-primary',
    'Personal': 'bg-pink-500',
    'Other': 'bg-gray-500',
    'Salary': 'bg-green-600',
    'Sales': 'bg-emerald-500',
    'Services Income': 'bg-teal-600',
    'Commission': 'bg-amber-600',
    'Rent Income': 'bg-lime-600',
    'Other Income': 'bg-green-500'
  };

  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');

  const expenseTotals = {};
  const incomeTotals = {};
  
  expenses.forEach(t => {
    expenseTotals[t.category] = (expenseTotals[t.category] || 0) + t.amount;
  });
  
  income.forEach(t => {
    incomeTotals[t.category] = (incomeTotals[t.category] || 0) + t.amount;
  });

  const totalExpenses = Object.values(expenseTotals).reduce((sum, val) => sum + val, 0);
  const totalIncome = Object.values(incomeTotals).reduce((sum, val) => sum + val, 0);

  const expenseCategories = Object.entries(expenseTotals)
    .map(([name, value]) => ({ name, value, percentage: (value / totalExpenses) * 100 }))
    .sort((a, b) => b.value - a.value);

  const incomeCategories = Object.entries(incomeTotals)
    .map(([name, value]) => ({ name, value, percentage: (value / totalIncome) * 100 }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Expenses Breakdown */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            {language === 'pt' ? 'Despesas por Categoria' : 'Expenses by Category'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenseCategories.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {language === 'pt' ? 'Sem despesas ainda' : 'No expenses yet'}
            </p>
          ) : (
            <div className="space-y-4">
              {expenseCategories.map((cat, idx) => {
                const Icon = categoryIcons[cat.name] || MoreHorizontal;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${categoryColors[cat.name]} bg-opacity-20 flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${categoryColors[cat.name].replace('bg-', 'text-')}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">€{cat.value.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{cat.percentage.toFixed(0)}%</p>
                      </div>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income Breakdown */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            {language === 'pt' ? 'Receitas por Categoria' : 'Income by Category'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomeCategories.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {language === 'pt' ? 'Sem receitas ainda' : 'No income yet'}
            </p>
          ) : (
            <div className="space-y-4">
              {incomeCategories.map((cat, idx) => {
                const Icon = categoryIcons[cat.name] || TrendingUp;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${categoryColors[cat.name]} bg-opacity-20 flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${categoryColors[cat.name].replace('bg-', 'text-')}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">€{cat.value.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{cat.percentage.toFixed(0)}%</p>
                      </div>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}