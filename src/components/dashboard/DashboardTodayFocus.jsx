import { Link } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, Clock
} from 'lucide-react';

// ─── Urgency state ─────────────────────────────────────────────────────────────
// RED  → overdue items exist
// YELLOW → upcoming deadlines / soon-due items
// GREEN → all caught up
function getUrgencyState(overdueTasks, overdueInvoices, overduePayments, hasUpcoming) {
  if (overdueTasks.length > 0 || overdueInvoices.length > 0 || overduePayments.length > 0) return 'red';
  if (hasUpcoming) return 'yellow';
  return 'green';
}

const URGENCY_STYLES = {
  red:    { border: 'border-red-500/25',    bg: 'bg-red-500/6',    dot: 'bg-red-400',    label: '' },
  yellow: { border: 'border-yellow-500/20', bg: 'bg-yellow-500/5', dot: 'bg-yellow-400', label: '' },
  green:  { border: 'border-emerald-500/20',bg: 'bg-emerald-500/5',dot: 'bg-emerald-400',label: '' },
};

export default function DashboardTodayFocus({
  todayFocusItems = [],
  upcomingItems = [],
  overdueTasks = [],
  overdueInvoices = [],
  overduePayments = [],
  language = 'en'
}) {
  const pt = language === 'pt';
  const allCaughtUp = todayFocusItems.length === 0;
  const urgency = getUrgencyState(overdueTasks, overdueInvoices, overduePayments, upcomingItems.length > 0);
  const us = URGENCY_STYLES[urgency];

  return (
    <div className="mb-6">

      {/* ── Section header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${us.dot}`} />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {pt ? 'Foco de Hoje' : "Today's Focus"}
        </h2>
        {!allCaughtUp && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {todayFocusItems.length} {pt ? 'item' : 'item'}{todayFocusItems.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── All caught up ────────────────────────────────────────────── */}
      {allCaughtUp ? (
        <div className={`rounded-xl border ${us.border} ${us.bg} px-4 py-3 flex items-center gap-3`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-emerald-300 font-medium">
              {pt ? 'Está tudo em dia.' : "You're all caught up."}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {pt ? 'Bom trabalho — planeie os próximos passos.' : 'Great work — plan your next steps.'}
            </p>
          </div>
        </div>
      ) : (
        /* ── Focus list ──────────────────────────────────────────────── */
        <div className={`rounded-xl border ${us.border} bg-card overflow-hidden`}>
          {todayFocusItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors group ${
                  i < todayFocusItems.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{item.label}</p>
                  {item.meta && <p className="text-[11px] text-muted-foreground truncate">{item.meta}</p>}
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-muted-foreground transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Upcoming section ─────────────────────────────────────────── */}
      {upcomingItems.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              {pt ? 'Em Breve' : 'Upcoming'}
            </h3>
          </div>
          <div className="space-y-1">
            {upcomingItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/4 transition-colors group"
                >
                  <Icon className={`w-3 h-3 flex-shrink-0 ${item.color}`} />
                  <span className="text-xs text-foreground/55 truncate flex-1">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.when}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}