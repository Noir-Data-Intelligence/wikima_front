import React, { useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useUserType } from '../components/UserTypeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { usePlanCheck } from '../components/usePlanCheck';
import PlanLimitModal from '../components/PlanLimitModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Upload, Search, FileText, X, Download, ExternalLink, CheckCircle2, Sparkles, Lock, Cloud, FolderOpen, ArrowRight, Filter } from 'lucide-react';
import { createPageUrl } from '../utils';
import WiKimaTips from '../components/WiKimaTips';
import { toast } from 'sonner';
import { BetaNotice } from '../components/BetaBanner';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import MobileMenuButton from '../components/dashboard/MobileMenuButton';

export default function Documents() {
  const { t, language } = useLanguage();
  const { userType } = useUserType();
  const isCompany = userType === 'company';
  const queryClient = useQueryClient();
  const { checkLimit, incrementUsage } = usePlanCheck();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [uploading, setUploading] = useState(false);

  // Authentication guard
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.auth.me();
        if (!user) {
          window.location.href = createPageUrl('Landing');
        }
      } catch (error) {
        window.location.href = createPageUrl('Landing');
      }
    };
    checkAuth();
  }, []);
  const [formData, setFormData] = useState({
    title: '',
    category: 'other',
    client_name: '',
    project_id: '',
    project_name: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.Document.filter({ workspace_id: workspaceId }, '-created_date');
    },
    initialData: []
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.Client.filter({ workspace_id: workspaceId }, 'name');
    },
    initialData: []
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    enabled: isCompany,
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.Project.filter({ workspace_id: workspaceId }, 'name');
    },
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Document.create(data),
    onSuccess: async () => {
      await incrementUsage('documents');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowDialog(false);
      resetForm();
      toast.success(language === 'pt' ? '✅ Documento carregado! Guardei-o para ti.' : '✅ Document uploaded! I saved it for you.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(language === 'pt' ? '🗑️ Eliminado! Mais espaço para o que importa.' : '🗑️ Deleted! More space for what matters.');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'other',
      client_name: '',
      project_id: '',
      project_name: '',
      notes: ''
    });
    setSelectedFile(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData({...formData, title: file.name});
      }
    }
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
    if (!selectedFile) return;

    const limit = checkLimit('documents');
    if (!limit.allowed) {
      setLimitInfo(limit);
      setShowLimitModal(true);
      setShowDialog(false);
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file: selectedFile });
      const workspaceId = await resolveWorkspaceId();
      
      await createMutation.mutateAsync({
        ...formData,
        workspace_id: workspaceId,
        file_url,
        file_type: selectedFile.type,
        file_size: selectedFile.size
      });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesClient = filterClient === 'all' || doc.client_name === filterClient;
    const matchesProject = filterProject === 'all' || doc.project_id === filterProject;
    return matchesSearch && matchesCategory && matchesClient && matchesProject;
  });

  const categories = {
    pt: {
      invoice: 'Fatura',
      contract: 'Contrato',
      certificate: 'Certificado',
      report: 'Relatório',
      other: 'Outro'
    },
    en: {
      invoice: 'Invoice',
      contract: 'Contract',
      certificate: 'Certificate',
      report: 'Report',
      other: 'Other'
    }
  };

  const categoryColors = {
    invoice: 'bg-amber-100 text-amber-700 border-amber-200',
    contract: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    certificate: 'bg-green-100 text-green-700 border-green-200',
    report: 'bg-purple-100 text-purple-700 border-purple-200',
    other: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      
      

      {/* Main Content */}
      <main className="p-6 lg:pt-6 md:p-8 md:pt-8">
        <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {language === 'pt' ? 'Documentos' : 'Documents'}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {language === 'pt' 
              ? 'Organize e aceda aos seus documentos por cliente ou categoria.'
              : 'Organize and access your documents by client or category.'}
          </p>
        </div>
        
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-primary hover:bg-primary/90 gap-2 whitespace-nowrap"
        >
          <Upload className="w-4 h-4" />
          {t('documents_upload')}
        </Button>
      </div>

      {/* WiKima Tips */}
      <div className="mb-6">
        <WiKimaTips context="documents" />
      </div>

      {/* Filters */}
      <Card className="mb-4 bg-card border-border">
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'pt' ? 'Pesquisar documentos...' : 'Search documents...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground h-9 focus:border-primary"
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <Filter className="w-4 h-4 text-muted-foreground" />
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-36 bg-background border-border text-foreground h-9 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'pt' ? 'Todas as Categorias' : 'All Categories'}</SelectItem>
                  <SelectItem value="invoice">{categories[language].invoice}</SelectItem>
                  <SelectItem value="contract">{categories[language].contract}</SelectItem>
                  <SelectItem value="certificate">{categories[language].certificate}</SelectItem>
                  <SelectItem value="report">{categories[language].report}</SelectItem>
                  <SelectItem value="other">{categories[language].other}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-36 bg-background border-border text-foreground h-9 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'pt' ? 'Todos os Clientes' : 'All Clients'}</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isCompany && projects.length > 0 && (
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-36 bg-background border-border text-foreground h-9 focus:border-primary">
                    <SelectValue placeholder={language === 'pt' ? 'Todos Projetos' : 'All Projects'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'pt' ? 'Todos os Projetos' : 'All Projects'}</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(searchTerm || filterCategory !== 'all' || filterClient !== 'all' || filterProject !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('all');
                    setFilterClient('all');
                    setFilterProject('all');
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  {language === 'pt' ? 'Limpar' : 'Clear'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {language === 'pt' ? 'Ainda não tem documentos.' : 'No documents uploaded.'}
          </p>
          <p className="text-gray-500">
            {language === 'pt' 
              ? 'Carregue o seu primeiro documento para começar.'
              : 'Upload your first document to get started.'}
          </p>
        </div>
      )}

      {/* Documents Grid */}
      {filteredDocuments.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-12">
          {filteredDocuments.map(doc => (
          <div key={doc.id} className="group bg-card border border-border hover:border-primary/40 rounded-lg p-3 transition-all duration-200 flex flex-col gap-2">
            {/* Top row: icon + title + delete */}
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 shrink-0 rounded-md bg-primary/15 flex items-center justify-center mt-0.5">
                <FileText className="text-primary" style={{width:'14px',height:'14px'}} />
              </div>
              <p className="flex-1 text-xs font-semibold text-foreground line-clamp-2 leading-snug min-w-0">{doc.title}</p>
              <button
                onClick={() => {
                  if (confirm(language === 'pt' ? 'Eliminar este documento?' : 'Delete this document?')) {
                    deleteMutation.mutate(doc.id);
                  }
                }}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400"
              >
                <X style={{width:'13px',height:'13px'}} />
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0 rounded border ${categoryColors[doc.category]}`}>
                {categories[language][doc.category]}
              </span>
              {doc.client_name && (
                <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0 rounded border border-border text-muted-foreground truncate max-w-[90px]">
                  {doc.client_name}
                </span>
              )}
              {doc.project_name && (
                <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0 rounded border border-orange-500/30 text-orange-400 truncate max-w-[90px]">
                  {doc.project_name}
                </span>
              )}
            </div>

            {/* Meta + action */}
            <div className="flex items-center justify-between gap-2 mt-auto">
              <span className="text-[10px] text-muted-foreground">
                {formatFileSize(doc.file_size)}{doc.file_size ? ' · ' : ''}{new Date(doc.created_date).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US')}
              </span>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 py-1 px-2 bg-primary hover:bg-primary/90 text-foreground rounded text-[10px] font-medium transition-colors"
              >
                <ExternalLink style={{width:'11px',height:'11px'}} />
                {language === 'pt' ? 'Abrir' : 'Open'}
              </a>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Compact tips strip */}
      {filteredDocuments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 mt-2">
          {[
            { icon: Sparkles, text: language === 'pt' ? 'Categorize por tipo e cliente' : 'Categorize by type & client', color: 'text-primary' },
            { icon: Upload, text: language === 'pt' ? 'Carregamento rápido de ficheiros' : 'Quick file upload', color: 'text-green-400' },
            { icon: FolderOpen, text: language === 'pt' ? 'Acesso instantâneo aos ficheiros' : 'Instant file access', color: 'text-primary' },
            { icon: Lock, text: language === 'pt' ? 'Armazenamento seguro e privado' : 'Secure & private storage', color: 'text-purple-400' },
          ].map(({ icon: Icon, text, color }) => (
            <span key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border px-2.5 py-1.5 rounded-lg">
              <Icon className={`w-3 h-3 ${color}`} />
              {text}
            </span>
          ))}
        </div>
      )}
        </div>
      </main>

      {/* Upload Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('documents_upload')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="file">
                {language === 'pt' ? 'Ficheiro' : 'File'}
              </Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                required
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="title">
                {language === 'pt' ? 'Título' : 'Title'}
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">{t('documents_category')}</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">{categories[language].invoice}</SelectItem>
                    <SelectItem value="contract">{categories[language].contract}</SelectItem>
                    <SelectItem value="certificate">{categories[language].certificate}</SelectItem>
                    <SelectItem value="report">{categories[language].report}</SelectItem>
                    <SelectItem value="other">{categories[language].other}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client">
                  {language === 'pt' ? 'Cliente (opcional)' : 'Client (optional)'}
                </Label>
                <Select value={formData.client_name} onValueChange={(value) => setFormData({...formData, client_name: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'pt' ? 'Selecionar...' : 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isCompany && projects.length > 0 && (
              <div>
                <Label>{language === 'pt' ? 'Projeto (opcional)' : 'Project (optional)'}</Label>
                <Select value={formData.project_id || ''} onValueChange={(value) => {
                  const p = projects.find(p => p.id === value);
                  setFormData({ ...formData, project_id: value, project_name: p?.name || '' });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'pt' ? 'Selecionar projeto...' : 'Select project...'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>{language === 'pt' ? 'Nenhum' : 'None'}</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="notes">
                {language === 'pt' ? 'Notas' : 'Notes'}
              </Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                {t('common_cancel')}
              </Button>
              <Button type="submit" disabled={uploading} className="bg-primary hover:bg-primary/90">
                {uploading ? (language === 'pt' ? 'A carregar...' : 'Uploading...') : t('common_save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Plan Limit Modal */}
      {limitInfo && (
        <PlanLimitModal
          open={showLimitModal}
          onClose={() => {
            setShowLimitModal(false);
            setLimitInfo(null);
          }}
          limitType={limitInfo.limitType}
          currentPlan="free"
          suggestedPlan={limitInfo.suggestedPlan}
        />
      )}
    </div>
  );
}