import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckSquare, Calendar, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, isToday, isTomorrow, format } from 'date-fns';
import { pt as ptLocale } from 'date-fns/locale/pt';
import { enGB } from 'date-fns/locale/en-GB';

function when(dateStr, pt) {
  if (!dateStr) return '';
  const locale = pt ? ptLocale : enGB;
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    if (isToday(d)) return pt ? 'hoje' : 'today';
    if (isTomorrow(d)) return pt ? 'amanhã' : 'tomorrow';
    return formatDistanceToNow(d, { addSuffix: true, locale });
  } catch { return ''; }
}

export default function SmartUpcomingSection({ tasks, agendaEvents, language, isCompany = false }) {
  const pt = language === 'pt';
  const todayStr = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const upcomingTasks = tasks
    .filter(t => !['completed','cancelled'].includes(t.status) && t.deadline)
    .filter(t => t.deadline.split('T')[0] >= todayStr && t.deadline.split('T')[0] <= weekEndStr)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  const upcomingMeetings = agendaEvents
    .filter(e => e.status !== 'cancelled' && e.date >= todayStr && e.date <= weekEndStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 5);

  const overdueTasks = tasks
    .filter(t => !['completed','cancelled'].includes(t.status) && t.deadline)
    .filter(t => t.deadline.split('T')[0] < todayStr)
    .slice(0, 3);

  const isEmpty = upcomingTasks.length === 0 && upcomingMeetings.length === 0 && overdueTasks.length === 0;

  if (isEmpty && isCompany) {
    const pt = language === 'pt';
    return (
      <div className="rounded-xl border p-4 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">
            {pt ? 'Próximos Eventos' : 'Upcoming Events'}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {pt ? 'Comece por adicionar tarefas ou eventos à sua agenda:' : 'Start by adding tasks or events to your calendar:'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/Tasks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary/80 hover:bg-primary/90/15 transition-colors text-xs">
            {pt ? '+ Criar Tarefa' : '+ Create Task'} <ArrowRight className="w-3 h-3" />
          </Link>
          <Link to="/Agenda" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400/80 hover:bg-purple-500/15 transition-colors text-xs">
            {pt ? '+ Agendar Evento' : '+ Schedule Event'} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Upcoming Tasks */}
      <div className="rounded-xl border p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-3">
          <CheckSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground/80">{pt ? 'Tarefas Próximas' : 'Upcoming Tasks'}</h3>
        </div>
        {upcomingTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">{pt ? 'Sem tarefas esta semana.' : 'No tasks this week.'}</p>
        ) : (
          <ul className="space-y-2">
            {upcomingTasks.map(t => (
              <li key={t.id}>
                <Link to={createPageUrl('Tasks')} className="block group">
                  <p className="text-xs text-foreground/75 truncate group-hover:text-foreground transition-colors">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground">{when(t.deadline, pt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upcoming Meetings */}
      <div className="rounded-xl border p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-foreground/80">{pt ? 'Reuniões / Eventos' : 'Meetings / Events'}</h3>
        </div>
        {upcomingMeetings.length === 0 ? (
          <p className="text-xs text-muted-foreground">{pt ? 'Sem eventos esta semana.' : 'No events this week.'}</p>
        ) : (
          <ul className="space-y-2">
            {upcomingMeetings.map(e => (
              <li key={e.id}>
                <Link to={createPageUrl('Agenda')} className="block group">
                  <p className="text-xs text-foreground/75 truncate group-hover:text-foreground transition-colors">{e.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {e.start_time ? `${e.start_time} · ` : ''}{when(e.date, pt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Overdue / Deadlines */}
      <div className="rounded-xl border p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-foreground/80">{pt ? 'Prazos Excedidos' : 'Overdue Deadlines'}</h3>
        </div>
        {overdueTasks.length === 0 ? (
          <p className="text-xs text-emerald-400/70">✓ {pt ? 'Tudo em dia!' : 'All on time!'}</p>
        ) : (
          <ul className="space-y-2">
            {overdueTasks.map(t => (
              <li key={t.id}>
                <Link to={createPageUrl('Tasks')} className="block group">
                  <p className="text-xs text-red-300/80 truncate group-hover:text-red-300 transition-colors">{t.title}</p>
                  <p className="text-[10px] text-red-400/50">{when(t.deadline, pt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}