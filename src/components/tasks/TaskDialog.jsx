import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import TaskPlanDialog from './TaskPlanDialog';

const REMINDER_OPTIONS = [
  { value: 'none', label_pt: 'Sem lembrete', label_en: 'No reminder' },
  { value: 'same_day', label_pt: 'No mesmo dia', label_en: 'Same day' },
  { value: '1_day', label_pt: '1 dia antes', label_en: '1 day before' },
  { value: '3_days', label_pt: '3 dias antes', label_en: '3 days before' },
  { value: '1_week', label_pt: '1 semana antes', label_en: '1 week before' }
];

const TASK_CATEGORIES = [
  { value: 'administrative', label_pt: 'Administrativo', label_en: 'Administrative' },
  { value: 'finance', label_pt: 'Finanças', label_en: 'Finance' },
  { value: 'client_support', label_pt: 'Apoio ao Cliente', label_en: 'Client Support' },
  { value: 'marketing', label_pt: 'Marketing', label_en: 'Marketing' },
  { value: 'meeting', label_pt: 'Reunião', label_en: 'Meeting' },
  { value: 'internal', label_pt: 'Interno', label_en: 'Internal' },
  { value: 'operations', label_pt: 'Operações', label_en: 'Operations' }
];

export default function TaskDialog({ open, onClose, task, onSave, onDelete, clients, teamMembers, userType, language, projects = [] }) {
  const pt = language === 'pt';
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', client_id: '', client_name: '',
    project_id: '', project_name: '',
    assigned_to: '', assigned_to_name: '', deadline: '',
    priority: 'medium', status: 'todo', reminder: 'none', category: '',
    estimated_hours: '', actual_hours: '',
    is_recurring: false, recurrence_pattern: ''
  });
  const [lockedClient, setLockedClient] = useState(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  const isIndividual = userType === 'individual';
  const isFreelancer = userType === 'freelancer';
  const isCompany = userType === 'company';
  const showClient = !isIndividual;
  const showTeamMember = isCompany;

  // Check URL params for pre-selected client
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('clientId');
    const clientName = urlParams.get('clientName');

    if (clientId && clientName && !task) {
      const decodedName = decodeURIComponent(clientName);
      setLockedClient({ id: clientId, name: decodedName });
      setForm(prev => ({ ...prev, client_id: clientId, client_name: decodedName }));
    }
  }, [task]);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        client_id: task.client_id || '',
        client_name: task.client_name || '',
        project_id: task.project_id || '',
        project_name: task.project_name || '',
        assigned_to: task.assigned_to || '',
        assigned_to_name: task.assigned_to_name || '',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        reminder: task.reminder || 'none',
        estimated_hours: task.estimated_hours?.toString() || '',
        actual_hours: task.actual_hours?.toString() || '',
        is_recurring: task.is_recurring || false,
        recurrence_pattern: task.recurrence_pattern || ''
      });
    } else {
      setForm({
        title: '', description: '', client_id: '', client_name: '',
        project_id: '', project_name: '',
        assigned_to: '', assigned_to_name: '', deadline: '',
        priority: 'medium', status: 'todo', reminder: 'none', category: '',
        estimated_hours: '', actual_hours: '',
        is_recurring: false, recurrence_pattern: ''
      });
      setLockedClient(null);
    }
  }, [task, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(pt ? 'Título é obrigatório' : 'Title is required');
      return;
    }
    if (isCompany && projects.length > 0 && !form.project_id) {
      toast.error(pt ? 'Seleciona um projeto' : 'Please select a project');
      return;
    }
    onSave({
      ...form,
      estimated_hours: form.estimated_hours === '' ? null : Number(form.estimated_hours),
      actual_hours: form.actual_hours === '' ? null : Number(form.actual_hours),
      recurrence_pattern: form.recurrence_pattern || null,
      category: form.category || null,
      reminder: form.reminder || null,
    });
    onClose();
  };

  const handleApplyPlan = (planData) => {
    setForm({
      ...form,
      priority: planData.priority,
      estimated_hours: planData.estimated_hours.toString()
    });
    toast.success(pt ? 'Plano aplicado!' : 'Plan applied!');
  };

  const statusLabels = {
    todo: pt ? 'Não Iniciada' : 'Not Started',
    in_progress: pt ? 'Em Progresso' : 'In Progress',
    waiting: pt ? 'Em Espera' : 'Waiting',
    completed: pt ? 'Concluída' : 'Completed',
    cancelled: pt ? 'Cancelada' : 'Cancelled'
  };

  const priorityLabels = {
    low: pt ? 'Baixa' : 'Low',
    medium: pt ? 'Média' : 'Medium',
    high: pt ? 'Alta' : 'High',
    urgent: pt ? 'Urgente' : 'Urgent'
  };

  const categoryLabels = TASK_CATEGORIES.map(o => pt ? o.label_pt : o.label_en);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-card border-border text-foreground p-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-2.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {task ? (pt ? 'Editar Tarefa' : 'Edit Task') : (pt ? 'Nova Tarefa' : 'New Task')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-3.5 space-y-3">
          {/* SECTION 1: TASK DETAILS */}
          <div className="space-y-2.5">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Título' : 'Title'} *</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="h-7 text-xs bg-background border-border text-foreground"
                placeholder={pt ? 'Prepare proposta para cliente' : 'Prepare proposal for client'}
                required
              />
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Descrição' : 'Description'} <span className="text-muted-foreground">({pt ? 'opcional' : 'optional'})</span></Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="bg-background border-border text-foreground text-xs resize-none"
                rows={1.5}
                placeholder={pt ? 'Adicione detalhes, notas ou instruções...' : 'Add task details, notes or workflow instructions...'}
              />
            </div>

            {isCompany && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <button
                  type="button"
                  onClick={() => setShowPlanDialog(true)}
                  disabled={!form.title}
                  className="w-full flex items-center justify-center gap-2 text-xs text-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  {pt ? 'Gerar Plano de Tarefa com IA' : 'Generate Task Plan with AI'}
                </button>
                <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
                  {pt 
                    ? 'A IA gera automaticamente sub-tarefas, prioridades, prazos e horas estimadas'
                    : 'AI automatically generates subtasks, priorities, deadlines, and estimated hours'
                  }
                </p>
              </div>
            )}
          </div>

          {/* SECTION 2: ASSIGNMENT */}
          {(showClient || showTeamMember || (isCompany && projects.length > 0)) && (
            <div className="border-t border-border pt-2.5">
              <h3 className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                {pt ? 'Atribuição' : 'Assignment'}
              </h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                {/* Project selector — company only */}
                {isCompany && projects.length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Projeto' : 'Project'} *</Label>
                    <Select
                      value={form.project_id || ''}
                      onValueChange={(value) => {
                        const selected = projects.find(p => p.id === value);
                        setForm({ ...form, project_id: value, project_name: selected?.name || '' });
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs bg-background border-border text-foreground">
                        <SelectValue placeholder={pt ? 'Selecionar projeto...' : 'Select project...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showClient && clients.length > 0 && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Cliente' : 'Client'} <span className="text-muted-foreground">({pt ? 'opcional' : 'optional'})</span></Label>
                    <Select
                      value={form.client_name || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setForm({ ...form, client_name: '', client_id: '' });
                        } else {
                          const selected = clients.find(c => c.name === value);
                          setForm({ ...form, client_name: value, client_id: selected?.id || '' });
                        }
                      }}
                      disabled={!!lockedClient}
                    >
                      <SelectTrigger className={`h-7 text-xs bg-background border-border text-foreground ${lockedClient ? 'opacity-60' : ''}`}>
                        <SelectValue placeholder={pt ? 'Nenhum' : 'None'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{pt ? 'Nenhum' : 'None'}</SelectItem>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {lockedClient && (
                      <p className="text-[9px] text-amber-400 mt-0.5">🔒 {pt ? 'Cliente fixo' : 'Client locked'}</p>
                    )}
                  </div>
                )}

                {showTeamMember && teamMembers.length > 0 && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Membro da Equipa' : 'Team Member'} <span className="text-muted-foreground">({pt ? 'opcional' : 'optional'})</span></Label>
                    <Select
                      value={form.assigned_to || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setForm({ ...form, assigned_to: '', assigned_to_name: '' });
                        } else {
                          const member = teamMembers.find(m => m.id === value);
                          setForm({ ...form, assigned_to: value, assigned_to_name: member?.full_name || '' });
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs bg-background border-border text-foreground">
                        <SelectValue placeholder={pt ? 'Nenhum' : 'None'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{pt ? 'Nenhum' : 'None'}</SelectItem>
                        {teamMembers.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            <span>{member.full_name}</span>
                            {member.role && <span className="text-xs text-muted-foreground"> · {member.role}</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: PLANNING */}
          <div className="border-t border-border pt-2.5">
            <h3 className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              {pt ? 'Planeamento' : 'Planning'}
            </h3>
            <div className="space-y-2.5">
              {/* Row 1: Deadline + Priority + Status */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Prazo' : 'Deadline'} <span className="text-muted-foreground">({pt ? 'opcional' : 'optional'})</span></Label>
                  <Input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })}
                    className="h-7 text-xs bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Prioridade' : 'Priority'}</Label>
                  <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="h-7 text-xs bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{priorityLabels.low}</SelectItem>
                      <SelectItem value="medium">{priorityLabels.medium}</SelectItem>
                      <SelectItem value="high">{priorityLabels.high}</SelectItem>
                      <SelectItem value="urgent">{priorityLabels.urgent}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Estado' : 'Status'}</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger className="h-7 text-xs bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">{statusLabels.todo}</SelectItem>
                      <SelectItem value="in_progress">{statusLabels.in_progress}</SelectItem>
                      <SelectItem value="waiting">{statusLabels.waiting}</SelectItem>
                      <SelectItem value="completed">{statusLabels.completed}</SelectItem>
                      <SelectItem value="cancelled">{statusLabels.cancelled}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Category + Reminder */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Categoria' : 'Category'} <span className="text-muted-foreground">({pt ? 'opcional' : 'optional'})</span></Label>
                  <Select
                    value={form.category || 'none'}
                    onValueChange={v => setForm({ ...form, category: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger className="h-7 text-xs bg-background border-border text-foreground">
                      <SelectValue placeholder={pt ? 'Selecionar' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{pt ? 'Nenhuma' : 'None'}</SelectItem>
                      {TASK_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {pt ? cat.label_pt : cat.label_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Lembrete' : 'Reminder'}</Label>
                  <Select value={form.reminder} onValueChange={v => setForm({ ...form, reminder: v })}>
                    <SelectTrigger className="h-7 text-xs bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {pt ? opt.label_pt : opt.label_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Time Tracking & Recurrence — company only */}
              {isCompany && (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Horas Estimadas' : 'Estimated Hours'}</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={form.estimated_hours}
                        onChange={e => setForm({ ...form, estimated_hours: e.target.value })}
                        className="h-7 text-xs bg-background border-border text-foreground"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Horas Reais' : 'Actual Hours'}</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={form.actual_hours}
                        onChange={e => setForm({ ...form, actual_hours: e.target.value })}
                        className="h-7 text-xs bg-background border-border text-foreground"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Recurrence */}
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        type="checkbox"
                        id="is_recurring"
                        checked={form.is_recurring}
                        onChange={e => setForm({ ...form, is_recurring: e.target.checked })}
                        className="w-3 h-3 rounded border-white/30 text-primary focus:ring-ring/50 bg-background"
                      />
                      <Label htmlFor="is_recurring" className="text-[10px] text-muted-foreground cursor-pointer">
                        {pt ? 'Tarefa Recorrente' : 'Recurring Task'}
                      </Label>
                    </div>
                    
                    {form.is_recurring && (
                      <div>
                        <Label className="text-[10px] text-muted-foreground mb-1 block">{pt ? 'Frequência' : 'Frequency'}</Label>
                        <Select 
                          value={form.recurrence_pattern} 
                          onValueChange={v => setForm({ ...form, recurrence_pattern: v })}
                        >
                          <SelectTrigger className="h-7 text-xs bg-background border-border text-foreground">
                            <SelectValue placeholder={pt ? 'Selecionar...' : 'Select...'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">{pt ? 'Diária' : 'Daily'}</SelectItem>
                            <SelectItem value="weekly">{pt ? 'Semanal' : 'Weekly'}</SelectItem>
                            <SelectItem value="monthly">{pt ? 'Mensal' : 'Monthly'}</SelectItem>
                            <SelectItem value="yearly">{pt ? 'Anual' : 'Yearly'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {pt ? 'Nova tarefa criada automaticamente ao concluir' : 'New task created automatically when completed'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1.5">
            {task && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/TaskDetail?id=${task.id}`);
                    onClose();
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {pt ? 'Ver detalhes' : 'View details'} <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(pt ? 'Eliminar tarefa?' : 'Delete task?')) {
                      onDelete(task.id);
                      onClose();
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  {pt ? 'Eliminar' : 'Delete'}
                </button>
              </div>
            )}
            <div className={`flex gap-2 ${!task ? 'ml-auto' : ''}`}>
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-md text-xs text-muted-foreground border border-border hover:bg-accent/50"
              >
                {pt ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-foreground hover:opacity-90"
                style={{ backgroundColor: '#e97c3f' }}
              >
                {task ? null : <Send className="w-3 h-3" />}
                {pt ? (task ? 'Guardar' : 'Criar Tarefa') : (task ? 'Save' : 'Create Task')}
              </button>
            </div>
          </div>
        </form>

        {/* AI Task Plan Dialog */}
        {isCompany && (
          <TaskPlanDialog
            open={showPlanDialog}
            onClose={() => setShowPlanDialog(false)}
            task={task || { title: form.title, description: form.description, deadline: form.deadline }}
            onSave={handleApplyPlan}
            language={language}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}