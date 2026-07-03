import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { api } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AssignmentFormDialog({ open, onOpenChange, assignment, projects, clients, teamMembers, onCreate, onUpdate }) {
  const { language } = useLanguage();
  const pt = language === 'pt';
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    project_name: '',
    client_id: '',
    client_name: '',
    assigned_to_id: '',
    assigned_to_name: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    notes: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await api.auth.me();
      setUser(currentUser);
    };
    if (open) loadUser();
  }, [open]);

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        project_id: assignment.project_id || '',
        project_name: assignment.project_name || '',
        client_id: assignment.client_id || '',
        client_name: assignment.client_name || '',
        assigned_to_id: assignment.assigned_to_id || '',
        assigned_to_name: assignment.assigned_to_name || '',
        status: assignment.status || 'pending',
        priority: assignment.priority || 'medium',
        due_date: assignment.due_date || '',
        notes: assignment.notes || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        project_id: '',
        project_name: '',
        client_id: '',
        client_name: '',
        assigned_to_id: '',
        assigned_to_name: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        notes: '',
      });
    }
  }, [assignment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.project_id || !formData.client_id || !formData.assigned_to_id) {
      return;
    }

    const submitData = {
      ...formData,
      created_by_id: user?.id,
      created_by_name: user?.full_name,
      created_by_email: user?.email,
    };

    if (assignment) {
      onUpdate({ id: assignment.id, ...submitData });
    } else {
      onCreate(submitData);
    }
  };

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setFormData(prev => ({ ...prev, project_id: projectId, project_name: project?.name || '' }));
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setFormData(prev => ({ ...prev, client_id: clientId, client_name: client?.name || '' }));
  };

  const handleMemberChange = (memberId) => {
    const member = teamMembers.find(m => m.id === memberId);
    setFormData(prev => ({ ...prev, assigned_to_id: memberId, assigned_to_name: member?.full_name || '' }));
  };

  const STATUS_OPTIONS = [
    { value: 'pending', label_pt: 'Pendente', label_en: 'Pending' },
    { value: 'in_progress', label_pt: 'Em Progresso', label_en: 'In Progress' },
    { value: 'completed', label_pt: 'Concluído', label_en: 'Completed' },
    { value: 'cancelled', label_pt: 'Cancelado', label_en: 'Cancelled' },
  ];

  const PRIORITY_OPTIONS = [
    { value: 'low', label_pt: 'Baixa', label_en: 'Low' },
    { value: 'medium', label_pt: 'Média', label_en: 'Medium' },
    { value: 'high', label_pt: 'Alta', label_en: 'High' },
    { value: 'urgent', label_pt: 'Urgente', label_en: 'Urgent' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {assignment ? (pt ? 'Editar Atribuição' : 'Edit Assignment') : (pt ? 'Nova Atribuição' : 'New Assignment')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label className="text-muted-foreground text-sm">
              {pt ? 'Título' : 'Title'} <span className="text-red-400">*</span>
            </Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="bg-muted/50 border-border text-foreground"
              placeholder={pt ? 'Título da atribuição' : 'Assignment title'}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-muted-foreground text-sm">
              {pt ? 'Descrição' : 'Description'}
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-muted/50 border-border text-foreground min-h-[80px]"
              placeholder={pt ? 'Descrição detalhada' : 'Detailed description'}
            />
          </div>

          {/* Project, Client, Assigned To - Required Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Project */}
            <div>
              <Label className="text-muted-foreground text-sm">
                {pt ? 'Projeto' : 'Project'} <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.project_id} onValueChange={handleProjectChange}>
                <SelectTrigger className="bg-muted/50 border-border text-foreground">
                  <SelectValue placeholder={pt ? 'Selecionar' : 'Select'} />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id} className="text-foreground hover:bg-accent">
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client */}
            <div>
              <Label className="text-muted-foreground text-sm">
                {pt ? 'Cliente' : 'Client'} <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.client_id} onValueChange={handleClientChange}>
                <SelectTrigger className="bg-muted/50 border-border text-foreground">
                  <SelectValue placeholder={pt ? 'Selecionar' : 'Select'} />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id} className="text-foreground hover:bg-accent">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned Team Member */}
            <div>
              <Label className="text-muted-foreground text-sm">
                {pt ? 'Atribuído a' : 'Assigned to'} <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.assigned_to_id} onValueChange={handleMemberChange}>
                <SelectTrigger className="bg-muted/50 border-border text-foreground">
                  <SelectValue placeholder={pt ? 'Selecionar' : 'Select'} />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id} className="text-foreground hover:bg-accent">
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status, Priority & Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-muted-foreground text-sm">
                {pt ? 'Estado' : 'Status'}
              </Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-muted/50 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-foreground hover:bg-accent">
                      {pt ? opt.label_pt : opt.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground text-sm">
                {pt ? 'Prioridade' : 'Priority'}
              </Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="bg-muted/50 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {PRIORITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-foreground hover:bg-accent">
                      {pt ? opt.label_pt : opt.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                {pt ? 'Data de Vencimento' : 'Due Date'}
              </Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="bg-muted/50 border-border text-foreground"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-muted-foreground text-sm">
              {pt ? 'Notas' : 'Notes'}
            </Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-muted/50 border-border text-foreground min-h-[60px]"
              placeholder={pt ? 'Notas adicionais' : 'Additional notes'}
            />
          </div>

          {/* Created By (Auto-saved, shown for info) */}
          {assignment && (
            <div className="rounded-lg bg-muted/50 p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                {pt ? 'Criado por:' : 'Created by:'}
              </p>
              <p className="text-sm text-muted-foreground">
                {assignment.created_by_name} ({assignment.created_by_email})
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground hover:bg-accent">
              {pt ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-foreground"
              disabled={!formData.title || !formData.project_id || !formData.client_id || !formData.assigned_to_id}
            >
              {assignment ? (pt ? 'Guardar' : 'Save') : (pt ? 'Criar' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}