import React, { useState, useEffect } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { createPageUrl } from '../utils';
import { formatCurrency, getCurrencySymbol, getDefaultCurrency } from '../utils/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  X, 
  FileText, 
  Receipt,
  Eye,
  Repeat,
  TrendingUp,
  Clock,
  CheckCircle,
  PauseCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import MobileMenuButton from '../components/dashboard/MobileMenuButton';
import { Link } from 'react-router-dom';
import ServiceAttachmentsDialog from '../components/ServiceAttachmentsDialog';
import AccessGuard from '../components/AccessGuard';

export default function Services() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [showAttachmentsDialog, setShowAttachmentsDialog] = useState(false);
  const [selectedServiceForAttachments, setSelectedServiceForAttachments] = useState(null);
  const [serviceType, setServiceType] = useState('one_time');
  const [workspaceCurrency, setWorkspaceCurrency] = useState('AOA');
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [formData, setFormData] = useState({
    service_name: '',
    client_id: '',
    client_name: '',
    description: '',
    assigned_to: '',
    assigned_to_name: '',
    start_date: '',
    end_date: '',
    status: 'pending',
    service_type: 'one_time',
    recurring_frequency: 'monthly',
    currency: 'AOA',
    total_value: 0,
    notes: ''
  });

  // Authentication guard and workspace currency initialization
  React.useEffect(() => {
    const initWorkspace = async () => {
      try {
        const user = await api.auth.me();
        if (!user) {
          window.location.href = createPageUrl('Landing');
          return;
        }
        
        // Get workspace and set default currency
        const workspaceId = user.current_workspace_id || user.default_workspace_id;
        if (workspaceId) {
          const workspaces = await api.entities.Workspace.filter({ id: workspaceId });
          if (workspaces.length > 0) {
            const wsCurrency = getDefaultCurrency(workspaces[0]);
            setWorkspaceCurrency(wsCurrency);
            setFormData(prev => ({ ...prev, currency: wsCurrency }));
          }
        }
      } catch (error) {
        window.location.href = createPageUrl('Landing');
      }
    };
    initWorkspace();
  }, []);

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.Service.filter({ workspace_id: workspaceId }, '-created_date');
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.Client.filter({ workspace_id: workspaceId }, 'name');
    }
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.TeamMember.filter({ workspace_id: workspaceId }, 'full_name');
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowDialog(false);
      resetForm();
      toast.success(language === 'pt' ? 'Serviço criado com sucesso!' : 'Service created successfully!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowDialog(false);
      resetForm();
      toast.success(language === 'pt' ? 'Serviço atualizado!' : 'Service updated!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(language === 'pt' ? 'Serviço eliminado!' : 'Service deleted!');
    }
  });

  const resetForm = () => {
    setFormData({
      service_name: '',
      client_id: '',
      client_name: '',
      description: '',
      assigned_to: '',
      assigned_to_name: '',
      start_date: '',
      end_date: '',
      status: 'pending',
      service_type: 'one_time',
      recurring_frequency: 'monthly',
      currency: workspaceCurrency,
      total_value: 0,
      notes: ''
    });
    setEditingService(null);
    setServiceType('one_time');
    setShowInternalNotes(false);
  };

  const resolveWorkspaceId = async () => {
    const currentUser = await api.auth.me();
    let wsId = currentUser.current_workspace_id || currentUser.default_workspace_id;
    if (!wsId) {
      const existing = await api.entities.Workspace.filter({ owner_email: currentUser.email });
      if (existing.length > 0) {
        wsId = existing[0].id;
      } else {
        const ws = await api.entities.Workspace.create({
          name: currentUser.full_name || currentUser.email,
          type: 'personal',
          owner_email: currentUser.email
        });
        wsId = ws.id;
      }
      await api.auth.updateMe({ current_workspace_id: wsId, default_workspace_id: wsId });
    }
    return wsId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const workspaceId = await resolveWorkspaceId();
    
    const serviceData = { 
      ...formData, 
      workspace_id: workspaceId,
      attachments: editingService?.attachments || []
    };
    
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: serviceData });
    } else {
      createMutation.mutate(serviceData);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      client_id: service.client_id || '',
      client_name: service.client_name,
      description: service.description || '',
      assigned_to: service.assigned_to || '',
      assigned_to_name: service.assigned_to_name || '',
      start_date: service.start_date || '',
      end_date: service.end_date || '',
      status: service.status,
      service_type: service.service_type || 'one_time',
      recurring_frequency: service.recurring_frequency || 'monthly',
      currency: service.currency || workspaceCurrency,
      total_value: service.total_value || 0,
      notes: service.notes || ''
    });
    setServiceType(service.service_type || 'one_time');
    setShowDialog(true);
  };

  const handleClientChange = (clientName) => {
    const client = clients.find(c => c.name === clientName);
    if (client) {
      // Auto-set currency based on client country
      const currency = client.country === 'Angola' ? 'AOA' : 
                       client.country === 'Portugal' ? 'EUR' :
                       client.country === 'Brazil' ? 'BRL' :
                       client.country === 'United Kingdom' ? 'GBP' :
                       client.country === 'United States' ? 'USD' :
                       client.country === 'South Africa' ? 'ZAR' :
                       workspaceCurrency; // Fallback to workspace default
      
      setFormData({
        ...formData,
        client_id: client.id,
        client_name: clientName,
        currency
      });
    }
  };

  const statusColors = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    paused: 'bg-slate-500/20 text-muted-foreground border-slate-500/30',
    recurring: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  };

  const statusIcons = {
    active: CheckCircle,
    pending: Clock,
    completed: CheckCircle,
    paused: PauseCircle,
    recurring: Repeat
  };

  const statusLabels = {
    pt: { active: 'Ativo', pending: 'Pendente', completed: 'Concluído', paused: 'Pausado', recurring: 'Recorrente' },
    en: { active: 'Active', pending: 'Pending', completed: 'Completed', paused: 'Paused', recurring: 'Recurring' }
  };

  const serviceTypeLabels = {
    pt: { one_time: 'Única', recurring: 'Recorrente' },
    en: { one_time: 'One-Time', recurring: 'Recurring' }
  };

  const filteredServices = services.filter(service => {
    const searchMatch = service.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       service.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || service.status === filterStatus;
    const clientMatch = filterClient === 'all' || service.client_name === filterClient;
    return searchMatch && statusMatch && clientMatch;
  });

  const stats = {
    active: filteredServices.filter(s => s.status === 'active').length,
    recurring: filteredServices.filter(s => s.service_type === 'recurring' || s.status === 'recurring').length,
    pending: filteredServices.filter(s => s.status === 'pending').length,
    monthlyRevenue: filteredServices
      .filter(s => s.status === 'active' || s.status === 'recurring')
      .reduce((sum, s) => sum + (s.total_value || 0), 0)
  };

  // Currency formatting is now handled by utils/currency.js

  return (
    <AccessGuard page="Services">
    <div className="min-h-screen bg-background">
      
      

      <main className="p-6 lg:pt-6 md:p-8 md:pt-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {language === 'pt' ? 'Serviços' : 'Services'}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {language === 'pt'
                  ? 'Gere serviços ativos, operações recorrentes e entregas a clientes.'
                  : 'Manage active services, recurring operations and client delivery.'}
              </p>
            </div>
            
            <Button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-primary hover:bg-primary/90 gap-2 whitespace-nowrap shadow-lg shadow-cyan-500/30"
            >
              <Plus className="w-4 h-4" />
              {language === 'pt' ? 'Novo Serviço' : 'New Service'}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {language === 'pt' ? 'Ativos' : 'Active'}
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{stats.active}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {language === 'pt' ? 'Recorrentes' : 'Recurring'}
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{stats.recurring}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Repeat className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {language === 'pt' ? 'Pendentes' : 'Pending'}
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{stats.pending}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {language === 'pt' ? 'Receita Mensal' : 'Monthly Revenue'}
                    </p>
                    <p className="text-lg font-bold text-primary mt-0.5">
                      {formatCurrency(stats.monthlyRevenue, workspaceCurrency, language)}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6 bg-card border-border">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'pt' ? 'Pesquisar serviços...' : 'Search services...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                <div className="flex gap-2 items-center">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40 bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === 'pt' ? 'Todos' : 'All Status'}</SelectItem>
                      <SelectItem value="pending">{statusLabels[language].pending}</SelectItem>
                      <SelectItem value="active">{statusLabels[language].active}</SelectItem>
                      <SelectItem value="completed">{statusLabels[language].completed}</SelectItem>
                      <SelectItem value="cancelled">{statusLabels[language].cancelled}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterClient} onValueChange={setFilterClient}>
                    <SelectTrigger className="w-40 bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === 'pt' ? 'Todos Clientes' : 'All Clients'}</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.name}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(searchTerm || filterStatus !== 'all' || filterClient !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                        setFilterClient('all');
                      }}
                      className="gap-2 text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                      {language === 'pt' ? 'Limpar' : 'Clear'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services List */}
          {filteredServices.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1.5">
                  {language === 'pt' ? 'Nenhum serviço registado' : 'No services registered'}
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto text-sm">
                  {language === 'pt' 
                    ? 'Comece a registar os serviços que presta aos seus clientes.'
                    : 'Start registering the services you provide to your clients.'}
                </p>
                <Button onClick={() => setShowDialog(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-cyan-500/30">
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'pt' ? 'Criar Primeiro Serviço' : 'Create First Service'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background border-b border-border">
                      <tr>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">
                          {language === 'pt' ? 'Serviço' : 'Service'}
                        </th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">
                          {language === 'pt' ? 'Cliente' : 'Client'}
                        </th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 hidden md:table-cell">
                          {language === 'pt' ? 'Tipo' : 'Type'}
                        </th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">
                          {language === 'pt' ? 'Estado' : 'Status'}
                        </th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 hidden lg:table-cell">
                          {language === 'pt' ? 'Prazo' : 'Due Date'}
                        </th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">
                          {language === 'pt' ? 'Valor' : 'Value'}
                        </th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">
                          {language === 'pt' ? 'Ações' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]">
                      {filteredServices.map((service) => (
                        <tr key={service.id} className="hover:bg-background/50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{service.service_name}</p>
                              {service.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-foreground">{service.client_name}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                              {serviceTypeLabels[language][service.service_type || 'one_time']}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`${statusColors[service.status]} border font-medium text-xs`}>
                              {React.createElement(statusIcons[service.status] || Clock, { className: "w-3 h-3 mr-1" })}
                              {statusLabels[language][service.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <p className="text-sm text-foreground">
                              {service.end_date 
                                ? new Date(service.end_date).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US')
                                : '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="text-sm font-bold text-primary">
                              {formatCurrency(service.total_value || 0, service.currency || workspaceCurrency, language)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedServiceForAttachments(service);
                                  setShowAttachmentsDialog(true);
                                }}
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title={language === 'pt' ? 'Documentos' : 'Documents'}
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(service)}
                                className="border-border text-primary hover:bg-primary/90/10 hover:border-primary h-8"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Link to={createPageUrl('Invoices') + `?serviceId=${service.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-border text-green-400 hover:bg-green-500/10 hover:border-green-500 h-8"
                                  title={language === 'pt' ? 'Gerar Fatura' : 'Generate Invoice'}
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Service Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingService 
                ? (language === 'pt' ? 'Editar Serviço' : 'Edit Service')
                : (language === 'pt' ? 'Criar Serviço' : 'Create Service')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SECTION 1: SERVICE DETAILS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-primary rounded"></div>
                <h4 className="text-sm font-semibold text-foreground">
                  {language === 'pt' ? 'Detalhes do Serviço' : 'Service Details'}
                </h4>
              </div>
              
              <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{language === 'pt' ? 'Nome do Serviço *' : 'Service Name *'}</Label>
                <Input
                  value={formData.service_name}
                  onChange={(e) => setFormData({...formData, service_name: e.target.value})}
                  placeholder={language === 'pt' ? 'Ex: Consultoria de Marketing' : 'Ex: Marketing Consulting'}
                  required
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label className="text-xs">{language === 'pt' ? 'Cliente *' : 'Client *'}</Label>
                <Select 
                  value={formData.client_name} 
                  onValueChange={handleClientChange}
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder={language === 'pt' ? 'Selecionar cliente...' : 'Select client...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.name}>
                        {client.name} {client.country && `(${client.country})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>

              <div>
                <Label className="text-xs">{language === 'pt' ? 'Descrição' : 'Description'}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={language === 'pt' ? 'Breve descrição...' : 'Brief description...'}
                  rows={2}
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>

            {/* SECTION 2: DELIVERY */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-purple-500 rounded"></div>
                <h4 className="text-sm font-semibold text-foreground">
                  {language === 'pt' ? 'Entrega' : 'Delivery'}
                </h4>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{language === 'pt' ? 'Responsável' : 'Responsible Member'}</Label>
                  <Select 
                    value={formData.assigned_to} 
                    onValueChange={(value) => {
                      const member = teamMembers.find(m => m.id === value);
                      setFormData({...formData, assigned_to: value, assigned_to_name: member?.full_name || ''});
                    }}
                  >
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder={language === 'pt' ? 'Selecionar...' : 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">{language === 'pt' ? 'Estado' : 'Status'}</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{statusLabels[language].pending}</SelectItem>
                      <SelectItem value="active">{statusLabels[language].active}</SelectItem>
                      <SelectItem value="completed">{statusLabels[language].completed}</SelectItem>
                      <SelectItem value="paused">{statusLabels[language].paused}</SelectItem>
                      <SelectItem value="recurring">{statusLabels[language].recurring}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{language === 'pt' ? 'Data de Início *' : 'Start Date *'}</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                    className="mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs">{language === 'pt' ? 'Data de Fim' : 'End Date'}</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: BUSINESS SETTINGS */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-1 bg-emerald-500 rounded"></div>
                <h4 className="text-sm font-semibold text-foreground">
                  {language === 'pt' ? 'Configurações' : 'Business Settings'}
                </h4>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{language === 'pt' ? 'Tipo de Serviço' : 'Service Type'}</Label>
                  <Select value={serviceType} onValueChange={(value) => {
                    setServiceType(value);
                    setFormData({...formData, service_type: value});
                  }}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">{language === 'pt' ? 'Única' : 'One-Time'}</SelectItem>
                      <SelectItem value="recurring">{language === 'pt' ? 'Recorrente' : 'Recurring'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {serviceType === 'recurring' && (
                  <div>
                    <Label className="text-xs">{language === 'pt' ? 'Frequência' : 'Frequency'}</Label>
                    <Select value={formData.recurring_frequency} onValueChange={(value) => setFormData({...formData, recurring_frequency: value})}>
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">{language === 'pt' ? 'Semanal' : 'Weekly'}</SelectItem>
                        <SelectItem value="monthly">{language === 'pt' ? 'Mensal' : 'Monthly'}</SelectItem>
                        <SelectItem value="quarterly">{language === 'pt' ? 'Trimestral' : 'Quarterly'}</SelectItem>
                        <SelectItem value="yearly">{language === 'pt' ? 'Anual' : 'Yearly'}</SelectItem>
                        <SelectItem value="custom">{language === 'pt' ? 'Personalizado' : 'Custom'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-xs">{language === 'pt' ? 'Moeda' : 'Currency'}</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AOA">🇦🇴 Kwanza (Kz)</SelectItem>
                      <SelectItem value="EUR">🇪🇺 Euro (€)</SelectItem>
                      <SelectItem value="USD">🇺🇸 Dollar ($)</SelectItem>
                      <SelectItem value="BRL">🇧🇷 Real (R$)</SelectItem>
                      <SelectItem value="GBP">🇬🇧 Pound (£)</SelectItem>
                      <SelectItem value="CFA">🌍 CFA Franc (CFA)</SelectItem>
                      <SelectItem value="ZAR">🇿🇦 Rand (R)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{language === 'pt' ? 'Valor do Serviço' : 'Service Value'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.total_value}
                    onChange={(e) => setFormData({...formData, total_value: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    className="mt-1 h-9"
                  />
                </div>
              </div>

              {/* Collapsible Internal Notes */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowInternalNotes(!showInternalNotes)}
                  className="text-xs text-primary hover:text-primary flex items-center gap-1"
                >
                  {showInternalNotes ? (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      {language === 'pt' ? 'Ocultar notas internas' : 'Hide internal notes'}
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      {language === 'pt' ? 'Adicionar notas internas (opcional)' : 'Add internal notes (optional)'}
                    </>
                  )}
                </button>
                {showInternalNotes && (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder={language === 'pt' ? 'Notas internas...' : 'Internal notes...'}
                    rows={2}
                    className="mt-2 min-h-[60px]"
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-3 border-t border-border">
              {editingService && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(language === 'pt' ? 'Eliminar este serviço?' : 'Delete this service?')) {
                      deleteMutation.mutate(editingService.id);
                      setShowDialog(false);
                    }
                  }}
                >
                  {language === 'pt' ? 'Eliminar' : 'Delete'}
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDialog(false)}>
                  {language === 'pt' ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  className="bg-primary hover:bg-cyan-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingService 
                    ? (language === 'pt' ? 'Atualizar' : 'Update')
                    : (language === 'pt' ? 'Criar Serviço' : 'Create Service')}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Service Attachments Dialog */}
      {selectedServiceForAttachments && (
        <ServiceAttachmentsDialog
          service={selectedServiceForAttachments}
          open={showAttachmentsDialog}
          onClose={() => {
            setShowAttachmentsDialog(false);
            setSelectedServiceForAttachments(null);
          }}
          onUpdate={() => {
            queryClient.invalidateQueries(['services']);
          }}
        />
      )}
    </div>
    </AccessGuard>
  );
}