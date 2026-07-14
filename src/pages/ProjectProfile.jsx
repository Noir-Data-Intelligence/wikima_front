import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Edit, Plus, CheckSquare, Users, FileText, Receipt,
  Calendar, Activity, StickyNote, User, ChevronRight, UploadCloud, Trash2, X, FolderOpen, FileCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import ReceiptDialog from '@/components/receipts/ReceiptDialog';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import EventDialog from '@/components/agenda/EventDialog';
import ProjectActivityTab from '@/components/projects/ProjectActivityTab';

// ── helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_COLORS = {
  low:    { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/25'  },
  medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/25' },
  high:   { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/25'    },
  urgent: { bg: 'bg-rose-500/15',   text: 'text-rose-400',   border: 'border-rose-500/25'   },
};
const STATUS_CONFIG = {
  planning:  { dot: 'bg-blue-400',    label_pt: 'Planeamento', label_en: 'Planning'  },
  active:    { dot: 'bg-emerald-400', label_pt: 'Ativo',       label_en: 'Active'    },
  on_hold:   { dot: 'bg-yellow-400',  label_pt: 'Em Espera',   label_en: 'On Hold'   },
  completed: { dot: 'bg-teal-400',    label_pt: 'Concluído',   label_en: 'Completed' },
  archived:  { dot: 'bg-gray-500',    label_pt: 'Arquivado',   label_en: 'Archived'  },
};
const TASK_STATUS_LABELS_PT = { todo: 'Por Fazer', in_progress: 'Em Curso', waiting: 'Bloqueado', completed: 'Concluído', cancelled: 'Cancelado' };
const TASK_STATUS_LABELS_EN = { todo: 'To Do', in_progress: 'In Progress', waiting: 'Blocked', completed: 'Completed', cancelled: 'Cancelled' };

function InfoRow({ label, value, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      {children || <span className="text-sm text-foreground">{value || <span className="text-muted-foreground italic text-xs">—</span>}</span>}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, count }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
        active ? 'border-orange-400 text-orange-300' : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
      }`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
      {count != null && count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-orange-500/20 text-orange-300' : 'bg-white/8 text-muted-foreground'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Quick Action Button ───────────────────────────────────────────────────────
function QuickActionBtn({ icon: Icon, label, onClick, color = '#e97c3f' }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] hover:border-border transition-all group min-w-[72px]">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <span className="text-[10px] text-muted-foreground group-hover:text-foreground/80 transition-colors text-center leading-tight">{label}</span>
    </button>
  );
}

// ── Activity Logger helper ────────────────────────────────────────────────────
async function logActivity(projectId, workspaceId, actionType, labelPt, labelEn, itemName, actorName = null) {
  try {
    await api.entities.ProjectActivityLog.create({
      project_id: projectId,
      workspace_id: workspaceId,
      action_type: actionType,
      action_label_pt: labelPt,
      action_label_en: labelEn,
      item_name: itemName || '',
      actor_name: actorName || '',
    });
  } catch (e) {
    console.error('Activity log error:', e);
  }
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ project, tasks, pt }) {
  const totalTasks = tasks.length;
  const doneTasks  = tasks.filter(t => t.status === 'completed').length;
  const progress   = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const statusCfg  = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const priCfg     = PRIORITY_COLORS[project.priority];
  const isOverdue  = project.due_date && new Date(project.due_date) < new Date() && !['completed','archived'].includes(project.status);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: details */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{pt ? 'Detalhes do Projeto' : 'Project Details'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label={pt ? 'Cliente' : 'Client'} value={project.client_name} />
            <InfoRow label={pt ? 'Gestor de Projeto' : 'Project Manager'} value={project.owner_name} />
            <InfoRow label="Status">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                <span className="text-sm text-foreground">{pt ? statusCfg.label_pt : statusCfg.label_en}</span>
              </div>
            </InfoRow>
            <InfoRow label={pt ? 'Prioridade' : 'Priority'}>
              {priCfg ? (
                <span className={`text-xs px-2 py-0.5 rounded-full border w-fit ${priCfg.bg} ${priCfg.text} ${priCfg.border}`}>
                  {pt ? { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' }[project.priority]
                       : { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }[project.priority]}
                </span>
              ) : <span className="text-sm text-muted-foreground italic text-xs">—</span>}
            </InfoRow>
            <InfoRow label={pt ? 'Data de Início' : 'Start Date'}
              value={project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy') : null} />
            <InfoRow label={pt ? 'Data Limite' : 'Due Date'}>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm ${isOverdue ? 'text-red-400' : 'text-foreground'}`}>
                  {project.due_date ? format(new Date(project.due_date), 'dd/MM/yyyy') : <span className="text-muted-foreground italic text-xs">—</span>}
                </span>
                {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{pt ? 'Em atraso' : 'Overdue'}</span>}
              </div>
            </InfoRow>
            <InfoRow label={pt ? 'Orçamento' : 'Budget'}
              value={project.budget != null ? `${Number(project.budget).toLocaleString()} ${project.currency || 'EUR'}` : null} />
            <InfoRow label={pt ? 'Categoria' : 'Category'} value={project.category} />
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{pt ? 'Descrição' : 'Description'}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{project.description}</p>
          </div>
        )}

        {/* Tags */}
        {project.tags?.length > 0 && (
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map(tag => (
                <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: progress + team */}
      <div className="space-y-4">
        {/* Progress */}
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{pt ? 'Progresso' : 'Progress'}</h3>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-foreground">{progress}%</span>
            <span className="text-xs text-muted-foreground">{doneTasks}/{totalTasks} {pt ? 'tarefas' : 'tasks'}</span>
          </div>
          <div className="h-2 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#22c55e' : '#e97c3f' }} />
          </div>
          {totalTasks === 0 && (
            <p className="text-xs text-muted-foreground mt-2">{pt ? 'Sem tarefas ainda.' : 'No tasks yet.'}</p>
          )}
        </div>

        {/* Team Members */}
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{pt ? 'Equipa' : 'Team'}</h3>
          {project.member_names?.length > 0 ? (
            <div className="space-y-2">
              {project.member_names.map((name, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0"
                    style={{ backgroundColor: `hsl(${(i * 67) % 360}, 50%, 35%)` }}>
                    {name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{pt ? 'Sem membros.' : 'No members yet.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({ tasks, workspaceId, projectId, project, clients, members, language, onRefresh }) {
  const pt = language === 'pt';
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', status: 'todo', priority: 'medium', deadline: '', assigned_to: '', assigned_to_name: '', description: '' });

  const invalidateLogs = () => queryClient.invalidateQueries({ queryKey: ['activityLogs', projectId] });

  const createTask = useMutation({
    mutationFn: (data) => api.entities.Task.create(data),
    onSuccess: (created, data) => {
      onRefresh();
      invalidateLogs();
      setAddOpen(false);
      setForm({ title: '', status: 'todo', priority: 'medium', deadline: '', assigned_to: '', assigned_to_name: '', description: '' });
      toast.success(pt ? '✅ Tarefa criada!' : '✅ Task created!');
      logActivity(projectId, workspaceId, 'task_created', 'Tarefa criada', 'Task created', data.title, data.assigned_to_name || null);
      if (data.assigned_to_name) {
        logActivity(projectId, workspaceId, 'task_assigned', 'Tarefa atribuída', 'Task assigned', data.title, data.assigned_to_name);
      }
    }
  });
  const updateTask = useMutation({
    mutationFn: ({ id, data, prevStatus, taskTitle, assignedName }) => api.entities.Task.update(id, data).then(r => ({ r, prevStatus, taskTitle, assignedName, newStatus: data.status })),
    onSuccess: ({ prevStatus, taskTitle, assignedName, newStatus }) => {
      onRefresh();
      invalidateLogs();
      if (newStatus && newStatus !== prevStatus) {
        if (newStatus === 'completed') {
          logActivity(projectId, workspaceId, 'task_completed', 'Tarefa concluída', 'Task completed', taskTitle, assignedName || null);
        } else {
          const labelPt = `Estado alterado para ${newStatus}`;
          const labelEn = `Status changed to ${newStatus}`;
          logActivity(projectId, workspaceId, 'task_status_changed', labelPt, labelEn, taskTitle, assignedName || null);
        }
      }
    }
  });
  const deleteTask = useMutation({
    mutationFn: (task) => api.entities.Task.delete(task.id),
    onSuccess: (_, task) => {
      onRefresh();
      invalidateLogs();
      toast.success(pt ? '🗑️ Tarefa eliminada.' : '🗑️ Task deleted.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createTask.mutate({
      ...form,
      workspace_id: workspaceId,
      project_id: projectId,
      project_name: project.name,
      client_id: project.client_id,
      client_name: project.client_name
    });
  };

  const statusColors = { todo: 'text-muted-foreground', in_progress: 'text-blue-400', waiting: 'text-yellow-400', completed: 'text-green-400', cancelled: 'text-red-400' };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setAddOpen(true)} className="h-8 text-xs gap-1.5" style={{ backgroundColor: '#e97c3f' }}>
          <Plus className="w-3.5 h-3.5" />{pt ? 'Nova Tarefa' : 'New Task'}
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] py-12 text-center">
          <CheckSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{pt ? 'Sem tarefas neste projeto.' : 'No tasks in this project yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition-all group">
              <button onClick={() => updateTask.mutate({ id: task.id, data: { status: task.status === 'completed' ? 'todo' : 'completed' }, prevStatus: task.status, taskTitle: task.title, assignedName: task.assigned_to_name })}
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-border hover:border-green-400'}`}>
                {task.status === 'completed' && <span className="text-foreground text-[8px]">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-[10px] ${statusColors[task.status]}`}>
                    {pt ? TASK_STATUS_LABELS_PT[task.status] : TASK_STATUS_LABELS_EN[task.status]}
                  </span>
                  {task.assigned_to_name && <span className="text-[10px] text-muted-foreground">{task.assigned_to_name}</span>}
                  {task.deadline && <span className="text-[10px] text-muted-foreground">{format(new Date(task.deadline), 'dd/MM/yyyy')}</span>}
                </div>
              </div>
              <button onClick={() => deleteTask.mutate(task)}
                className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition-all p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md bg-background border-border text-foreground p-0">
          <div className="px-5 py-3.5 border-b border-border">
            <DialogTitle className="text-sm font-semibold">{pt ? 'Nova Tarefa' : 'New Task'}</DialogTitle>
          </div>
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Título' : 'Title'} *</Label>
              <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="h-9 text-sm bg-background border-border text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-9 text-xs bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(pt ? TASK_STATUS_LABELS_PT : TASK_STATUS_LABELS_EN).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Prazo' : 'Deadline'}</Label>
                <Input type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                  className="h-9 text-xs bg-background border-border text-foreground" />
              </div>
            </div>
            {members.length > 0 && (
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Responsável' : 'Assigned To'}</Label>
                <Select value={form.assigned_to} onValueChange={v => {
                  const m = members.find(m => m.id === v);
                  setForm({ ...form, assigned_to: v, assigned_to_name: m?.full_name || '' });
                }}>
                  <SelectTrigger className="h-9 text-xs bg-background border-border text-foreground"><SelectValue placeholder={pt ? 'Selecionar...' : 'Select...'} /></SelectTrigger>
                  <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Descrição' : 'Description'}</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2} className="bg-background border-border text-foreground text-sm resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setAddOpen(false)}
                className="px-4 py-1.5 rounded-md text-xs text-muted-foreground border border-border hover:bg-accent/50">
                {pt ? 'Cancelar' : 'Cancel'}
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-md text-xs text-foreground" style={{ backgroundColor: '#e97c3f' }}>
                {pt ? 'Criar' : 'Create'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────
function TeamTab({ project, allMembers, pt, onUpdate, projectId, workspaceId, onLogRefresh }) {
  const projectMemberIds = project.member_ids || [];
  const projectMembers = allMembers.filter(m => projectMemberIds.includes(m.id));
  const available = allMembers.filter(m => !projectMemberIds.includes(m.id));
  const [addOpen, setAddOpen] = useState(false);

  const addMember = (member) => {
    const newIds = [...projectMemberIds, member.id];
    const newNames = [...(project.member_names || []), member.full_name];
    onUpdate({ member_ids: newIds, member_names: newNames });
    setAddOpen(false);
    logActivity(projectId, workspaceId, 'member_added', 'Membro adicionado', 'Member added', member.full_name, member.full_name);
    if (onLogRefresh) onLogRefresh();
  };
  const removeMember = (member) => {
    onUpdate({
      member_ids: projectMemberIds.filter(id => id !== member.id),
      member_names: (project.member_names || []).filter(n => n !== member.full_name)
    });
    logActivity(projectId, workspaceId, 'member_removed', 'Membro removido', 'Member removed', member.full_name, member.full_name);
    if (onLogRefresh) onLogRefresh();
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setAddOpen(true)} disabled={available.length === 0}
          className="h-8 text-xs gap-1.5" style={{ backgroundColor: '#e97c3f' }}>
          <Plus className="w-3.5 h-3.5" />{pt ? 'Adicionar Membro' : 'Add Member'}
        </Button>
      </div>
      {projectMembers.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] py-12 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{pt ? 'Nenhum membro na equipa.' : 'No team members yet.'}</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {projectMembers.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3.5 group hover:bg-white/[0.05]">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0"
                style={{ backgroundColor: `hsl(${(i * 67) % 360}, 50%, 35%)` }}>
                {m.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.full_name}</p>
                <p className="text-[11px] text-muted-foreground">{m.role || m.department || '—'}</p>
              </div>
              <button onClick={() => removeMember(m)}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-400/50 hover:text-red-400 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm bg-background border-border text-foreground p-0">
          <div className="px-5 py-3.5 border-b border-border">
            <DialogTitle className="text-sm font-semibold">{pt ? 'Adicionar Membro' : 'Add Member'}</DialogTitle>
          </div>
          <div className="p-3 max-h-72 overflow-y-auto">
            {available.length === 0
              ? <p className="text-xs text-muted-foreground px-2 py-4 text-center">{pt ? 'Todos os membros já foram adicionados.' : 'All members already added.'}</p>
              : available.map(m => (
                <button key={m.id} onClick={() => addMember(m)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-all text-left">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-foreground"
                    style={{ backgroundColor: '#1c2d5f' }}>
                    {m.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{m.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.role || '—'}</p>
                  </div>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────
function DocumentsTab({ workspaceId, projectId, project, pt, onLogRefresh }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', workspaceId, projectId],
    queryFn: () => api.entities.Document.filter({ workspace_id: workspaceId, project_id: projectId }),
    enabled: !!workspaceId && !!projectId
  });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    await api.entities.Document.create({
      workspace_id: workspaceId,
      project_id: projectId,
      project_name: project.name,
      client_id: project.client_id,
      client_name: project.client_name,
      title: file.name,
      name: file.name,
      file_url,
      file_name: file.name,
      file_size: file.size,
      category: 'other',
      upload_date: new Date().toISOString()
    });
    queryClient.invalidateQueries({ queryKey: ['documents', workspaceId, projectId] });
    setUploading(false);
    toast.success(pt ? '✅ Documento enviado!' : '✅ Document uploaded!');
    logActivity(projectId, workspaceId, 'document_uploaded', 'Documento carregado', 'Document uploaded', file.name);
    if (onLogRefresh) onLogRefresh();
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <label className="cursor-pointer">
          <span className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs text-foreground font-medium transition-all"
            style={{ backgroundColor: '#e97c3f' }}>
            {uploading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            {pt ? 'Carregar Documento' : 'Upload Document'}
          </span>
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>
      {documents.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] py-12 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{pt ? 'Sem documentos.' : 'No documents yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <FileText className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{doc.name || doc.file_name}</p>
                {doc.upload_date && <p className="text-[10px] text-muted-foreground">{format(new Date(doc.upload_date), 'dd/MM/yyyy')}</p>}
              </div>
              {doc.file_url && <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-orange-400 hover:underline">{pt ? 'Ver' : 'View'}</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Finance Tab ───────────────────────────────────────────────────────────────
const STATUS_LABEL = {
  pt: { draft: 'Rascunho', sent: 'Enviada', paid: 'Paga', overdue: 'Vencida', cancelled: 'Cancelada' },
  en: { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' }
};
const RECEIPT_STATUS_COLOR = {
  issued: 'bg-green-500/15 text-green-400',
  refunded: 'bg-orange-500/15 text-orange-400',
  cancelled: 'bg-rose-500/15 text-rose-400'
};

function FinanceTab({ workspaceId, projectId, project, pt, clients, language, companyProfile, onLogRefresh }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('invoices');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    invoice_number: '',
    client_name: project.client_name || '',
    client_email: '',
    client_country: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'draft',
    items: [{ description: '', quantity: 1, price: 0, total: 0 }],
    currency: project.currency || 'EUR',
    tax_rate: 0,
    discount: 0,
    notes: '',
    seller_company_name: '',
    seller_tax_id: '',
    seller_address: '',
    seller_country: ''
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', workspaceId, projectId],
    queryFn: () => api.entities.Invoice.filter({ workspace_id: workspaceId, project_id: projectId }),
    enabled: !!workspaceId && !!projectId
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts', workspaceId, projectId],
    queryFn: () => api.entities.Receipt.filter({ workspace_id: workspaceId, project_id: projectId }),
    enabled: !!workspaceId && !!projectId
  });

  const totalInvoiced = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid = receipts.filter(r => r.status === 'issued').reduce((s, r) => s + (r.amount || 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;
  const cur = project.currency || 'EUR';

  const calcTotal = (f) => {
    const sub = f.items.reduce((s, it) => s + (it.total || 0), 0);
    const afterDisc = sub - (f.discount || 0);
    return afterDisc + afterDisc * ((f.tax_rate || 0) / 100);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const total = calcTotal(form);
    await api.entities.Invoice.create({
      ...form,
      workspace_id: workspaceId,
      project_id: projectId,
      project_name: project.name,
      subtotal: form.items.reduce((s, it) => s + (it.total || 0), 0),
      tax: form.items.reduce((s, it) => s + (it.total || 0), 0) * ((form.tax_rate || 0) / 100),
      total
    });
    queryClient.invalidateQueries({ queryKey: ['invoices', workspaceId, projectId] });
    setSaving(false);
    setShowForm(false);
    toast.success(pt ? '✅ Fatura criada!' : '✅ Invoice created!');
    logActivity(projectId, workspaceId, 'invoice_created', 'Fatura criada', 'Invoice created', form.invoice_number || form.client_name);
    if (onLogRefresh) onLogRefresh();
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx][field] = value;
    if (field === 'quantity' || field === 'price') items[idx].total = (items[idx].quantity || 0) * (items[idx].price || 0);
    setForm({ ...form, items });
  };

  const statusColor = (s) => s === 'paid' ? 'bg-green-500/15 text-green-400' : s === 'overdue' ? 'bg-red-500/15 text-red-400' : s === 'cancelled' ? 'bg-gray-500/15 text-gray-400' : 'bg-blue-500/15 text-blue-400';

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: pt ? 'Total Faturado' : 'Total Invoiced', value: totalInvoiced, color: '#6366f1' },
          { label: pt ? 'Total Pago' : 'Total Paid', value: totalPaid, color: '#22c55e' },
          { label: pt ? 'Em Aberto' : 'Outstanding', value: totalOutstanding, color: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
            <p className="text-[10px] text-muted-foreground mb-1 font-medium">{k.label}</p>
            <p className="text-lg font-bold text-foreground">
              {Number(k.value).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs text-muted-foreground ml-1">{cur}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-white/8 mb-3">
        {[
          { key: 'invoices', label: pt ? 'Faturas' : 'Invoices', count: invoices.length },
          { key: 'receipts', label: pt ? 'Recibos' : 'Receipts', count: receipts.length }
        ].map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all -mb-px ${
              activeSubTab === t.key ? 'border-orange-400 text-orange-300' : 'border-transparent text-muted-foreground hover:text-muted-foreground'
            }`}>
            {t.label}
            {t.count > 0 && <span className="ml-1.5 text-[10px] px-1.5 rounded-full bg-white/8 text-muted-foreground">{t.count}</span>}
          </button>
        ))}
        <div className="flex-1" />
        {activeSubTab === 'invoices' && (
          <Button onClick={() => setShowForm(true)} className="h-7 text-[11px] gap-1 mb-1" style={{ backgroundColor: '#e97c3f' }}>
            <Plus className="w-3 h-3" />{pt ? 'Nova Fatura' : 'New Invoice'}
          </Button>
        )}
        {activeSubTab === 'receipts' && (
          <Button onClick={() => setShowReceiptDialog(true)} className="h-7 text-[11px] gap-1 mb-1" style={{ backgroundColor: '#e97c3f' }}>
            <Plus className="w-3 h-3" />{pt ? 'Novo Recibo' : 'New Receipt'}
          </Button>
        )}
      </div>

      {/* Invoices list */}
      {activeSubTab === 'invoices' && (invoices.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] py-10 text-center">
          <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{pt ? 'Sem faturas para este projeto.' : 'No invoices for this project yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <Receipt className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{inv.invoice_number || (pt ? 'Fatura' : 'Invoice')}</p>
                <p className="text-[10px] text-muted-foreground">{inv.client_name}{inv.date ? ` · ${inv.date}` : ''}</p>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor(inv.status)}`}>
                  {STATUS_LABEL[pt ? 'pt' : 'en'][inv.status] || inv.status}
                </span>
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {Number(inv.total || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} {inv.currency || cur}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Receipts list */}
      {activeSubTab === 'receipts' && (receipts.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] py-10 text-center">
          <FileCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{pt ? 'Sem recibos para este projeto.' : 'No receipts for this project yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map(rec => (
            <div key={rec.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <FileCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{rec.receipt_number || (pt ? 'Recibo' : 'Receipt')}</p>
                <p className="text-[10px] text-muted-foreground">{rec.client_name}{rec.date ? ` · ${rec.date}` : ''}{rec.invoice_number ? ` · ${rec.invoice_number}` : ''}</p>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${RECEIPT_STATUS_COLOR[rec.status] || 'bg-green-500/15 text-green-400'}`}>
                  {rec.status === 'issued' ? (pt ? 'Emitido' : 'Issued') : rec.status === 'refunded' ? (pt ? 'Reembolsado' : 'Refunded') : (pt ? 'Cancelado' : 'Cancelled')}
                </span>
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {Number(rec.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} {rec.currency || cur}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Receipt dialog — pre-assigned to this project */}
      <ReceiptDialog
        open={showReceiptDialog}
        onClose={() => setShowReceiptDialog(false)}
        receipt={null}
        prefillInvoice={null}
        companyProfile={companyProfile}
        projects={[project]}
        isCompany={true}
        defaultProjectId={projectId}
        defaultProjectName={project.name}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['receipts', workspaceId, projectId] });
          toast.success(pt ? '✅ Recibo criado!' : '✅ Receipt created!');
          logActivity(projectId, workspaceId, 'receipt_created', 'Recibo criado', 'Receipt created', project.name);
          if (onLogRefresh) onLogRefresh();
        }}
      />

      {/* Quick invoice creation dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg bg-background border-border text-foreground p-0 max-h-[85vh] overflow-y-auto">
          <div className="px-5 py-3.5 border-b border-border sticky top-0 bg-background z-10">
            <DialogTitle className="text-sm font-semibold">{pt ? 'Nova Fatura' : 'New Invoice'} — {project.name}</DialogTitle>
          </div>
          <form onSubmit={handleCreate} className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Nº Fatura' : 'Invoice #'} *</Label>
                <Input required value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })}
                  placeholder="INV-2025-0001" className="h-8 text-xs bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-8 text-xs bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL[pt ? 'pt' : 'en']).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Cliente' : 'Client'}</Label>
                <Select value={form.client_name} onValueChange={v => setForm({ ...form, client_name: v })}>
                  <SelectTrigger className="h-8 text-xs bg-background border-border text-foreground"><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Moeda' : 'Currency'}</Label>
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="h-8 text-xs bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['EUR', 'USD', 'GBP', 'AOA', 'BRL'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Data Emissão' : 'Issue Date'}</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="h-8 text-xs bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Vencimento' : 'Due Date'}</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="h-8 text-xs bg-background border-border text-foreground" />
              </div>
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Itens' : 'Line Items'}</Label>
              <div className="space-y-1.5">
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                    <div className="col-span-5">
                      <Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                        placeholder={pt ? 'Descrição' : 'Description'} className="h-7 text-xs bg-background border-border text-foreground" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs bg-background border-border text-foreground text-center" min="0" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs bg-background border-border text-foreground" min="0" step="0.01" />
                    </div>
                    <div className="col-span-2">
                      <Input value={item.total.toFixed(2)} readOnly className="h-7 text-xs bg-[#060e1e] border-border text-muted-foreground text-right" />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}
                        disabled={form.items.length === 1}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-rose-400 disabled:opacity-30">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, price: 0, total: 0 }] })}
                className="mt-1.5 text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1">
                <Plus className="w-3 h-3" />{pt ? 'Adicionar linha' : 'Add line'}
              </button>
            </div>

            <div className="flex justify-end gap-4 text-xs text-muted-foreground pt-1">
              <span>Total: <strong className="text-orange-400">{form.currency} {calcTotal(form).toFixed(2)}</strong></span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-1.5 rounded-md text-xs text-muted-foreground border border-border hover:bg-accent/50">
                {pt ? 'Cancelar' : 'Cancel'}
              </button>
              <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-md text-xs text-foreground disabled:opacity-50" style={{ backgroundColor: '#e97c3f' }}>
                {saving ? '...' : (pt ? 'Criar Fatura' : 'Create Invoice')}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Agenda Tab ────────────────────────────────────────────────────────────────
const EVENT_STATUS_COLORS = {
  scheduled: 'bg-primary/15 text-primary',
  completed: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-rose-500/15 text-rose-400'
};

function AgendaTab({ workspaceId, projectId, project, pt, members, language, onLogRefresh }) {
  const queryClient = useQueryClient();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: agendaEvents = [] } = useQuery({
    queryKey: ['agendaEvents', workspaceId, projectId],
    queryFn: () => api.entities.AgendaEvent.filter({ workspace_id: workspaceId, project_id: projectId }),
    enabled: !!workspaceId && !!projectId
  });

  // Sort chronologically
  const sorted = [...agendaEvents].sort((a, b) => {
    const dateA = `${a.date}T${a.start_time || '00:00'}`;
    const dateB = `${b.date}T${b.start_time || '00:00'}`;
    return dateA.localeCompare(dateB);
  });

  const getMemberName = (event) => {
    if (event.assigned_to_name) return event.assigned_to_name;
    if (event.client_name) return event.client_name;
    return null;
  };

  const handleSuccess = (eventTitle) => {
    queryClient.invalidateQueries({ queryKey: ['agendaEvents', workspaceId, projectId] });
    setShowEventDialog(false);
    if (!selectedEvent && eventTitle) {
      logActivity(projectId, workspaceId, 'meeting_scheduled', 'Reunião agendada', 'Meeting scheduled', eventTitle);
      if (onLogRefresh) onLogRefresh();
    }
    setSelectedEvent(null);
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => { setSelectedEvent(null); setShowEventDialog(true); }}
          className="h-8 text-xs gap-1.5" style={{ backgroundColor: '#e97c3f' }}>
          <Plus className="w-3.5 h-3.5" />{pt ? 'Novo Evento' : 'New Event'}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] py-12 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{pt ? 'Sem eventos de agenda para este projeto.' : 'No agenda events for this project yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(ev => {
            const isToday = ev.date === new Date().toISOString().split('T')[0];
            const isPast = ev.date < new Date().toISOString().split('T')[0];
            const memberName = getMemberName(ev);
            return (
              <div
                key={ev.id}
                onClick={() => { setSelectedEvent(ev); setShowEventDialog(true); }}
                className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition-all cursor-pointer group"
              >
                {/* Date block */}
                <div className={`flex flex-col items-center min-w-[44px] text-center ${isPast && ev.status !== 'completed' ? 'opacity-50' : ''}`}>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {format(new Date(ev.date + 'T00:00'), pt ? 'dd MMM' : 'MMM dd')}
                  </span>
                  {isToday && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary mt-0.5">{pt ? 'Hoje' : 'Today'}</span>
                  )}
                </div>

                {/* Time */}
                <div className="flex flex-col items-center min-w-[52px]">
                  <span className="text-xs text-muted-foreground tabular-nums">{ev.start_time}</span>
                  {ev.end_time && <span className="text-[10px] text-muted-foreground tabular-nums">{ev.end_time}</span>}
                </div>

                {/* Title + location */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ev.location && (
                      <span className="text-[10px] text-muted-foreground truncate">{ev.location}</span>
                    )}
                    {ev.description && !ev.location && (
                      <span className="text-[10px] text-muted-foreground truncate">{ev.description}</span>
                    )}
                  </div>
                </div>

                {/* Assigned member */}
                {memberName && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{memberName}</span>
                  </div>
                )}

                {/* Status */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${EVENT_STATUS_COLORS[ev.status] || EVENT_STATUS_COLORS.scheduled}`}>
                  {ev.status === 'completed' ? (pt ? 'Concluído' : 'Completed')
                    : ev.status === 'cancelled' ? (pt ? 'Cancelado' : 'Cancelled')
                    : (pt ? 'Agendado' : 'Scheduled')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <EventDialog
        open={showEventDialog}
        onClose={() => { setShowEventDialog(false); setSelectedEvent(null); }}
        onSuccess={handleSuccess}
        event={selectedEvent}
        projects={[project]}
        isCompany={true}
        defaultProjectId={projectId}
        defaultProjectName={project.name}
      />
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────
function NotesTab({ project, onUpdate, pt, projectId, workspaceId, onLogRefresh }) {
  const [notes, setNotes] = useState(project.notes || '');
  const [saved, setSaved] = useState(true);

  const handleSave = () => {
    onUpdate({ notes });
    setSaved(true);
    toast.success(pt ? '✅ Notas guardadas!' : '✅ Notes saved!');
    logActivity(projectId, workspaceId, 'notes_added', 'Notas atualizadas', 'Notes updated', project.name);
    if (onLogRefresh) onLogRefresh();
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false); }}
        rows={14}
        placeholder={pt ? 'Escreve as tuas notas aqui...' : 'Write your notes here...'}
        className="bg-white/[0.03] border-white/8 text-foreground text-sm placeholder:text-muted-foreground resize-none focus:border-orange-500/40 w-full"
      />
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saved}
          className="px-4 py-1.5 rounded-md text-xs text-foreground transition-all disabled:opacity-40"
          style={{ backgroundColor: '#e97c3f' }}>
          {pt ? 'Guardar Notas' : 'Save Notes'}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProjectProfile() {
  const { language } = useLanguage();
  const pt = language === 'pt';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const projectId = new URLSearchParams(window.location.search).get('id');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);

  const { data: workspaceData } = useQuery({
    queryKey: ['workspaceData'],
    queryFn: async () => {
      const user = await api.auth.me();
      return { id: user.current_workspace_id || user.default_workspace_id };
    }
  });
  const workspaceId = workspaceData?.id;

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.entities.Project.get(projectId),
    enabled: !!projectId
  });

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', workspaceId, projectId],
    queryFn: () => api.entities.Task.filter({ workspace_id: workspaceId, project_id: projectId }),
    enabled: !!workspaceId && !!projectId
  });

  const { data: members = [] } = useQuery({
    queryKey: ['teamMembers', workspaceId],
    queryFn: () => api.entities.TeamMember.filter({ workspace_id: workspaceId, status: 'active' }),
    enabled: !!workspaceId
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', workspaceId],
    queryFn: () => api.entities.Client.filter({ workspace_id: workspaceId, status: 'active' }),
    enabled: !!workspaceId
  });

  const { data: companyProfile } = useCompanyProfile();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', workspaceId, projectId],
    queryFn: () => api.entities.Document.filter({ workspace_id: workspaceId, project_id: projectId }),
    enabled: !!workspaceId && !!projectId
  });

  const { data: agendaEvents = [] } = useQuery({
    queryKey: ['agendaEvents', workspaceId, projectId],
    queryFn: () => api.entities.AgendaEvent.filter({ workspace_id: workspaceId, project_id: projectId }),
    enabled: !!workspaceId && !!projectId
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', workspaceId, projectId],
    queryFn: () => api.entities.Invoice.filter({ workspace_id: workspaceId, project_id: projectId }),
    enabled: !!workspaceId && !!projectId
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts', workspaceId, projectId],
    queryFn: () => api.entities.Receipt.filter({ workspace_id: workspaceId, project_id: projectId }),
    enabled: !!workspaceId && !!projectId
  });

  const invalidateLogs = () => queryClient.invalidateQueries({ queryKey: ['activityLogs', projectId] });

  // Seed a "project created" log entry once if none exist yet
  const { data: seedCheckLogs } = useQuery({
    queryKey: ['activityLogs', projectId],
    queryFn: () => api.entities.ProjectActivityLog.filter({ project_id: projectId }, '-created_date', 1),
    enabled: !!projectId,
  });
  React.useEffect(() => {
    if (seedCheckLogs && seedCheckLogs.length === 0 && project && workspaceId) {
      logActivity(projectId, workspaceId, 'project_created', 'Projeto criado', 'Project created', project.name, project.owner_name || null);
    }
  }, [seedCheckLogs, project, workspaceId]);

  const updateProject = useMutation({
    mutationFn: (data) => api.entities.Project.update(projectId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['project', projectId] }); queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] }); }
  });

  const deleteProject = useMutation({
    mutationFn: () => api.entities.Project.delete(projectId),
    onSuccess: () => { navigate('/Projects'); toast.success(pt ? '🗑️ Projeto eliminado.' : '🗑️ Project deleted.'); }
  });

  const handleSave = (form) => {
    const prevStatus = project.status;
    updateProject.mutate(form);
    setEditOpen(false);
    toast.success(pt ? '✅ Projeto atualizado!' : '✅ Project updated!');
    logActivity(projectId, workspaceId, 'project_updated', 'Projeto atualizado', 'Project updated', form.name || project.name);
    if (form.status && form.status !== prevStatus) {
      logActivity(projectId, workspaceId, 'project_status_changed', `Estado alterado para ${form.status}`, `Status changed to ${form.status}`, form.name || project.name);
    }
    invalidateLogs();
  };

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-7 h-7 border-4 border-border border-t-orange-400 rounded-full animate-spin" />
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;

  const PROFILE_TABS = [
    { key: 'overview',   icon: FolderOpen,  label: pt ? 'Visão Geral' : 'Overview'  },
    { key: 'tasks',      icon: CheckSquare, label: pt ? 'Tarefas' : 'Tasks',         count: tasks.length },
    { key: 'team',       icon: Users,       label: pt ? 'Equipa' : 'Team',           count: (project.member_ids || []).length },
    { key: 'documents',  icon: FileText,    label: pt ? 'Documentos' : 'Documents'  },
    { key: 'finance',    icon: Receipt,     label: pt ? 'Finanças' : 'Finance'       },
    { key: 'agenda',     icon: Calendar,    label: pt ? 'Agenda' : 'Agenda'          },
    { key: 'activity',   icon: Activity,    label: pt ? 'Atividade' : 'Activity'     },
    { key: 'notes',      icon: StickyNote,  label: pt ? 'Notas' : 'Notes'            },
  ];

  const QUICK_ACTIONS = [
    { icon: CheckSquare, label: pt ? 'Nova Tarefa' : 'Add Task',       color: '#6366f1', onClick: () => setActiveTab('tasks')     },
    { icon: Users,       label: pt ? 'Add Membro' : 'Add Member',      color: '#22c55e', onClick: () => setActiveTab('team')      },
    { icon: UploadCloud, label: pt ? 'Carregar Doc' : 'Upload Doc',    color: '#0ea5e9', onClick: () => setActiveTab('documents') },
    { icon: Receipt,     label: pt ? 'Ver Faturas' : 'View Invoices',  color: '#a855f7', onClick: () => setActiveTab('finance')   },
    { icon: Calendar,    label: pt ? 'Ver Agenda' : 'Schedule',        color: '#e97c3f', onClick: () => setActiveTab('agenda')    },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-6 md:p-8 md:pt-8">
        <div className="max-w-6xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Link to="/Projects" className="hover:text-muted-foreground transition-colors">{pt ? 'Projetos' : 'Projects'}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-muted-foreground truncate">{project.name}</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/Projects')} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot}`} />
                  <h1 className="text-lg font-bold text-foreground">{project.name}</h1>
                </div>
                <p className="text-xs text-muted-foreground ml-5">{project.client_name || '—'} {project.category ? `· ${project.category}` : ''}</p>
              </div>
            </div>
            <button onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-white/12 hover:bg-white/8 hover:text-foreground transition-all">
              <Edit className="w-3.5 h-3.5" />{pt ? 'Editar' : 'Edit'}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
            {QUICK_ACTIONS.map((qa, i) => (
              <QuickActionBtn key={i} icon={qa.icon} label={qa.label} color={qa.color} onClick={qa.onClick} />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 mb-5 border-b border-border overflow-x-auto scrollbar-none">
            {PROFILE_TABS.map(tab => (
              <TabBtn key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}
                icon={tab.icon} label={tab.label} count={tab.count} />
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && <OverviewTab project={project} tasks={tasks} pt={pt} />}
          {activeTab === 'tasks' && (
            <TasksTab tasks={tasks} workspaceId={workspaceId} projectId={projectId} project={project}
              clients={clients} members={members} language={language} onRefresh={refetchTasks} />
          )}
          {activeTab === 'team' && (
            <TeamTab project={project} allMembers={members} pt={pt}
              projectId={projectId} workspaceId={workspaceId} onLogRefresh={invalidateLogs}
              onUpdate={(data) => updateProject.mutate(data)} />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab workspaceId={workspaceId} projectId={projectId} project={project} pt={pt} onLogRefresh={invalidateLogs} />
          )}
          {activeTab === 'finance' && (
            <FinanceTab workspaceId={workspaceId} projectId={projectId} project={project} pt={pt} clients={clients} language={language} companyProfile={companyProfile} onLogRefresh={invalidateLogs} />
          )}
          {activeTab === 'agenda' && (
            <AgendaTab workspaceId={workspaceId} projectId={projectId} project={project}
              pt={pt} members={members} language={language} onLogRefresh={invalidateLogs} />
          )}
          {activeTab === 'activity' && (
            <ProjectActivityTab
              workspaceId={workspaceId}
              projectId={projectId}
              pt={pt}
              project={project}
              tasks={tasks}
              documents={documents}
              agendaEvents={agendaEvents}
              invoices={invoices}
              receipts={receipts}
            />
          )}
          {activeTab === 'notes' && <NotesTab project={project} onUpdate={(data) => updateProject.mutate(data)} pt={pt} projectId={projectId} workspaceId={workspaceId} onLogRefresh={invalidateLogs} />}
        </div>
      </main>

      <ProjectFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
        onSave={handleSave}
        onDelete={() => { if (confirm(pt ? 'Eliminar projeto?' : 'Delete project?')) deleteProject.mutate(); }}
        clients={clients}
        members={members}
        language={language}
      />
    </div>
  );
}