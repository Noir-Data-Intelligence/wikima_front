import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, Users, CheckSquare, ChevronRight, Bell, Wallet } from 'lucide-react';
import { usePersonalPayments } from '../../hooks/usePersonalPayments';

export default function DashboardAlerts({ invoices, tasks, clients, language }) {
  const pt = language === 'pt';
  const now = new Date();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { overdue: overduePayments, dueToday: paymentsDueToday, dueSoon: paymentsDueSoon } = usePersonalPayments();

  const alerts = [];

  const overdueInvoices = invoices.filter(i =>
    !['paid','cancelled'].includes(i.status) && i.due_date && new Date(i.due_date) < now
  );
  if (overdueInvoices.length > 0) alerts.push({
    icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)',
    label: pt ? `${overdueInvoices.length} fatura(s) vencida(s)` : `${overdueInvoices.length} overdue invoice(s)`,
    sub: pt ? 'Ação imediata necessária' : 'Immediate action needed',
    link: createPageUrl('Invoices')
  });

  const overdueTasks = tasks.filter(t =>
    !['completed','cancelled'].includes(t.status) && t.deadline && new Date(t.deadline) < today
  );
  if (overdueTasks.length > 0) alerts.push({
    icon: CheckSquare, color: '#f97316', bg: 'rgba(249,115,22,0.1)',
    label: pt ? `${overdueTasks.length} tarefa(s) atrasada(s)` : `${overdueTasks.length} overdue task(s)`,
    sub: pt ? 'Prazo ultrapassado' : 'Deadline passed',
    link: createPageUrl('Tasks')
  });

  const tasksDueToday = tasks.filter(t => {
    if (['completed','cancelled'].includes(t.status)) return false;
    if (!t.deadline) return false;
    const d = new Date(t.deadline); d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  });
  if (tasksDueToday.length > 0) alerts.push({
    icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
    label: pt ? `${tasksDueToday.length} tarefa(s) para hoje` : `${tasksDueToday.length} task(s) due today`,
    sub: pt ? 'Prazo hoje' : 'Due today',
    link: createPageUrl('Tasks')
  });

  const pending = invoices.filter(i => i.status === 'sent');
  if (pending.length > 0) {
    const total = pending.reduce((s, i) => s + (i.total || 0), 0);
    alerts.push({
      icon: Clock, color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',
      label: pt ? `€${Math.round(total)} por receber` : `€${Math.round(total)} awaiting payment`,
      sub: `${pending.length} ${pt ? 'faturas enviadas' : 'invoices sent'}`,
      link: createPageUrl('Invoices')
    });
  }

  const leads = clients.filter(c => c.pipeline_stage === 'lead');
  if (leads.length > 0) alerts.push({
    icon: Users, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',
    label: pt ? `${leads.length} lead(s) para acompanhar` : `${leads.length} lead(s) to follow up`,
    sub: 'CRM Pipeline',
    link: createPageUrl('Clients')
  });

  // Personal payment alerts
  if (overduePayments.length > 0) alerts.push({
    icon: Wallet, color: '#ef4444', bg: 'rgba(239,68,68,0.1)',
    label: pt ? `${overduePayments.length} pagamento${overduePayments.length > 1 ? 's' : ''} pessoal${overduePayments.length > 1 ? 'is' : ''} em atraso` : `${overduePayments.length} personal payment${overduePayments.length > 1 ? 's' : ''} overdue`,
    sub: overduePayments.map(p => p.name).join(', '),
    link: createPageUrl('Financials')
  });

  if (paymentsDueToday.length > 0) alerts.push({
    icon: Wallet, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
    label: pt ? `${paymentsDueToday.map(p => p.name).join(', ')} — hoje` : `${paymentsDueToday.map(p => p.name).join(', ')} — due today`,
    sub: pt ? '💰 Pagamento pessoal' : '💰 Personal payment',
    link: createPageUrl('Financials')
  });

  if (paymentsDueSoon.length > 0) {
    const weekTotal = paymentsDueSoon.reduce((s, p) => s + (p.amount || 0), 0);
    alerts.push({
      icon: Wallet, color: '#22d3ee', bg: 'rgba(34,211,238,0.08)',
      label: pt
        ? `${paymentsDueSoon.length} pagamento${paymentsDueSoon.length > 1 ? 's' : ''} pessoal${paymentsDueSoon.length > 1 ? 'is' : ''} esta semana`
        : `${paymentsDueSoon.length} personal payment${paymentsDueSoon.length > 1 ? 's' : ''} this week`,
      sub: pt ? `€${Math.round(weekTotal)} a pagar` : `€${Math.round(weekTotal)} due`,
      link: createPageUrl('Financials')
    });
  }

  return (
    <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: '#e97c3f' }} />
          <CardTitle className="text-sm font-semibold text-foreground">
            {pt ? 'Alertas do Negócio' : 'Business Alerts'}
          </CardTitle>
          {alerts.length > 0 && (
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-foreground" style={{ backgroundColor: '#ef4444' }}>
              {alerts.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-1.5">
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-emerald-400 text-sm font-medium">{pt ? 'Tudo em ordem!' : 'All clear!'}</p>
            <p className="text-blue-400 text-xs mt-0.5">{pt ? 'Sem alertas pendentes' : 'No pending alerts'}</p>
          </div>
        ) : alerts.map((a, i) => {
          const Icon = a.icon;
          return (
            <Link to={a.link} key={i}>
              <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-all group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: a.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-xs font-medium truncate">{a.label}</p>
                  <p className="text-blue-400 text-[10px]">{a.sub}</p>
                </div>
                <ChevronRight className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}