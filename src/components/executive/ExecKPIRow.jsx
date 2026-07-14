import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function KPICard({ title, value, subtitle, icon: IconComp, color, link, trend, trendValue }) {
  const Icon = IconComp;
  const content = (
    <Card className="border transition-all hover:scale-[1.02]" style={{ backgroundColor: '#1e293b', borderColor: `${color}30` }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-foreground tabular-nums mb-1">{value}</div>
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {subtitle && <div className="text-xs mt-1" style={{ color: `${color}cc` }}>{subtitle}</div>}
      </CardContent>
    </Card>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}

export default function ExecKPIRow({ invoices, clients, tasks, expenses, language }) {
  const pt = language === 'pt';

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const overdueInvoices = invoices.filter(i => {
    if (i.status === 'paid' || i.status === 'cancelled') return false;
    if (!i.due_date) return false;
    return new Date(i.due_date) < now;
  });
  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'draft');

  // Monthly revenue
  const monthRevenue = paidInvoices
    .filter(i => { const d = new Date(i.paid_date || i.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
    .reduce((s, i) => s + (i.total || 0), 0);

  const lastMonthRevenue = paidInvoices
    .filter(i => { const d = new Date(i.paid_date || i.date); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; })
    .reduce((s, i) => s + (i.total || 0), 0);

  const revenueGrowth = lastMonthRevenue > 0 ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null;

  // Pending payments
  const pendingAmount = pendingInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const overdueAmount = overdueInvoices.reduce((s, i) => s + (i.total || 0), 0);

  // Active clients
  const activeClients = clients.filter(c => c.status === 'active').length;
  const newClientsThisMonth = clients.filter(c => {
    const d = new Date(c.created_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  // Overdue tasks
  const today = new Date(); today.setHours(0,0,0,0);
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    if (!t.deadline) return false;
    return new Date(t.deadline) < today;
  });

  const fmt = (n) => n >= 1000 ? `€${(n/1000).toFixed(1)}k` : `€${n.toFixed(0)}`;

  const kpis = [
    {
      title: pt ? 'Receita Mensal' : 'Monthly Revenue',
      value: fmt(monthRevenue),
      subtitle: revenueGrowth !== null ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% ${pt ? 'vs mês anterior' : 'vs last month'}` : (pt ? 'sem dados anteriores' : 'no prior data'),
      icon: DollarSign,
      color: '#10b981',
      trend: revenueGrowth !== null ? (revenueGrowth >= 0 ? 'up' : 'down') : null,
      trendValue: revenueGrowth !== null ? `${Math.abs(revenueGrowth)}%` : null,
      link: createPageUrl('Invoices')
    },
    {
      title: pt ? 'Pagamentos Pendentes' : 'Pending Payments',
      value: fmt(pendingAmount),
      subtitle: `${pendingInvoices.length} ${pt ? 'faturas por receber' : 'invoices awaiting'}`,
      icon: Clock,
      color: '#f59e0b',
      link: createPageUrl('Invoices')
    },
    {
      title: pt ? 'Faturas Vencidas' : 'Overdue Invoices',
      value: fmt(overdueAmount),
      subtitle: `${overdueInvoices.length} ${pt ? 'faturas em atraso' : 'overdue'}`,
      icon: AlertCircle,
      color: overdueInvoices.length > 0 ? '#ef4444' : '#10b981',
      link: createPageUrl('Invoices')
    },
    {
      title: pt ? 'Clientes Ativos' : 'Active Clients',
      value: activeClients,
      subtitle: newClientsThisMonth > 0 ? `+${newClientsThisMonth} ${pt ? 'este mês' : 'this month'}` : (pt ? 'total ativo' : 'total active'),
      icon: Users,
      color: '#8b5cf6',
      trend: newClientsThisMonth > 0 ? 'up' : null,
      trendValue: newClientsThisMonth > 0 ? `+${newClientsThisMonth}` : null,
      link: createPageUrl('Clients')
    },
    {
      title: pt ? 'Tarefas Atrasadas' : 'Overdue Tasks',
      value: overdueTasks.length,
      subtitle: overdueTasks.length === 0 ? (pt ? 'Tudo em dia ✓' : 'All on track ✓') : (pt ? 'requerem atenção' : 'need attention'),
      icon: AlertCircle,
      color: overdueTasks.length > 0 ? '#f97316' : '#10b981',
      link: createPageUrl('Tasks')
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((k, i) => <KPICard key={i} {...k} />)}
    </div>
  );
}