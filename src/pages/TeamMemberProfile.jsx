import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Edit, CheckSquare, Calendar, FileText, Activity,
  Shield, Clock, AlertTriangle, CheckCircle2, Mail, Phone,
  Building2, User, BarChart3, PauseCircle, PlayCircle, Check, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import MobileMenuButton from '@/components/dashboard/MobileMenuButton';
import TeamMemberDialog from '@/components/team/TeamMemberDialog';
import TeamTaskDialog from '@/components/team/TeamTaskDialog';
import { MemberAvatar, AccessRoleBadge } from './Team';

const STATUS_COLORS = {
  todo:        'bg-slate-500/20 text-muted-foreground border-slate-500/30',
  in_progress: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  waiting:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
  completed:   'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled:   'bg-gray-500/20 text-gray-400 border-gray-500/30'
};
const PRIORITY_COLORS = {
  low:    'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high:   'bg-red-500/20 text-red-400 border-red-500/30',
  urgent: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

const TABS = [
  { key: 'overview',    icon: User,        label_pt: 'Visão Geral',  label_en: 'Overview'     },
  { key: 'tasks',       icon: CheckSquare, label_pt: 'Tarefas',       label_en: 'Tasks'        },
  { key: 'agenda',      icon: Calendar,    label_pt: 'Agenda',        label_en: 'Agenda'       },
  { key: 'documents',   icon: FileText,    label_pt: 'Documentos',    label_en: 'Documents'    },
  { key: 'activity',    icon: Activity,    label_pt: 'Atividade',     label_en: 'Activity'     },
  { key: 'permissions', icon: Shield,      label_pt: 'Permissões',    label_en: 'Permissions'  },
];

// Full permissions matrix per role
const PERMISSIONS = (pt) => [
  { key: 'manage_clients',   label: pt ? 'Gerir Clientes'       : 'Manage Clients',     owner: true,  admin: true,  manager: true,  member: false },
  { key: 'manage_team',      label: pt ? 'Gerir Equipa'         : 'Manage Team',         owner: true,  admin: true,  manager: false, member: false },
  { key: 'create_tasks',     label: pt ? 'Criar Tarefas'        : 'Create Tasks',        owner: true,  admin: true,  manager: true,  member: false },
  { key: 'assign_tasks',     label: pt ? 'Atribuir Tarefas'     : 'Assign Tasks',        owner: true,  admin: true,  manager: true,  member: false },
  { key: 'create_invoices',  label: pt ? 'Criar Faturas'        : 'Create Invoices',     owner: true,  admin: true,  manager: false, member: false },
  { key: 'view_reports',     label: pt ? 'Ver Relatórios'       : 'View Reports',        owner: true,  admin: true,  manager: true,  member: false },
  { key: 'manage_settings',  label: pt ? 'Gerir Definições'     : 'Manage Settings',     owner: true,  admin: true,  manager: false, member: false },
  { key: 'manage_workspace', label: pt ? 'Gerir Workspace'      : 'Manage Workspace',    owner: true,  admin: false, manager: false, member: false },
];

const ROLE_COLORS = { owner: '#e97c3f', admin: '#ef4444', manager: '#6366f1', member: '#22c55e' };

export default function TeamMemberProfile() {
  const { language } = useLanguage();
  const pt     = language === 'pt';
  const locale = pt ? ptBR : enUS;
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [activeTab, setActiveTab]           = useState('overview');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask]       = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const memberId  = urlParams.get('id');

  const { data: workspaceData } = useQuery({
    queryKey: ['workspaceData'],
    queryFn: async () => {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;
      if (!wsId) return { id: null, name: '' };
      const ws = await api.entities.Workspace.get(wsId);
      return { id: wsId, name: ws?.name || '', companyName: ws?.company_info?.company_name || ws?.name || '', companyLogoUrl: ws?.logo_url || '' };
    }
  });
  const workspaceId = workspaceData?.id;

  const { data: member, isLoading } = useQuery({
    queryKey: ['teamMember', memberId],
    queryFn: () => api.entities.TeamMember.filter({ id: memberId }).then(r => r[0]),
    enabled: !!memberId,
    refetchInterval: 15000
  });

  const { data: members = [] } = useQuery({
    queryKey: ['teamMembers', workspaceId],
    queryFn: () => api.entities.TeamMember.filter({ workspace_id: workspaceId }, 'full_name'),
    enabled: !!workspaceId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['member-tasks', memberId],
    queryFn: () => api.entities.Task.filter({ assigned_to: memberId }, '-deadline'),
    enabled: !!memberId,
    refetchInterval: 10000
  });

  const { data: agendaEvents = [] } = useQuery({
    queryKey: ['agendaEvents', workspaceId],
    queryFn: () => api.entities.AgendaEvent.filter({ workspace_id: workspaceId }),
    enabled: !!workspaceId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', workspaceId],
    queryFn: () => api.entities.Document.filter({ workspace_id: workspaceId }),
    enabled: !!workspaceId
  });

  const updateMember = useMutation({
    mutationFn: (data) => api.entities.TeamMember.update(memberId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teamMember', memberId] }); queryClient.invalidateQueries({ queryKey: ['teamMembers', workspaceId] }); setEditDialogOpen(false); }
  });

  const suspendMember = useMutation({
    mutationFn: () => api.entities.TeamMember.update(memberId, { status: 'inactive' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teamMember', memberId] }); }
  });

  const reactivateMember = useMutation({
    mutationFn: () => api.entities.TeamMember.update(memberId, { status: 'active' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teamMember', memberId] }); }
  });

  const createTask = useMutation({
    mutationFn: (data) => api.entities.Task.create({ ...data, workspace_id: workspaceId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['member-tasks', memberId] }); setTaskDialogOpen(false); }
  });
  const updateTask = useMutation({
    mutationFn: ({ id, data }) => api.entities.Task.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['member-tasks', memberId] }); setTaskDialogOpen(false); setEditingTask(null); }
  });
  const deleteTask = useMutation({
    mutationFn: (id) => api.entities.Task.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['member-tasks', memberId] }); setTaskDialogOpen(false); setEditingTask(null); }
  });

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-orange-400 rounded-full animate-spin" />
    </div>
  );
  if (!member) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">{pt ? 'Membro não encontrado.' : 'Member not found.'}</p>
        <Link to={createPageUrl('Team')}><Button variant="outline">{pt ? 'Voltar' : 'Go Back'}</Button></Link>
      </div>
    </div>
  );

  const activeTasks    = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks   = tasks.filter(t => !['completed', 'cancelled'].includes(t.status) && t.deadline && new Date(t.deadline) < new Date());
  const workloadPct    = Math.min(100, (activeTasks.length / 8) * 100);
  const workloadLevel  = activeTasks.length === 0 ? 'none' : activeTasks.length <= 3 ? 'low' : activeTasks.length <= 6 ? 'medium' : 'high';
  const workloadColor  = workloadLevel === 'high' ? 'bg-red-500' : workloadLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
  const workloadDot    = workloadLevel === 'high' ? '🔴' : workloadLevel === 'medium' ? '🟡' : workloadLevel === 'none' ? '⚪' : '🟢';
  const isSuspended    = member.status === 'inactive';
  const supervisor     = member.reports_to ? members.find(m => m.id === member.reports_to) : null;

  const statusLabels = {
    pt: { todo: 'Por Fazer', in_progress: 'Em Progresso', waiting: 'Bloqueada', completed: 'Concluída', cancelled: 'Cancelada' },
    en: { todo: 'Not Started', in_progress: 'In Progress', waiting: 'Blocked', completed: 'Completed', cancelled: 'Cancelled' }
  };
  const priorityLabels = {
    pt: { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' },
    en: { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }
  };

  // Activity feed
  const activityFeed = [
    member.created_date        && { date: member.created_date,        icon: '👤', text_pt: 'Membro adicionado à equipa',  text_en: 'Member added to team' },
    member.invitation_sent_at  && { date: member.invitation_sent_at,  icon: '📧', text_pt: 'Convite enviado',              text_en: 'Invitation sent' },
    member.joined_at           && { date: member.joined_at,           icon: '✅', text_pt: 'Convite aceite — membro ativo', text_en: 'Invite accepted — member active' },
    isSuspended                && { date: member.updated_date,        icon: '⏸️', text_pt: 'Membro suspenso',              text_en: 'Member suspended' },
    ...tasks.map(t => ({
      date: t.updated_date || t.created_date,
      icon: t.status === 'completed' ? '✅' : t.status === 'waiting' ? '🚫' : t.status === 'in_progress' ? '▶️' : '📋',
      text_pt: `Tarefa "${t.title}" → ${statusLabels.pt[t.status] || t.status}`,
      text_en: `Task "${t.title}" → ${statusLabels.en[t.status] || t.status}`
    }))
  ].filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));

  const perms = PERMISSIONS(pt);
  const role  = member.app_role || 'member';

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 md:px-6 py-3 flex items-center justify-between">
          <Link to={createPageUrl('Team')}>
            <Button variant="ghost" className="gap-2 text-blue-300 hover:text-foreground hover:bg-accent/50 text-sm px-2">
              <ArrowLeft className="w-4 h-4" />{pt ? 'Equipa' : 'Team'}
            </Button>
          </Link>
          <div className="flex gap-2">
            {isSuspended ? (
              <Button size="sm" onClick={() => reactivateMember.mutate()}
                className="gap-1.5 h-8 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20">
                <PlayCircle className="w-3.5 h-3.5" />{pt ? 'Reativar' : 'Reactivate'}
              </Button>
            ) : member.joined_at && (
              <Button size="sm" onClick={() => suspendMember.mutate()}
                className="gap-1.5 h-8 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20">
                <PauseCircle className="w-3.5 h-3.5" />{pt ? 'Suspender' : 'Suspend'}
              </Button>
            )}
            <Button size="sm" onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}
              className="gap-1.5 h-8 text-xs bg-white/8 hover:bg-white/15 text-foreground border border-border">
              <CheckSquare className="w-3.5 h-3.5" />{pt ? 'Atribuir Tarefa' : 'Assign Task'}
            </Button>
            <Button size="sm" onClick={() => setEditDialogOpen(true)}
              className="gap-1.5 h-8 text-xs bg-white/8 hover:bg-white/15 text-foreground border border-border">
              <Edit className="w-3.5 h-3.5" />{pt ? 'Editar' : 'Edit'}
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Member header */}
          <div className="rounded-2xl bg-card border border-white/8 p-5 mb-4">
            <div className="flex items-start gap-4">
              <MemberAvatar member={member} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <h1 className="text-xl font-bold text-foreground">{member.full_name}</h1>
                  <AccessRoleBadge role={member.app_role} pt={pt} />
                  {isSuspended
                    ? <span className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-500/10 text-gray-400 border-gray-500/20">{pt ? 'Suspenso' : 'Suspended'}</span>
                    : member.invitation_status === 'accepted'
                      ? <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{pt ? 'Ativo' : 'Active'}</span>
                      : member.invitation_status === 'pending'
                        ? <span className="text-[10px] px-2 py-0.5 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">{pt ? 'Convite Pendente' : 'Invite Pending'}</span>
                        : <span className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-500/10 text-gray-400 border-gray-500/20">{pt ? 'Inativo' : 'Inactive'}</span>
                  }
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {member.role       && <span className="flex items-center gap-1 text-sm text-muted-foreground"><User className="w-3.5 h-3.5" />{member.role}</span>}
                  {member.department && <span className="flex items-center gap-1 text-sm text-muted-foreground"><Building2 className="w-3.5 h-3.5" />{member.department}</span>}
                  {member.email      && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{member.email}</span>}
                  {member.phone      && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{member.phone}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: pt ? 'Tarefas Ativas'  : 'Active Tasks',    value: activeTasks.length,    color: 'text-orange-300', icon: CheckSquare  },
              { label: pt ? 'Concluídas'       : 'Completed',       value: completedTasks.length, color: 'text-emerald-300', icon: CheckCircle2 },
              { label: pt ? 'Em Atraso'         : 'Overdue',         value: overdueTasks.length,   color: overdueTasks.length > 0 ? 'text-red-300' : 'text-muted-foreground', icon: AlertTriangle },
              { label: pt ? 'Carga de Trabalho' : 'Workload',        value: `${activeTasks.length}/8`, color: 'text-indigo-300', icon: BarChart3 },
            ].map((k, i) => (
              <div key={i} className="rounded-xl bg-card border border-white/8 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
                  <span className="text-[10px] text-muted-foreground">{k.label}</span>
                </div>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Workload bar */}
          <div className="rounded-xl bg-card border border-white/8 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />{pt ? 'Indicador de Carga' : 'Workload Indicator'}
              </span>
              <span className={`text-xs font-semibold ${workloadLevel === 'high' ? 'text-red-400' : workloadLevel === 'medium' ? 'text-amber-400' : workloadLevel === 'low' ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                {workloadDot} {activeTasks.length} {pt ? 'tarefas ativas' : 'active tasks'}
              </span>
            </div>
            <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all ${workloadColor}`} style={{ width: `${workloadPct}%` }} />
            </div>
            {/* Breakdown */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                🟢 {activeTasks.filter(t => t.status === 'in_progress').length} {pt ? 'Em progresso' : 'In progress'}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                🟡 {activeTasks.filter(t => t.status === 'todo').length} {pt ? 'Por iniciar' : 'Not started'}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                🔴 {overdueTasks.length} {pt ? 'Em atraso' : 'Overdue'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              {pt ? 'Capacidade máx. recomendada: 8 tarefas ativas' : 'Recommended max capacity: 8 active tasks'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 mb-4 border-b border-white/8 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                    active ? 'border-orange-400 text-orange-300' : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />{pt ? tab.label_pt : tab.label_en}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="rounded-2xl bg-card border border-white/8 p-5">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Informação Pessoal' : 'Personal Info'}</h3>
                  {[
                    { label: pt ? 'Nome Completo'   : 'Full Name',    value: member.full_name },
                    { label: pt ? 'Cargo'            : 'Job Title',   value: member.role },
                    { label: pt ? 'Departamento'     : 'Department',  value: member.department },
                    { label: 'Email',                                   value: member.email },
                    { label: pt ? 'Telefone'         : 'Phone',       value: member.phone },
                    { label: pt ? 'Reporta a'        : 'Reports To',  value: supervisor ? supervisor.full_name : member.reports_to_name || null },
                  ].filter(r => r.value).map((row, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{row.label}</span>
                      <span className="text-sm text-foreground/75 flex-1 break-all">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Status & Acesso' : 'Status & Access'}</h3>
                  {[
                    { label: pt ? 'Nível de Acesso'    : 'Access Level',     value: pt ? { owner: 'Owner', admin: 'Administrador', manager: 'Manager', member: 'Colaborador' }[role] : { owner: 'Owner', admin: 'Administrator', manager: 'Manager', member: 'Employee' }[role] },
                    { label: pt ? 'Criado por'          : 'Created by',       value: member.invited_by_name || member.invited_by_email },
                    { label: pt ? 'Membro desde'        : 'Member since',     value: member.joined_at ? format(new Date(member.joined_at), 'dd MMM yyyy', { locale }) : null },
                    { label: pt ? 'Criado em'           : 'Created date',     value: member.created_date ? format(new Date(member.created_date), 'dd MMM yyyy', { locale }) : null },
                    { label: pt ? 'Convite enviado'     : 'Invite sent',      value: member.invitation_sent_at ? format(new Date(member.invitation_sent_at), 'dd MMM yyyy HH:mm', { locale }) : null },
                    { label: pt ? 'Estado do convite'   : 'Invite status',    value: member.invitation_status || 'N/A' },
                    { label: pt ? 'Última atividade'    : 'Last activity',    value: tasks.length ? formatDistanceToNow(new Date(tasks[0].updated_date || tasks[0].created_date), { addSuffix: true, locale }) : null },
                  ].filter(r => r.value).map((row, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{row.label}</span>
                      <span className="text-sm text-foreground/75 flex-1">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TASKS */}
            {activeTab === 'tasks' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-muted-foreground">{tasks.length} {pt ? 'tarefas no total' : 'tasks total'}</p>
                  <Button size="sm" onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}
                    className="h-7 text-xs gap-1.5 bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/20">
                    <CheckSquare className="w-3 h-3" />{pt ? 'Nova Tarefa' : 'New Task'}
                  </Button>
                </div>
                {tasks.length === 0
                  ? <EmptyTabState icon={CheckSquare} label={pt ? 'Sem tarefas atribuídas.' : 'No tasks assigned.'} />
                  : tasks.map(t => {
                      const isOverdue = t.deadline && new Date(t.deadline) < new Date() && !['completed', 'cancelled'].includes(t.status);
                      return (
                        <div key={t.id} onClick={() => { setEditingTask(t); setTaskDialogOpen(true); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-white/[0.03] cursor-pointer transition-colors mb-1.5">
                          <CheckSquare className={`w-4 h-4 shrink-0 ${t.status === 'completed' ? 'text-green-400' : t.status === 'waiting' ? 'text-amber-400' : 'text-muted-foreground'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${t.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.title}</p>
                            {t.deadline && <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>{t.deadline}{isOverdue ? ` · ${pt ? 'Em atraso' : 'Overdue'}` : ''}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {t.priority && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[t.priority]}`}>{priorityLabels[pt ? 'pt' : 'en'][t.priority]}</span>}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status]}`}>{statusLabels[pt ? 'pt' : 'en'][t.status]}</span>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            )}

            {/* AGENDA */}
            {activeTab === 'agenda' && (
              <div>
                {agendaEvents.length === 0
                  ? <EmptyTabState icon={Calendar} label={pt ? 'Sem eventos na agenda.' : 'No agenda events.'} />
                  : agendaEvents.slice(0, 12).map(e => (
                    <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border mb-1.5">
                      <Calendar className="w-4 h-4 shrink-0 text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.date}{e.start_time ? ` · ${e.start_time}` : ''}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* DOCUMENTS */}
            {activeTab === 'documents' && (
              <div>
                {documents.length === 0
                  ? <EmptyTabState icon={FileText} label={pt ? 'Sem documentos.' : 'No documents.'} />
                  : documents.slice(0, 12).map(d => (
                    <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border mb-1.5">
                      <FileText className="w-4 h-4 shrink-0 text-teal-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{d.title || d.file_name}</p>
                        <p className="text-xs text-muted-foreground">{d.created_date ? format(new Date(d.created_date), 'dd/MM/yyyy') : ''}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* ACTIVITY */}
            {activeTab === 'activity' && (
              <div>
                {activityFeed.length === 0
                  ? <EmptyTabState icon={Activity} label={pt ? 'Sem atividade registada.' : 'No activity recorded.'} />
                  : (
                    <div className="space-y-2.5">
                      {activityFeed.map((item, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/50 border border-border text-sm">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <p className="text-sm text-muted-foreground">{pt ? item.text_pt : item.text_en}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            )}

            {/* PERMISSIONS MATRIX */}
            {activeTab === 'permissions' && (
              <div>
                <p className="text-xs text-muted-foreground mb-4">
                  {pt ? `Permissões do papel "${pt ? { owner: 'Owner', admin: 'Administrador', manager: 'Manager', member: 'Colaborador' }[role] : role}":` : `Permissions for role "${{ owner: 'Owner', admin: 'Administrator', manager: 'Manager', member: 'Employee' }[role]}":` }
                </p>

                {/* Full matrix header */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/8">
                        <th className="text-left text-muted-foreground py-2 pr-4 font-medium">{pt ? 'Permissão' : 'Permission'}</th>
                        {[
                          { key: 'owner',   label: 'Owner',      color: '#e97c3f' },
                          { key: 'admin',   label: pt ? 'Admin' : 'Admin',    color: '#ef4444' },
                          { key: 'manager', label: 'Manager',   color: '#6366f1' },
                          { key: 'member',  label: pt ? 'Colab.' : 'Empl.',   color: '#22c55e' },
                        ].map(r => (
                          <th key={r.key} className={`text-center py-2 px-3 font-semibold ${r.key === role ? 'opacity-100' : 'opacity-40'}`}
                            style={{ color: r.color }}>
                            {r.label}
                            {r.key === role && <div className="w-1 h-1 rounded-full mx-auto mt-0.5" style={{ backgroundColor: r.color }} />}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {perms.map((perm, i) => (
                        <tr key={perm.key} className={`border-b border-border ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                          <td className="py-2.5 pr-4 text-muted-foreground">{perm.label}</td>
                          {(['owner', 'admin', 'manager', 'member']).map(r => (
                            <td key={r} className="text-center py-2.5 px-3">
                              {perm[r]
                                ? <Check className={`w-3.5 h-3.5 mx-auto ${r === role ? 'text-emerald-400' : 'text-emerald-800'}`} />
                                : <X    className={`w-3.5 h-3.5 mx-auto ${r === role ? 'text-red-400/60'  : 'text-red-900/30'}`} />
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4">
                  {pt ? 'Para alterar permissões, edita o Nível de Acesso do membro.' : "To change permissions, edit the member's Access Level."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <TeamMemberDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        member={member}
        onSave={(form) => updateMember.mutate(form)}
        onSuspend={() => suspendMember.mutate()}
        onReactivate={() => reactivateMember.mutate()}
        language={language}
        workspaceId={workspaceId}
        workspaceName={workspaceData?.name}
        companyName={workspaceData?.companyName}
        companyLogoUrl={workspaceData?.companyLogoUrl}
      />

      <TeamTaskDialog
        open={taskDialogOpen}
        onClose={() => { setTaskDialogOpen(false); setEditingTask(null); }}
        task={editingTask ? { ...editingTask } : { assigned_to: memberId }}
        members={members}
        onSave={(form) => {
          if (editingTask) updateTask.mutate({ id: editingTask.id, data: form });
          else createTask.mutate(form);
        }}
        onDelete={(id) => { if (confirm(pt ? 'Eliminar?' : 'Delete?')) deleteTask.mutate(id); }}
        language={language}
      />
    </div>
  );
}

function EmptyTabState({ icon: Icon, label }) {
  return (
    <div className="text-center py-10">
      <Icon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}