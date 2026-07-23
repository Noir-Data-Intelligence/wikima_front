import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2, User, Calendar, Briefcase, Tag, X,
  PhoneCall, Send, MessageSquare, Globe,
  Receipt, FileText, CheckSquare, Clock, TrendingUp,
  FolderOpen, Activity, AlertCircle, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';

const STAGE_COLORS = {
  lead:          'bg-slate-500/20 text-muted-foreground border-slate-500/30',
  contacted:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  proposal_sent: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  negotiation:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  won:           'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  active_client: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  lost:          'bg-red-500/20 text-red-300 border-red-500/30',
};

const RELATIONSHIP_LABELS = {
  client:   { pt: 'Cliente',    en: 'Client' },
  lead:     { pt: 'Lead',       en: 'Lead' },
  supplier: { pt: 'Fornecedor', en: 'Supplier' },
  partner:  { pt: 'Parceiro',   en: 'Partner' },
};

const TAG_OPTIONS = ['VIP', 'New', 'High Value', 'Pending', 'Cold', 'Hot Lead', 'Priority'];

function ClientAvatar({ client, size = 'lg' }) {
  const sizeClasses = size === 'lg'
    ? 'w-16 h-16 text-2xl rounded-2xl'
    : 'w-12 h-12 text-lg rounded-xl';

  const initials = client.type === 'company'
    ? (client.company || client.name || '?').substring(0, 2).toUpperCase()
    : (client.name || '?').charAt(0).toUpperCase();

  const avatarUrl = client.logo_url || client.photo_url || client.avatar_url;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={client.name}
        className={`${sizeClasses} object-cover flex-shrink-0 border border-border`}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
    );
  }

  return (
    <div className={`${sizeClasses} bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center flex-shrink-0 border border-primary/20 font-bold text-primary`}>
      {initials}
    </div>
  );
}

