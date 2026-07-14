import { useState, useEffect } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building2, Bell, Link as LinkIcon, Sparkles, LogOut, Upload, Trash2, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';
import PlanLimitModal from '../components/PlanLimitModal';
import GmailIntegration from '../components/GmailIntegration';

export default function Profile() {
  const { t, language } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    profile_photo: '',
    country: '',
    timezone: '',
    preferred_language: '',
    role_title: '',
    company_name: '',
    company_type: '',
    company_logo: '',
    num_employees: '',
    tax_number: '',
    address: '',
    company_phone: '',
    website_url: '',
    phone: ''
  });
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    task_reminders: true,
    invoice_alerts: true,
    wiwi_suggestions: true,
    whatsapp_notifications: false,
    daily_summary: false,
    weekly_summary: true,
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    google_calendar_sync: false,
    two_factor_enabled: false
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setUserData({
        full_name: currentUser.full_name || '',
        email: currentUser.email || '',
        profile_photo: currentUser.profile_photo || '',
        country: currentUser.country || '',
        timezone: currentUser.timezone || '',
        preferred_language: currentUser.preferred_language || '',
        role_title: currentUser.role_title || '',
        company_name: currentUser.company_name || '',
        company_type: currentUser.company_type || '',
        company_logo: currentUser.company_logo || '',
        num_employees: currentUser.num_employees || '',
        tax_number: currentUser.tax_number || '',
        address: currentUser.address || '',
        company_phone: currentUser.company_phone || '',
        website_url: currentUser.website_url || '',
        phone: currentUser.phone || ''
      });
      if (currentUser.preferences) {
        setPreferences({ ...preferences, ...currentUser.preferences });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.auth.updateMe({
        profile_photo: userData.profile_photo,
        country: userData.country,
        timezone: userData.timezone,
        preferred_language: userData.preferred_language,
        role_title: userData.role_title,
        company_name: userData.company_name,
        company_type: userData.company_type,
        company_logo: userData.company_logo,
        num_employees: userData.num_employees,
        tax_number: userData.tax_number,
        phone: userData.phone,
        address: userData.address,
        company_phone: userData.company_phone,
        website_url: userData.website_url
      });
      toast.success(language === 'pt' ? 'Perfil atualizado!' : 'Profile updated!');
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao guardar' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setUserData({...userData, profile_photo: file_url});
      await api.auth.updateMe({ profile_photo: file_url });
      toast.success(language === 'pt' ? 'Foto atualizada!' : 'Photo updated!');
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao carregar foto' : 'Error uploading photo');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setUserData({...userData, company_logo: file_url});
      await api.auth.updateMe({ company_logo: file_url });
      toast.success(language === 'pt' ? 'Logo atualizado!' : 'Logo updated!');
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao carregar logo' : 'Error uploading logo');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(language === 'pt' ? 'Tem certeza que deseja eliminar a sua conta? Esta ação é irreversível.' : 'Are you sure you want to delete your account? This action is irreversible.')) {
      toast.error(language === 'pt' ? 'Funcionalidade em desenvolvimento. Contacte o suporte.' : 'Feature under development. Please contact support.');
    }
  };

  const checkNotificationAccess = (feature) => {
    const plan = user?.user_plan || 'free';
    
    const blocked = {
      free: ['whatsapp_notifications', 'daily_summary'],
      starter: [],
      growth: [],
      business: []
    };

    if (blocked[plan]?.includes(feature)) {
      const suggestedPlan = plan === 'free' ? 'starter' : plan === 'starter' ? 'growth' : 'business';
      setLimitInfo({
        allowed: false,
        limitType: 'notifications',
        suggestedPlan: suggestedPlan
      });
      setShowLimitModal(true);
      return false;
    }
    return true;
  };

  const handleToggleChange = (feature, checked) => {
    if (checked && !checkNotificationAccess(feature)) {
      return;
    }
    setPreferences({ ...preferences, [feature]: checked });
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await api.auth.updateMe({ preferences });
      toast.success(language === 'pt' ? 'Definições guardadas com sucesso.' : 'Settings saved successfully.');
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao guardar' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p>{t('common_loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      

      {/* Main Content */}
      <main className="p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
      {/* Header with strong visibility */}
      <div className="mb-8 bg-gradient-to-r from-slate-800 to-slate-900 -mx-6 md:-mx-8 px-6 md:px-8 py-6 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{t('profile_title')}</h1>
            <p className="text-slate-300 text-sm mb-3">
              {language === 'pt'
                ? 'Gere a tua conta, preferências e integrações'
                : 'Manage your account, preferences, and integrations'}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary to-primary/70 rounded-full">
              <span className="text-white text-sm font-semibold">
                {(user?.user_plan || 'free').toUpperCase()} {language === 'pt' ? 'Plano' : 'Plan'}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 bg-muted hover:bg-white/20 text-foreground border-border">
            <LogOut className="w-4 h-4" />
            {language === 'pt' ? 'Sair' : 'Logout'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="user" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="user" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{t('profile_user_info')}</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('profile_company_info')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">{t('profile_notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <LinkIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('profile_integrations')}</span>
          </TabsTrigger>
        </TabsList>

        {/* User Info Tab */}
        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile_user_info')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center gap-6 mb-6">
                  {userData.profile_photo ? (
                    <img src={userData.profile_photo} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-amber-100" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-foreground text-3xl font-bold">
                      {userData.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{userData.full_name}</h3>
                    <p className="text-muted-foreground">{userData.email}</p>
                    <div className="mt-2 mb-3">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/15 border border-primary/30 rounded-full text-sm font-medium text-primary">
                        {(user?.user_plan || 'free').toUpperCase()} Plan
                      </span>
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={(e) => e.preventDefault()}>
                        <Upload className="w-4 h-4" />
                        {language === 'pt' ? 'Alterar Foto' : 'Change Photo'}
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">
                      {language === 'pt' ? 'Nome Completo' : 'Full Name'}
                    </Label>
                    <Input
                      id="full_name"
                      value={userData.full_name}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({...userData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="role_title">
                      {language === 'pt' ? 'Cargo/Título' : 'Role/Title'}
                    </Label>
                    <Input
                      id="role_title"
                      value={userData.role_title}
                      onChange={(e) => setUserData({...userData, role_title: e.target.value})}
                      placeholder={language === 'pt' ? 'Ex: Coach, Terapeuta' : 'Ex: Coach, Therapist'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      {language === 'pt' ? 'Telefone' : 'Phone'}
                    </Label>
                    <Input
                      id="phone"
                      value={userData.phone}
                      onChange={(e) => setUserData({...userData, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">
                      {language === 'pt' ? 'País' : 'Country'}
                    </Label>
                    <Input
                      id="country"
                      value={userData.country}
                      onChange={(e) => setUserData({...userData, country: e.target.value})}
                      placeholder={language === 'pt' ? 'Ex: Portugal' : 'Ex: Portugal'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone">
                      {language === 'pt' ? 'Fuso Horário' : 'Timezone'}
                    </Label>
                    <select
                      id="timezone"
                      value={userData.timezone}
                      onChange={(e) => setUserData({...userData, timezone: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select...</option>
                      <option value="Europe/Lisbon">Europe/Lisbon (GMT+0)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                      <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                      <option value="America/New_York">America/New York (GMT-5)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="preferred_language">
                      {language === 'pt' ? 'Idioma Preferido' : 'Preferred Language'}
                    </Label>
                    <select
                      id="preferred_language"
                      value={userData.preferred_language}
                      onChange={(e) => setUserData({...userData, preferred_language: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select...</option>
                      <option value="pt">Português</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {language === 'pt' ? 'Autenticação de Dois Fatores (2FA)' : 'Two-Factor Authentication (2FA)'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'pt' ? 'Adicione uma camada extra de segurança' : 'Add an extra layer of security'}
                      </p>
                    </div>
                    <Switch
                      checked={preferences.two_factor_enabled}
                      onCheckedChange={(checked) => setPreferences({...preferences, two_factor_enabled: checked})}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="button" variant="outline" className="sm:w-auto">
                      {language === 'pt' ? 'Alterar Senha' : 'Change Password'}
                    </Button>

                    <Button type="button" variant="destructive" className="sm:w-auto gap-2" onClick={handleDeleteAccount}>
                      <Trash2 className="w-4 h-4" />
                      {language === 'pt' ? 'Eliminar Conta' : 'Delete Account'}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                  {saving ? t('common_loading') : t('common_save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Info Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile_company_info')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center gap-6 mb-6">
                  {userData.company_logo ? (
                    <img src={userData.company_logo} alt="Logo" className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      <Button type="button" variant="outline" size="sm" className="gap-2">
                        <Upload className="w-4 h-4" />
                        {language === 'pt' ? 'Carregar Logo' : 'Upload Logo'}
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">
                      {language === 'pt' ? 'Nome da Empresa' : 'Company Name'}
                    </Label>
                    <Input
                      id="company_name"
                      value={userData.company_name}
                      onChange={(e) => setUserData({...userData, company_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_type">
                      {language === 'pt' ? 'Tipo de Negócio' : 'Business Type'}
                    </Label>
                    <Input
                      id="company_type"
                      value={userData.company_type}
                      onChange={(e) => setUserData({...userData, company_type: e.target.value})}
                      placeholder={language === 'pt' ? 'Ex: Coaching, Terapia' : 'Ex: Coaching, Therapy'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="num_employees">
                      {language === 'pt' ? 'Número de Funcionários' : 'Number of Employees'}
                    </Label>
                    <select
                      id="num_employees"
                      value={userData.num_employees}
                      onChange={(e) => setUserData({...userData, num_employees: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select...</option>
                      <option value="1">1 (Solo)</option>
                      <option value="2-5">2-5</option>
                      <option value="6-10">6-10</option>
                      <option value="11-50">11-50</option>
                      <option value="50+">50+</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="tax_number">
                      {language === 'pt' ? 'NIF / Número Fiscal' : 'Tax Number (NIF)'}
                    </Label>
                    <Input
                      id="tax_number"
                      value={userData.tax_number}
                      onChange={(e) => setUserData({...userData, tax_number: e.target.value})}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">
                      {language === 'pt' ? 'Morada' : 'Address'}
                    </Label>
                    <Input
                      id="address"
                      value={userData.address}
                      onChange={(e) => setUserData({...userData, address: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_phone">
                      {language === 'pt' ? 'Telefone da Empresa' : 'Company Phone'}
                    </Label>
                    <Input
                      id="company_phone"
                      value={userData.company_phone}
                      onChange={(e) => setUserData({...userData, company_phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website_url">
                      {language === 'pt' ? 'Website' : 'Website URL'}
                    </Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={userData.website_url}
                      onChange={(e) => setUserData({...userData, website_url: e.target.value})}
                      placeholder="https://"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="bg-amber-700 hover:bg-amber-800">
                  {saving ? t('common_loading') : t('common_save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile_notifications')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {language === 'pt' ? 'Notificações por Email' : 'Email Notifications'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt' 
                      ? 'Recebe atualizações importantes por email'
                      : 'Receive important updates via email'}
                  </p>
                </div>
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) => handleToggleChange('email_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {language === 'pt' ? 'Notificações WhatsApp' : 'WhatsApp Notifications'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt'
                      ? 'Recebe notificações via WhatsApp'
                      : 'Receive notifications via WhatsApp'}
                  </p>
                </div>
                <Switch
                  checked={preferences.whatsapp_notifications}
                  onCheckedChange={(checked) => handleToggleChange('whatsapp_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {language === 'pt' ? 'Lembretes de Tarefas' : 'Task Reminders'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt'
                      ? 'Avisos sobre tarefas próximas do prazo'
                      : 'Alerts for upcoming task deadlines'}
                  </p>
                </div>
                <Switch
                  checked={preferences.task_reminders}
                  onCheckedChange={(checked) => handleToggleChange('task_reminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {language === 'pt' ? 'Alertas de Faturas' : 'Invoice Alerts'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt'
                      ? 'Notificações sobre faturas vencidas'
                      : 'Notifications about overdue invoices'}
                  </p>
                </div>
                <Switch
                  checked={preferences.invoice_alerts}
                  onCheckedChange={(checked) => handleToggleChange('invoice_alerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {language === 'pt' ? 'Resumo Diário' : 'Daily Summary'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt'
                      ? 'Recebe um resumo diário das tuas tarefas'
                      : 'Receive a daily summary of your tasks'}
                  </p>
                </div>
                <Switch
                  checked={preferences.daily_summary}
                  onCheckedChange={(checked) => handleToggleChange('daily_summary', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {language === 'pt' ? 'Resumo Semanal' : 'Weekly Summary'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt'
                      ? 'Recebe um resumo semanal do teu progresso'
                      : 'Receive a weekly summary of your progress'}
                  </p>
                </div>
                <Switch
                  checked={preferences.weekly_summary}
                  onCheckedChange={(checked) => handleToggleChange('weekly_summary', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium">
                      {language === 'pt' ? 'Sugestões WIKIMA' : 'WIKIMA Suggestions'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'pt'
                        ? 'Recebe sugestões proativas do assistente IA'
                        : 'Receive proactive suggestions from AI assistant'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.wiwi_suggestions}
                  onCheckedChange={(checked) => handleToggleChange('wiwi_suggestions', checked)}
                />
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <p className="font-medium">
                    {language === 'pt' ? 'Horário de Trabalho' : 'Working Hours'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      {language === 'pt' ? 'Início' : 'Start'}
                    </Label>
                    <Input
                      type="time"
                      value={preferences.working_hours_start}
                      onChange={(e) => setPreferences({...preferences, working_hours_start: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>
                      {language === 'pt' ? 'Fim' : 'End'}
                    </Label>
                    <Input
                      type="time"
                      value={preferences.working_hours_end}
                      onChange={(e) => setPreferences({...preferences, working_hours_end: e.target.value})}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'pt'
                    ? 'Notificações serão enviadas apenas durante este horário'
                    : 'Notifications will only be sent during these hours'}
                </p>
              </div>

              <Button onClick={handleSavePreferences} disabled={saving} className="bg-amber-700 hover:bg-amber-800">
                {saving ? t('common_loading') : t('common_save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile_integrations')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <GmailIntegration />

              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium">Outlook Sync</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt'
                      ? 'Sincroniza emails do Outlook com WiKima'
                      : 'Sync Outlook emails with WiKima'}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {language === 'pt' ? 'Em breve' : 'Coming soon'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt'
                      ? 'Sincroniza as tuas tarefas com o Google Calendar'
                      : 'Sync your tasks with Google Calendar'}
                  </p>
                </div>
                <Switch
                  checked={preferences.google_calendar_sync}
                  onCheckedChange={(checked) => setPreferences({...preferences, google_calendar_sync: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium">Outlook Calendar</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt'
                      ? 'Sincroniza tarefas com o Outlook Calendar'
                      : 'Sync tasks with Outlook Calendar'}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {language === 'pt' ? 'Em breve' : 'Coming soon'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium">WhatsApp Business API</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt'
                      ? 'Liga o WhatsApp Business para mensagens automáticas'
                      : 'Connect WhatsApp Business for automated messaging'}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {language === 'pt' ? 'Em breve' : 'Coming soon'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium">Stripe / PayPal</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt'
                      ? 'Conecta gateway de pagamento'
                      : 'Connect payment gateway'}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {language === 'pt' ? 'Em breve' : 'Coming soon'}
                </Button>
              </div>

              <Button onClick={handleSavePreferences} disabled={saving} className="bg-amber-700 hover:bg-amber-800">
                {saving ? t('common_loading') : t('common_save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Limit Modal */}
      {limitInfo && (
        <PlanLimitModal
          open={showLimitModal}
          onClose={() => {
            setShowLimitModal(false);
            setLimitInfo(null);
          }}
          limitType={limitInfo.limitType}
          currentPlan={user?.user_plan || 'free'}
          suggestedPlan={limitInfo.suggestedPlan}
        />
      )}
        </div>
      </main>
    </div>
  );
}