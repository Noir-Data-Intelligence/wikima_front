import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, Users, CheckSquare, ChevronRight, Bell } from 'lucide-react';

export default function ExecAlerts({ invoices, tasks, clients, language }) {
  const pt = language === 'pt';
  const now = new Date();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const alerts = [];

  // Overdue invoices
  const overdueInvoices = invoices.filter(i => {
    if (i.status === 'paid' || i.status === 'cancelled') return false;
    if (!i.due_date) return false;
    return new Date(i.due_date) < now;
  });
  if (overdueInvoices.length > 0) {
    alerts.push({
      icon: AlertCircle,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      label: pt ? `${overdueInvoices.length} fatura(s) em atraso` : `${overdueInvoices.length} overdue invoice(s)`,
      sub: pt ? 'Requer ação imediata' : 'Requires immediate action',
      link: createPageUrl('Invoices'),
      severity: 'high'
    });
  }

  // Overdue tasks
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    if (!t.deadline) return false;
    return new Date(t.deadline) < today;
  });
  if (overdueTasks.length > 0) {
    alerts.push({
      icon: CheckSquare,
      color: '#f97316',
      bg: 'rgba(249,115,22,0.1)',
      label: pt ? `${overdueTasks.length} tarefa(s) atrasada(s)` : `${overdueTasks.length} overdue task(s)`,
      sub: pt ? 'Prazo ultrapassado' : 'Deadline passed',
      link: createPageUrl('Tasks'),
      severity: 'medium'
    });
  }

  // Tasks due today
  const tasksDueToday = tasks.filter(t => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    if (!t.deadline) return false;
    const d = new Date(t.deadline); d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  });
  if (tasksDueToday.length > 0) {
    alerts.push({
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      label: pt ? `${tasksDueToday.length} tarefa(s) para hoje` : `${tasksDueToday.length} task(s) due today`,
      sub: pt ? 'Prazo hoje' : 'Due today',
      link: createPageUrl('Tasks'),
      severity: 'low'
    });
  }

  // Pending invoice amount
  const pendingInvoices = invoices.filter(i => i.status === 'sent');
  if (pendingInvoices.length > 0) {
    const total = pendingInvoices.reduce((s, i) => s + (i.total || 0), 0);
    alerts.push({
      icon: Clock,
      color: '#22d3ee',
      bg: 'rgba(34,211,238,0.1)',
      label: pt ? `€${total.toFixed(0)} por receber` : `€${total.toFixed(0)} awaiting payment`,
      sub: `${pendingInvoices.length} ${pt ? 'faturas enviadas' : 'invoices sent'}`,
      link: createPageUrl('Invoices'),
      severity: 'info'
    });
  }

  // Leads (clients in lead stage)
  const leads = clients.filter(c => c.pipeline_stage === 'lead');
  if (leads.length > 0) {
    alerts.push({
      icon: Users,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
      label: pt ? `${leads.length} lead(s) sem seguimento` : `${leads.length} lead(s) to follow up`,
      sub: pt ? 'Pipeline CRM' : 'CRM Pipeline',
      link: createPageUrl('Clients'),
      severity: 'info'
    });
  }

  return (
    <Card className="h-full" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: '#e97c3f' }} />
          <CardTitle className="text-base font-semibold text-foreground">
            {pt ? 'Alertas Operacionais' : 'Operational Alerts'}
          </CardTitle>
          {alerts.length > 0 && (
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-foreground" style={{ backgroundColor: '#ef4444' }}>
              {alerts.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-emerald-400 text-sm font-medium">{pt ? 'Tudo em ordem!' : 'All clear!'}</p>
            <p className="text-blue-400 text-xs mt-1">{pt ? 'Sem alertas pendentes' : 'No pending alerts'}</p>
          </div>
        ) : (
          alerts.map((a, i) => {
            const Icon = a.icon;
            return (
              <Link to={a.link} key={i}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-all group cursor-pointer">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.bg }}>
                    <Icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-xs font-medium truncate">{a.label}</p>
                    <p className="text-blue-400 text-xs">{a.sub}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}