export default function CompanyClientSummary({
  client, tasks, invoices, receipts, documents, services,
  pt, clientId, onAddTag, onRemoveTag
}) {
  const locale = pt ? ptBR : enUS;

  const stageLabel = {
    lead:          'Lead',
    contacted:     pt ? 'Contactado'      : 'Contacted',
    proposal_sent: pt ? 'Proposta Enviada': 'Proposal Sent',
    negotiation:   pt ? 'Em Negociação'   : 'Negotiation',
    won:           pt ? 'Ganho'           : 'Won',
    active_client: pt ? 'Cliente Ativo'   : 'Active Client',
    lost:          pt ? 'Perdido'         : 'Lost',
  };

  // Computed metrics
  const totalRevenue    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const totalOutstanding= invoices.filter(i => !['paid', 'cancelled'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0);
  const pendingInvoices = invoices.filter(i => !['paid', 'cancelled'].includes(i.status));
  const openTasks       = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));
  const lastInvoice     = invoices[0];
  const daysSinceContact = client.last_interaction_date
    ? Math.floor((new Date() - new Date(client.last_interaction_date)) / 86400000)
    : null;

  // Last activity across all entities
  const allDates = [
    ...tasks.map(t => t.created_date),
    ...invoices.map(i => i.created_date),
    ...receipts.map(r => r.created_date),
    ...documents.map(d => d.created_date),
  ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a));
  const lastActivity = allDates[0];

  const relLabel = RELATIONSHIP_LABELS[client.relationship_type];

  const kpis = [
    {
      label: pt ? 'Projetos Ativos' : 'Active Projects',
      value: pt ? 'Em breve' : 'Coming soon',
      icon: FolderOpen,
      color: 'text-indigo-300',
      bg: 'bg-indigo-500/8',
      border: 'border-indigo-500/15',
      empty: true,
    },
    {
      label: pt ? 'Tarefas Abertas' : 'Open Tasks',
      value: openTasks.length > 0 ? openTasks.length : null,
      emptyLabel: pt ? 'Sem tarefas' : 'No tasks',
      icon: CheckSquare,
      color: openTasks.length > 0 ? 'text-purple-300' : 'text-muted-foreground',
      bg: 'bg-purple-500/8',
      border: 'border-purple-500/15',
    },
    {
      label: pt ? 'Faturas Pendentes' : 'Pending Invoices',
      value: pendingInvoices.length > 0 ? pendingInvoices.length : null,
      emptyLabel: pt ? 'Sem faturas' : 'No invoices',
      icon: Receipt,
      color: pendingInvoices.length > 0 ? 'text-amber-300' : 'text-muted-foreground',
      bg: 'bg-amber-500/8',
      border: 'border-amber-500/15',
    },
    {
      label: pt ? 'Saldo em Aberto' : 'Outstanding Balance',
      value: totalOutstanding > 0 ? `€${totalOutstanding.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : null,
      emptyLabel: pt ? 'Sem saldo' : 'No balance',
      icon: AlertCircle,
      color: totalOutstanding > 0 ? 'text-red-300' : 'text-muted-foreground',
      bg: 'bg-red-500/8',
      border: 'border-red-500/15',
    },
    {
      label: pt ? 'Receita Total' : 'Total Revenue',
      value: totalRevenue > 0 ? `€${totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : null,
      emptyLabel: '€0',
      icon: TrendingUp,
      color: totalRevenue > 0 ? 'text-emerald-300' : 'text-muted-foreground',
      bg: 'bg-emerald-500/8',
      border: 'border-emerald-500/15',
    },
    {
      label: pt ? 'Última Fatura' : 'Last Invoice',
      value: lastInvoice ? format(new Date(lastInvoice.created_date || lastInvoice.date), 'dd MMM yyyy', { locale }) : null,
      emptyLabel: pt ? 'Nenhuma' : 'None',
      icon: Clock,
      color: lastInvoice ? 'text-blue-300' : 'text-muted-foreground',
      bg: 'bg-blue-500/8',
      border: 'border-blue-500/15',
    },
    {
      label: pt ? 'Última Atividade' : 'Last Activity',
      value: lastActivity ? formatDistanceToNow(new Date(lastActivity), { addSuffix: true, locale }) : null,
      emptyLabel: pt ? 'Sem atividade' : 'No activity',
      icon: Activity,
      color: lastActivity ? 'text-primary' : 'text-muted-foreground',
      bg: 'bg-primary/8',
      border: 'border-primary/15',
    },
  ];

  return (
    <div className="space-y-4 mb-4">

      {/* ── Client Identity Card ── */}
      <div className="rounded-2xl bg-card border border-white/8 p-5">
        <div className="flex items-start gap-4">
          <ClientAvatar client={client} size="lg" />
          <div className="flex-1 min-w-0">

            {/* Name + badges */}
            <div className="flex items-start flex-wrap gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground leading-tight">{client.name}</h1>
              <Badge className={`text-xs border ${STAGE_COLORS[client.pipeline_stage || 'lead']}`}>
                {stageLabel[client.pipeline_stage || 'lead']}
              </Badge>
              {relLabel && (
                <Badge className="text-xs bg-white/8 text-muted-foreground border-border">
                  {pt ? relLabel.pt : relLabel.en}
                </Badge>
              )}
              <Badge className={`text-xs border ${client.status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                {client.status === 'active' ? (pt ? 'Ativo' : 'Active') : (pt ? 'Inativo' : 'Inactive')}
              </Badge>
            </div>

            {/* Company line (for individuals with a company) */}
            {client.company && client.type !== 'company' && (
              <p className="text-blue-300 text-sm flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5" />{client.company}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 mb-2">
              {client.main_contact_name && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />{client.main_contact_name}
                  {client.job_title && <span className="text-muted-foreground">· {client.job_title}</span>}
                </span>
              )}
              {client.assigned_to_name && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Briefcase className="w-3 h-3" />{pt ? 'Responsável:' : 'Manager:'} {client.assigned_to_name}
                </span>
              )}
              {client.customer_since && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />{pt ? 'Desde' : 'Since'} {format(new Date(client.customer_since), 'MMM yyyy', { locale })}
                </span>
              )}
              {client.service_category && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="w-3 h-3" />{client.service_category}
                </span>
              )}
            </div>

            {/* Quick contact chips */}
            <div className="flex flex-wrap gap-1.5">
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-colors">
                  <PhoneCall className="w-3 h-3" />{client.phone}
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-colors">
                  <Send className="w-3 h-3" />{client.email}
                </a>
              )}
              {(client.whatsapp || client.phone) && (
                <a href={`https://wa.me/${(client.whatsapp || client.phone)?.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20 transition-colors">
                  <MessageSquare className="w-3 h-3" />WhatsApp
                </a>
              )}
              {client.website && (
                <a href={client.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border text-muted-foreground hover:bg-accent transition-colors">
                  <Globe className="w-3 h-3" />{pt ? 'Website' : 'Website'}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tags row */}
        <div className="mt-4 pt-3.5 border-t border-border flex flex-wrap gap-1.5 items-center">
          {(client.tags || []).map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300">
              {tag}
              <button onClick={() => onRemoveTag(tag)} className="ml-0.5 hover:text-red-300 transition-colors"><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
          <div className="relative group">
            <button className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:text-muted-foreground hover:border-white/30 transition-all flex items-center gap-1">
              <Tag className="w-3 h-3" />{pt ? 'Tag' : 'Tag'}
            </button>
            <div className="absolute top-8 left-0 z-30 hidden group-hover:flex flex-col bg-popover border border-border rounded-xl shadow-xl p-2 min-w-36 gap-0.5">
              {TAG_OPTIONS.filter(t => !(client.tags || []).includes(t)).map(tag => (
                <button key={tag} onClick={() => onAddTag(tag)} className="text-left text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">{tag}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Business Overview KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`rounded-xl border ${kpi.border} ${kpi.bg} p-3.5`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-tight">{kpi.label}</span>
              </div>
              <p className={`text-base font-bold leading-none ${kpi.color}`}>
                {kpi.value ?? <span className="text-muted-foreground text-sm font-normal">{kpi.emptyLabel || (pt ? 'N/D' : 'N/A')}</span>}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex flex-wrap gap-2">
        <Link to={`${createPageUrl('Tasks')}?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`}>
          <Button size="sm" className="gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/20 h-8 text-xs">
            <CheckSquare className="w-3.5 h-3.5" />{pt ? 'Nova Tarefa' : 'New Task'}
          </Button>
        </Link>
        <Link to={createPageUrl('Invoices')}>
          <Button size="sm" className="gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/20 h-8 text-xs">
            <Receipt className="w-3.5 h-3.5" />{pt ? 'Nova Fatura' : 'New Invoice'}
          </Button>
        </Link>
        <Link to={createPageUrl('Agenda')}>
          <Button size="sm" className="gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/20 h-8 text-xs">
            <Calendar className="w-3.5 h-3.5" />{pt ? 'Agendar Reunião' : 'Schedule Meeting'}
          </Button>
        </Link>
        <Link to={createPageUrl('Documents')}>
          <Button size="sm" className="gap-1.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/20 h-8 text-xs">
            <FileText className="w-3.5 h-3.5" />{pt ? 'Carregar Documento' : 'Upload Document'}
          </Button>
        </Link>
        {client.email && (
          <a href={`mailto:${client.email}`}>
            <Button size="sm" className="gap-1.5 bg-primary/15 hover:bg-primary/90/25 text-primary border border-primary/20 h-8 text-xs">
              <Mail className="w-3.5 h-3.5" />{pt ? 'Enviar Email' : 'Send Email'}
            </Button>
          </a>
        )}
        {/* Future: Create Project — disabled until Projects module is available */}
        <Button size="sm" disabled
          className="gap-1.5 bg-indigo-500/8 text-indigo-400/40 border border-indigo-500/10 h-8 text-xs cursor-not-allowed opacity-50"
          title={pt ? 'Módulo de Projetos em breve' : 'Projects module coming soon'}>
          <FolderOpen className="w-3.5 h-3.5" />{pt ? 'Novo Projeto' : 'New Project'}
        </Button>
      </div>

      {/* ── Alerts ── */}
      {(daysSinceContact > 7 || totalOutstanding > 0) && (
        <div className="flex flex-col gap-2">
          {daysSinceContact > 7 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-sm text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {pt ? `Sem contacto há ${daysSinceContact} dias` : `No contact for ${daysSinceContact} days`}
            </div>
          )}
          {totalOutstanding > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 text-sm text-red-300">
              <Receipt className="w-4 h-4 flex-shrink-0" />
              {pt ? `Saldo em aberto: €${totalOutstanding.toFixed(0)}` : `Outstanding balance: €${totalOutstanding.toFixed(0)}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}