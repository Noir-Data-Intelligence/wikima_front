import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus, Users, CheckSquare, Search,
  AlertTriangle, MoreHorizontal,
  Activity, UserCheck, X,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';
import TeamMemberDialog from '@/components/team/TeamMemberDialog';
import TeamTaskDialog from '@/components/team/TeamTaskDialog';
import AccessGuard from '@/components/AccessGuard';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PRIORITY_COLORS = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  urgent: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

const STATUS_COLORS = {
  todo: 'bg-slate-500/20 text-muted-foreground border-slate-500/30',
  in_progress: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  waiting: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const ACCESS_ROLE_CONFIG = {
  owner:         { label_pt: 'Owner',          label_en: 'Owner',          color: 'bg-orange-500/15 text-orange-300 border-orange-500/25' },
  admin:         { label_pt: 'Administrador',   label_en: 'Administrator',  color: 'bg-rose-500/15 text-rose-300 border-rose-500/25' },
  manager:       { label_pt: 'Manager',         label_en: 'Manager',        color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25' },
  member:        { label_pt: 'Colaborador',     label_en: 'Employee',       color: 'bg-slate-500/15 text-muted-foreground border-slate-500/25' },
};

export function MemberAvatar({ member, size = 'md' }) {
  const initials = (member.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs';
  if (member.photo_url) {
    return (
      <img src={member.photo_url} alt={member.full_name}
        className={`${sizeClass} rounded-xl object-cover flex-shrink-0 border border-border`}
        onError={e => { e.target.style.display = 'none'; }}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-xl flex items-center justify-center font-bold text-foreground flex-shrink-0 shadow-lg`}
      style={{ backgroundColor: member.avatar_color || '#e97c3f' }}>
      {initials}
    </div>
  );
}

export function AccessRoleBadge({ role, pt }) {
  const cfg = ACCESS_ROLE_CONFIG[role] || ACCESS_ROLE_CONFIG.member;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
      {pt ? cfg.label_pt : cfg.label_en}
    </span>
  );
}

function InvitationBadge({ status, pt }) {
  if (!status || status === 'accepted') return null;
  const cfg = {
    pending:  { label_pt: 'Convite Pendente',  label_en: 'Invite Pending',  cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    expired:  { label_pt: 'Convite Expirado',  label_en: 'Invite Expired',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    sent:     { label_pt: 'Convite Enviado',   label_en: 'Invite Sent',     cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  }[status] || { label_pt: status, label_en: status, cls: 'bg-muted text-muted-foreground border-border' };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
      {pt ? cfg.label_pt : cfg.label_en}
    </span>
  );
}

function WorkloadBar({ active, pt }) {
  // Simple indicator: 0-3 = low, 4-6 = medium, 7+ = high
  const level = active === 0 ? 'none' : active <= 3 ? 'low' : active <= 6 ? 'medium' : 'high';
  const pct = Math.min(100, (active / 8) * 100);
  const barColor = level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
  if (active === 0) return <span className="text-[10px] text-muted-foreground">{pt ? 'Sem carga' : 'No load'}</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground">{active}</span>
    </div>
  );
}

function StatusBadge({ member, pt }) {
  if (member.invitation_status === 'pending' || member.invitation_status === 'sent') {
    return <span className="text-[10px] px-2 py-0.5 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">{pt ? 'Convite Pendente' : 'Invite Pending'}</span>;
  }
  if (member.invitation_status === 'expired') {
    return <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">{pt ? 'Expirado' : 'Expired'}</span>;
  }
  if (member.status === 'inactive') {
    return <span className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-500/10 text-gray-400 border-gray-500/20">{pt ? 'Inativo' : 'Inactive'}</span>;
  }
  return <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{pt ? 'Ativo' : 'Active'}</span>;
}

export default function Team() {
  const { language } = useLanguage();
  const pt = language === 'pt';
  const locale = pt ? ptBR : enUS;
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [view, setView]                 = useState('members');
  const [search, setSearch]             = useState('');
  const [filterDept, setFilterDept]     = useState('all');
  const [filterRole, setFilterRole]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen]     = useState(false);
  const [editingMember, setEditingMember]       = useState(null);
  const [editingTask, setEditingTask]           = useState(null);
  const [selectedMember, setSelectedMember]     = useState(null);

  const { data: workspaceData } = useQuery({
    queryKey: ['workspaceData'],
    queryFn: async () => {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;
      if (!wsId) return { id: null, name: '', companyName: '', companyLogoUrl: '' };
      const ws = await api.entities.Workspace.get(wsId);
      return {
        id: wsId,
        name: ws?.name || '',
        companyName: ws?.company_info?.company_name || ws?.name || '',
        companyLogoUrl: ws?.logo_url || ''
      };
    }
  });
  const workspaceId     = workspaceData?.id;
  const workspaceName   = workspaceData?.name;
  const companyName     = workspaceData?.companyName;
  const companyLogoUrl  = workspaceData?.companyLogoUrl;

  const { data: members = [] } = useQuery({
    queryKey: ['teamMembers', workspaceId],
    queryFn: () => api.entities.TeamMember.filter({ workspace_id: workspaceId }, 'full_name'),
    enabled: !!workspaceId,
    refetchInterval: 15000
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', workspaceId],
    queryFn: () => api.entities.Task.filter({ workspace_id: workspaceId }, '-deadline'),
    enabled: !!workspaceId,
    refetchInterval: 15000
  });

  // Mutations
  const createMember = useMutation({
    mutationFn: (data) => api.entities.TeamMember.create({ ...data, workspace_id: workspaceId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teamMembers', workspaceId] }); setMemberDialogOpen(false); toast.success(pt ? '✅ Membro adicionado!' : '✅ Member added!'); }
  });
  const updateMember = useMutation({
    mutationFn: ({ id, data }) => api.entities.TeamMember.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teamMembers', workspaceId] }); setMemberDialogOpen(false); setEditingMember(null); toast.success(pt ? '✅ Atualizado!' : '✅ Updated!'); }
  });
  const deleteMember = useMutation({
    mutationFn: (id) => api.entities.TeamMember.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teamMembers', workspaceId] }); setMemberDialogOpen(false); setEditingMember(null); toast.success(pt ? '🗑️ Membro removido.' : '🗑️ Member removed.'); }
  });
  const createTask = useMutation({
    mutationFn: (data) => api.entities.Task.create({ ...data, workspace_id: workspaceId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] }); setTaskDialogOpen(false); toast.success(pt ? '✅ Tarefa criada!' : '✅ Task created!'); }
  });
  const updateTask = useMutation({
    mutationFn: ({ id, data }) => api.entities.Task.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] }); setTaskDialogOpen(false); setEditingTask(null); toast.success(pt ? '✅ Tarefa atualizada!' : '✅ Task updated!'); }
  });
  const deleteTask = useMutation({
    mutationFn: (id) => api.entities.Task.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] }); setTaskDialogOpen(false); setEditingTask(null); }
  });

  const suspendMember = useMutation({
    mutationFn: (id) => api.entities.TeamMember.update(id, { status: 'inactive' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teamMembers', workspaceId] }); setMemberDialogOpen(false); setEditingMember(null); toast.success(pt ? '⏸️ Membro suspenso.' : '⏸️ Member suspended.'); }
  });

  const reactivateMember = useMutation({
    mutationFn: (id) => api.entities.TeamMember.update(id, { status: 'active' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teamMembers', workspaceId] }); setMemberDialogOpen(false); setEditingMember(null); toast.success(pt ? '✅ Membro reativado!' : '✅ Member reactivated!'); }
  });

  const cancelInvite = useMutation({
    mutationFn: (id) => api.entities.TeamMember.update(id, { invitation_status: 'expired' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teamMembers', workspaceId] }); setMemberDialogOpen(false); toast.success(pt ? 'Convite cancelado.' : 'Invitation cancelled.'); }
  });

  const handleSaveMember = (form) => {
    if (editingMember) updateMember.mutate({ id: editingMember.id, data: form });
    else createMember.mutate(form);
  };
  const handleSaveTask = (form) => {
    if (editingTask) updateTask.mutate({ id: editingTask.id, data: form });
    else createTask.mutate(form);
  };
  const openNewMember  = () => { setEditingMember(null); setMemberDialogOpen(true); };
  const openEditMember = (m) => { setEditingMember(m); setMemberDialogOpen(true); };
  const openNewTask    = (memberId = null) => { setEditingTask(null); setSelectedMember(memberId); setTaskDialogOpen(true); };
  const openEditTask   = (task) => { setEditingTask(task); setTaskDialogOpen(true); };

  // KPIs
  const activeMembers  = members.filter(m => m.status === 'active');
  const activeTasks    = allTasks.filter(t => !['completed', 'cancelled'].includes(t.status));
  const overdueTasks   = allTasks.filter(t => !['completed', 'cancelled'].includes(t.status) && t.deadline && new Date(t.deadline) < new Date());

  // Unique departments and roles for filters
  const departments = ['all', ...new Set(members.map(m => m.department).filter(Boolean))];
  const roles       = ['all', 'owner', 'admin', 'manager', 'member'];

  // Filtered members
  const filteredMembers = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.full_name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.role?.toLowerCase().includes(q) || m.department?.toLowerCase().includes(q);
    const matchDept   = filterDept === 'all'   || m.department === filterDept;
    const matchRole   = filterRole === 'all'   || m.app_role   === filterRole;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'pending' ? (m.invitation_status === 'pending' || m.invitation_status === 'sent') : m.status === filterStatus);
    return matchSearch && matchDept && matchRole && matchStatus;
  });

  const getMemberActiveTasks = (memberId) => allTasks.filter(t => t.assigned_to === memberId && !['completed', 'cancelled'].includes(t.status));
  const getMemberLastActivity = (memberId) => {
    const memberTasks = allTasks.filter(t => t.assigned_to === memberId);
    if (!memberTasks.length) return null;
    return memberTasks.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date))[0];
  };

  // Activity feed: combine task events + member events
  const activityFeed = [
    ...members.map(m => ({ type: 'member_added', date: m.created_date, member: m, text_pt: `${m.full_name} adicionado à equipa`, text_en: `${m.full_name} added to team` })),
    ...members.filter(m => m.joined_at).map(m => ({ type: 'invite_accepted', date: m.joined_at, member: m, text_pt: `${m.full_name} aceitou o convite`, text_en: `${m.full_name} accepted the invite` })),
    ...allTasks.map(t => {
      const m = members.find(x => x.id === t.assigned_to);
      return { type: 'task_event', date: t.updated_date || t.created_date, member: m, task: t, text_pt: `Tarefa "${t.title}" – ${t.status}`, text_en: `Task "${t.title}" – ${t.status}` };
    }),
  ].filter(e => e.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

  const statusLabels = {
    pt: { todo: 'Por Fazer', in_progress: 'Em Progresso', waiting: 'Em Espera', completed: 'Concluída', cancelled: 'Cancelada' },
    en: { todo: 'To Do', in_progress: 'In Progress', waiting: 'Waiting', completed: 'Completed', cancelled: 'Cancelled' }
  };
  const priorityLabels = {
    pt: { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' },
    en: { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }
  };

  return (
    <AccessGuard page="Team">
      <div className="min-h-screen bg-background">
        
        

        <main className="p-5 lg:pt-6 md:p-8 md:pt-8">
          <div className="max-w-[1600px] mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div>
                <h1 className="text-xl font-bold text-foreground">{pt ? 'Equipa' : 'Team'}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{pt ? 'Gestão operacional da equipa.' : 'Operational team management.'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openNewTask()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-accent text-xs transition-all">
                  <Plus className="w-3.5 h-3.5" />{pt ? 'Tarefa' : 'Task'}
                </button>
                <Button onClick={openNewMember} className="gap-1.5 h-8 text-xs px-3 shadow-lg shadow-orange-500/15" style={{ backgroundColor: '#e97c3f' }}>
                  <Plus className="w-3.5 h-3.5" />{pt ? 'Membro' : 'Member'}
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: pt ? 'Total Membros' : 'Total Members',    value: members.length,       color: '#e97c3f', icon: Users },
                { label: pt ? 'Membros Ativos' : 'Active Members',  value: activeMembers.length, color: '#22c55e', icon: UserCheck },
                { label: pt ? 'Tarefas Ativas' : 'Active Tasks',    value: activeTasks.length,   color: '#6366f1', icon: CheckSquare },
                { label: pt ? 'Em Atraso' : 'Overdue Tasks',        value: overdueTasks.length,  color: overdueTasks.length > 0 ? '#ef4444' : '#64748b', icon: AlertTriangle },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <s.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.color }} />
                    <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0 mb-4 border-b border-border">
              {[
                { id: 'members',  label: pt ? 'Membros'   : 'Members',  icon: Users },
                { id: 'tasks',    label: pt ? 'Tarefas'   : 'Tasks',    icon: CheckSquare },
                { id: 'activity', label: pt ? 'Atividade' : 'Activity', icon: Activity },
              ].map(tab => {
                const Icon = tab.icon;
                const active = view === tab.id;
                return (
                  <button key={tab.id} onClick={() => setView(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all -mb-px ${
                      active ? 'border-orange-400 text-orange-300' : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
                    }`}>
                    <Icon className="w-3.5 h-3.5" />{tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── MEMBERS VIEW ── */}
            {view === 'members' && (
              <>
                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input placeholder={pt ? 'Pesquisar membros...' : 'Search members...'}
                      value={search} onChange={e => setSearch(e.target.value)}
                      className="pl-9 h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-orange-500/40 text-sm" />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterDept} onValueChange={setFilterDept}>
                      <SelectTrigger className="w-32 h-9 bg-muted/50 border-border text-muted-foreground text-xs">
                        <SelectValue placeholder={pt ? 'Departamento' : 'Department'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{pt ? 'Todos Dep.' : 'All Depts'}</SelectItem>
                        {departments.filter(d => d !== 'all').map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="w-32 h-9 bg-muted/50 border-border text-muted-foreground text-xs">
                        <SelectValue placeholder={pt ? 'Nível' : 'Role'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{pt ? 'Todos' : 'All'}</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">{pt ? 'Administrador' : 'Administrator'}</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">{pt ? 'Colaborador' : 'Employee'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-28 h-9 bg-muted/50 border-border text-muted-foreground text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{pt ? 'Todos' : 'All'}</SelectItem>
                        <SelectItem value="active">{pt ? 'Ativos' : 'Active'}</SelectItem>
                        <SelectItem value="pending">{pt ? 'Pendentes' : 'Pending'}</SelectItem>
                        <SelectItem value="inactive">{pt ? 'Inativos' : 'Inactive'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 mb-12">
                  {filteredMembers.length === 0 ? (
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] py-12 text-center">
                      <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">{pt ? 'Nenhum membro encontrado.' : 'No members found.'}</p>
                      <p className="text-xs text-muted-foreground mb-4">{pt ? 'Ajusta os filtros ou adiciona um novo membro.' : 'Adjust filters or add a new member.'}</p>
                      <Button onClick={openNewMember} className="h-8 text-xs gap-1.5" style={{ backgroundColor: '#e97c3f' }}>
                        <Plus className="w-3.5 h-3.5" />{pt ? 'Adicionar Membro' : 'Add Member'}
                      </Button>
                    </div>
                  ) : (
                    filteredMembers.map(member => {
                      const activeMemberTasks = getMemberActiveTasks(member.id);
                      const lastTask          = getMemberLastActivity(member.id);
                      return (
                        <div key={member.id} className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-border transition-all">
                          {/* Avatar */}
                          <MemberAvatar member={member} size="lg" />

                          {/* Main info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="text-sm font-semibold text-foreground">{member.full_name}</span>
                              <AccessRoleBadge role={member.app_role} pt={pt} />
                              <StatusBadge member={member} pt={pt} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {member.role && <span className="text-xs text-muted-foreground">{member.role}</span>}
                              {member.department && <span className="text-xs text-muted-foreground">· {member.department}</span>}
                              {member.email && <span className="text-xs text-muted-foreground hidden md:block">· {member.email}</span>}
                            </div>
                          </div>

                          {/* Workload + last activity */}
                          <div className="hidden lg:flex flex-col items-end gap-1 flex-shrink-0 min-w-24">
                            <WorkloadBar active={activeMemberTasks.length} pt={pt} />
                            {lastTask && (
                              <span className="text-[10px] text-muted-foreground text-right">
                                {formatDistanceToNow(new Date(lastTask.updated_date || lastTask.created_date), { addSuffix: true, locale })}
                              </span>
                            )}
                          </div>

                          {/* Active tasks count */}
                          <div className="hidden md:flex flex-col items-center flex-shrink-0 w-12">
                            <span className="text-lg font-bold text-orange-400">{activeMemberTasks.length}</span>
                            <span className="text-[10px] text-muted-foreground">{pt ? 'ativas' : 'active'}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button title={pt ? 'Atribuir tarefa' : 'Assign task'}
                              onClick={() => openNewTask(member.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10 transition-all opacity-0 group-hover:opacity-100">
                              <CheckSquare className="w-4 h-4" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all opacity-0 group-hover:opacity-100">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                                <DropdownMenuItem asChild className="text-xs cursor-pointer">
                                  <Link to={`${createPageUrl('TeamMemberProfile')}?id=${member.id}`}>
                                    {pt ? 'Ver perfil' : 'View profile'}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditMember(member)} className="text-xs cursor-pointer">
                                  {pt ? 'Editar membro' : 'Edit member'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Link to={`${createPageUrl('TeamMemberProfile')}?id=${member.id}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-muted-foreground transition-all opacity-0 group-hover:opacity-100">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* ── TASKS VIEW ── */}
            {view === 'tasks' && (
              <div className="space-y-2 mb-12">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder={pt ? 'Pesquisar tarefas...' : 'Search tasks...'}
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-orange-500/40 text-sm" />
                </div>
                {allTasks.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] py-12 text-center">
                    <CheckSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">{pt ? 'Sem tarefas ainda.' : 'No team tasks yet.'}</p>
                    <Button onClick={() => openNewTask()} className="h-8 text-xs gap-1.5" style={{ backgroundColor: '#e97c3f' }}>
                      <Plus className="w-3.5 h-3.5" />{pt ? 'Criar Tarefa' : 'Create Task'}
                    </Button>
                  </div>
                ) : (
                  allTasks
                    .filter(t => !search || t.title?.toLowerCase().includes(search.toLowerCase()))
                    .map(task => {
                      const assignedMember = members.find(m => m.id === task.assigned_to);
                      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !['completed', 'cancelled'].includes(task.status);
                      return (
                        <div key={task.id} onClick={() => openEditTask(task)}
                          className="group flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-border cursor-pointer transition-all">
                          <CheckSquare className={`w-4 h-4 flex-shrink-0 ${task.status === 'completed' ? 'text-green-400' : 'text-muted-foreground'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate mb-0.5 ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2">
                              {assignedMember && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MemberAvatar member={assignedMember} size="sm" />
                                  {assignedMember.full_name}
                                </span>
                              )}
                              {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{pt ? 'Em atraso' : 'Overdue'}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                              {priorityLabels[pt ? 'pt' : 'en'][task.priority] || task.priority}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[task.status]}`}>
                              {statusLabels[pt ? 'pt' : 'en'][task.status] || task.status}
                            </span>
                            {task.deadline && (
                              <span className={`text-xs hidden md:block ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                                {new Date(task.deadline).toLocaleDateString(pt ? 'pt-PT' : 'en-US')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* ── ACTIVITY VIEW ── */}
            {view === 'activity' && (
              <div className="mb-12">
                {activityFeed.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] py-12 text-center">
                    <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{pt ? 'Sem atividade registada.' : 'No activity yet.'}</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-muted/50" />
                    <div className="space-y-2">
                      {activityFeed.map((event, i) => {
                        const dotColor = event.type === 'invite_accepted' ? 'bg-emerald-400' : event.type === 'member_added' ? 'bg-blue-400' : event.task?.status === 'completed' ? 'bg-green-400' : event.task?.status === 'in_progress' ? 'bg-indigo-400' : 'bg-slate-400';
                        return (
                          <div key={i} className="flex gap-3 items-start">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 bg-muted/50 border border-border`}>
                              {event.member ? (
                                <MemberAvatar member={event.member} size="sm" />
                              ) : (
                                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5">
                              <p className="text-sm text-muted-foreground">{pt ? event.text_pt : event.text_en}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(event.date), { addSuffix: true, locale })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>

        <TeamMemberDialog
          open={memberDialogOpen}
          onClose={() => { setMemberDialogOpen(false); setEditingMember(null); }}
          member={editingMember}
          onSave={handleSaveMember}
          onSuspend={(id) => suspendMember.mutate(id)}
          onReactivate={(id) => reactivateMember.mutate(id)}
          onCancelInvite={(id) => cancelInvite.mutate(id)}
          language={language}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          companyName={companyName}
          companyLogoUrl={companyLogoUrl}
        />
        <TeamTaskDialog
          open={taskDialogOpen}
          onClose={() => { setTaskDialogOpen(false); setEditingTask(null); setSelectedMember(null); }}
          task={editingTask ? { ...editingTask, assigned_to: editingTask.assigned_to || selectedMember || '' } : (selectedMember ? { assigned_to: selectedMember } : null)}
          members={members}
          onSave={handleSaveTask}
          onDelete={(id) => { if (confirm(pt ? 'Eliminar esta tarefa?' : 'Delete this task?')) deleteTask.mutate(id); }}
          language={language}
        />
      </div>
    </AccessGuard>
  );
}