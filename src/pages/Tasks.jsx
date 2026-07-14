import React, { useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useDemoMode } from '../components/DemoModeContext';
import { useUserType } from '../components/UserTypeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ListTodo, LayoutGrid, Calendar, Search, Filter, SortAsc } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { usePlanCheck } from '../components/usePlanCheck';
import PlanLimitModal from '../components/PlanLimitModal';
import TaskRow from '../components/tasks/TaskRow';
import TaskCard from '../components/tasks/TaskCard';
import TaskDialog from '../components/tasks/TaskDialog';
import AccessGuard from '../components/AccessGuard';

export default function Tasks() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language } = useLanguage();
  const { isDemoMode, demoData } = useDemoMode();
  const { userType } = useUserType();
  const queryClient = useQueryClient();
  const { checkLimit } = usePlanCheck();
  
  const [view, setView] = useState('list');
  const [showDialog, setShowDialog] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssigned, setFilterAssigned] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const pt = language === 'pt';
  const isIndividual = userType === 'individual';
  const isCompany = userType === 'company';

  // Auth guard
  React.useEffect(() => {
    if (isDemoMode) return;
    api.auth.me().then(u => { if (!u) window.location.href = createPageUrl('Landing'); }).catch(() => window.location.href = createPageUrl('Landing'));
  }, [isDemoMode]);

  const getWsId = async () => {
    const u = await api.auth.me();
    return u.current_workspace_id || u.default_workspace_id;
  };

  const { data: tasksData = [] } = useQuery({
    queryKey: ['tasks'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Task.filter({ workspace_id: id }, '-deadline'); }
  });

  const { data: clientsData = [] } = useQuery({
    queryKey: ['clients'], enabled: !isDemoMode && !isIndividual,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Client.filter({ workspace_id: id }, 'name'); }
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'], enabled: !isDemoMode && isCompany,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.TeamMember.filter({ workspace_id: id, status: 'active' }, 'full_name'); }
  });

  const { data: projectsData = [] } = useQuery({
    queryKey: ['projects'], enabled: !isDemoMode && isCompany,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Project.filter({ workspace_id: id }, 'name'); }
  });

  const tasks = isDemoMode ? demoData.tasks : tasksData;
  const clients = isDemoMode ? demoData.clients : clientsData;
  const projects = isDemoMode ? demoData.projects : projectsData;

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const id = await getWsId();
      return api.entities.Task.create({ ...data, workspace_id: id });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(pt ? '✅ Tarefa criada!' : '✅ Task created!');
    },
    onError: (error) => {
      console.error('Task create failed:', error);
      toast.error(error?.message || (pt ? 'Erro ao criar tarefa' : 'Failed to create task'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => api.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(pt ? '✅ Atualizada!' : '✅ Updated!');
    },
    onError: (error) => {
      console.error('Task update failed:', error);
      toast.error(error?.message || (pt ? 'Erro ao atualizar tarefa' : 'Failed to update task'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(pt ? '🗑️ Eliminada' : '🗑️ Deleted');
    },
    onError: (error) => {
      console.error('Task delete failed:', error);
      toast.error(error?.message || (pt ? 'Erro ao eliminar tarefa' : 'Failed to delete task'));
    }
  });

  const handleSave = (form) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: form });
    } else {
      const limit = checkLimit('tasks');
      if (!limit.allowed) { setLimitInfo(limit); setShowLimitModal(true); return; }
      createMutation.mutate(form);
    }
    setShowDialog(false);
    setEditingTask(null);
  };

  const handleStatusChange = (task, newStatus) => {
    updateMutation.mutate({
      id: task.id,
      data: {
        ...task,
        status: newStatus,
        completed_date: newStatus === 'completed' ? new Date().toISOString() : null
      }
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination || result.source.droppableId === result.destination.droppableId) return;
    const task = tasks.find(t => t.id === result.draggableId);
    if (!task) return;
    updateMutation.mutate({
      id: task.id,
      data: { ...task, status: result.destination.droppableId, completed_date: result.destination.droppableId === 'completed' ? new Date().toISOString() : null }
    });
  };

  // Filter and sort tasks
  const filteredTasks = tasks.filter(t => {
    const matchSearch = !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchClient = filterClient === 'all' || !t.client_name || t.client_name === filterClient;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchAssigned = filterAssigned === 'all' || !t.assigned_to_name || t.assigned_to_name === filterAssigned;
    return matchSearch && matchStatus && matchClient && matchPriority && matchAssigned;
  }).sort((a, b) => {
    if (sortBy === 'deadline') return new Date(a.deadline || 0) - new Date(b.deadline || 0);
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === 'created') return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    return 0;
  });

  const columns = [
    { id: 'todo', label: pt ? 'Não Iniciada' : 'Not Started' },
    { id: 'in_progress', label: pt ? 'Em Progresso' : 'In Progress' },
    { id: 'waiting', label: pt ? 'Em Espera' : 'Waiting' },
    { id: 'completed', label: pt ? 'Concluída' : 'Completed' }
  ];

  return (
    <AccessGuard page="Tasks">
      <div className="min-h-screen bg-background">
        
        

        <main className="p-5 lg:pt-6 md:p-8 md:pt-8">
          <div className="max-w-[1600px] mx-auto">
            
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div>
                <h1 className="text-xl font-bold text-foreground">{pt ? 'Tarefas' : 'Tasks'}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{pt ? 'Gere as tuas tarefas, prazos e fluxo de trabalho da equipa.' : 'Manage your tasks, deadlines and team workflow.'}</p>
              </div>
              <Button
                onClick={() => { setEditingTask(null); setShowDialog(true); }}
                className="bg-primary hover:bg-primary/90 gap-1.5 shadow-lg shadow-cyan-500/15 h-8 text-xs px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                {pt ? 'Nova Tarefa' : 'New Task'}
              </Button>
            </div>

            {/* ── All Tasks Section ─────────────────────────────────── */}
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-foreground/80 mb-3">{pt ? 'Todas as Tarefas' : 'All Tasks'}</h2>
              
              {/* ── Compact Toolbar ─────────────────────────────────── */}
              <div className="flex items-center gap-1.5 mb-3">
                {/* Filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-7 w-28 bg-muted/50 border-border text-foreground text-[10px]">
                    <Filter className="w-2.5 h-2.5 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{pt ? 'Todos Estados' : 'All Status'}</SelectItem>
                    <SelectItem value="todo">{pt ? 'Não Iniciada' : 'Not Started'}</SelectItem>
                    <SelectItem value="in_progress">{pt ? 'Em Progresso' : 'In Progress'}</SelectItem>
                    <SelectItem value="waiting">{pt ? 'Em Espera' : 'Waiting'}</SelectItem>
                    <SelectItem value="completed">{pt ? 'Concluída' : 'Completed'}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-7 w-28 bg-muted/50 border-border text-foreground text-[10px]">
                    <SortAsc className="w-2.5 h-2.5 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deadline">{pt ? 'Prazo' : 'Due Date'}</SelectItem>
                    <SelectItem value="priority">{pt ? 'Prioridade' : 'Priority'}</SelectItem>
                    <SelectItem value="created">{pt ? 'Criação' : 'Created'}</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Options */}
                <div className="flex bg-muted/50 rounded border border-border p-0.5">
                  <button onClick={() => setView('list')} className={`p-1 rounded ${view === 'list' ? 'bg-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <ListTodo className="w-3 h-3" />
                  </button>
                  <button onClick={() => setView('board')} className={`p-1 rounded ${view === 'board' ? 'bg-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <LayoutGrid className="w-3 h-3" />
                  </button>
                  <button onClick={() => setView('calendar')} className={`p-1 rounded ${view === 'calendar' ? 'bg-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Calendar className="w-3 h-3" />
                  </button>
                </div>

                {/* Compact Search */}
                <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={pt ? 'Pesquisar...' : 'Search...'}
                    className="pl-7 h-7 w-full bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/40 text-[10px]"
                  />
                </div>
              </div>

              {/* ── Task Table/List ────────────────────────────────── */}
              {view === 'list' ? (
                <div className="border border-white/8 rounded-xl overflow-hidden bg-white/[0.02]">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-white/[0.03] border-b border-white/8 text-[10px] font-medium text-muted-foreground">
                    <div className="col-span-3">{pt ? 'Tarefa' : 'Task'}</div>
                    {!isIndividual && <div className="col-span-2">{pt ? 'Cliente' : 'Client'}</div>}
                    {isCompany && <div className="col-span-2">{pt ? 'Atribuída a' : 'Assigned'}</div>}
                    {isCompany && <div className="col-span-2">{pt ? 'Tempo' : 'Time'}</div>}
                    <div className="col-span-2">{pt ? 'Estado' : 'Status'}</div>
                    <div className="col-span-1">{pt ? 'Prazo' : 'Due'}</div>
                  </div>
                  {/* Task Rows or Empty State */}
                  {filteredTasks.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs text-muted-foreground">{pt ? 'Sem tarefas ainda' : 'No tasks yet'}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {filteredTasks.map(task => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onEdit={(t) => { setEditingTask(t); setShowDialog(true); }}
                          onStatusChange={handleStatusChange}
                          language={language}
                          userType={userType}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : view === 'board' ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {columns.map(col => (
                      <div key={col.id} className="space-y-1.5">
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-white/[0.03] border border-white/8">
                          <span className="text-[10px] font-medium text-muted-foreground">{col.label}</span>
                          <span className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                            {filteredTasks.filter(t => t.status === col.id).length}
                          </span>
                        </div>
                        <Droppable droppableId={col.id}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-1.5 min-h-[120px]"
                            >
                              {filteredTasks.length === 0 ? (
                                <div className="px-3 py-4 text-center">
                                  <p className="text-[10px] text-muted-foreground">{pt ? 'Sem tarefas' : 'No tasks'}</p>
                                </div>
                              ) : filteredTasks
                                .filter(t => t.status === col.id)
                                .map((task, idx) => (
                                  <Draggable key={task.id} draggableId={task.id} index={idx}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                      >
                                        <TaskCard
                                          task={task}
                                          onEdit={(t) => { setEditingTask(t); setShowDialog(true); }}
                                          language={language}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                  </div>
                </DragDropContext>
              ) : (
                <div className="border border-white/8 rounded-xl overflow-hidden bg-white/[0.02]">
                  {/* Calendar Header */}
                  <div className="px-4 py-2 bg-white/[0.03] border-b border-white/8 text-[10px] font-medium text-muted-foreground">
                    {pt ? 'Calendário de Tarefas' : 'Task Calendar'}
                  </div>
                  {filteredTasks.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs text-muted-foreground">{pt ? 'Sem tarefas com prazo' : 'No tasks with deadlines'}</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredTasks
                        .filter(t => t.deadline)
                        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                        .map(task => (
                          <div
                            key={task.id}
                            onClick={() => { setEditingTask(task); setShowDialog(true); }}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-border cursor-pointer transition-all"
                          >
                            <div className="text-center min-w-[50px]">
                              <div className="text-base font-bold text-foreground">
                                {new Date(task.deadline).getDate()}
                              </div>
                              <div className="text-[9px] text-muted-foreground uppercase">
                                {new Date(task.deadline).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', { month: 'short' })}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-foreground truncate">{task.title}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                {task.client_name && <span className="text-[10px] text-muted-foreground truncate">{task.client_name}</span>}
                                {task.assigned_to_name && <span className="text-[10px] text-muted-foreground truncate">{task.assigned_to_name}</span>}
                              </div>
                            </div>
                            <div className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                              'bg-muted/50 text-muted-foreground border-border'
                            }`}>
                              {task.status === 'completed' ? (pt ? 'Feita' : 'Done') :
                               task.status === 'in_progress' ? (pt ? 'Em curso' : 'Active') :
                               (pt ? 'Pendente' : 'Pending')}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </main>

        <TaskDialog
          open={showDialog}
          onClose={() => { setShowDialog(false); setEditingTask(null); }}
          task={editingTask}
          onSave={handleSave}
          onDelete={(id) => deleteMutation.mutate(id)}
          clients={clients}
          teamMembers={teamMembers}
          projects={projects}
          userType={userType}
          language={language}
        />

        {limitInfo && (
          <PlanLimitModal
            open={showLimitModal}
            onClose={() => { setShowLimitModal(false); setLimitInfo(null); }}
            limitType={limitInfo.limitType}
            currentPlan="free"
            suggestedPlan={limitInfo.suggestedPlan}
          />
        )}
      </div>
    </AccessGuard>
  );
}