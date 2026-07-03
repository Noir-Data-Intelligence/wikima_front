import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, FolderOpen, Search, MoreHorizontal, Calendar,
  Users, AlertTriangle, CheckCircle2, Clock, Archive, Trash2, Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import MobileMenuButton from '@/components/dashboard/MobileMenuButton';
import AccessGuard from '@/components/AccessGuard';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';

const PRIORITY_COLORS = {
  low:    'bg-green-500/15 text-green-400 border-green-500/25',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  high:   'bg-red-500/15 text-red-400 border-red-500/25',
  urgent: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
};

const STATUS_CONFIG = {
  planning:  { dot: 'bg-blue-400',    label_pt: 'Planeamento', label_en: 'Planning'  },
  active:    { dot: 'bg-emerald-400', label_pt: 'Ativo',       label_en: 'Active'    },
  on_hold:   { dot: 'bg-yellow-400',  label_pt: 'Em Espera',   label_en: 'On Hold'   },
  completed: { dot: 'bg-teal-400',    label_pt: 'Concluído',   label_en: 'Completed' },
  archived:  { dot: 'bg-gray-500',    label_pt: 'Arquivado',   label_en: 'Archived'  },
};

const TABS = [
  { key: 'active',     label_pt: 'Ativos',      label_en: 'Active'    },
  { key: 'planning',   label_pt: 'Planeamento', label_en: 'Planning'  },
  { key: 'completed',  label_pt: 'Concluídos',  label_en: 'Completed' },
  { key: 'archived',   label_pt: 'Arquivados',  label_en: 'Archived'  },
];


