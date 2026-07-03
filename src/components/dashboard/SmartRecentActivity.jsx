import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, CheckSquare, Receipt, FileText, UserCheck, Package, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt as ptLocale } from 'date-fns/locale/pt';
import { enGB } from 'date-fns/locale/en-GB';
import CompanyOnboardingCards from './CompanyOnboardingCards';

export default function SmartRecentActivity({ tasks, clients, invoices, documents, agendaEvents, language, isCompany = false }) {
  const pt = language === 'pt';
  const locale = pt ? ptLocale : enGB;

  const fmt = (dateStr) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale });
    } catch { return ''; }
  };

  // Collect recent activity items from multiple entity types
  const items = [
    ...clients.slice(0, 5).map(c => ({
      icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10',
      label: `${c.name}`,
      sub: pt ? 'Novo cliente adicionado' : 'New client added',
      date: c.created_date, to: 'Clients'
    })),
    ...tasks.filter(t => t.status === 'completed').slice(0, 5).map(t => ({
      icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10',
      label: t.title,
      sub: pt ? 'Tarefa concluída' : 'Task completed',
      date: t.completed_date || t.updated_date, to: 'Tasks'
    })),
    ...invoices.filter(i => i.status !== 'draft').slice(0, 5).map(i => ({
      icon: Receipt, color: 'text-amber-400', bg: 'bg-amber-500/10',
      label: `${i.client_name} — €${(i.total || 0).toFixed(0)}`,
      sub: pt ? 'Fatura emitida' : 'Invoice issued',
      date: i.created_date, to: 'Invoices'
    })),
    ...documents.slice(0, 5).map(d => ({
      icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10',
      label: d.title || d.name || (pt ? 'Documento' : 'Document'),
      sub: pt ? 'Documento carregado' : 'Document uploaded',
      date: d.created_date, to: 'Documents'
    })),
    ...agendaEvents.filter(e => e.status === 'completed').slice(0, 3).map(e => ({
      icon: Calendar, color: 'text-primary', bg: 'bg-primary/10',
      label: e.title,
      sub: pt ? 'Reunião concluída' : 'Meeting completed',
      date: e.updated_date || e.created_date, to: 'Agenda'
    })),
  ]
    .filter(i => !!i.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  if (items.length === 0) {
    if (isCompany) {
      return (
        <div className="py-2">
          <CompanyOnboardingCards language={language} />
        </div>
      );
    }
    return (
      <div className="text-center py-4 text-muted-foreground text-xs">
        {pt ? 'Sem actividade recente.' : 'No recent activity yet.'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Link key={idx} to={createPageUrl(item.to)} className="block group">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-accent/50">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/85 truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">{fmt(item.date)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}