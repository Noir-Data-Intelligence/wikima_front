import React from 'react';
import { Lightbulb } from 'lucide-react';
import CompanyOnboardingCards from './CompanyOnboardingCards';

export default function SmartInsights({ data, sector, language, isCompany = false }) {
  const pt = language === 'pt';
  const {
    invoices, tasks, products, clients, agendaEvents, teamMembers
  } = data;

  const todayStr = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const insights = [];

  // Overdue invoices
  const overdueInv = invoices.filter(i => i.status === 'overdue');
  if (overdueInv.length > 0) {
    insights.push({
      text: pt
        ? `${overdueInv.length} fatura${overdueInv.length > 1 ? 's estão' : ' está'} em atraso.`
        : `${overdueInv.length} invoice${overdueInv.length > 1 ? 's are' : ' is'} overdue.`,
      color: 'text-red-400', dot: 'bg-red-400'
    });
  }

  // Tasks due this week
  const tasksDueWeek = tasks.filter(t => t.deadline && t.deadline.split('T')[0] >= todayStr && t.deadline.split('T')[0] <= weekEndStr && !['completed','cancelled'].includes(t.status));
  if (tasksDueWeek.length > 0) {
    insights.push({
      text: pt
        ? `${tasksDueWeek.length} tarefa${tasksDueWeek.length > 1 ? 's vencem' : ' vence'} esta semana.`
        : `${tasksDueWeek.length} task${tasksDueWeek.length > 1 ? 's are' : ' is'} due this week.`,
      color: 'text-amber-400', dot: 'bg-amber-400'
    });
  }

  // Low stock
  const lowStock = products.filter(p => (p.quantity_available ?? 0) < (p.minimum_stock_level ?? 10) && p.status !== 'discontinued');
  if (lowStock.length > 0) {
    insights.push({
      text: pt
        ? `Stock baixo em ${lowStock.length} produto${lowStock.length > 1 ? 's' : ''}.`
        : `Stock is running low for ${lowStock.length} product${lowStock.length > 1 ? 's' : ''}.`,
      color: 'text-orange-400', dot: 'bg-orange-400'
    });
  }

  // Most active client (most invoices)
  if (invoices.length > 0 && clients.length > 0) {
    const clientCount = {};
    invoices.forEach(i => { if (i.client_name) clientCount[i.client_name] = (clientCount[i.client_name] || 0) + 1; });
    const topClient = Object.entries(clientCount).sort((a, b) => b[1] - a[1])[0];
    if (topClient && topClient[1] > 1) {
      insights.push({
        text: pt
          ? `O seu cliente mais ativo é ${topClient[0]}.`
          : `Your most active client is ${topClient[0]}.`,
        color: 'text-blue-400', dot: 'bg-blue-400'
      });
    }
  }

  // Upcoming meetings this week
  const meetingsThisWeek = agendaEvents.filter(e => e.date >= todayStr && e.date <= weekEndStr && e.status !== 'cancelled');
  if (meetingsThisWeek.length > 0) {
    insights.push({
      text: pt
        ? `Tem ${meetingsThisWeek.length} evento${meetingsThisWeek.length > 1 ? 's' : ''} esta semana.`
        : `You have ${meetingsThisWeek.length} event${meetingsThisWeek.length > 1 ? 's' : ''} this week.`,
      color: 'text-purple-400', dot: 'bg-purple-400'
    });
  }

  // Active clients without recent follow-up
  const staleClients = clients.filter(c => c.status !== 'inactive' && (!c.last_interaction_date || c.last_interaction_date < new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]));
  if (staleClients.length > 2) {
    insights.push({
      text: pt
        ? `${staleClients.length} clientes sem contacto há mais de 30 dias.`
        : `${staleClients.length} clients without contact in over 30 days.`,
      color: 'text-primary', dot: 'bg-primary'
    });
  }

  // No urgent tasks — positive insight
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && !['completed','cancelled'].includes(t.status));
  if (urgentTasks.length === 0 && tasks.length > 0) {
    insights.push({
      text: pt ? 'Sem tarefas urgentes — bom trabalho! 🎉' : 'No urgent tasks — great job! 🎉',
      color: 'text-emerald-400', dot: 'bg-emerald-400'
    });
  }

  // Team member insight
  const activeTeam = teamMembers.filter(m => m.status === 'active');
  if (activeTeam.length > 0 && tasks.length > 0) {
    const assigned = tasks.filter(t => t.assigned_to && !['completed','cancelled'].includes(t.status)).length;
    if (assigned > 0) {
      insights.push({
        text: pt
          ? `${assigned} tarefa${assigned > 1 ? 's atribuídas' : ' atribuída'} à equipa.`
          : `${assigned} task${assigned > 1 ? 's assigned' : ' assigned'} to the team.`,
        color: 'text-indigo-400', dot: 'bg-indigo-400'
      });
    }
  }

  const shown = insights.slice(0, 4);

  if (shown.length === 0) {
    if (isCompany) {
      return (
        <div className="py-2">
          <CompanyOnboardingCards language={language} />
        </div>
      );
    }
    return (
      <p className="text-sm text-muted-foreground py-2">
        {pt ? 'Adiciona dados para ver os teus insights.' : 'Add some data to start seeing insights.'}
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {shown.map((ins, idx) => (
        <li key={idx} className="flex items-start gap-2.5">
          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${ins.dot}`} />
          <span className={`text-sm ${ins.color}`}>{ins.text}</span>
        </li>
      ))}
    </ul>
  );
}