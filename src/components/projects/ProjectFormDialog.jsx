import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2, Tag, ChevronDown, Check } from 'lucide-react';

const FIELD_CLASS = "h-9 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-orange-500/50";
const LABEL_CLASS = "text-[11px] font-medium text-muted-foreground mb-1 block";

const CATEGORIES_PT = ['Design', 'Desenvolvimento', 'Marketing', 'Consultoria', 'Construção', 'Investigação', 'Operações', 'Outro'];
const CATEGORIES_EN = ['Design', 'Development', 'Marketing', 'Consulting', 'Construction', 'Research', 'Operations', 'Other'];

const EMPTY_FORM = {
  name: '', status: 'planning', priority: 'medium', category: '',
  client_id: '', client_name: '', owner_id: '', owner_name: '',
  member_ids: [], member_names: [],
  start_date: '', due_date: '', budget: '', description: '', tags: []
};

function TagInput({ tags, onChange, pt }) {
  const [input, setInput] = useState('');
  const addTag = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div className="min-h-9 flex flex-wrap gap-1.5 items-center px-2.5 py-1.5 rounded-md border border-border bg-background cursor-text"
      onClick={e => e.currentTarget.querySelector('input')?.focus()}>
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/20">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-orange-100"><X className="w-2.5 h-2.5" /></button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } if (e.key === ',') { e.preventDefault(); addTag(); } }}
        onBlur={addTag}
        placeholder={tags.length === 0 ? (pt ? 'Adicionar tag, Enter para confirmar' : 'Add tag, press Enter') : ''}
        className="bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground flex-1 min-w-24"
      />
    </div>
  );
}

