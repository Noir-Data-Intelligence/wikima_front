import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Receipt, Users, FileText, Calendar, Activity, Clock } from 'lucide-react';

function timeAgo(date, pt) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return pt ? 'Agora mesmo' : 'Just now';
  if (mins < 60) return pt ? `${mins}m atrás` : `${mins}m ago`;
  if (hrs < 24) return pt ? `${hrs}h atrás` : `${hrs}h ago`;
  if (days === 1) return pt ? 'Ontem' : 'Yesterday';
  return pt ? `${days}d atrás` : `${days}d ago`;
}

export default function DashboardActivityFeed({ tasks, invoices, clients, documents, events, language }) {
  const pt = language === 'pt';

  const allItems = [
    ...tasks.slice(0, 5).map(t => ({
      icon: CheckSquare, color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',
      label: pt ? 'Tarefa criada' : 'Task created',
      name: t.title,
      sub: t.client_name ? `${t.client_name}` : (t.assigned_to_name || ''),
      date: t.created_date,
      link: createPageUrl('Tasks')
    })),
    ...invoices.slice(0, 5).map(i => ({
      icon: Receipt, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
      label: i.status === 'paid' ? (pt ? 'Fatura paga' : 'Invoice paid') : (pt ? 'Fatura criada' : 'Invoice created'),
      name: i.client_name,
      sub: `€${(i.total || 0).toLocaleString()}`,
      date: i.paid_date || i.created_date,
      link: createPageUrl('Invoices')
    })),
    ...clients.slice(0, 5).map(c => ({
      icon: Users, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',
      label: pt ? 'Cliente adicionado' : 'Client added',
      name: c.name,
      sub: c.company || c.pipeline_stage || '',
      date: c.created_date,
      link: createPageUrl('Clients')
    })),
    ...documents.slice(0, 3).map(d => ({
      icon: FileText, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',
      label: pt ? 'Documento carregado' : 'Document uploaded',
      name: d.title,
      sub: d.client_name || d.category || '',
      date: d.created_date,
      link: createPageUrl('Documents')
    })),
    ...events.slice(0, 3).map(e => ({
      icon: Calendar, color: '#34d399', bg: 'rgba(52,211,153,0.1)',
      label: pt ? 'Evento agendado' : 'Event scheduled',
      name: e.title,
      sub: `${e.date}${e.start_time ? ' ' + e.start_time : ''}`,
      date: e.created_date,
      link: createPageUrl('Agenda')
    })),
  ]
    .filter(item => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  return (
    <Card style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: '#e97c3f' }} />
          <CardTitle className="text-sm font-semibold text-foreground">
            {pt ? 'Atividade Recente' : 'Recent Activity'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {allItems.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-blue-300 text-xs">{pt ? 'A sua atividade aparecerá aqui' : 'Your activity will appear here'}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {allItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link to={item.link} key={idx}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-all group">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-foreground text-xs font-medium truncate group-hover:text-blue-300 transition-colors">{item.name}</p>
                      </div>
                      <p className="text-blue-400 text-[10px] truncate">{item.label}{item.sub ? ` · ${item.sub}` : ''}</p>
                    </div>
                    <span className="text-[10px] text-blue-500 flex-shrink-0 whitespace-nowrap">{timeAgo(item.date, pt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}