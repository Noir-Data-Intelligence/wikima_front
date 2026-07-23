import { useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Edit, Mail, Building2, FileText,
  CheckSquare, Receipt, MessageSquare, Calendar, Save, Plus,
  Tag, Briefcase, Globe, ExternalLink,
  PhoneCall, Send, AlertCircle, Users, Activity,
  X, User, FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';
import ClientFormDialog from '../components/clients/ClientFormDialog';
import CompanyClientSummary from '../components/clients/CompanyClientSummary';
import { useWorkspace } from '../components/WorkspaceContext';

const TAG_OPTIONS = ['VIP', 'New', 'High Value', 'Pending', 'Cold', 'Hot Lead', 'Priority'];

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

export default function ClientProfile() {
  const { language } = useLanguage();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const pt = language === 'pt';
  const isCompanyWorkspace = currentWorkspace?.type === 'company';
  const locale = pt ? ptBR : enUS;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [nifError, setNifError] = useState('');
  const [formError, setFormError] = useState('');
  const [newNote, setNewNote] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => api.entities.Client.filter({ id: clientId }).then(r => r[0]),
    enabled: !!clientId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['client-tasks', clientId],
    queryFn: () => api.entities.Task.filter({ client_id: clientId }, '-created_date'),
    enabled: !!clientId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: () => api.entities.Document.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['client-invoices', clientId],
    queryFn: () => api.entities.Invoice.filter({ client_id: clientId }, '-date'),
    enabled: !!clientId
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ['client-receipts', clientId],
    queryFn: () => api.entities.Receipt.filter({ client_id: clientId }, '-date'),
    enabled: !!clientId
  });

  const { data: services = [] } = useQuery({
    queryKey: ['client-services', clientId],
    queryFn: () => api.entities.Service.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(pt ? 'Cliente atualizado!' : 'Client updated!');
      setShowEditDialog(false);
    }
  });

  const handleEditSubmit = async () => {
    setNifError(''); setFormError('');
    const hasName = editFormData.first_name?.trim() || editFormData.name?.trim() || editFormData.company?.trim();
    if (!hasName) { setFormError(pt ? 'O nome é obrigatório.' : 'Name is required.'); return null; }
    const fullName = editFormData.type === 'company'
      ? (editFormData.company || editFormData.name || '')
      : (`${editFormData.first_name || ''} ${editFormData.last_name || ''}`).trim() || editFormData.name || '';
    const payload = { ...editFormData, name: fullName };
    await updateMutation.mutateAsync(payload);
    return null;
  };

  const handleAddTag = (tag) => {
    const current = client?.tags || [];
    if (!current.includes(tag)) updateMutation.mutate({ tags: [...current, tag] });
  };

  const handleRemoveTag = (tag) => {
    updateMutation.mutate({ tags: (client?.tags || []).filter(t => t !== tag) });
  };

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    const existing = client.notes ? client.notes + '\n\n' : '';
    const stamp = `[${format(new Date(), 'dd/MM/yyyy HH:mm')}]\n`;
    updateMutation.mutate({ notes: existing + stamp + newNote.trim() });
    setNewNote('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{pt ? 'Cliente não encontrado' : 'Client not found'}</p>
          <Link to={createPageUrl('Clients')}>
            <Button variant="outline">{pt ? 'Voltar' : 'Go Back'}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const totalOutstanding = invoices.filter(i => !['paid', 'cancelled'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0);
  const openTasks = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));
  const lastInvoice = invoices[0];
  const daysSinceContact = client.last_interaction_date
    ? Math.floor((new Date() - new Date(client.last_interaction_date)) / 86400000)
    : null;

  const stageLabel = {
    lead: 'Lead', contacted: pt ? 'Contactado' : 'Contacted',
    proposal_sent: pt ? 'Proposta Enviada' : 'Proposal Sent',
    negotiation: pt ? 'Em Negociação' : 'Negotiation',
    won: pt ? 'Ganho' : 'Won',
    active_client: pt ? 'Cliente Ativo' : 'Active Client',
    lost: pt ? 'Perdido' : 'Lost'
  };

  // Activity timeline
  const timeline = [
    { type: 'created', date: client.created_date, title: pt ? 'Cliente criado' : 'Client created', icon: User, color: 'text-primary', bg: 'bg-primary/15' },
    ...tasks.map(t => ({ type: 'task', date: t.created_date, title: t.title, status: t.status, priority: t.priority, icon: CheckSquare, color: 'text-purple-400', bg: 'bg-purple-500/15' })),
    ...documents.map(d => ({ type: 'document', date: d.created_date, title: d.title || d.file_name, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/15' })),
    ...invoices.map(i => ({ type: 'invoice', date: i.created_date, title: `${pt ? 'Fatura' : 'Invoice'} ${i.invoice_number || ''}`, amount: i.total, status: i.status, icon: Receipt, color: 'text-amber-400', bg: 'bg-amber-500/15' })),
    ...receipts.map(r => ({ type: 'receipt', date: r.created_date, title: `${pt ? 'Recibo' : 'Receipt'} #${r.receipt_number || ''}`, amount: r.amount, icon: FileCheck, color: 'text-green-400', bg: 'bg-green-500/15' })),
    ...services.map(s => ({ type: 'service', date: s.created_date, title: s.service_name || s.name, status: s.status, icon: Briefcase, color: 'text-primary', bg: 'bg-primary/15' })),
  ].filter(e => e.date).sort((a, b) => new Date(b.date) - new Date(a.date));

  const TABS = [
    { key: 'overview',   label_pt: 'Visão Geral',  label_en: 'Overview',   icon: Users },
    { key: 'tasks',      label_pt: 'Tarefas',       label_en: 'Tasks',      icon: CheckSquare, count: tasks.length },
    { key: 'invoices',   label_pt: 'Faturas',       label_en: 'Invoices',   icon: Receipt,     count: invoices.length },
    { key: 'receipts',   label_pt: 'Recibos',       label_en: 'Receipts',   icon: FileCheck,   count: receipts.length },
    { key: 'documents',  label_pt: 'Documentos',    label_en: 'Documents',  icon: FileText,    count: documents.length },
    { key: 'services',   label_pt: 'Serviços',      label_en: 'Services',   icon: Briefcase,   count: services.length },
    { key: 'activity',   label_pt: 'Atividade',     label_en: 'Activity',   icon: Activity,    count: timeline.length },
    { key: 'notes',      label_pt: 'Notas',         label_en: 'Notes',      icon: FileText },
  ];

  const invoiceStatusColor = { draft: 'text-gray-400', sent: 'text-blue-400', paid: 'text-emerald-400', overdue: 'text-red-400', cancelled: 'text-gray-500' };
  const taskStatusColor = { todo: 'text-muted-foreground', in_progress: 'text-blue-400', waiting: 'text-amber-400', completed: 'text-emerald-400', cancelled: 'text-gray-500' };

  const relLabel = RELATIONSHIP_LABELS[client.relationship_type];

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 md:px-6 py-3 flex items-center justify-between">
          <Link to={createPageUrl('Clients')}>
            <Button variant="ghost" className="gap-2 text-blue-300 hover:text-foreground hover:bg-accent/50 text-sm px-2">
              <ArrowLeft className="w-4 h-4" />
              {pt ? 'Clientes' : 'Clients'}
            </Button>
          </Link>
          <Button
            onClick={() => { setEditFormData({ ...client }); setShowEditDialog(true); }}
            className="gap-2 bg-muted hover:bg-white/15 text-foreground border border-border text-sm h-8"
            variant="outline"
          >
            <Edit className="w-3.5 h-3.5" />{pt ? 'Editar' : 'Edit'}
          </Button>
        </div>

        <div className="p-4 md:p-6 max-w-6xl mx-auto">

          {/* ── Company Workspace: full business summary ── */}
          {isCompanyWorkspace ? (
            <CompanyClientSummary
              client={client}
              tasks={tasks}
              invoices={invoices}
              receipts={receipts}
              documents={documents}
              services={services}
              pt={pt}
              clientId={clientId}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          ) : (
            <>
              {/* Header Card — non-company workspaces */}
              <div className="rounded-2xl bg-card border border-white/8 p-5 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0 border border-primary/20">
                    {client.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
                      <Badge className={`text-xs border ${STAGE_COLORS[client.pipeline_stage || 'lead']}`}>
                        {stageLabel[client.pipeline_stage || 'lead']}
                      </Badge>
                      {relLabel && (
                        <Badge className="text-xs bg-white/8 text-muted-foreground border-border">
                          {pt ? relLabel.pt : relLabel.en}
                        </Badge>
                      )}
                    </div>
                    {client.company && client.type !== 'company' && (
                      <p className="text-blue-300 text-sm flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3.5 h-3.5" />{client.company}
                      </p>
                    )}
                    {client.main_contact_name && (
                      <p className="text-muted-foreground text-sm flex items-center gap-1.5 mb-1">
                        <User className="w-3.5 h-3.5" />{client.main_contact_name}
                        {client.job_title && <span className="text-muted-foreground">· {client.job_title}</span>}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {client.phone && (
                        <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-colors">
                          <PhoneCall className="w-3 h-3" />{client.phone}
                        </a>
                      )}
                      {client.email && (
                        <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-colors">
                          <Send className="w-3 h-3" />{client.email}
                        </a>
                      )}
                      {(client.whatsapp || client.phone) && (
                        <a href={`https://wa.me/${(client.whatsapp || client.phone)?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20 transition-colors">
                          <MessageSquare className="w-3 h-3" />WhatsApp
                        </a>
                      )}
                      {client.website && (
                        <a href={client.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted/50 border border-border text-muted-foreground hover:bg-accent transition-colors">
                          <Globe className="w-3 h-3" />{pt ? 'Website' : 'Website'}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                  {(client.tags || []).map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:text-red-300 transition-colors"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                  <div className="relative group">
                    <button className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:text-muted-foreground hover:border-white/30 transition-all flex items-center gap-1">
                      <Tag className="w-3 h-3" />{pt ? 'Tag' : 'Tag'}
                    </button>
                    <div className="absolute top-8 left-0 z-30 hidden group-hover:flex flex-col bg-popover border border-border rounded-xl shadow-xl p-2 min-w-36 gap-0.5">
                      {TAG_OPTIONS.filter(t => !(client.tags || []).includes(t)).map(tag => (
                        <button key={tag} onClick={() => handleAddTag(tag)} className="text-left text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">{tag}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {(daysSinceContact > 7 || totalOutstanding > 0) && (
                <div className="mb-4 flex flex-col gap-2">
                  {daysSinceContact > 7 && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-sm text-amber-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {pt ? `Sem contacto há ${daysSinceContact} dias` : `No contact for ${daysSinceContact} days`}
                    </div>
                  )}
                  {totalOutstanding > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 text-sm text-red-300">
                      <Receipt className="w-4 h-4 flex-shrink-0" />
                      {pt ? `Valor em aberto: €${totalOutstanding.toFixed(0)}` : `Outstanding: €${totalOutstanding.toFixed(0)}`}
                    </div>
                  )}
                </div>
              )}

              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: pt ? 'Total Pago' : 'Total Paid',      value: `€${totalPaid.toFixed(0)}`,       color: 'text-emerald-300' },
                  { label: pt ? 'Em Aberto' : 'Outstanding',       value: `€${totalOutstanding.toFixed(0)}`, color: totalOutstanding > 0 ? 'text-amber-300' : 'text-muted-foreground' },
                  { label: pt ? 'Tarefas Abertas' : 'Open Tasks',  value: openTasks.length,                   color: 'text-purple-300' },
                  { label: pt ? 'Serviços' : 'Services',            value: services.length,                    color: 'text-primary' },
                ].map((k, i) => (
                  <div key={i} className="rounded-xl bg-card border border-white/8 p-4">
                    <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                    <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-5">
                <Link to={`${createPageUrl('Tasks')}?clientId=${clientId}&clientName=${encodeURIComponent(client.name)}`}>
                  <Button size="sm" className="gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/20 h-8 text-xs">
                    <Plus className="w-3.5 h-3.5" />{pt ? 'Nova Tarefa' : 'New Task'}
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
              </div>
            </>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-0 mb-4 border-b border-white/8 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                    active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {pt ? tab.label_pt : tab.label_en}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-primary/20 text-primary' : 'bg-white/8 text-muted-foreground'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="rounded-2xl bg-card border border-white/8 p-5">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Informação' : 'Information'}</h3>
                  {[
                    { label: pt ? 'Nome' : 'Name',                value: client.name },
                    { label: pt ? 'Empresa' : 'Company',          value: client.company, hide: client.type === 'company' },
                    { label: pt ? 'Contacto Principal' : 'Main Contact', value: client.main_contact_name },
                    { label: 'Email',                              value: client.email },
                    { label: pt ? 'Telefone' : 'Phone',           value: client.phone },
                    { label: 'WhatsApp',                           value: client.whatsapp },
                    { label: 'Website',                            value: client.website },
                    { label: pt ? 'Morada' : 'Address',           value: [client.address, client.city, client.postal_code, client.country].filter(Boolean).join(', ') },
                  ].filter(r => r.value && !r.hide).map((row, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{row.label}</span>
                      <span className="text-sm text-foreground/80 flex-1 break-all">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Relação' : 'Relationship'}</h3>
                  {[
                    { label: pt ? 'Cliente Desde' : 'Customer Since', value: client.customer_since ? format(new Date(client.customer_since), 'dd MMM yyyy', { locale }) : null },
                    { label: pt ? 'Tipo de Relação' : 'Relationship', value: RELATIONSHIP_LABELS[client.relationship_type] ? (pt ? RELATIONSHIP_LABELS[client.relationship_type].pt : RELATIONSHIP_LABELS[client.relationship_type].en) : null },
                    { label: pt ? 'Setor' : 'Industry',   value: client.service_category },
                    { label: pt ? 'Estado CRM' : 'Stage', value: stageLabel[client.pipeline_stage || 'lead'] },
                    { label: pt ? 'Última Fatura' : 'Last Invoice', value: lastInvoice ? `${lastInvoice.invoice_number || ''} · €${(lastInvoice.total || 0).toFixed(0)} · ${lastInvoice.status}` : null },
                    { label: pt ? 'Último Contacto' : 'Last Activity', value: client.last_interaction_date ? format(new Date(client.last_interaction_date), 'dd MMM yyyy', { locale }) : null },
                    { label: pt ? 'Saldo Pendente' : 'Pending Balance', value: totalOutstanding > 0 ? `€${totalOutstanding.toFixed(2)}` : '€0.00' },
                  ].filter(r => r.value !== null && r.value !== undefined).map((row, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{row.label}</span>
                      <span className="text-sm text-foreground/80 flex-1">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TASKS */}
            {activeTab === 'tasks' && (
              <div className="space-y-2">
                {tasks.length === 0
                  ? <EmptyState icon={CheckSquare} label={pt ? 'Sem tarefas para este cliente.' : 'No tasks for this client.'} />
                  : tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-white/[0.03] transition-colors">
                      <CheckSquare className={`w-4 h-4 shrink-0 ${taskStatusColor[t.status] || 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{t.status} {t.deadline ? `· ${t.deadline}` : ''}</p>
                      </div>
                      {t.priority && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${t.priority === 'urgent' ? 'border-red-500/30 text-red-300 bg-red-500/10' : t.priority === 'high' ? 'border-orange-500/30 text-orange-300 bg-orange-500/10' : 'border-border text-muted-foreground'}`}>{t.priority}</span>}
                    </div>
                  ))
                }
              </div>
            )}

            {/* INVOICES */}
            {activeTab === 'invoices' && (
              <div className="space-y-2">
                {invoices.length === 0
                  ? <EmptyState icon={Receipt} label={pt ? 'Sem faturas para este cliente.' : 'No invoices for this client.'} />
                  : invoices.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-white/[0.03] transition-colors">
                      <Receipt className={`w-4 h-4 shrink-0 ${(invoiceStatusColor[inv.status] || 'text-muted-foreground')}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{inv.invoice_number || (pt ? 'Fatura' : 'Invoice')}</p>
                        <p className="text-xs text-muted-foreground">{inv.date} · {inv.status}</p>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">€{(inv.total || 0).toFixed(2)}</span>
                    </div>
                  ))
                }
              </div>
            )}

            {/* RECEIPTS */}
            {activeTab === 'receipts' && (
              <div className="space-y-2">
                {receipts.length === 0
                  ? <EmptyState icon={FileCheck} label={pt ? 'Sem recibos para este cliente.' : 'No receipts for this client.'} />
                  : receipts.map(r => (
                    <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-white/[0.03] transition-colors">
                      <FileCheck className="w-4 h-4 shrink-0 text-green-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">#{r.receipt_number}</p>
                        <p className="text-xs text-muted-foreground">{r.date} · {r.payment_method || ''}</p>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">€{(r.amount || 0).toFixed(2)}</span>
                    </div>
                  ))
                }
              </div>
            )}

            {/* DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="space-y-2">
                {documents.length === 0
                  ? <EmptyState icon={FileText} label={pt ? 'Sem documentos para este cliente.' : 'No documents for this client.'} />
                  : documents.map(d => (
                    <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-white/[0.03] transition-colors">
                      <FileText className="w-4 h-4 shrink-0 text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{d.title || d.file_name}</p>
                        <p className="text-xs text-muted-foreground">{d.created_date ? format(new Date(d.created_date), 'dd/MM/yyyy') : ''}</p>
                      </div>
                      {d.file_url && (
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))
                }
              </div>
            )}

            {/* SERVICES */}
            {activeTab === 'services' && (
              <div className="space-y-2">
                {services.length === 0
                  ? <EmptyState icon={Briefcase} label={pt ? 'Sem serviços para este cliente.' : 'No services for this client.'} />
                  : services.map(s => (
                    <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-white/[0.03] transition-colors">
                      <Briefcase className="w-4 h-4 shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{s.service_name || s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.status}</p>
                      </div>
                      {s.total_value && <span className="text-sm font-semibold text-muted-foreground">€{s.total_value.toFixed(0)}</span>}
                    </div>
                  ))
                }
              </div>
            )}

            {/* ACTIVITY TIMELINE */}
            {activeTab === 'activity' && (
              <div>
                {timeline.length === 0
                  ? <EmptyState icon={Activity} label={pt ? 'Sem atividade registada.' : 'No activity recorded yet.'} />
                  : (
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-px bg-muted/50" />
                      <div className="space-y-3">
                        {timeline.map((item, i) => {
                          const Icon = item.icon;
                          return (
                            <div key={i} className="flex gap-3 items-start">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${item.bg} border border-border`}>
                                <Icon className={`w-4 h-4 ${item.color}`} />
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm text-foreground font-medium truncate">{item.title}</span>
                                  {item.status && <span className={`text-xs ${item.type === 'invoice' ? (invoiceStatusColor[item.status] || 'text-muted-foreground') : (taskStatusColor[item.status] || 'text-muted-foreground')}`}>· {item.status}</span>}
                                  {item.amount !== undefined && <span className="text-xs text-amber-300 ml-auto">€{item.amount?.toFixed(0)}</span>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true, locale }) : ''}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                }
              </div>
            )}

            {/* NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder={pt ? 'Adicionar nota...' : 'Add a note...'}
                    rows={3}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" onClick={handleSaveNote} disabled={!newNote.trim() || updateMutation.isPending}
                      className="bg-primary hover:bg-primary/90 h-8 text-xs">
                      <Save className="w-3.5 h-3.5 mr-1.5" />{pt ? 'Guardar Nota' : 'Save Note'}
                    </Button>
                  </div>
                </div>
                {client.notes ? (
                  <div className="whitespace-pre-wrap text-sm text-blue-100/80 leading-relaxed bg-white/[0.02] rounded-xl p-4 border border-border">
                    {client.notes}
                  </div>
                ) : (
                  <EmptyState icon={FileText} label={pt ? 'Sem notas ainda.' : 'No notes yet.'} />
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Edit Dialog — reuses ClientFormDialog */}
      <ClientFormDialog
        open={showEditDialog}
        onOpenChange={(v) => { setShowEditDialog(v); if (!v) { setNifError(''); setFormError(''); } }}
        editingClient={client}
        formData={editFormData}
        setFormData={setEditFormData}
        nifError={nifError}
        formError={formError}
        onSubmit={handleEditSubmit}
        onDelete={() => {
          if (confirm(pt ? 'Eliminar este cliente?' : 'Delete this client?')) {
            api.entities.Client.delete(clientId).then(() => {
              toast.success(pt ? 'Cliente eliminado.' : 'Client deleted.');
              window.location.href = createPageUrl('Clients');
            });
          }
        }}
        isSaving={updateMutation.isPending}
        language={language}
        onPostAction={() => {}}
      />
    </div>
  );
}

function EmptyState({ icon: Icon, label }) {
  return (
    <div className="text-center py-10">
      <Icon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}