import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, User, ChevronRight, Plus } from 'lucide-react';

export default function DashboardTodayAgenda({ events, tasks, language }) {
  const pt = language === 'pt';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Today's agenda events
  const todayEvents = events
    .filter(e => e.date === todayStr && e.status !== 'cancelled')
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  // Tasks due today
  const tasksDueToday = tasks.filter(t => {
    if (['completed', 'cancelled'].includes(t.status)) return false;
    if (!t.deadline) return false;
    const d = new Date(t.deadline);
    d.setHours(0, 0, 0, 0);
    const todayMid = new Date(today); todayMid.setHours(0, 0, 0, 0);
    return d.getTime() === todayMid.getTime();
  });

  const isEmpty = todayEvents.length === 0 && tasksDueToday.length === 0;

  const priorityColor = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };

  return (
    <Card style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: '#e97c3f' }} />
            <CardTitle className="text-sm font-semibold text-foreground">
              {pt ? 'Agenda de Hoje' : "Today's Schedule"}
            </CardTitle>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold text-blue-300 bg-blue-500/10">
              {today.toLocaleDateString(pt ? 'pt-PT' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <Link to={createPageUrl('Agenda')} className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-foreground transition-colors">
            <Plus className="w-3 h-3" />
            {pt ? 'Adicionar' : 'Add'}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-2">
        {isEmpty ? (
          <div className="text-center py-5">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-blue-300 text-xs">{pt ? 'Sem eventos hoje' : 'No events today'}</p>
            <Link to={createPageUrl('Agenda')}>
              <p className="text-[11px] text-blue-500 hover:text-blue-300 mt-1 transition-colors">
                {pt ? 'Ir para a Agenda →' : 'Go to Agenda →'}
              </p>
            </Link>
          </div>
        ) : (
          <>
            {todayEvents.map((ev, i) => (
              <Link to={createPageUrl('Agenda')} key={ev.id || i}>
                <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-all group">
                  <div className="flex-shrink-0 text-center min-w-[40px]">
                    <div className="text-[11px] font-bold text-primary">{ev.start_time}</div>
                    {ev.end_time && <div className="text-[9px] text-blue-400">{ev.end_time}</div>}
                  </div>
                  <div className="w-px self-stretch bg-primary/30 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-xs font-medium truncate group-hover:text-primary transition-colors">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {ev.client_name && (
                        <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
                          <User className="w-2.5 h-2.5" />{ev.client_name}
                        </span>
                      )}
                      {ev.location && (
                        <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
                          <MapPin className="w-2.5 h-2.5" />{ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                </div>
              </Link>
            ))}
            {tasksDueToday.map((task, i) => (
              <Link to={createPageUrl('Tasks')} key={task.id || i}>
                <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-all group">
                  <div className="flex-shrink-0 min-w-[40px]">
                    <div className="text-[10px] font-bold px-1.5 py-0.5 rounded text-center" style={{ backgroundColor: `${priorityColor[task.priority] || '#f59e0b'}20`, color: priorityColor[task.priority] || '#f59e0b' }}>
                      {pt ? 'Tarefa' : 'Task'}
                    </div>
                  </div>
                  <div className="w-px self-stretch bg-amber-500/30 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-xs font-medium truncate group-hover:text-amber-300 transition-colors">{task.title}</p>
                    {task.client_name && (
                      <span className="flex items-center gap-0.5 text-[10px] text-blue-400 mt-0.5">
                        <User className="w-2.5 h-2.5" />{task.client_name}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                </div>
              </Link>
            ))}
          </>
        )}
        {!isEmpty && (
          <Link to={createPageUrl('Agenda')}>
            <div className="text-center pt-1">
              <span className="text-[11px] text-blue-500 hover:text-blue-300 transition-colors">
                {pt ? 'Ver agenda completa →' : 'View full agenda →'}
              </span>
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}