import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import { Link } from 'react-router-dom';
import {
  Bell,
  Mail,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Upload,
  Clock,
  Gift,
  Settings,
  KeyRound,
  Languages,
  LogOut,
  ChevronDown,
  CheckSquare,
  ArrowRight,
  MessageSquarePlus
} from 'lucide-react';
import { api } from '@/api/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '../../utils';

export default function DashboardHeader({ user, tasks = [], invoices = [], documents = [], workspaceId }) {
  const { language, toggleLanguage } = useLanguage();
  const { isActive: isTrialActive, daysRemaining } = useTrialStatus();
  const [showBell, setShowBell] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuRef = React.useRef(null);
  const bellRef = React.useRef(null);
  const queryClient = useQueryClient();

  // Mark all as read when opening bell
  const handleOpenBell = () => {
    if (unreadTaskNotifs.length > 0) {
      markAllReadMutation.mutate();
    }
    setShowBell(true);
  };

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowBell(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => api.auth.logout();

  // ── Task Assignment Notifications (from DB) ──
  const { data: taskNotifications = [] } = useQuery({
    queryKey: ['taskNotifications', workspaceId],
    queryFn: () => api.entities.TaskAssignmentNotification.filter(
      { workspace_id: workspaceId },
      '-created_date',
      20
    ),
    enabled: !!workspaceId,
    refetchInterval: 30000
  });

  const unreadTaskNotifs = taskNotifications.filter(n => !n.read);

  const markReadMutation = useMutation({
    mutationFn: (id) => api.entities.TaskAssignmentNotification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taskNotifications', workspaceId] })
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(unreadTaskNotifs.map(n =>
        api.entities.TaskAssignmentNotification.update(n.id, { read: true })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taskNotifications', workspaceId] })
  });

  // ── System Alerts (derived from tasks/invoices/docs) ──
  const systemAlerts = React.useMemo(() => {
    const items = [];
    const now = new Date();

    const overdueTasks = tasks.filter(t =>
      t.deadline && t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.deadline) < now
    );
    if (overdueTasks.length > 0) {
      items.push({
        id: `overdue-${Date.now()}`,
        icon: AlertCircle,
        iconColor: 'text-red-400',
        title: language === 'pt'
          ? `${overdueTasks.length} tarefa(s) atrasada(s)`
          : `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
        subtitle: overdueTasks[0]?.title,
        time: new Date(overdueTasks[0]?.deadline),
        unread: true
      });
    }

    const oldUnpaid = invoices.filter(inv => {
      if (inv.status === 'paid') return false;
      return (now - new Date(inv.date)) / 86400000 > 7;
    });
    if (oldUnpaid.length > 0) {
      items.push({
        id: `unpaid-${Date.now()}`,
        icon: Receipt,
        iconColor: 'text-amber-400',
        title: language === 'pt'
          ? `${oldUnpaid.length} fatura(s) pendente(s) há +7 dias`
          : `${oldUnpaid.length} invoice${oldUnpaid.length > 1 ? 's' : ''} pending 7+ days`,
        subtitle: oldUnpaid[0]?.client_name,
        time: new Date(oldUnpaid[0]?.date),
        unread: true
      });
    }

    documents.slice(0, 2).forEach(doc => {
      items.push({
        id: `doc-${doc.id}`,
        icon: Upload,
        iconColor: 'text-blue-400',
        title: language === 'pt' ? 'Documento carregado' : 'Document uploaded',
        subtitle: doc.title,
        time: new Date(doc.created_date),
        unread: false
      });
    });

    return items.sort((a, b) => b.time - a.time).slice(0, 6);
  }, [tasks, invoices, documents, language]);

  // Total unread badge = unread task notifications + unread alerts
  const totalUnread = unreadTaskNotifs.length + systemAlerts.filter(a => a.unread).length;

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return language === 'pt' ? `há ${minutes}m` : `${minutes}m ago`;
    if (hours < 24) return language === 'pt' ? `há ${hours}h` : `${hours}h ago`;
    return language === 'pt' ? `há ${days}d` : `${days}d ago`;
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-8">
        {/* Trial Badge */}
        {isTrialActive ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
               style={{ backgroundColor: 'rgba(233,124,63,0.15)', border: '1px solid rgba(233,124,63,0.4)', color: '#e97c3f' }}>
            <Gift className="w-4 h-4" />
            <span>
              {language === 'pt'
                ? `Período de Avaliação – ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
                : `Free Trial – ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
            </span>
          </div>
        ) : <div />}

        <div className="flex items-center gap-1.5">

          {/* ── Unified Bell ── */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={handleOpenBell}
              className="relative p-2 text-blue-300 hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              <Bell className="w-5 h-5" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-foreground text-xs rounded-full flex items-center justify-center font-bold animate-in zoom-in transition-all duration-200 shadow-lg shadow-red-500/30">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </button>

            {showBell && (
              <>
                <div className="fixed inset-0 z-40 animate-in fade-in duration-200" onClick={() => setShowBell(false)} />
                <div className="absolute right-0 top-12 w-80 sm:w-96 z-50 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-foreground text-sm">
                        {language === 'pt' ? 'Notificações' : 'Notifications'}
                      </span>
                      {totalUnread > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium animate-in fade-in duration-200">
                          {totalUnread} {language === 'pt' ? 'novas' : 'new'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadTaskNotifs.length > 0 && (
                        <button
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-xs text-blue-400 hover:text-primary transition-colors duration-150"
                        >
                          {language === 'pt' ? 'Marcar tudo lido' : 'Mark all read'}
                        </button>
                      )}
                      <button onClick={() => setShowBell(false)} className="text-blue-400 hover:text-foreground transition-colors duration-150">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <ScrollArea className="max-h-[420px]">
                    <div className="divide-y divide-[#334155]/60">
                      {/* Task assignment notifications */}
                      {taskNotifications.map(n => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 transition-all duration-200 ${n.read ? 'opacity-60' : 'bg-primary/5 hover:bg-primary/90/10'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${n.read ? 'bg-muted' : 'bg-primary/20'}`}>
                              <CheckSquare className={`w-4 h-4 ${n.read ? 'text-blue-400' : 'text-primary'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-foreground text-sm font-medium leading-snug truncate">
                                  {n.task_title}
                                </p>
                                {!n.read && (
                                  <button
                                    onClick={() => markReadMutation.mutate(n.id)}
                                    className="text-blue-500 hover:text-blue-300 flex-shrink-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-blue-300 text-xs mt-0.5">
                                {language === 'pt' ? 'Atribuído a' : 'Assigned to'}{' '}
                                <span className="text-foreground font-medium">{n.assigned_to_name}</span>
                              </p>
                              <p className="text-xs text-blue-500 mt-1">
                                {new Date(n.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* System alerts */}
                      {systemAlerts.map(alert => {
                        const Icon = alert.icon;
                        return (
                          <div key={alert.id} className={`px-4 py-3 transition-all duration-200 ${alert.unread ? 'hover:bg-red-500/5' : 'opacity-60'}`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0 mt-0.5 ${alert.iconColor}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground text-sm font-medium leading-snug">{alert.title}</p>
                                {alert.subtitle && (
                                  <p className="text-blue-300 text-xs mt-0.5 truncate">{alert.subtitle}</p>
                                )}
                                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{formatTime(alert.time)}
                                </p>
                              </div>
                              {alert.unread && (
                                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {taskNotifications.length === 0 && systemAlerts.length === 0 && (
                        <div className="text-center py-10">
                          <CheckCircle2 className="w-8 h-8 text-green-400/50 mx-auto mb-2" />
                          <p className="text-blue-400 text-sm">
                            {language === 'pt' ? 'Sem notificações' : 'No notifications'}
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {taskNotifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-border">
                      <Link
                        to={createPageUrl('Tasks')}
                        onClick={() => setShowBell(false)}
                        className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary transition-colors"
                      >
                        {language === 'pt' ? 'Ver todas as tarefas' : 'View all tasks'}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Envelope → Messages ── */}
          <Link
            to={createPageUrl('Messages')}
            className="p-2 text-blue-300 hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            title={language === 'pt' ? 'Mensagens' : 'Messages'}
          >
            <Mail className="w-5 h-5" />
          </Link>

          {/* ── User Avatar + Dropdown ── */}
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-foreground text-sm font-bold">
                {user?.full_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm text-foreground font-medium leading-tight">{user?.full_name || 'User'}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-blue-300 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-blue-400 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/Profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <User className="w-4 h-4 text-primary" />
                    {language === 'pt' ? 'Perfil / Conta' : 'Profile / Account'}
                  </Link>

                  <Link
                    to="/FeedbackCenter"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <MessageSquarePlus className="w-4 h-4 text-orange-400" />
                    {language === 'pt' ? 'Enviar Feedback' : 'Send Feedback'}
                  </Link>

                  <Link
                    to="/WorkspaceSettings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-blue-400" />
                    {language === 'pt' ? 'Definições' : 'Settings'}
                  </Link>

                  <button
                    onClick={() => { toggleLanguage(); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <Languages className="w-4 h-4 text-green-400" />
                    <span className="flex-1 text-left">{language === 'pt' ? 'Idioma' : 'Language'}</span>
                    <span className="text-xs bg-muted text-blue-300 px-2 py-0.5 rounded-full">
                      {language === 'pt' ? 'PT' : 'EN'}
                    </span>
                  </button>
                </div>

                <div className="border-t border-border py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {language === 'pt' ? 'Terminar Sessão' : 'Logout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}