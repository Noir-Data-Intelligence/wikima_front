import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';

export default function TeamTaskDialog({ open, onClose, task, members, onSave, onDelete, language }) {
  const pt = language === 'pt';

  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '',
    priority: 'medium', deadline: '', status: 'todo', notes: ''
  });

  useEffect(() => {
    if (task) {
      setForm({
        title:       task.title       || '',
        description: task.description || '',
        assigned_to: task.assigned_to || '',
        priority:    task.priority    || 'medium',
        deadline:    task.deadline ? task.deadline.split('T')[0] : '',
        status:      task.status      || 'todo',
        notes:       task.notes       || ''
      });
    } else {
      setForm({ title: '', description: '', assigned_to: '', priority: 'medium', deadline: '', status: 'todo', notes: '' });
    }
  }, [task, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const saveData = { ...form };
    if (form.assigned_to) {
      const m = members.find(x => x.id === form.assigned_to);
      if (m) saveData.assigned_to_name = m.full_name;
    }
    onSave(saveData);
  };

  const priorityLabels = {
    pt: { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' },
    en: { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }
  };

  // Extended statuses including Blocked for team tasks
  const statusOptions = pt
    ? [
        { value: 'todo',        label: 'Por Fazer' },
        { value: 'in_progress', label: 'Em Progresso' },
        { value: 'waiting',     label: 'Bloqueada' },
        { value: 'completed',   label: 'Concluída' },
        { value: 'cancelled',   label: 'Cancelada' },
      ]
    : [
        { value: 'todo',        label: 'Not Started' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'waiting',     label: 'Blocked' },
        { value: 'completed',   label: 'Completed' },
        { value: 'cancelled',   label: 'Cancelled' },
      ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground text-sm">
            {task?.id ? (pt ? 'Editar Tarefa' : 'Edit Task') : (pt ? 'Nova Tarefa de Equipa' : 'New Team Task')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Título' : 'Title'} *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
              className="bg-background border-border text-foreground h-9 text-sm"
              placeholder={pt ? 'Título da tarefa...' : 'Task title...'} />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Descrição' : 'Description'}</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="bg-background border-border text-foreground resize-none text-sm" rows={2}
              placeholder={pt ? 'Detalhes da tarefa...' : 'Task details...'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Atribuir a' : 'Assign to'}</Label>
              <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                <SelectTrigger className="bg-background border-border text-foreground h-9 text-sm">
                  <SelectValue placeholder={pt ? 'Selecionar membro' : 'Select member'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{pt ? 'Sem atribuição' : 'Unassigned'}</SelectItem>
                  {members.filter(m => m.status === 'active').map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Prioridade' : 'Priority'}</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-background border-border text-foreground h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels[pt ? 'pt' : 'en']).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Prazo' : 'Deadline'}</Label>
              <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="bg-background border-border text-foreground h-9 text-sm" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-background border-border text-foreground h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Notas' : 'Notes'}</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="bg-background border-border text-foreground resize-none text-sm" rows={2} />
          </div>

          <div className="flex justify-between pt-1">
            {task?.id && (
              <Button type="button" variant="destructive" onClick={() => onDelete(task.id)} size="sm" className="gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />{pt ? 'Eliminar' : 'Delete'}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}
                className="border-border text-muted-foreground h-8 text-xs">
                {pt ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button type="submit" className="h-8 text-xs text-foreground hover:opacity-90" style={{ backgroundColor: '#e97c3f' }}>
                {pt ? 'Guardar' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}