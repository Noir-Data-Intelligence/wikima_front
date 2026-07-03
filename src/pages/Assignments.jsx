import React, { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Plus, Search, Briefcase, CheckCircle, Clock, AlertCircle, User, Building } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import MobileMenuButton from '@/components/dashboard/MobileMenuButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AssignmentFormDialog from '@/components/assignments/AssignmentFormDialog';

const STATUS_CFG = {
  pending: { dot: 'bg-yellow-400', label_pt: 'Pendente', label_en: 'Pending', color: 'text-yellow-400' },
  in_progress: { dot: 'bg-blue-400', label_pt: 'Em Progresso', label_en: 'In Progress', color: 'text-blue-400' },
  completed: { dot: 'bg-emerald-400', label_pt: 'Concluído', label_en: 'Completed', color: 'text-emerald-400' },
  cancelled: { dot: 'bg-red-400', label_pt: 'Cancelado', label_en: 'Cancelled', color: 'text-red-400' },
};

const PRIORITY_CFG = {
  low: { label_pt: 'Baixa', label_en: 'Low', color: 'text-muted-foreground' },
  medium: { label_pt: 'Média', label_en: 'Medium', color: 'text-blue-400' },
  high: { label_pt: 'Alta', label_en: 'High', color: 'text-orange-400' },
  urgent: { label_pt: 'Urgente', label_en: 'Urgent', color: 'text-red-400' },
};

export default function Assignments() {
  const { language } = useLanguage();
  const pt = language === 'pt';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const getWsId = async () => {
    const u = await api.auth.me();
    return u.current_workspace_id || u.default_workspace_id;
  };

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const wsId = await getWsId();
      if (!wsId) return [];
      return api.entities.Assignment.filter({ workspace_id: wsId }, '-created_date');
    }
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['assignments-projects'],
    queryFn: async () => {
      const wsId = await getWsId();
      if (!wsId) return [];
      return api.entities.Project.filter({ workspace_id: wsId });
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['assignments-clients'],
    queryFn: async () => {
      const wsId = await getWsId();
      if (!wsId) return [];
      return api.entities.Client.filter({ workspace_id: wsId });
    }
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['assignments-team'],
    queryFn: async () => {
      const wsId = await getWsId();
      if (!wsId) return [];
      return api.entities.TeamMember.filter({ workspace_id: wsId });
    }
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return api.entities.Assignment.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setShowFormDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }) => {
      return api.entities.Assignment.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setEditingAssignment(null);
    }
  });

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assigned_to_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    in_progress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  };

  const handleCreate = () => {
    setEditingAssignment(null);
    setShowFormDialog(true);
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setShowFormDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-6 md:p-8 md:pt-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {pt ? 'Atribuições' : 'Assignments'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {pt ? 'Gerir atribuições de projetos e clientes' : 'Manage project and client assignments'}
              </p>
            </div>
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-foreground">
              <Plus className="w-4 h-4 mr-2" />
              {pt ? 'Nova Atribuição' : 'New Assignment'}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{pt ? 'Total' : 'Total'}</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1">{stats.total}</p>
            </div>
            <div className="rounded-xl border p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-muted-foreground">{pt ? 'Pendentes' : 'Pending'}</span>
              </div>
              <p className="text-xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
            </div>
            <div className="rounded-xl border p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">{pt ? 'Em Progresso' : 'In Progress'}</span>
              </div>
              <p className="text-xl font-bold text-blue-400 mt-1">{stats.in_progress}</p>
            </div>
            <div className="rounded-xl border p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">{pt ? 'Concluídas' : 'Completed'}</span>
              </div>
              <p className="text-xl font-bold text-emerald-400 mt-1">{stats.completed}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={pt ? 'Pesquisar...' : 'Search...'}
                className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-muted/50 text-muted-foreground border border-border hover:bg-accent'
                  }`}
                >
                  {pt ? STATUS_CFG[status]?.label_pt : STATUS_CFG[status]?.label_en}
                </button>
              ))}
            </div>
          </div>

          {/* Assignments List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-border border-t-white rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">{pt ? 'A carregar...' : 'Loading...'}</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-1">
                {pt ? 'Sem Atribuições' : 'No Assignments'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {pt ? 'Comece por criar uma nova atribuição' : 'Start by creating a new assignment'}
              </p>
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-foreground">
                <Plus className="w-4 h-4 mr-2" />
                {pt ? 'Criar Primeira Atribuição' : 'Create First Assignment'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map(assignment => {
                const statusCfg = STATUS_CFG[assignment.status] || STATUS_CFG.pending;
                const priorityCfg = PRIORITY_CFG[assignment.priority] || PRIORITY_CFG.medium;
                const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && assignment.status !== 'completed';
                
                return (
                  <div
                    key={assignment.id}
                    onClick={() => handleEdit(assignment)}
                    className="rounded-xl border p-4 hover:bg-white/[0.06] hover:border-white/12 transition-all cursor-pointer group"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${statusCfg.color} bg-muted/50 border-0 text-xs`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} mr-1.5`} />
                            {pt ? statusCfg.label_pt : statusCfg.label_en}
                          </Badge>
                          <Badge className={`${priorityCfg.color} bg-muted/50 border-0 text-xs`}>
                            {pt ? priorityCfg.label_pt : priorityCfg.label_en}
                          </Badge>
                        </div>
                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {assignment.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3" />
                            {assignment.project_name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Building className="w-3 h-3" />
                            {assignment.client_name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            {assignment.assigned_to_name}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {assignment.due_date && (
                          <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {isOverdue ? (pt ? 'Atrasado' : 'Overdue') : new Date(assignment.due_date).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Form Dialog */}
      <AssignmentFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        assignment={editingAssignment}
        projects={projects}
        clients={clients}
        teamMembers={teamMembers}
        onCreate={(data) => createMutation.mutate(data)}
        onUpdate={(data) => updateMutation.mutate(data)}
      />
    </div>
  );
}