import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, CheckCircle, Clock, RefreshCw, Shield, UserCog, User, Crown, PauseCircle, PlayCircle, XCircle } from 'lucide-react';
import { api } from '@/api/client';
import { toast } from 'sonner';

const AVATAR_COLORS = ['#e97c3f', '#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316'];

const ACCESS_ROLES = (pt) => [
  { value: 'owner',   label: 'Owner',                      desc: pt ? 'Controlo total'          : 'Full control',            icon: Crown,   color: '#e97c3f' },
  { value: 'admin',   label: pt ? 'Administrador' : 'Admin', desc: pt ? 'Gestão de workspace'   : 'Workspace management',     icon: Shield,  color: '#ef4444' },
  { value: 'manager', label: 'Manager',                    desc: pt ? 'Gestão de equipa'         : 'Team management',          icon: UserCog, color: '#6366f1' },
  { value: 'member',  label: pt ? 'Colaborador' : 'Employee', desc: pt ? 'Tarefas atribuídas'  : 'Assigned tasks only',       icon: User,    color: '#22c55e' },
];

export default function TeamMemberDialog({
  open, onClose, member, onSave, onSuspend, onReactivate, onCancelInvite,
  language, workspaceId, workspaceName, companyName, companyLogoUrl
}) {
  const pt = language === 'pt';

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    role: '', department: '', app_role: 'member', notes: '',
    avatar_color: AVATAR_COLORS[0]
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (member) {
      const parts = (member.full_name || '').split(' ');
      setForm({
        first_name: member.first_name || parts[0] || '',
        last_name:  member.last_name  || parts.slice(1).join(' ') || '',
        email:       member.email        || '',
        phone:       member.phone        || '',
        role:        member.role         || '',
        department:  member.department   || '',
        app_role:    member.app_role     || 'member',
        notes:       member.notes        || '',
        avatar_color: member.avatar_color || AVATAR_COLORS[0]
      });
    } else {
      setForm({
        first_name: '', last_name: '', email: '', phone: '',
        role: '', department: '', app_role: 'member', notes: '',
        avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
      });
    }
  }, [member, open]);

  const getFullName = () => `${form.first_name} ${form.last_name}`.trim();

  const handleSendInvite = async (e) => {
    e?.preventDefault();
    const fullName = getFullName();
    if (!form.email || !fullName || !form.role) {
      toast.error(pt ? 'Preencha nome, email e cargo.' : 'Fill in name, email and role.');
      return;
    }
    setInviting(true);
    try {
      const saveData = { ...form, full_name: fullName, status: 'active' };
      onSave(saveData);
      await new Promise(r => setTimeout(r, 400));
      await api.functions.invoke('inviteTeamMember', {
        memberEmail:    form.email,
        memberName:     fullName,
        memberRole:     form.role,
        appRole:        form.app_role,
        workspaceId,
        workspaceName,
        companyName:    companyName || workspaceName,
        companyLogoUrl: companyLogoUrl || null,
        teamMemberId:   member?.id || null
      });
      toast.success(pt ? `✉️ Convite enviado para ${form.email}!` : `✉️ Invite sent to ${form.email}!`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(pt ? 'Erro ao enviar convite.' : 'Failed to send invite.');
    } finally {
      setInviting(false);
    }
  };

  const handleSaveOnly = (e) => {
    e.preventDefault();
    onSave({ ...form, full_name: getFullName(), status: member?.status || 'active' });
  };

  const inviteStatus = member?.invitation_status;
  const isAccepted   = inviteStatus === 'accepted';
  const isPending    = inviteStatus === 'pending';
  const isExpired    = inviteStatus === 'expired';
  const isSuspended  = member?.status === 'inactive';
  const hasActivity  = !!(member?.joined_at);
  const roles        = ACCESS_ROLES(pt);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-card border-border text-foreground p-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-foreground">
              {member ? (pt ? 'Editar Membro' : 'Edit Member') : (pt ? 'Novo Membro' : 'New Team Member')}
            </DialogTitle>
            <div className="flex items-center gap-1.5">
              {isAccepted && !isSuspended && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-500/15 text-green-400 border-green-500/25 border gap-1">
                  <CheckCircle className="w-2.5 h-2.5" />{pt ? 'Ativo' : 'Active'}
                </Badge>
              )}
              {isPending && (
                <Badge className="text-[10px] px-1.5 py-0 bg-yellow-500/15 text-yellow-400 border-yellow-500/25 border gap-1">
                  <Clock className="w-2.5 h-2.5" />{pt ? 'Pendente' : 'Pending'}
                </Badge>
              )}
              {isExpired && (
                <Badge className="text-[10px] px-1.5 py-0 bg-red-500/15 text-red-400 border-red-500/25 border gap-1">
                  <XCircle className="w-2.5 h-2.5" />{pt ? 'Expirado' : 'Expired'}
                </Badge>
              )}
              {isSuspended && (
                <Badge className="text-[10px] px-1.5 py-0 bg-gray-500/15 text-gray-400 border-gray-500/25 border gap-1">
                  <PauseCircle className="w-2.5 h-2.5" />{pt ? 'Suspenso' : 'Suspended'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={member ? handleSaveOnly : handleSendInvite} className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">

          {/* Invite status banner */}
          {member && !isAccepted && (
            <div className="rounded-md border border-border bg-background px-3 py-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {isPending  && (pt ? '⏳ A aguardar aceitação do convite' : '⏳ Awaiting invite acceptance')}
                {isExpired  && (pt ? '⚠️ Convite expirado'               : '⚠️ Invitation expired')}
                {!isPending && !isExpired && (pt ? '📧 Convite não enviado' : '📧 Invite not sent yet')}
              </p>
              <button type="button" onClick={handleSendInvite} disabled={inviting}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-all flex-shrink-0">
                {inviting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                {isPending || isExpired ? (pt ? 'Reenviar' : 'Resend') : (pt ? 'Enviar' : 'Send')}
              </button>
            </div>
          )}

          {/* Cancel invite option for pending */}
          {member && isPending && onCancelInvite && (
            <button type="button" onClick={() => onCancelInvite(member.id)}
              className="w-full text-left text-[11px] text-red-400 hover:text-red-300 px-1 flex items-center gap-1.5 transition-colors">
              <XCircle className="w-3 h-3" />
              {pt ? 'Cancelar convite' : 'Cancel invitation'}
            </button>
          )}

          {/* First + Last Name */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Primeiro Nome' : 'First Name'} *</Label>
              <Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required
                className="h-8 text-xs bg-background border-border text-foreground" placeholder={pt ? 'Ex: João' : 'e.g. John'} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Apelido' : 'Last Name'} *</Label>
              <Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required
                className="h-8 text-xs bg-background border-border text-foreground" placeholder={pt ? 'Ex: Silva' : 'e.g. Smith'} />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                required disabled={isAccepted}
                className="h-8 text-xs bg-background border-border text-foreground disabled:opacity-50"
                placeholder="email@example.com" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Telefone' : 'Phone'}</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="h-8 text-xs bg-background border-border text-foreground" placeholder="+351 900 000 000" />
            </div>
          </div>

          {/* Role + Department */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Cargo / Função' : 'Job Title'} *</Label>
              <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required
                className="h-8 text-xs bg-background border-border text-foreground"
                placeholder={pt ? 'Ex: Dev Frontend' : 'e.g. Designer'} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Departamento' : 'Department'}</Label>
              <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                className="h-8 text-xs bg-background border-border text-foreground"
                placeholder={pt ? 'Ex: Engenharia' : 'e.g. Engineering'} />
            </div>
          </div>

          {/* Access Level */}
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1.5 block">{pt ? 'Nível de Acesso' : 'Access Level'}</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {roles.map(r => {
                const Icon = r.icon;
                const active = form.app_role === r.value;
                return (
                  <button key={r.value} type="button" onClick={() => setForm({ ...form, app_role: r.value })}
                    className={`flex flex-col items-start gap-0.5 px-2.5 py-2 rounded-md border text-left transition-all ${
                      active ? '' : 'border-border bg-background hover:border-slate-500'
                    }`}
                    style={active ? { borderColor: r.color, backgroundColor: `${r.color}18` } : {}}>
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3" style={{ color: active ? r.color : '#64748b' }} />
                      <span className="text-xs font-medium" style={{ color: active ? r.color : '#94a3b8' }}>{r.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-tight">{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">{pt ? 'Notas' : 'Notes'}</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="bg-background border-border text-foreground text-xs resize-none" rows={2}
              placeholder={pt ? 'Notas internas...' : 'Internal notes...'} />
          </div>

          {/* Suspend / Reactivate for members with activity */}
          {member && hasActivity && (
            <div className="border-t border-border pt-3">
              {isSuspended ? (
                <button type="button" onClick={() => onReactivate && onReactivate(member.id)}
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  <PlayCircle className="w-3.5 h-3.5" />
                  {pt ? 'Reativar membro' : 'Reactivate member'}
                </button>
              ) : (
                <button type="button" onClick={() => onSuspend && onSuspend(member.id)}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  <PauseCircle className="w-3.5 h-3.5" />
                  {pt ? 'Suspender membro' : 'Suspend member'}
                </button>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {pt ? 'O histórico de tarefas e documentos é preservado.' : 'Task history and documents are preserved.'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs text-muted-foreground border border-border hover:bg-accent/50 transition-all">
              {pt ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="submit" disabled={inviting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-foreground hover:opacity-90 transition-all disabled:opacity-60"
              style={{ backgroundColor: '#e97c3f' }}>
              {inviting && <RefreshCw className="w-3 h-3 animate-spin" />}
              {!inviting && !member && <Send className="w-3 h-3" />}
              {member ? (pt ? 'Guardar' : 'Save') : (pt ? 'Enviar Convite' : 'Send Invitation')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}