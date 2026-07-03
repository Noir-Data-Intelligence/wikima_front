import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { differenceInDays } from 'date-fns';

/**
 * Shared hook — fetches active recurring payments and classifies them.
 * Used by Dashboard, Agenda, DashboardAlerts, and Financials.
 */
export function usePersonalPayments() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['recurring-payments-shared'],
    queryFn: async () => {
      const u = await api.auth.me();
      const wsId = u.current_workspace_id || u.default_workspace_id;
      if (!wsId) return [];
      return api.entities.RecurringPayment.filter({ workspace_id: wsId, status: 'active' }, 'next_due_date');
    },
    staleTime: 1000 * 60 * 2 // 2 min cache
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const classified = payments.map(p => {
    const daysUntil = p.next_due_date ? differenceInDays(new Date(p.next_due_date), new Date(todayStr)) : null;
    let urgency = 'upcoming'; // green
    if (daysUntil === null) urgency = 'upcoming';
    else if (daysUntil < 0) urgency = 'overdue';     // red
    else if (daysUntil <= 3) urgency = 'soon';        // yellow
    else urgency = 'upcoming';                         // green
    return { ...p, daysUntil, urgency };
  });

  const overdue = classified.filter(p => p.urgency === 'overdue');
  const dueToday = classified.filter(p => p.daysUntil === 0);
  const dueSoon = classified.filter(p => p.urgency === 'soon' && p.daysUntil > 0); // 1-3 days
  const upcoming7 = classified.filter(p => p.daysUntil !== null && p.daysUntil > 3 && p.daysUntil <= 7);

  return { payments: classified, overdue, dueToday, dueSoon, upcoming7, isLoading };
}