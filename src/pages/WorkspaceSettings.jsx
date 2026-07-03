import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useLanguage } from '../components/LanguageContext';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import { Building2, Users, Mail, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import ProfileSettingsCard from '../components/profile/ProfileSettingsCard';
import CompanyProfileTab from '../components/settings/CompanyProfileTab';

export default function WorkspaceSettings() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberRole, setMemberRole] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await api.auth.me();
      setUser(currentUser);

      if (!currentUser.current_workspace_id) {
        navigate(createPageUrl('Onboarding'));
        return;
      }

      // Get workspace
      const workspaces = await api.entities.Workspace.filter({ id: currentUser.current_workspace_id });
      if (workspaces.length === 0) {
        navigate(createPageUrl('Onboarding'));
        return;
      }
      setWorkspace(workspaces[0]);

      // Get current user's role
      const myMembership = await api.entities.WorkspaceMember.filter({
        workspace_id: currentUser.current_workspace_id,
        user_email: currentUser.email
      });
      setMemberRole(myMembership[0]?.role);

      // Get all members if user is owner/admin
      if (myMembership[0]?.role === 'owner' || myMembership[0]?.role === 'admin') {
        const allMembers = await api.entities.WorkspaceMember.filter({
          workspace_id: currentUser.current_workspace_id
        });
        setMembers(allMembers);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSaveWorkspace = async () => {
    try {
      setSavingWorkspace(true);
      await api.entities.Workspace.update(workspace.id, {
        name: workspace.name,
        company_info: workspace.company_info,
        settings: workspace.settings
      });
      alert(language === 'pt' ? 'Guardado com sucesso!' : 'Saved successfully!');
      setSavingWorkspace(false);
    } catch (error) {
      console.error('Error saving workspace:', error);
      alert(language === 'pt' ? 'Erro ao guardar' : 'Error saving');
      setSavingWorkspace(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;

    try {
      // Check if already a member
      const existing = await api.entities.WorkspaceMember.filter({
        workspace_id: workspace.id,
        user_email: inviteEmail
      });

      if (existing.length > 0) {
        alert(language === 'pt' ? 'Utilizador já é membro' : 'User is already a member');
        return;
      }

      // Create member record
      await api.entities.WorkspaceMember.create({
        workspace_id: workspace.id,
        user_email: inviteEmail,
        role: inviteRole,
        status: 'invited',
        permissions: {
          can_manage_tasks: true,
          can_manage_clients: true,
          can_manage_documents: true,
          can_manage_invoices: inviteRole !== 'member',
          can_view_financials: true,
          can_manage_members: inviteRole === 'owner' || inviteRole === 'admin'
        }
      });

      // Send invitation email
      await api.integrations.Core.SendEmail({
        to: inviteEmail,
        subject: language === 'pt' ? `Convite para ${workspace.name}` : `Invitation to ${workspace.name}`,
        body: language === 'pt' 
          ? `Foi convidado para juntar-se ao espaço de trabalho ${workspace.name} na WiKima.\n\nAceda a https://wikima.com e faça login para começar.`
          : `You've been invited to join the ${workspace.name} workspace on WiKima.\n\nVisit https://wikima.com and log in to get started.`
      });

      alert(language === 'pt' ? 'Convite enviado!' : 'Invitation sent!');
      setInviteEmail('');
      loadData();
    } catch (error) {
      console.error('Error inviting member:', error);
      alert(language === 'pt' ? 'Erro ao enviar convite' : 'Error sending invitation');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm(language === 'pt' ? 'Remover este membro?' : 'Remove this member?')) return;

    try {
      await api.entities.WorkspaceMember.delete(memberId);
      loadData();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      await api.entities.WorkspaceMember.update(memberId, {
        role: newRole,
        permissions: {
          can_manage_tasks: true,
          can_manage_clients: true,
          can_manage_documents: true,
          can_manage_invoices: newRole !== 'member',
          can_view_financials: true,
          can_manage_members: newRole === 'owner' || newRole === 'admin'
        }
      });
      loadData();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{language === 'pt' ? 'A carregar...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        
        <div className="flex-1 ">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {language === 'pt' ? 'Configurações do Espaço de Trabalho' : 'Workspace Settings'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'pt' ? 'Gerir espaço de trabalho e membros' : 'Manage workspace and members'}
              </p>
            </div>

            {/* Tabs — only shown for company workspaces */}
            {workspace?.type === 'company' && (
              <div className="flex gap-1 mb-4 p-1 rounded-xl bg-background w-fit">
                {['general', 'company'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'general'
                      ? (language === 'pt' ? 'Geral' : 'General')
                      : (language === 'pt' ? 'Perfil da Empresa' : 'Company Profile')}
                  </button>
                ))}
              </div>
            )}

            {/* Company Profile Tab */}
            {activeTab === 'company' && workspace?.type === 'company' ? (
              <CompanyProfileTab workspace={workspace} language={language} />
            ) : (
              <div className="grid gap-6">
                {/* Profile Settings - Hidden for company workspaces */}
                {workspace?.type !== 'company' && <ProfileSettingsCard language={language} />}

                {/* Workspace Info */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      {language === 'pt' ? 'Informações do Espaço' : 'Workspace Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        {language === 'pt' ? 'Nome do Espaço' : 'Workspace Name'}
                      </label>
                      <Input
                        value={workspace?.name || ''}
                        onChange={(e) => setWorkspace({...workspace, name: e.target.value})}
                        className="bg-background border-border text-foreground"
                        disabled={memberRole !== 'owner'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        {language === 'pt' ? 'Tipo de Espaço' : 'Workspace Type'}
                      </label>
                      <Badge className="bg-primary/20 text-primary">
                        {workspace?.type === 'personal' 
                          ? (language === 'pt' ? 'Pessoal' : 'Personal')
                          : (language === 'pt' ? 'Empresa' : 'Company')}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === 'pt' 
                          ? 'Para usar outro perfil, crie um novo espaço de trabalho.'
                          : 'To use another profile, create a new workspace.'}
                      </p>
                    </div>

                    {memberRole === 'owner' && (
                      <Button 
                        onClick={handleSaveWorkspace}
                        disabled={savingWorkspace}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {savingWorkspace 
                          ? (language === 'pt' ? 'A guardar...' : 'Saving...')
                          : (language === 'pt' ? 'Guardar Alterações' : 'Save Changes')}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Team Members Summary - Only for company workspaces */}
                {workspace?.type === 'company' && (
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {language === 'pt' ? 'Membros da Equipa' : 'Team Members'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background rounded-lg p-4 border border-border">
                          <p className="text-sm text-muted-foreground mb-1">
                            {language === 'pt' ? 'Total de Membros' : 'Total Members'}
                          </p>
                          <p className="text-2xl font-bold text-foreground">{members.length}</p>
                        </div>
                        <div className="bg-background rounded-lg p-4 border border-border">
                          <p className="text-sm text-muted-foreground mb-1">
                            {language === 'pt' ? 'Membros Ativos' : 'Active Members'}
                          </p>
                          <p className="text-2xl font-bold text-foreground">
                            {members.filter(m => m.status !== 'invited').length}
                          </p>
                        </div>
                      </div>

                      {(memberRole === 'owner' || memberRole === 'admin') && (
                        <Button
                          onClick={() => navigate(createPageUrl('Team'))}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {language === 'pt' ? 'Gerir Equipa' : 'Manage Team'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}