function MultiMemberSelect({ members, selectedIds, selectedNames, onChange, pt }) {
  const [open, setOpen] = useState(false);
  const toggle = (member) => {
    if (selectedIds.includes(member.id)) {
      onChange(
        selectedIds.filter(id => id !== member.id),
        selectedNames.filter(n => n !== member.full_name)
      );
    } else {
      onChange([...selectedIds, member.id], [...selectedNames, member.full_name]);
    }
  };
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 h-9 px-3 rounded-md border border-border bg-background text-sm text-left transition-colors hover:border-orange-500/40">
        <span className={selectedIds.length === 0 ? 'text-muted-foreground text-xs' : 'text-foreground text-xs truncate'}>
          {selectedIds.length === 0
            ? (pt ? 'Selecionar membros...' : 'Select members...')
            : selectedNames.join(', ')}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-background shadow-xl max-h-44 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">{pt ? 'Nenhum membro encontrado.' : 'No members found.'}</p>
          ) : members.map(m => (
            <button key={m.id} type="button" onClick={() => toggle(m)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-accent/50 transition-colors">
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedIds.includes(m.id) ? 'bg-orange-500 border-orange-500' : 'border-border'}`}>
                {selectedIds.includes(m.id) && <Check className="w-2.5 h-2.5 text-foreground" />}
              </div>
              <div>
                <p className="text-foreground font-medium">{m.full_name}</p>
                {m.role && <p className="text-muted-foreground text-[10px]">{m.role}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function ProjectFormDialog({ open, onClose, project, onSave, onDelete, clients, members, language }) {
  const pt = language === 'pt';
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      if (project) {
        setForm({
          name:         project.name         || '',
          status:       project.status        || 'planning',
          priority:     project.priority      || 'medium',
          category:     project.category      || '',
          client_id:    project.client_id     || '',
          client_name:  project.client_name   || '',
          owner_id:     project.owner_id      || '',
          owner_name:   project.owner_name    || '',
          member_ids:   project.member_ids    || [],
          member_names: project.member_names  || [],
          start_date:   project.start_date    || '',
          due_date:     project.due_date      || '',
          budget:       project.budget != null ? String(project.budget) : '',
          description:  project.description  || '',
          tags:         project.tags          || []
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [project, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setForm(prev => ({ ...prev, client_id: clientId, client_name: client?.name || '' }));
  };

  const handleManagerChange = (memberId) => {
    const member = members.find(m => m.id === memberId);
    setForm(prev => ({ ...prev, owner_id: memberId, owner_name: member?.full_name || '' }));
  };

  const handleMembersChange = (ids, names) => {
    setForm(prev => ({ ...prev, member_ids: ids, member_names: names }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, budget: form.budget ? Number(form.budget) : undefined });
  };

  const statusOptions = pt
    ? [['planning','Planeamento'],['active','Ativo'],['on_hold','Em Espera'],['completed','Concluído'],['archived','Arquivado']]
    : [['planning','Planning'],['active','Active'],['on_hold','On Hold'],['completed','Completed'],['archived','Archived']];

  const priorityOptions = pt
    ? [['low','Baixa'],['medium','Média'],['high','Alta'],['urgent','Urgente']]
    : [['low','Low'],['medium','Medium'],['high','High'],['urgent','Urgent']];

  const categories = pt ? CATEGORIES_PT : CATEGORIES_EN;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-4xl w-full bg-background border-border text-foreground p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <DialogTitle className="text-sm font-semibold text-foreground">
            {project ? (pt ? 'Editar Projeto' : 'Edit Project') : (pt ? 'Novo Projeto' : 'New Project')}
          </DialogTitle>
          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[78vh]">
          <div className="px-5 py-4 space-y-4">

            {/* Project Name */}
            <div>
              <Label className={LABEL_CLASS}>{pt ? 'Nome do Projeto' : 'Project Name'} <span className="text-orange-400">*</span></Label>
              <Input required value={form.name} onChange={e => set('name', e.target.value)}
                className={FIELD_CLASS} placeholder={pt ? 'Ex: Website Redesign' : 'e.g. Website Redesign'} />
            </div>

            {/* Client (required) */}
            <div>
              <Label className={LABEL_CLASS}>{pt ? 'Cliente' : 'Client'} <span className="text-orange-400">*</span></Label>
              {clients.length > 0 ? (
                <Select value={form.client_id} onValueChange={handleClientChange} required>
                  <SelectTrigger className={`${FIELD_CLASS} w-full`}>
                    <SelectValue placeholder={pt ? 'Selecionar cliente...' : 'Select client...'} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground">
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.client_name} onChange={e => set('client_name', e.target.value)}
                  className={FIELD_CLASS} placeholder={pt ? 'Nome do cliente' : 'Client name'} />
              )}
            </div>

            {/* Project Manager + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={LABEL_CLASS}>{pt ? 'Gestor de Projeto' : 'Project Manager'}</Label>
                {members.length > 0 ? (
                  <Select value={form.owner_id} onValueChange={handleManagerChange}>
                    <SelectTrigger className={`${FIELD_CLASS} w-full`}>
                      <SelectValue placeholder={pt ? 'Selecionar...' : 'Select...'} />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
                      {members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.owner_name} onChange={e => set('owner_name', e.target.value)}
                    className={FIELD_CLASS} placeholder={pt ? 'Nome do gestor' : 'Manager name'} />
                )}
              </div>
              <div>
                <Label className={LABEL_CLASS}>{pt ? 'Categoria' : 'Category'}</Label>
                <Select value={form.category} onValueChange={v => set('category', v)}>
                  <SelectTrigger className={`${FIELD_CLASS} w-full`}>
                    <SelectValue placeholder={pt ? 'Selecionar...' : 'Select...'} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground">
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Team Members */}
            <div>
              <Label className={LABEL_CLASS}>{pt ? 'Membros da Equipa' : 'Team Members'}</Label>
              <MultiMemberSelect
                members={members}
                selectedIds={form.member_ids}
                selectedNames={form.member_names}
                onChange={handleMembersChange}
                pt={pt}
              />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={LABEL_CLASS}>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className={`${FIELD_CLASS} w-full`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground">
                    {statusOptions.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={LABEL_CLASS}>{pt ? 'Prioridade' : 'Priority'}</Label>
                <Select value={form.priority} onValueChange={v => set('priority', v)}>
                  <SelectTrigger className={`${FIELD_CLASS} w-full`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground">
                    {priorityOptions.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Start + Due Date + Budget */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className={LABEL_CLASS}>{pt ? 'Data de Início' : 'Start Date'}</Label>
                <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                  className={FIELD_CLASS} />
              </div>
              <div>
                <Label className={LABEL_CLASS}>{pt ? 'Data Limite' : 'Due Date'}</Label>
                <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                  className={FIELD_CLASS} />
              </div>
              <div>
                <Label className={LABEL_CLASS}>{pt ? 'Orçamento (€)' : 'Budget (€)'}</Label>
                <Input type="number" min="0" step="0.01" value={form.budget} onChange={e => set('budget', e.target.value)}
                  className={FIELD_CLASS} placeholder="0.00" />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className={LABEL_CLASS}>{pt ? 'Descrição' : 'Description'}</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={3} className="bg-background border-border text-foreground text-sm placeholder:text-muted-foreground resize-none focus:border-orange-500/50"
                placeholder={pt ? 'Descrição do projeto...' : 'Project description...'} />
            </div>

            {/* Tags */}
            <div>
              <Label className={LABEL_CLASS}><Tag className="w-3 h-3 inline mr-1" />{pt ? 'Tags' : 'Tags'}</Label>
              <TagInput tags={form.tags} onChange={v => set('tags', v)} pt={pt} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-background">
            {project ? (
              <button type="button" onClick={() => onDelete(project.id)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />{pt ? 'Eliminar' : 'Delete'}
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-1.5 rounded-md text-xs text-muted-foreground border border-border hover:bg-accent/50 transition-all">
                {pt ? 'Cancelar' : 'Cancel'}
              </button>
              <button type="submit"
                className="px-4 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all">
                {project ? (pt ? 'Atualizar' : 'Update') : (pt ? 'Criar Projeto' : 'Create Project')}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}