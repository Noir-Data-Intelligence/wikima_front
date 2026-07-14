import React, { useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useDemoMode } from '../components/DemoModeContext';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, Plus, Eye, Search, Mail, Building2, CheckSquare, Receipt, Calendar,
  LayoutList, Kanban, MoreVertical, Pencil, Trash2, Euro,
  Clock, Star, TrendingUp, Archive
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { Link, useNavigate } from 'react-router-dom';
import ClientPipelineView from '../components/clients/ClientPipelineView';
import ClientSummaryCards from '../components/clients/ClientSummaryCards';
import ClientFormDialog from '../components/clients/ClientFormDialog';
import { useWorkspace } from '../components/WorkspaceContext';
import AccessGuard from '../components/AccessGuard';

const isLead = c => ['lead', 'contacted', 'proposal_sent', 'negotiation'].includes(c.pipeline_stage || 'lead');
const isActiveClient = c => ['won', 'active_client'].includes(c.pipeline_stage);
const isArchived = c => c.status === 'inactive' || c.pipeline_stage === 'lost';

const STAGE_META = {
  lead:          { label_pt: 'Lead',              label_en: 'Lead',            cls: 'border-slate-500/30 text-muted-foreground bg-slate-500/10' },
  contacted:     { label_pt: 'Contactado',        label_en: 'Contacted',       cls: 'border-blue-500/30 text-blue-300 bg-blue-500/10' },
  proposal_sent: { label_pt: 'Proposta Enviada',  label_en: 'Proposal Sent',   cls: 'border-violet-500/30 text-violet-300 bg-violet-500/10' },
  negotiation:   { label_pt: 'Negociação',        label_en: 'Negotiation',     cls: 'border-amber-500/30 text-amber-300 bg-amber-500/10' },
  won:           { label_pt: 'Ganho',             label_en: 'Won',             cls: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' },
  active_client: { label_pt: 'Cliente Ativo',     label_en: 'Active',          cls: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' },
  lost:          { label_pt: 'Perdido',           label_en: 'Lost',            cls: 'border-red-500/20 text-red-300/60 bg-red-500/5' },
};

const AVATAR_COLORS = ['bg-primary','bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-pink-500','bg-teal-500'];
const avatarColor = name => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = name => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

const defaultForm = {
  name: '', salutation: '', first_name: '', last_name: '', email: '', phone: '',
  whatsapp: '', website: '', company: '', main_contact_name: '', job_title: '',
  type: 'individual', status: 'active', notes: '', address: '', city: '', postal_code: '',
  country: '', tax_number: '', pipeline_stage: 'won', relationship_type: 'client',
  customer_since: '', next_action_date: '', next_action: '',
  tags: [], service_category: '', lead_source: '', priority: '', employee_count: '', assigned_to_name: ''
};

export default function Clients() {
  const { language } = useLanguage();
  const { isDemoMode, demoData } = useDemoMode();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pt = language === 'pt';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [nifError, setNifError] = useState('');
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('clients'); // 'leads' | 'clients' | 'archived'
  const [viewMode, setViewMode] = useState('list');
  const [pipelineDefaultStage, setPipelineDefaultStage] = useState('lead');
  const [filterRelType, setFilterRelType] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const today = new Date().toISOString().split('T')[0];

  React.useEffect(() => {
    if (isDemoMode) return;
    api.auth.me().then(u => { if (!u) window.location.href = createPageUrl('Landing'); }).catch(() => window.location.href = createPageUrl('Landing'));
  }, [isDemoMode]);

  const getWsId = async () => {
    if (currentWorkspace?.id) return currentWorkspace.id;
    const u = await api.auth.me();
    return u.current_workspace_id || u.default_workspace_id;
  };

  const { data: clientsData = [] } = useQuery({
    queryKey: ['clients'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Client.filter({ workspace_id: id }, '-created_date'); }
  });
  const { data: tasksData = [] } = useQuery({
    queryKey: ['tasks'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Task.filter({ workspace_id: id }); }
  });
  const { data: documentsData = [] } = useQuery({
    queryKey: ['documents'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Document.filter({ workspace_id: id }); }
  });
  const { data: invoicesData = [] } = useQuery({
    queryKey: ['invoices'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Invoice.filter({ workspace_id: id }); }
  });

  const clients = isDemoMode ? demoData.clients : clientsData;
  const tasks = isDemoMode ? demoData.tasks : tasksData;
  const documents = isDemoMode ? demoData.documents : documentsData;
  const invoices = isDemoMode ? demoData.invoices : invoicesData;

  const createMutation = useMutation({ mutationFn: data => api.entities.Client.create(data) });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => api.entities.Client.update(id, data) });
  const deleteMutation = useMutation({
    mutationFn: id => api.entities.Client.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); toast.success(pt ? 'Cliente eliminado.' : 'Client deleted.'); }
  });

  const resolveWorkspaceId = async () => {
    const id = await getWsId();
    if (id) return id;
    const u = await api.auth.me();
    const existing = await api.entities.Workspace.filter({ owner_email: u.email });
    if (existing.length > 0) return existing[0].id;
    const ws = await api.entities.Workspace.create({ name: u.full_name || u.email, type: 'personal', owner_email: u.email });
    await api.auth.updateMe({ current_workspace_id: ws.id, default_workspace_id: ws.id });
    return ws.id;
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    const nameParts = (client.name || '').split(' ');
    setFormData({
      name: client.name || '',
      first_name: client.first_name || nameParts[0] || '',
      last_name: client.last_name || nameParts.slice(1).join(' ') || '',
      email: client.email || '', phone: client.phone || '',
      whatsapp: client.whatsapp || '', website: client.website || '',
      company: client.company || '', main_contact_name: client.main_contact_name || '',
      job_title: client.job_title || '', type: client.type || 'individual',
      status: client.status || 'active', notes: client.notes || '',
      address: client.address || '', city: client.city || '',
      postal_code: client.postal_code || '', tax_number: client.tax_number || '',
      country: client.country || '', pipeline_stage: client.pipeline_stage || 'won',
      relationship_type: client.relationship_type || 'client',
      customer_since: client.customer_since || '',
      next_action_date: client.next_action_date || '', next_action: client.next_action || '',
      tags: client.tags || [], service_category: client.service_category || '',
      lead_source: client.lead_source || '', priority: client.priority || '',
      employee_count: client.employee_count || '',
      salutation: client.salutation || '', assigned_to_name: client.assigned_to_name || ''
    });
    setShowDialog(true);
  };

  const resetForm = () => { setFormData(defaultForm); setEditingClient(null); setNifError(''); setFormError(''); };

  const handleSubmit = async () => {
    setFormError(''); setNifError('');
    if (isDemoMode) { setFormError('Ações desativadas no modo de pré-visualização.'); return null; }
    const hasName = formData.first_name?.trim() || formData.name?.trim();
    if (!hasName) { setFormError(pt ? 'O nome é obrigatório.' : 'Name is required.'); return null; }
    const nif = formData.tax_number.trim();
    if (nif && (!/^\d+$/.test(nif) || nif.length !== 9)) { setNifError(pt ? 'NIF inválido (9 dígitos).' : 'Invalid NIF (9 digits).'); return null; }

    const workspaceId = await resolveWorkspaceId();
    if (!workspaceId) { setFormError(pt ? 'Workspace não encontrado.' : 'Workspace not found.'); return null; }

    // Build full name from first+last if provided
    const fullName = (formData.first_name || formData.last_name)
      ? `${formData.first_name || ''} ${formData.last_name || ''}`.trim()
      : formData.name.trim();

    const payload = {
      name: fullName, type: formData.type, status: formData.status,
      workspace_id: workspaceId, pipeline_stage: formData.pipeline_stage || pipelineDefaultStage || 'lead',
      relationship_type: formData.relationship_type || 'client',
      tags: formData.tags || []
    };
    if (formData.first_name?.trim()) payload.first_name = formData.first_name.trim();
    if (formData.last_name?.trim()) payload.last_name = formData.last_name.trim();
    if (formData.email?.trim()) payload.email = formData.email.trim();
    if (formData.phone?.trim()) payload.phone = formData.phone.trim();
    if (formData.whatsapp?.trim()) payload.whatsapp = formData.whatsapp.trim();
    if (formData.website?.trim()) payload.website = formData.website.trim();
    if (nif) payload.tax_number = nif;
    if (formData.company?.trim()) payload.company = formData.company.trim();
    if (formData.main_contact_name?.trim()) payload.main_contact_name = formData.main_contact_name.trim();
    if (formData.job_title?.trim()) payload.job_title = formData.job_title.trim();
    if (formData.address?.trim()) payload.address = formData.address.trim();
    if (formData.city?.trim()) payload.city = formData.city.trim();
    if (formData.postal_code?.trim()) payload.postal_code = formData.postal_code.trim();
    if (formData.notes?.trim()) payload.notes = formData.notes.trim();
    if (formData.customer_since) payload.customer_since = formData.customer_since;
    if (formData.next_action_date) payload.next_action_date = formData.next_action_date;
    if (formData.next_action?.trim()) payload.next_action = formData.next_action.trim();
    if (formData.service_category) payload.service_category = formData.service_category;
    if (formData.country?.trim()) payload.country = formData.country.trim();
    if (formData.lead_source) payload.lead_source = formData.lead_source;
    if (formData.priority) payload.priority = formData.priority;
    if (formData.assigned_to_name?.trim()) payload.assigned_to_name = formData.assigned_to_name.trim();

    try {
      let result;
      if (editingClient) {
        await updateMutation.mutateAsync({ id: editingClient.id, data: payload });
        toast.success(pt ? 'Cliente atualizado.' : 'Client updated.');
        result = null;
      } else {
        result = await createMutation.mutateAsync(payload);
        toast.success(pt ? 'Cliente adicionado.' : 'Client added.');
      }
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      resetForm();
      if (editingClient) setShowDialog(false);
      return result;
    } catch (err) {
      setFormError(`${pt ? 'Erro:' : 'Error:'} ${err?.message || 'unknown'}`);
      return null;
    }
  };

  const handleDelete = () => {
    if (!editingClient) return;
    if (confirm(pt ? 'Eliminar este cliente?' : 'Delete this client?')) {
      deleteMutation.mutate(editingClient.id);
      setShowDialog(false); resetForm();
    }
  };

  const handlePostAction = (action, client) => {
    if (action === 'task') navigate(`${createPageUrl('Tasks')}?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}`);
    else if (action === 'invoice') navigate(createPageUrl('Invoices'));
    else if (action === 'document') navigate(createPageUrl('Documents'));
    else if (action === 'follow_up') handleEdit(client);
  };

  const getClientStats = (client) => {
    const inv = invoices.filter(x => x.client_id === client.id);
    return {
      tasks: tasks.filter(x => x.client_id === client.id).length,
      invoices: inv.length,
      totalPaid: inv.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0),
      hasOverdue: inv.some(i => i.status === 'overdue'),
    };
  };

  // Tab filtering
  const tabCounts = {
    clients: clients.filter(c => isActiveClient(c) && !isArchived(c)).length,
    leads: clients.filter(c => isLead(c) && !isArchived(c)).length,
    archived: clients.filter(isArchived).length,
  };

  const baseFiltered = clients.filter(c => {
    const search = !searchTerm
      || c.name?.toLowerCase().includes(searchTerm.toLowerCase())
      || c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      || c.company?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!search) return false;
    if (filterRelType && c.relationship_type !== filterRelType) return false;
    if (filterIndustry && c.service_category !== filterIndustry) return false;
    if (activeTab === 'clients') return isActiveClient(c) && !isArchived(c);
    if (activeTab === 'leads') return isLead(c) && !isArchived(c);
    if (activeTab === 'archived') return isArchived(c);
    return true;
  });

  const TABS = [
    { key: 'clients', label_pt: 'Clientes',  label_en: 'Clients',  icon: Users,   count: tabCounts.clients },
    { key: 'leads',   label_pt: 'Leads',     label_en: 'Leads',    icon: TrendingUp, count: tabCounts.leads },
    { key: 'archived',label_pt: 'Arquivados',label_en: 'Archived', icon: Archive, count: tabCounts.archived },
  ];

  const emptyLabels = {
    clients: {
      title_pt: 'Sem clientes ativos.',      title_en: 'No active clients yet.',
      sub_pt: 'Adicione o seu primeiro cliente.',  sub_en: 'Add your first client.',
    },
    leads: {
      title_pt: 'Sem leads ainda.',          title_en: 'No leads yet.',
      sub_pt: 'Registe um lead para começar.',     sub_en: 'Add a lead to get started.',
    },
    archived: {
      title_pt: 'Sem contactos arquivados.', title_en: 'No archived contacts.',
      sub_pt: '',                                  sub_en: '',
    },
  };

  return (
    <AccessGuard page="Clients">
      <div className="min-h-screen bg-background">
        
        

        <main className="p-5 lg:pt-6 md:p-8 md:pt-8">
          <div className="max-w-[1600px] mx-auto">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div>
                <h1 className="text-xl font-bold text-foreground">{pt ? 'Clientes' : 'Clients'}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{pt ? 'Clientes, leads e relações comerciais.' : 'Clients, leads and business relationships.'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-muted/50 rounded-lg border border-border p-0.5">
                  <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <LayoutList className="w-3.5 h-3.5" />{pt ? 'Lista' : 'List'}
                  </button>
                  <button onClick={() => setViewMode('pipeline')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'pipeline' ? 'bg-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Kanban className="w-3.5 h-3.5" />Pipeline
                  </button>
                </div>
                <Button onClick={() => { resetForm(); setPipelineDefaultStage(activeTab === 'leads' ? 'lead' : 'won'); setFormData(f => ({ ...f, pipeline_stage: activeTab === 'leads' ? 'lead' : 'won' })); setShowDialog(true); }}
                  className="bg-primary hover:bg-primary/90 gap-1.5 shadow-lg shadow-cyan-500/15 h-8 text-xs px-3">
                  <Plus className="w-3.5 h-3.5" />
                  {activeTab === 'leads' ? (pt ? 'Novo Lead' : 'New Lead') : (pt ? 'Criar Novo Cliente' : 'Create New Client')}
                </Button>
              </div>
            </div>

            {/* ── KPI cards ──────────────────────────────────────────── */}
            <ClientSummaryCards clients={clients} invoices={invoices} language={language} />

            {/* ── Pipeline view ──────────────────────────────────────── */}
            {viewMode === 'pipeline' && (
              <ClientPipelineView clients={clients} onAddClient={(stage) => {
                setPipelineDefaultStage(stage); resetForm();
                setFormData(f => ({ ...f, pipeline_stage: stage })); setShowDialog(true);
              }} />
            )}

            {/* ── List view ──────────────────────────────────────────── */}
            {viewMode === 'list' && (
              <>
                {/* Nav tabs */}
                <div className="flex items-center gap-0 mb-4 border-b border-border">
                  {TABS.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;
                    return (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all -mb-px ${
                          active
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
                        }`}>
                        <Icon className="w-3.5 h-3.5" />
                        {pt ? tab.label_pt : tab.label_en}
                        <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-primary/20 text-primary' : 'bg-white/8 text-muted-foreground'}`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search + Filters */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder={pt ? 'Pesquisar...' : 'Search...'}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/40 text-sm"
                    />
                    {baseFiltered.length > 0 && (
                      <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground">{baseFiltered.length}</span>
                    )}
                  </div>
                  <select value={filterRelType} onChange={e => setFilterRelType(e.target.value)}
                    className="h-9 px-3 text-xs bg-muted/50 border border-border text-muted-foreground rounded-lg focus:outline-none focus:border-primary/40">
                    <option value="">{pt ? 'Tipo de relação' : 'Relationship type'}</option>
                    <option value="client">{pt ? 'Cliente' : 'Client'}</option>
                    <option value="lead">Lead</option>
                    <option value="supplier">{pt ? 'Fornecedor' : 'Supplier'}</option>
                    <option value="partner">{pt ? 'Parceiro' : 'Partner'}</option>
                  </select>
                  <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}
                    className="h-9 px-3 text-xs bg-muted/50 border border-border text-muted-foreground rounded-lg focus:outline-none focus:border-primary/40">
                    <option value="">{pt ? 'Setor' : 'Industry'}</option>
                    <option value="consulting">{pt ? 'Consultoria' : 'Consulting'}</option>
                    <option value="design">Design</option>
                    <option value="technology">{pt ? 'Tecnologia' : 'Technology'}</option>
                    <option value="marketing">Marketing</option>
                    <option value="legal">{pt ? 'Jurídico' : 'Legal'}</option>
                    <option value="accounting">{pt ? 'Contabilidade' : 'Accounting'}</option>
                    <option value="health">{pt ? 'Saúde' : 'Health'}</option>
                    <option value="other">{pt ? 'Outro' : 'Other'}</option>
                  </select>
                  {(filterRelType || filterIndustry) && (
                    <button onClick={() => { setFilterRelType(''); setFilterIndustry(''); }}
                      className="h-9 px-3 text-xs text-muted-foreground hover:text-muted-foreground border border-border rounded-lg transition-colors">
                      {pt ? 'Limpar' : 'Clear'}
                    </button>
                  )}
                </div>

                {/* Empty state */}
                {baseFiltered.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/2 py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-7 h-7 text-primary/60" />
                    </div>
                    <h3 className="text-base font-semibold text-muted-foreground mb-2">
                      {searchTerm || filterRelType || filterIndustry
                        ? (pt ? 'Nenhum resultado encontrado.' : 'No results found.')
                        : clients.length === 0
                          ? (pt ? 'A sua base de clientes está vazia.' : 'Your client database is empty.')
                          : (pt ? emptyLabels[activeTab].title_pt : emptyLabels[activeTab].title_en)}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      {!searchTerm && !filterRelType && !filterIndustry && clients.length === 0
                        ? (pt ? 'Comece por adicionar o seu primeiro cliente para gerir o seu negócio.' : 'Start by adding your first client to begin managing your business.')
                        : (!searchTerm && !filterRelType && !filterIndustry && emptyLabels[activeTab].sub_en)
                          ? (pt ? emptyLabels[activeTab].sub_pt : emptyLabels[activeTab].sub_en)
                          : ''}
                    </p>
                    {!searchTerm && !filterRelType && !filterIndustry && activeTab !== 'archived' && (
                      <Button onClick={() => setShowDialog(true)} className="bg-primary hover:bg-primary/90 h-9 text-sm px-5 shadow-lg shadow-cyan-500/15">
                        <Plus className="w-4 h-4 mr-1.5" />
                        {pt ? 'Adicionar Cliente' : 'Add Client'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 mb-12">
                    {baseFiltered.map(client => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        stats={getClientStats(client)}
                        pt={pt}
                        today={today}
                        onEdit={() => handleEdit(client)}
                        onDelete={() => { if (confirm(pt ? 'Eliminar?' : 'Delete?')) deleteMutation.mutate(client.id); }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <ClientFormDialog
          open={showDialog}
          onOpenChange={(v) => { setShowDialog(v); if (!v) resetForm(); }}
          editingClient={editingClient}
          formData={formData}
          setFormData={setFormData}
          nifError={nifError}
          formError={formError}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          isSaving={createMutation.isPending || updateMutation.isPending}
          language={language}
          onPostAction={handlePostAction}
        />
      </div>
    </AccessGuard>
  );
}

// ── Client card component ─────────────────────────────────────────────────────
function ClientCard({ client, stats, pt, today, onEdit, onDelete }) {
  const stage = STAGE_META[client.pipeline_stage || 'lead'] || STAGE_META.lead;
  const inits = initials(client.name);
  const avColor = avatarColor(client.name);
  const followUpDue = client.next_action_date && client.next_action_date <= today && client.status !== 'inactive';
  const followUpToday = client.next_action_date === today;
  const isVIP = (client.tags || []).includes('VIP');

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-border transition-all">

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-foreground text-xs font-bold shadow-lg ${avColor}`}>
        {inits}
      </div>

      {/* Main info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-semibold text-foreground truncate">{client.name}</span>
          {isVIP && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" />}
          <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${stage.cls}`}>
            {pt ? stage.label_pt : stage.label_en}
          </span>
          {(client.tags || []).filter(t => t !== 'VIP').slice(0, 1).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300/70 flex-shrink-0">{tag}</span>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {client.company && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3 flex-shrink-0" />{client.company}
            </span>
          )}
          {client.service_category && (
            <span className="text-xs text-muted-foreground capitalize">{client.service_category}</span>
          )}
          {client.email && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground hidden sm:flex">
              <Mail className="w-3 h-3 flex-shrink-0" />{client.email}
            </span>
          )}
          {followUpDue && (
            <span className={`flex items-center gap-1 text-xs flex-shrink-0 ${followUpToday ? 'text-amber-400' : 'text-red-400/70'}`}>
              <Clock className="w-3 h-3" />
              {followUpToday ? (pt ? 'Follow-up hoje' : 'Follow-up today') : (pt ? 'Follow-up em atraso' : 'Follow-up overdue')}
            </span>
          )}
          {client.next_action_date && !followUpDue && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Calendar className="w-3 h-3" />{client.next_action_date}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
        {stats.hasOverdue && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">!</span>
        )}
        {stats.tasks > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-purple-300/70 bg-purple-500/8 px-2 py-0.5 rounded-full border border-purple-500/15">
            <CheckSquare className="w-2.5 h-2.5" />{stats.tasks}
          </span>
        )}
        {stats.invoices > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-amber-300/70 bg-amber-500/8 px-2 py-0.5 rounded-full border border-amber-500/15">
            <Receipt className="w-2.5 h-2.5" />{stats.invoices}
          </span>
        )}
        {stats.totalPaid > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-300/70 bg-emerald-500/8 px-2 py-0.5 rounded-full border border-emerald-500/15">
            <Euro className="w-2.5 h-2.5" />€{stats.totalPaid.toFixed(0)}
          </span>
        )}
      </div>

      {/* Actions */}
      <Link to={createPageUrl('ClientProfile') + `?id=${client.id}`} className="flex-shrink-0 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary/60 hover:text-primary hover:bg-primary/90/10">
          <Eye className="w-3.5 h-3.5 mr-1" />{pt ? 'Perfil' : 'Profile'}
        </Button>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent flex-shrink-0">
            <MoreVertical className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onEdit} className="gap-2 text-xs">
            <Pencil className="w-3.5 h-3.5" />{pt ? 'Editar' : 'Edit'}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={createPageUrl('ClientProfile') + `?id=${client.id}`} className="flex items-center gap-2 text-xs">
              <Eye className="w-3.5 h-3.5" />{pt ? 'Ver Perfil' : 'View Profile'}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-xs text-red-500 focus:text-red-500" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />{pt ? 'Eliminar' : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}