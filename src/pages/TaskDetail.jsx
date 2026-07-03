import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import {
  ArrowLeft, CheckSquare, MessageSquare, Paperclip, Plus, Trash2, 
  Upload, FileText, Image, Download, ExternalLink, History, User,
  Calendar, Flag, Edit3
} from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import MobileMenuButton from '@/components/dashboard/MobileMenuButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, format } from 'date-fns';
import { pt as ptLocale } from 'date-fns/locale/pt';
import { enGB } from 'date-fns/locale/en-GB';

const STATUS_COLORS = {
  todo: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  waiting: 'bg-yellow-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

const PRIORITY_COLORS = {
  low: 'text-muted-foreground',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};

export default function TaskDetail() {
  const { language } = useLanguage();
  const pt = language === 'pt';
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('checklist');
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const taskId = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('id') 
    : null;

  const getWsId = async () => {
    const u = await api.auth.me();
    return u.current_workspace_id || u.default_workspace_id;
  };

  // Fetch task
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      return api.entities.Task.get(taskId);
    }
  });

  // Fetch subtasks
  const { data: subtasks = [], refetch: refetchSubtasks } = useQuery({
    queryKey: ['task-subtasks', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const wsId = await getWsId();
      if (!wsId || !taskId) return [];
      return api.entities.TaskSubtask.filter({ task_id: taskId }, 'order');
    }
  });

  // Fetch comments
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['task-comments', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const wsId = await getWsId();
      if (!wsId || !taskId) return [];
      return api.entities.TaskComment.filter({ task_id: taskId }, '-created_date');
    }
  });

  // Fetch attachments
  const { data: attachments = [], refetch: refetchAttachments } = useQuery({
    queryKey: ['task-attachments', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const wsId = await getWsId();
      if (!wsId || !taskId) return [];
      return api.entities.TaskAttachment.filter({ task_id: taskId }, '-uploaded_date');
    }
  });

  // Fetch activity log
  const { data: activities = [] } = useQuery({
    queryKey: ['task-activity', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const wsId = await getWsId();
      if (!wsId || !taskId) return [];
      return api.entities.TaskActivity.filter({ task_id: taskId }, '-created_date');
    }
  });

  const queryClient = useQueryClient();

  // Mutations
  const createSubtaskMutation = useMutation({
    mutationFn: async (title) => {
      const user = await api.auth.me();
      const wsId = await getWsId();
      return api.entities.TaskSubtask.create({
        workspace_id: wsId,
        task_id: taskId,
        title,
        is_completed: false,
        created_by_id: user?.id,
        created_by_name: user?.full_name,
        created_date: new Date().toISOString(),
        order: subtasks.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task-subtasks']);
      queryClient.invalidateQueries(['task']);
      setNewSubtask('');
    }
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ id, is_completed }) => {
      return api.entities.TaskSubtask.update(id, {
        is_completed,
        completed_date: is_completed ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task-subtasks']);
      queryClient.invalidateQueries(['task']);
    }
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id) => {
      return api.entities.TaskSubtask.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task-subtasks']);
      queryClient.invalidateQueries(['task']);
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content) => {
      const user = await api.auth.me();
      const wsId = await getWsId();
      return api.entities.TaskComment.create({
        workspace_id: wsId,
        task_id: taskId,
        content,
        author_id: user?.id,
        author_name: user?.full_name,
        author_email: user?.email,
        created_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task-comments']);
      setNewComment('');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id) => {
      return api.entities.TaskComment.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task-comments']);
    }
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (id) => {
      return api.entities.TaskAttachment.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task-attachments']);
    }
  });

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (newSubtask.trim()) {
      createSubtaskMutation.mutate(newSubtask.trim());
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim());
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert(pt ? 'Tipo de ficheiro não suportado. Use PDF, Word, Excel ou imagens.' : 'Unsupported file type. Use PDF, Word, Excel or images.');
      return;
    }

    setUploadingFile(true);
    try {
      const user = await api.auth.me();
      const wsId = await getWsId();
      
      // Upload file
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      
      // Create attachment record
      await api.entities.TaskAttachment.create({
        workspace_id: wsId,
        task_id: taskId,
        file_name: file.name,
        file_url,
        file_type: file.type,
        file_size: file.size,
        uploaded_by_id: user?.id,
        uploaded_by_name: user?.full_name,
        uploaded_date: new Date().toISOString(),
      });
      
      queryClient.invalidateQueries(['task-attachments']);
    } catch (error) {
      console.error('Upload error:', error);
      alert(pt ? 'Erro ao carregar ficheiro' : 'Error uploading file');
    } finally {
      setUploadingFile(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) return Image;
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('word') || fileType.includes('document')) return FileText;
    if (fileType.includes('excel') || fileType.includes('sheet')) return FileText;
    return Paperclip;
  };

  const getFileExtension = (fileName) => {
    return fileName.split('.').pop()?.toUpperCase() || '';
  };

  // Calculate progress
  const completedCount = subtasks.filter(s => s.is_completed).length;
  const totalCount = subtasks.length;
  const checklistProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Time tracking progress
  const estimatedHours = task.estimated_hours || 0;
  const actualHours = task.actual_hours || 0;
  const timeProgress = estimatedHours > 0 ? Math.round((actualHours / estimatedHours) * 100) : 0;

  if (taskLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-border border-t-white rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm">{pt ? 'A carregar...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background">
        
        
        <main className="p-5 lg:pt-6 md:p-8 md:pt-8">
          <div className="max-w-6xl mx-auto text-center py-12">
            <h2 className="text-xl font-bold text-foreground mb-2">{pt ? 'Tarefa não encontrada' : 'Task not found'}</h2>
            <Button onClick={() => navigate(createPageUrl('Tasks'))} className="bg-primary hover:bg-primary/90 text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {pt ? 'Voltar às Tarefas' : 'Back to Tasks'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const statusCfg = STATUS_COLORS[task.status] || STATUS_COLORS.todo;
  const priorityCfg = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-6 md:p-8 md:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate(createPageUrl('Tasks'))}
              className="mb-4 border-border text-muted-foreground hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {pt ? 'Voltar' : 'Back'}
            </Button>
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${statusCfg} text-foreground border-0 text-xs`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge className={`${priorityCfg} bg-muted border-0 text-xs`}>
                    {task.priority.toUpperCase()}
                  </Badge>
                  {task.is_recurring && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      🔄 {task.recurrence_pattern?.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{task.title}</h1>
                {task.description && (
                  <p className="text-muted-foreground text-sm">{task.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4 mb-6">
            {/* Checklist Progress */}
            {totalCount > 0 && (
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{pt ? 'Progresso do Checklist' : 'Checklist Progress'}</span>
                  <span className="text-sm font-semibold text-foreground">{checklistProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {completedCount} {pt ? 'de' : 'of'} {totalCount} {pt ? 'subtarefas concluídas' : 'subtasks completed'}
                </p>
              </div>
            )}

            {/* Time Tracking Progress — company only */}
            {estimatedHours > 0 && (
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{pt ? 'Progresso do Tempo' : 'Time Progress'}</span>
                  <span className="text-sm font-semibold text-foreground">{timeProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      timeProgress > 100 ? 'bg-red-500' : timeProgress > 80 ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${timeProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {actualHours.toFixed(1)}h {pt ? 'de' : 'of'} {estimatedHours.toFixed(1)}h
                  </p>
                  {timeProgress > 100 && (
                    <p className="text-xs text-red-400 font-medium">
                      {pt ? 'Excedido!' : 'Over budget!'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 bg-muted/50 border border-border">
              <TabsTrigger value="checklist" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground">
                <CheckSquare className="w-4 h-4 mr-2" />
                {pt ? 'Checklist' : 'Checklist'}
              </TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground">
                <MessageSquare className="w-4 h-4 mr-2" />
                {pt ? 'Comentários' : 'Comments'}
              </TabsTrigger>
              <TabsTrigger value="attachments" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground">
                <Paperclip className="w-4 h-4 mr-2" />
                {pt ? 'Anexos' : 'Attachments'}
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground">
                <History className="w-4 h-4 mr-2" />
                {pt ? 'Atividade' : 'Activity'}
              </TabsTrigger>
            </TabsList>

            {/* Checklist Tab */}
            <TabsContent value="checklist" className="mt-4">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <form onSubmit={handleAddSubtask} className="mb-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder={pt ? 'Adicionar subtarefa...' : 'Add subtask...'}
                      className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-foreground">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </form>

                <div className="space-y-2">
                  {subtasks.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      {pt ? 'Sem subtarefas. Adicione a primeira!' : 'No subtasks. Add the first one!'}
                    </p>
                  ) : (
                    subtasks.map(subtask => (
                      <div
                        key={subtask.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          subtask.is_completed 
                            ? 'bg-muted/50 border-border' 
                            : 'bg-muted/50 border-border hover:border-border'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={subtask.is_completed}
                          onChange={(e) => toggleSubtaskMutation.mutate({ 
                            id: subtask.id, 
                            is_completed: e.target.checked 
                          })}
                          className="w-4 h-4 rounded border-white/30 text-primary focus:ring-ring/50"
                        />
                        <span className={`flex-1 text-sm ${
                          subtask.is_completed ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}>
                          {subtask.title}
                        </span>
                        <button
                          onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="mt-4">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <form onSubmit={handleAddComment} className="mb-4">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={pt ? 'Escrever comentário...' : 'Write a comment...'}
                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground mb-2"
                    rows={3}
                  />
                  <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-foreground">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {pt ? 'Comentar' : 'Comment'}
                  </Button>
                </form>

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      {pt ? 'Sem comentários. Seja o primeiro!' : 'No comments. Be the first!'}
                    </p>
                  ) : (
                    comments.map(comment => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-lg border border-border bg-muted/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{comment.author_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_date), { 
                                addSuffix: true, 
                                locale: pt ? ptLocale : enGB 
                              })}
                            </p>
                          </div>
                          {comment.author_email === (typeof window !== 'undefined' && localStorage.getItem('user_email')) && (
                            <button
                              onClick={() => deleteCommentMutation.mutate(comment.id)}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-foreground/80">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="mt-4">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="mb-4">
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-white/30 transition-colors bg-muted/50">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {uploadingFile 
                        ? (pt ? 'A carregar...' : 'Uploading...') 
                        : (pt ? 'Carregar ficheiro' : 'Upload file')}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                      disabled={uploadingFile}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {pt ? 'PDF, Word, Excel ou imagens' : 'PDF, Word, Excel or images'}
                  </p>
                </div>

                <div className="space-y-2">
                  {attachments.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      {pt ? 'Sem anexos. Carregue o primeiro ficheiro!' : 'No attachments. Upload the first file!'}
                    </p>
                  ) : (
                    attachments.map(attachment => {
                      const FileIcon = getFileIcon(attachment.file_type);
                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/50"
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <FileIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getFileExtension(attachment.file_name)} · {(attachment.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      {pt ? 'Sem atividade registada' : 'No activity recorded'}
                    </p>
                  ) : (
                    activities.map(activity => {
                      const actionLabel = pt ? activity.action_label_pt : activity.action_label_en;
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/50"
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">
                              <span className="font-semibold">{activity.user_name}</span>
                              <span className="text-muted-foreground"> {actionLabel}</span>
                              {(activity.old_value || activity.new_value) && (
                                <span className="text-muted-foreground text-xs block mt-1">
                                  {activity.old_value && <span className="line-through mr-2">{activity.old_value}</span>}
                                  {activity.new_value && <span className="text-primary">{activity.new_value}</span>}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(activity.created_date), 'PPP p', { locale: pt ? ptLocale : enGB })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}