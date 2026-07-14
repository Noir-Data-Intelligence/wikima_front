import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Clock, AlertCircle, Users, TrendingUp, TrendingDown } from 'lucide-react';

function KPICard({ title, value, subtitle, icon: IconComp, color, borderColor, link, trend, trendLabel }) {
  const Icon = IconComp;
  const inner = (
    <Card className="border transition-all duration-200 hover:scale-[1.02] cursor-pointer" style={{ backgroundColor: '#1e293b', borderColor: borderColor || `${color}25` }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          {trend !== undefined && trendLabel && (
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {trendLabel}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-foreground tabular-nums leading-none mb-1">{value}</div>
        <div className="text-xs font-medium text-muted-foreground leading-tight">{title}</div>
        {subtitle && <div className="text-[10px] mt-1" style={{ color: `${color}bb` }}>{subtitle}</div>}
      </CardContent>
    </Card>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}

export default function DashboardKPIRow({ invoices, clients, tasks, expenses, language }) {
  const pt = language === 'pt';
  const now = new Date();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const paidInvoices = invoices.filter(i => i.status === 'paid');

  const monthRevenue = paidInvoices
    .filter(i => { const d = new Date(i.paid_date || i.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
    .reduce((s, i) => s + (i.total || 0), 0);

  const lastMonthRevenue = paidInvoices
    .filter(i => { const d = new Date(i.paid_date || i.date); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; })
    .reduce((s, i) => s + (i.total || 0), 0);

  const revenueGrowth = lastMonthRevenue > 0 ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null;

  const overdueInvoices = invoices.filter(i => {
    if (i.status === 'paid' || i.status === 'cancelled') return false;
    return i.due_date && new Date(i.due_date) < now;
  });
  const overdueAmount = overdueInvoices.reduce((s, i) => s + (i.total || 0), 0);

  const pendingInvoices = invoices.filter(i => i.status === 'sent');
  const pendingAmount = pendingInvoices.reduce((s, i) => s + (i.total || 0), 0);

  const activeClients = clients.filter(c => c.status === 'active').length;
  const newClientsThisMonth = clients.filter(c => {
    const d = new Date(c.created_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    return t.deadline && new Date(t.deadline) < today;
  }).length;

  const fmt = (n) => n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${Math.round(n)}`;

  const kpis = [
    {
      title: pt ? 'Receita Mensal' : 'Monthly Revenue',
      value: fmt(monthRevenue),
      subtitle: revenueGrowth !== null ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% ${pt ? 'vs mês ant.' : 'vs last month'}` : (pt ? 'sem histórico' : 'no prior data'),
      icon: DollarSign, color: '#10b981',
      trend: revenueGrowth, trendLabel: revenueGrowth !== null ? `${Math.abs(revenueGrowth)}%` : null,
      link: createPageUrl('Invoices')
    },
    {
      title: pt ? 'A Receber' : 'Awaiting Payment',
      value: fmt(pendingAmount),
      subtitle: `${pendingInvoices.length} ${pt ? 'faturas enviadas' : 'invoices sent'}`,
      icon: Clock, color: '#f59e0b',
      link: createPageUrl('Invoices')
    },
    {
      title: pt ? 'Faturas Vencidas' : 'Overdue Invoices',
      value: overdueInvoices.length > 0 ? fmt(overdueAmount) : '0',
      subtitle: overdueInvoices.length > 0 ? `${overdueInvoices.length} ${pt ? 'em atraso' : 'overdue'}` : (pt ? 'Tudo em dia ✓' : 'All on track ✓'),
      icon: AlertCircle, color: overdueInvoices.length > 0 ? '#ef4444' : '#10b981',
      link: createPageUrl('Invoices')
    },
    {
      title: pt ? 'Clientes Ativos' : 'Active Clients',
      value: activeClients,
      subtitle: newClientsThisMonth > 0 ? `+${newClientsThisMonth} ${pt ? 'este mês' : 'this month'}` : (pt ? 'total ativo' : 'total active'),
      icon: Users, color: '#8b5cf6',
      trend: newClientsThisMonth > 0 ? newClientsThisMonth : undefined,
      trendLabel: newClientsThisMonth > 0 ? `+${newClientsThisMonth}` : null,
      link: createPageUrl('Clients')
    },
    {
      title: pt ? 'Tarefas Atrasadas' : 'Overdue Tasks',
      value: overdueTasks,
      subtitle: overdueTasks === 0 ? (pt ? 'Tudo em dia ✓' : 'All on track ✓') : (pt ? 'requerem atenção' : 'need attention'),
      icon: AlertCircle, color: overdueTasks > 0 ? '#f97316' : '#10b981',
      link: createPageUrl('Tasks')
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
      {kpis.map((k, i) => <KPICard key={i} {...k} />)}
    </div>
  );
}