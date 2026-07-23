import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useLanguage } from '../components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import EventDialog from '../components/agenda/EventDialog';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, CheckSquare, Wallet, FolderOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePersonalPayments } from '../hooks/usePersonalPayments';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns';
import { pt as ptLocale } from 'date-fns/locale/pt';
import { enUS } from 'date-fns/locale/en-US';
import { toast } from 'sonner';

export default function Agenda() {
  const { language } = useLanguage();
  const pt = language === 'pt';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isCompany, setIsCompany] = useState(false);
  const [filterProject, setFilterProject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await api.auth.me();
      const workspace = await api.entities.Workspace.filter({ owner_email: user.email });
      if (workspace.length > 0) {
        const ws = workspace[0];
        const company = ws.type === 'company';
        setIsCompany(company);

        const fetches = [
          api.entities.AgendaEvent.filter({ workspace_id: ws.id }),
          api.entities.Task.filter({ workspace_id: ws.id }),
        ];
        if (company) fetches.push(api.entities.Project.filter({ workspace_id: ws.id }));

        const [eventsList, tasksList, projectsList] = await Promise.all(fetches);
        setEvents(eventsList);
        setTasks(tasksList.filter(t => t.deadline && t.status !== 'completed' && t.status !== 'cancelled'));
        if (company) setProjects(projectsList || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(pt ? 'Erro ao carregar agenda' : 'Error loading agenda');
    } finally {
      setLoading(false);
    }
  };

  const handleNewEvent = (date = null) => {
    setSelectedEvent(null);
    setSelectedDate(date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    setShowEventDialog(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const { payments: personalPayments } = usePersonalPayments();

  const filteredEvents = filterProject === 'all' ? events : events.filter(e => e.project_id === filterProject);
  const getEventsForDate = (date) => filteredEvents.filter(e => isSameDay(parseISO(e.date), date));
  const getTasksForDate = (date) => tasks.filter(t => t.deadline && isSameDay(parseISO(t.deadline.slice(0, 10)), date));
  const getPaymentsForDate = (date) => personalPayments.filter(p => p.next_due_date && isSameDay(parseISO(p.next_due_date), date));

  const priorityDot = { urgent: 'bg-red-400', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-slate-400' };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = language === 'pt'
      ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day) => (
            <div key={day} className="py-1.5 text-center text-xs font-medium text-primary uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            const dayTasks = getTasksForDate(day);
            const dayPayments = getPaymentsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            const total = dayEvents.length + dayTasks.length + dayPayments.length;

            return (
              <div
                key={day.toString()}
                className={`min-h-[62px] p-1.5 transition-colors cursor-pointer group
                  ${!isCurrentMonth ? 'bg-background/60' : 'bg-card'}
                  hover:bg-background`}
                onClick={() => handleNewEvent(day)}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-primary text-foreground' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  {total > 2 && (
                    <span className="text-[9px] text-muted-foreground">{total}</span>
                  )}
                </div>
                {/* Items */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                      className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight bg-primary/20 text-primary hover:bg-primary/90/30 truncate"
                    >
                      <Clock className="w-2 h-2 shrink-0" />
                      <span className="truncate">{event.start_time} {event.title}</span>
                    </div>
                  ))}
                  {dayTasks.slice(0, dayEvents.length >= 2 ? 0 : 2 - dayEvents.length).map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight bg-orange-500/15 text-orange-300 truncate"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot[task.priority] || 'bg-slate-400'}`} />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayPayments.slice(0, Math.max(0, 2 - dayEvents.length - dayTasks.length)).map((pay) => {
                    const urgencyColor = pay.urgency === 'overdue' ? 'bg-red-500/20 text-red-300' : pay.urgency === 'soon' ? 'bg-yellow-500/15 text-yellow-300' : 'bg-emerald-500/15 text-emerald-300';
                    return (
                      <div key={pay.id} onClick={(e) => e.stopPropagation()} className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight truncate ${urgencyColor}`}>
                        <Wallet className="w-2 h-2 shrink-0" />
                        <span className="truncate">{pay.name}</span>
                      </div>
                    );
                  })}
                  {total > 2 && (
                    <div className="text-[9px] text-muted-foreground px-1">
                      +{total - 2} {language === 'pt' ? 'mais' : 'more'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-border border-b border-border">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toString()} className="py-2 px-1 text-center">
                <div className={`text-[10px] uppercase tracking-wide ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {format(day, 'EEE', { locale: language === 'pt' ? ptLocale : enUS })}
                </div>
                <div className={`text-base font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 divide-x divide-border">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const dayTasks = getTasksForDate(day);
            const dayPayments = getPaymentsForDate(day);
            return (
              <div
                key={day.toString()}
                className="min-h-[160px] p-1.5 space-y-1 cursor-pointer hover:bg-background transition-colors"
                onClick={() => handleNewEvent(day)}
              >
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                    className="bg-primary/20 border border-primary/30 rounded p-1.5 hover:bg-primary/90/30 transition-colors"
                  >
                    <div className="text-xs font-medium text-primary truncate">{event.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{event.start_time} - {event.end_time}</div>
                  </div>
                ))}
                {dayTasks.map((task) => (
                  <div key={task.id} onClick={(e) => e.stopPropagation()} className="bg-orange-500/15 border border-orange-500/20 rounded p-1.5">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot[task.priority] || 'bg-slate-400'}`} />
                      <div className="text-xs font-medium text-orange-300 truncate">{task.title}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 ml-2.5">{language === 'pt' ? 'Prazo' : 'Deadline'}</div>
                  </div>
                ))}
                {dayPayments.map((pay) => {
                  const urgencyClass = pay.urgency === 'overdue' ? 'bg-red-500/15 border-red-500/25 text-red-300' : pay.urgency === 'soon' ? 'bg-yellow-500/15 border-yellow-500/20 text-yellow-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
                  return (
                    <div key={pay.id} onClick={(e) => e.stopPropagation()} className={`border rounded p-1.5 ${urgencyClass}`}>
                      <div className="flex items-center gap-1">
                        <Wallet className="w-2.5 h-2.5 shrink-0" />
                        <div className="text-xs font-medium truncate">{pay.name}</div>
                      </div>
                      <div className="text-[10px] opacity-60 mt-0.5 ml-3.5">€{(pay.amount || 0).toFixed(0)}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const dayTasks = getTasksForDate(currentDate);
    const dayPayments = getPaymentsForDate(currentDate);

    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-base font-semibold text-foreground mb-3">
          {format(currentDate, 'EEEE, d MMMM yyyy', { locale: language === 'pt' ? ptLocale : enUS })}
        </h3>

        {dayEvents.length === 0 && dayTasks.length === 0 && dayPayments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {language === 'pt' ? 'Nenhum evento ou prazo hoje' : 'No events or deadlines today'}
            </p>
            <Button onClick={() => handleNewEvent(currentDate)} className="mt-3 h-8 text-xs" variant="outline">
              <Plus className="w-3 h-3 mr-1" />
              {language === 'pt' ? 'Criar Evento' : 'Create Event'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {dayTasks.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  {language === 'pt' ? 'Prazos de Tarefas' : 'Task Deadlines'}
                </div>
                {dayTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-orange-500/10 border border-orange-500/20 mb-1">
                    <CheckSquare className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="text-sm text-orange-300 font-medium truncate">{task.title}</span>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-muted text-muted-foreground'}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {dayPayments.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  {language === 'pt' ? 'Pagamentos Pessoais' : 'Personal Payments'}
                </div>
                {dayPayments.map((pay) => {
                  const urgencyClass = pay.urgency === 'overdue' ? 'border-red-500/30 bg-red-500/10' : pay.urgency === 'soon' ? 'border-yellow-500/25 bg-yellow-500/8' : 'border-emerald-500/20 bg-emerald-500/8';
                  const textColor = pay.urgency === 'overdue' ? 'text-red-300' : pay.urgency === 'soon' ? 'text-yellow-300' : 'text-emerald-300';
                  return (
                    <div key={pay.id} className={`flex items-center gap-3 p-2.5 rounded-lg border mb-1 ${urgencyClass}`}>
                      <Wallet className={`w-3.5 h-3.5 shrink-0 ${textColor}`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${textColor}`}>{pay.name}</p>
                        <p className="text-xs text-muted-foreground">{pay.urgency === 'overdue' ? (language === 'pt' ? 'Em atraso' : 'Overdue') : (language === 'pt' ? 'Para hoje' : 'Due today')}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">€{(pay.amount || 0).toFixed(0)}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {dayEvents.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  {language === 'pt' ? 'Eventos' : 'Events'}
                </div>
                {dayEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="p-3 mb-1 bg-background border-primary/20 hover:border-primary/40 cursor-pointer transition-colors"
                    onClick={() => handleEditEvent(event)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">{event.title}</h4>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.start_time} - {event.end_time}</span>
                          {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                          {event.client_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{event.client_name}</span>}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        
        
        <div className="p-4 lg:pt-8 md:p-8 md:pt-8 flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground text-sm">
            {language === 'pt' ? 'A carregar...' : 'Loading...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      
      

      <div className="p-4 lg:pt-8 md:p-8 md:pt-8 flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto space-y-2.5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">{language === 'pt' ? 'Agenda' : 'Agenda'}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'pt' ? 'Eventos, prazos e tarefas agendadas' : 'Events, deadlines & scheduled tasks'}
                </p>
              </div>
              <Button onClick={() => handleNewEvent()} className="bg-primary hover:bg-primary/90 h-8 text-xs px-3 gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                {language === 'pt' ? 'Novo Evento' : 'New Event'}
              </Button>
            </div>

            {/* Project filter — company only */}
            {isCompany && projects.length > 0 && (
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-44 h-7 bg-card border-border text-muted-foreground text-xs">
                    <SelectValue placeholder={pt ? 'Todos os Projetos' : 'All Projects'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{pt ? 'Todos os Projetos' : 'All Projects'}</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Controls bar */}
            <div className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border">
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                  onClick={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : addDays(currentDate, view === 'week' ? -7 : -1))}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2"
                  onClick={() => setCurrentDate(new Date())}>
                  {language === 'pt' ? 'Hoje' : 'Today'}
                </Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                  onClick={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, view === 'week' ? 7 : 1))}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <span className="ml-2 text-sm font-semibold text-foreground">
                  {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: language === 'pt' ? ptLocale : enUS })}
                  {view === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: language === 'pt' ? ptLocale : enUS })} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: language === 'pt' ? ptLocale : enUS })}`}
                  {view === 'day' && format(currentDate, 'd MMM yyyy', { locale: language === 'pt' ? ptLocale : enUS })}
                </span>
              </div>
              <div className="flex gap-1">
                {['day', 'week', 'month'].map((v) => (
                  <Button key={v} variant={view === v ? 'default' : 'ghost'} size="sm"
                    className={`h-7 text-xs px-2.5 ${view === v ? 'bg-primary hover:bg-primary/90' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setView(v)}>
                    {v === 'day' ? (language === 'pt' ? 'Dia' : 'Day') : v === 'week' ? (language === 'pt' ? 'Semana' : 'Week') : (language === 'pt' ? 'Mês' : 'Month')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary/40" />{language === 'pt' ? 'Evento' : 'Event'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-500/40" />{language === 'pt' ? 'Prazo de tarefa' : 'Task deadline'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/40" />{language === 'pt' ? 'Pagamento (ok)' : 'Payment (ok)'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-500/40" />{language === 'pt' ? 'Pagamento próximo' : 'Payment soon'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500/40" />{language === 'pt' ? 'Pagamento em atraso' : 'Payment overdue'}</span>
            </div>

            {/* Calendar View */}
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
        </div>
      </div>

      <EventDialog
        open={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        onSuccess={loadData}
        event={selectedEvent}
        selectedDate={selectedDate}
        projects={projects}
        isCompany={isCompany}
      />
    </div>
  );
}