function ProjectCard({ project, pt, onEdit, onArchive, onDelete, onClick }) {
  const cfg    = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const isOver = project.due_date && new Date(project.due_date) < new Date() && !['completed', 'archived'].includes(project.status);

  return (
    <div onClick={onClick} className="group rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-border transition-all p-4 cursor-pointer">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {project.priority && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[project.priority]}`}>
              {pt ? { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' }[project.priority]
                   : { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }[project.priority]}
            </span>
          )}
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
          <button onClick={e => e.stopPropagation()} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(project); }} className="text-xs cursor-pointer gap-2">
                <Edit className="w-3.5 h-3.5" />{pt ? 'Editar' : 'Edit'}
              </DropdownMenuItem>
              {project.status !== 'archived' && (
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onArchive(project); }} className="text-xs cursor-pointer gap-2">
                  <Archive className="w-3.5 h-3.5" />{pt ? 'Arquivar' : 'Archive'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(project.id); }} className="text-xs cursor-pointer gap-2 text-red-400">
                <Trash2 className="w-3.5 h-3.5" />{pt ? 'Eliminar' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {project.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {project.client_name && (
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project.client_name}</span>
        )}
        {project.owner_name && (
          <span className="flex items-center gap-1"><FolderOpen className="w-3 h-3" />{project.owner_name}</span>
        )}
        {project.due_date && (
          <span className={`flex items-center gap-1 ${isOver ? 'text-red-400' : ''}`}>
            <Calendar className="w-3 h-3" />
            {format(new Date(project.due_date), 'dd/MM/yyyy')}
            {isOver && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 ml-1">{pt ? 'Em atraso' : 'Overdue'}</span>}
          </span>
        )}
        {project.budget != null && (
          <span className="text-muted-foreground">{Number(project.budget).toLocaleString()} {project.currency || 'EUR'}</span>
        )}
      </div>
    </div>
  );
}

export default function Projects() {
  const { language } = useLanguage();
  const pt = language === 'pt';
  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [activeTab, setActiveTab]         = useState('active');
  const [search, setSearch]               = useState('');
  const [formOpen, setFormOpen]           = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const { data: workspaceData } = useQuery({
    queryKey: ['workspaceData'],
    queryFn: async () => {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;
      if (!wsId) return { id: null };
      return { id: wsId };
    }
  });
  const workspaceId = workspaceData?.id;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => api.entities.Project.filter({ workspace_id: workspaceId }, '-created_date'),
    enabled: !!workspaceId,
    refetchInterval: 15000
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

  const createProject = useMutation({
    mutationFn: (data) => api.entities.Project.create({ ...data, workspace_id: workspaceId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] }); setFormOpen(false); toast.success(pt ? '✅ Projeto criado!' : '✅ Project created!'); }
  });
  const updateProject = useMutation({
    mutationFn: ({ id, data }) => api.entities.Project.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] }); setFormOpen(false); setEditingProject(null); toast.success(pt ? '✅ Projeto atualizado!' : '✅ Project updated!'); }
  });
  const deleteProject = useMutation({
    mutationFn: (id) => api.entities.Project.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] }); setFormOpen(false); setEditingProject(null); toast.success(pt ? '🗑️ Projeto eliminado.' : '🗑️ Project deleted.'); }
  });

  const handleSave = (form) => {
    if (editingProject) updateProject.mutate({ id: editingProject.id, data: form });
    else createProject.mutate(form);
  };
  const handleEdit    = (p)  => { setEditingProject(p); setFormOpen(true); };
  const handleArchive = (p)  => updateProject.mutate({ id: p.id, data: { status: 'archived' } });
  const handleDelete  = (id) => { if (confirm(pt ? 'Eliminar este projeto?' : 'Delete this project?')) deleteProject.mutate(id); };
  const handleNew     = ()   => { setEditingProject(null); setFormOpen(true); };

  // KPIs
  const total     = projects.length;
  const active    = projects.filter(p => p.status === 'active').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const overdue   = projects.filter(p => p.due_date && new Date(p.due_date) < new Date() && !['completed', 'archived'].includes(p.status)).length;

  const filteredProjects = projects.filter(p => {
    const matchTab    = p.status === activeTab;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.owner_name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const tabCounts = TABS.reduce((acc, t) => {
    acc[t.key] = projects.filter(p => p.status === t.key).length;
    return acc;
  }, {});

  return (
    <AccessGuard page="Projects">
      <div className="min-h-screen bg-background">
        
        

        <main className="p-5 lg:pt-6 md:p-8 md:pt-8">
          <div className="max-w-[1600px] mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div>
                <h1 className="text-xl font-bold text-foreground">{pt ? 'Projetos' : 'Projects'}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{pt ? 'Gestão de projetos da empresa.' : 'Company project management.'}</p>
              </div>
              <Button onClick={handleNew} className="gap-1.5 h-8 text-xs px-3 shadow-lg shadow-orange-500/15" style={{ backgroundColor: '#e97c3f' }}>
                <Plus className="w-3.5 h-3.5" />{pt ? 'Novo Projeto' : 'New Project'}
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: pt ? 'Total Projetos'    : 'Total Projects',     value: total,     color: '#e97c3f', icon: FolderOpen   },
                { label: pt ? 'Projetos Ativos'   : 'Active Projects',    value: active,    color: '#22c55e', icon: CheckCircle2 },
                { label: pt ? 'Concluídos'         : 'Completed',          value: completed, color: '#6366f1', icon: Clock        },
                { label: pt ? 'Em Atraso'           : 'Overdue Projects',   value: overdue,   color: overdue > 0 ? '#ef4444' : '#64748b', icon: AlertTriangle },
              ].map((k, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <k.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: k.color }} />
                    <span className="text-[10px] text-muted-foreground font-medium">{k.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{k.value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0 mb-4 border-b border-border">
              {TABS.map(tab => {
                const active = activeTab === tab.key;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all -mb-px ${
                      active ? 'border-orange-400 text-orange-300' : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
                    }`}>
                    {pt ? tab.label_pt : tab.label_en}
                    {tabCounts[tab.key] > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-orange-500/20 text-orange-300' : 'bg-white/8 text-muted-foreground'}`}>
                        {tabCounts[tab.key]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder={pt ? 'Pesquisar projetos...' : 'Search projects...'}
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-orange-500/40 text-sm" />
            </div>

            {/* Projects Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-4 border-border border-t-orange-400 rounded-full animate-spin" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] py-16 text-center">
                <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {pt ? 'Nenhum projeto encontrado.' : 'No projects found.'}
                </p>
                <p className="text-xs text-muted-foreground mb-5">
                  {search ? (pt ? 'Tenta ajustar a pesquisa.' : 'Try adjusting your search.') : (pt ? 'Cria o primeiro projeto.' : 'Create your first project.')}
                </p>
                {!search && (
                  <Button onClick={handleNew} className="h-8 text-xs gap-1.5" style={{ backgroundColor: '#e97c3f' }}>
                    <Plus className="w-3.5 h-3.5" />{pt ? 'Novo Projeto' : 'New Project'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 mb-12">
                {filteredProjects.map(p => (
                  <ProjectCard key={p.id} project={p} pt={pt}
                    onEdit={handleEdit} onArchive={handleArchive} onDelete={handleDelete}
                    onClick={() => navigate(`/ProjectProfile?id=${p.id}`)} />
                ))}
              </div>
            )}
          </div>
        </main>

        <ProjectFormDialog
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingProject(null); }}
          project={editingProject}
          onSave={handleSave}
          onDelete={handleDelete}
          clients={clients}
          members={members}
          language={language}
        />
      </div>
    </AccessGuard>
  );
}