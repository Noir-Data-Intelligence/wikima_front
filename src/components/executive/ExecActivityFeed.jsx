import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Receipt, Users, Activity } from 'lucide-react';

export default function ExecActivityFeed({ tasks, invoices, clients, language }) {
  const pt = language === 'pt';

  const events = [
    ...tasks.slice(0, 4).map(t => ({
      type: 'task',
      icon: CheckSquare,
      color: '#22d3ee',
      bg: 'rgba(34,211,238,0.1)',
      title: pt ? 'Tarefa criada' : 'Task created',
      name: t.title,
      date: new Date(t.created_date)
    })),
    ...invoices.slice(0, 4).map(i => ({
      type: 'invoice',
      icon: Receipt,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      title: i.status === 'paid' ? (pt ? 'Fatura paga' : 'Invoice paid') : (pt ? 'Fatura criada' : 'Invoice created'),
      name: `${i.client_name} · €${(i.total || 0).toFixed(0)}`,
      date: new Date(i.created_date)
    })),
    ...clients.slice(0, 3).map(c => ({
      type: 'client',
      icon: Users,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
      title: pt ? 'Cliente adicionado' : 'Client added',
      name: c.name,
      date: new Date(c.created_date)
    }))
  ]
    .sort((a, b) => b.date - a.date)
    .slice(0, 7);

  const formatDate = (d) => {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000 / 60);
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  return (
    <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: '#e97c3f' }} />
          <CardTitle className="text-base font-semibold text-foreground">
            {pt ? 'Atividade Recente' : 'Recent Activity'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-10 h-10 text-blue-400/40 mx-auto mb-2" />
            <p className="text-blue-300 text-sm">{pt ? 'Sem atividade recente' : 'No recent activity'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((e, i) => {
              const Icon = e.icon;
              return (
                <div key={i} className="flex items-start gap-3 relative">
                  {i < events.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-muted" />
                  )}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10" style={{ backgroundColor: e.bg }}>
                    <Icon className="w-4 h-4" style={{ color: e.color }} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-foreground text-xs font-medium">{e.title}</p>
                      <span className="text-[10px] text-blue-400 flex-shrink-0 ml-2">{formatDate(e.date)}</span>
                    </div>
                    <p className="text-blue-300 text-xs mt-0.5 truncate">{e.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}