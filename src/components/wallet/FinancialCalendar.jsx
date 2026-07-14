import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';

const CAT_COLORS = {
  rent: 'bg-orange-500/80',
  utilities: 'bg-yellow-500/80',
  subscriptions: 'bg-purple-500/80',
  internet: 'bg-blue-500/80',
  school: 'bg-primary/80',
  insurance: 'bg-teal-500/80',
  loan: 'bg-red-500/80',
  taxes: 'bg-red-600/80',
  food: 'bg-green-500/80',
  transport: 'bg-sky-500/80',
  health: 'bg-pink-500/80',
  entertainment: 'bg-violet-500/80',
  other: 'bg-slate-500/80'
};

export default function FinancialCalendar({ payments = [], language }) {
  const [viewDate, setViewDate] = useState(new Date());
  const locale = language === 'pt' ? ptBR : enUS;

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start
  const startPad = getDay(monthStart); // 0=Sun
  const padDays = Array(startPad).fill(null);

  const getPaymentsForDay = (day) =>
    payments.filter(p => {
      if (!p.next_due_date) return false;
      return isSameDay(new Date(p.next_due_date), day);
    });

  const today = new Date();

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-foreground capitalize">
          {format(viewDate, 'MMMM yyyy', { locale })}
        </span>
        <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {(language === 'pt' ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px">
        {padDays.map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dayPayments = getPaymentsForDay(day);
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toString()} className={`min-h-[52px] rounded-lg p-1 transition-colors ${isToday ? 'bg-primary/15 border border-primary/30' : 'hover:bg-accent'}`}>
              <p className={`text-xs text-center mb-1 font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </p>
              <div className="flex flex-col gap-0.5">
                {dayPayments.slice(0, 2).map(p => (
                  <div key={p.id} className={`text-[9px] px-1 py-0.5 rounded truncate text-foreground/90 font-medium ${CAT_COLORS[p.category] || CAT_COLORS.other}`}>
                    {p.name}
                  </div>
                ))}
                {dayPayments.length > 2 && (
                  <div className="text-[9px] text-muted-foreground text-center">+{dayPayments.length - 2}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {payments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-border">
          {[...new Set(payments.map(p => p.category))].map(cat => (
            <div key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${CAT_COLORS[cat] || CAT_COLORS.other}`} />
              {cat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}