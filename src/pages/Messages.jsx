import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { usePlanCheck } from '../components/usePlanCheck';
import PlanLimitModal from '../components/PlanLimitModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Send, Plus, Search, Users, Building2, ChevronDown, ChevronRight,
  Smile, Paperclip, Mic, MoreVertical, Phone, Video, Info,
  CheckCheck, Check, Hash, ArrowRight
} from 'lucide-react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import MobileMenuButton from '../components/dashboard/MobileMenuButton';
import AccessGuard from '../components/AccessGuard';
import MessagesContextPanel from '../components/messages/MessagesContextPanel';
import MessagesWelcome from '../components/messages/MessagesWelcome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Messages() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { checkLimit } = usePlanCheck();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedConv, setSelectedConv] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newConvType, setNewConvType] = useState('team');
  const [newConvTarget, setNewConvTarget] = useState('');
  const [newConvMsg, setNewConvMsg] = useState('');
  const [search, setSearch] = useState('');
  const [teamSectionOpen, setTeamSectionOpen] = useState(true);
  const [clientSectionOpen, setClientSectionOpen] = useState(true);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const messagesEndRef = useRef(null);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => api.auth.me() });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const user = await api.auth.me();
      const all = await api.entities.Message.list('-created_date', 500);
      return user.role === 'admin'
        ? all
        : all.filter(m => m.created_by === user.email || m.recipient_email === user.email || (!m.recipient_email && m.created_by === user.email));
    },
    initialData: [],
    refetchInterval: 6000
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list('name', 200),
    initialData: []
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      const user = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: user.email });
      if (!ws.length) return [];
      return api.entities.TeamMember.filter({ workspace_id: ws[0].id, status: 'active' });
    },
    initialData: []
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-messages'],
    queryFn: async () => {
      const user = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: user.email });
      if (!ws.length) return [];
      return api.entities.Task.filter({ workspace_id: ws[0].id });
    },
    initialData: []
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-messages'],
    queryFn: async () => {
      const user = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: user.email });
      if (!ws.length) return [];
      return api.entities.Invoice.filter({ workspace_id: ws[0].id });
    },
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Message.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['messages']); setNewMessage(''); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Message.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['messages'])
  });

  // ── Build conversation buckets ──
  const clientConvs = {};
  messages.filter(m => !m.is_team_message).forEach(msg => {
    const key = `client:${msg.client_name}`;
    if (!clientConvs[key]) clientConvs[key] = [];
    clientConvs[key].push({ ...msg, _type: 'internal' });
  });

  const teamConvs = {};
  messages.filter(m => m.is_team_message).forEach(msg => {
    const isMine = msg.created_by === currentUser?.email;
    const otherName = isMine ? (msg.recipient_name || msg.client_name) : (msg.sender_name || msg.created_by);
    const key = `team:${otherName}`;
    if (!teamConvs[key]) teamConvs[key] = [];
    teamConvs[key].push({ ...msg, _type: 'team', _isMine: isMine });
  });

  const buildList = (map) => Object.entries(map).map(([key, msgs]) => {
    const sorted = [...msgs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const label = key.replace(/^(client|team):/, '');
    return {
      key, label, messages: sorted, lastMessage: sorted[0],
      unreadCount: sorted.filter(m => !m.read && (m.sender === 'client' || (!m._isMine && m._type === 'team'))).length
    };
  }).sort((a, b) => new Date(b.lastMessage?.created_date || 0) - new Date(a.lastMessage?.created_date || 0));

  const clientList = buildList(clientConvs).filter(c => !search || c.label.toLowerCase().includes(search.toLowerCase()));
  const teamList = buildList(teamConvs).filter(c => !search || c.label.toLowerCase().includes(search.toLowerCase()));

  const allConvs = { ...clientConvs, ...teamConvs };
  const currentMessages = selectedConv
    ? [...(allConvs[selectedConv] || [])].sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

  const selectedLabel = selectedConv?.replace(/^(client|team):/, '');
  const isTeamConv = selectedConv?.startsWith('team:');
  const selectedClient = !isTeamConv ? clients.find(c => c.name === selectedLabel) : null;

  // ── Actions ──
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    const limit = checkLimit('messaging');
    if (!limit.allowed) { setLimitInfo(limit); setShowLimitModal(true); return; }

    if (isTeamConv) {
      const member = teamMembers.find(m => m.full_name === selectedLabel);
      await createMutation.mutateAsync({
        client_name: selectedLabel,
        content: newMessage,
        sender: 'user',
        sender_name: currentUser?.full_name || currentUser?.email,
        recipient_name: selectedLabel,
        recipient_email: member?.email || '',
        is_team_message: true,
        read: false
      });
    } else {
      await createMutation.mutateAsync({ client_name: selectedLabel, content: newMessage, sender: 'user', read: true });
    }
  };

  const handleStartConversation = async () => {
    if (!newConvTarget || !newConvMsg.trim()) return;
    const limit = checkLimit('messaging');
    if (!limit.allowed) { setLimitInfo(limit); setShowLimitModal(true); setShowNewDialog(false); return; }

    if (newConvType === 'team') {
      const member = teamMembers.find(m => m.full_name === newConvTarget);
      await createMutation.mutateAsync({
        client_name: newConvTarget,
        content: newConvMsg,
        sender: 'user',
        sender_name: currentUser?.full_name || currentUser?.email,
        recipient_name: newConvTarget,
        recipient_email: member?.email || '',
        is_team_message: true,
        read: false
      });
      setSelectedConv(`team:${newConvTarget}`);
    } else {
      await createMutation.mutateAsync({ client_name: newConvTarget, content: newConvMsg, sender: 'user', read: true });
      setSelectedConv(`client:${newConvTarget}`);
    }
    setShowNewDialog(false);
    setNewConvTarget('');
    setNewConvMsg('');
  };

  const markAsRead = (msg) => {
    if (!msg.read && (msg.sender === 'client' || (!msg._isMine && msg._type === 'team'))) {
      updateMutation.mutate({ id: msg.id, data: { ...msg, read: true } });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, selectedConv]);

  const fmtTime = (date) => new Date(date).toLocaleTimeString(language === 'pt' ? 'pt-PT' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (date) => {
    const d = new Date(date); const today = new Date();
    const diff = new Date(today.toDateString()) - new Date(d.toDateString());
    if (diff === 0) return language === 'pt' ? 'Hoje' : 'Today';
    if (diff === 86400000) return language === 'pt' ? 'Ontem' : 'Yesterday';
    return d.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', { day: 'numeric', month: 'short' });
  };

  const fmtRelative = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return language === 'pt' ? 'agora' : 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return new Date(date).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', { day: 'numeric', month: 'short' });
  };

  // ── Conversation List Item ──
  const ConvItem = ({ conv }) => (
    <button
      onClick={() => { setSelectedConv(conv.key); conv.messages.forEach(markAsRead); }}
      className={`w-full px-3 py-3 text-left flex items-center gap-3 hover:bg-accent/50 transition-all duration-150 relative ${
        selectedConv === conv.key ? 'bg-accent' : ''
      }`}
    >
      {selectedConv === conv.key && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-violet-400" />
      )}
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-foreground text-sm font-semibold shrink-0 relative
        ${conv.key.startsWith('team:') ? 'bg-gradient-to-br from-violet-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>
        {conv.label[0]?.toUpperCase()}
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-border" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-sm font-medium truncate ${selectedConv === conv.key ? 'text-foreground' : 'text-foreground'}`}>
            {conv.label}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{fmtRelative(conv.lastMessage?.created_date)}</span>
        </div>
        <div className="flex items-center gap-1">
          <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? 'text-muted-foreground font-medium' : 'text-muted-foreground'}`}>
            {conv.lastMessage?.content || '...'}
          </p>
          {conv.unreadCount > 0 && (
            <span className="shrink-0 bg-violet-500 text-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );

  // ── Message Bubble ──
  const MessageBubble = ({ msg, idx }) => {
    const isUser = msg._isMine || msg.sender === 'user' || msg.is_sent;
    const prevMsg = idx > 0 ? currentMessages[idx - 1] : null;
    const showDate = !prevMsg || fmtDate(msg.created_date) !== fmtDate(prevMsg.created_date);
    const isFirstInGroup = !prevMsg || (prevMsg._isMine || prevMsg.sender === 'user' || prevMsg.is_sent) !== isUser;
    const senderName = msg.sender_name || (isUser ? (currentUser?.full_name || 'You') : selectedLabel);

    return (
      <React.Fragment key={msg.id}>
        {showDate && (
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-accent" />
            <span className="text-[11px] text-muted-foreground font-medium px-3 py-1 rounded-full bg-muted/50 border border-border">
              {fmtDate(msg.created_date)}
            </span>
            <div className="flex-1 h-px bg-accent" />
          </div>
        )}
        <div className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isFirstInGroup ? 'mt-3' : 'mt-1'}`}>
          {/* Avatar — only for received, only on first in group */}
          {!isUser ? (
            isFirstInGroup ? (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-foreground text-xs font-semibold shrink-0 mb-0.5
                ${isTeamConv ? 'bg-gradient-to-br from-violet-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>
                {selectedLabel?.[0]?.toUpperCase()}
              </div>
            ) : <div className="w-8 shrink-0" />
          ) : null}

          <div className={`max-w-[65%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            {isFirstInGroup && !isUser && (
              <span className="text-[11px] text-muted-foreground font-medium mb-1 ml-1">{senderName}</span>
            )}
            <div className={`rounded-2xl px-4 py-2.5 ${
              isUser
                ? isTeamConv
                  ? 'bg-violet-600 text-foreground rounded-br-sm'
                  : 'bg-blue-600 text-foreground rounded-br-sm'
                : 'bg-card text-foreground rounded-bl-sm border border-border'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
            <div className={`flex items-center gap-1 mt-1 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
              <span className="text-[10px] text-muted-foreground">{fmtTime(msg.created_date)}</span>
              {isUser && (
                msg.read
                  ? <CheckCheck className="w-3 h-3 text-blue-400" />
                  : <Check className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  };

  return (
    <AccessGuard page="Messages">
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        
        

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* ── LEFT SIDEBAR: Conversation list ── */}
            <div className="w-72 flex-shrink-0 flex flex-col border-r border-border pt-0 bg-card">

              {/* Header */}
              <div className="px-4 pt-2.5 pb-2.5 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold text-foreground">
                    {language === 'pt' ? 'Mensagens' : 'Messages'}
                  </h2>
                  <button
                    onClick={() => { setNewConvType('team'); setShowNewDialog(true); }}
                    className="w-8 h-8 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={language === 'pt' ? 'Pesquisar conversas...' : 'Search conversations...'}
                    className="w-full bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground rounded-lg pl-9 pr-3 py-2 outline-none focus:border-violet-500/50 focus:bg-accent transition-all"
                  />
                </div>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto pt-0.5">

                {/* TEAM section */}
                <div className="mt-0">
                  <button
                    onClick={() => setTeamSectionOpen(v => !v)}
                    className="w-full flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    {teamSectionOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <Users className="w-3 h-3" />
                    {language === 'pt' ? 'Equipa' : 'Team'}
                    {teamList.reduce((s, c) => s + c.unreadCount, 0) > 0 && (
                      <span className="ml-auto bg-violet-500 text-foreground rounded-full text-[10px] min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">
                        {teamList.reduce((s, c) => s + c.unreadCount, 0)}
                      </span>
                    )}
                  </button>
                  {teamSectionOpen && (
                    teamList.length === 0
                      ? (
                        <div className="px-4 py-3 flex items-center gap-2 text-muted-foreground">
                          <Hash className="w-3.5 h-3.5" />
                          <span className="text-xs">{language === 'pt' ? 'Sem conversas de equipa' : 'No team conversations yet'}</span>
                        </div>
                      )
                      : teamList.map(c => <ConvItem key={c.key} conv={c} />)
                  )}
                </div>

                {/* CLIENT section */}
                <div className="mt-0">
                  <button
                    onClick={() => setClientSectionOpen(v => !v)}
                    className="w-full flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    {clientSectionOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <Building2 className="w-3 h-3" />
                    {language === 'pt' ? 'Clientes' : 'Clients'}
                    {clientList.reduce((s, c) => s + c.unreadCount, 0) > 0 && (
                      <span className="ml-auto bg-blue-500 text-foreground rounded-full text-[10px] min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">
                        {clientList.reduce((s, c) => s + c.unreadCount, 0)}
                      </span>
                    )}
                  </button>
                  {clientSectionOpen && (
                    clientList.length === 0
                      ? (
                        <div className="px-4 py-3 flex items-center gap-2 text-muted-foreground">
                          <Hash className="w-3.5 h-3.5" />
                          <span className="text-xs">{language === 'pt' ? 'Sem conversas com clientes' : 'No client conversations yet'}</span>
                        </div>
                      )
                      : clientList.map(c => <ConvItem key={c.key} conv={c} />)
                  )}
                </div>
              </div>
            </div>

            {/* ── MAIN CHAT AREA ── */}
            <div className="flex-1 flex flex-col min-h-0 bg-background">
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 bg-background/80 backdrop-blur-sm">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-foreground text-sm font-semibold shrink-0
                      ${isTeamConv ? 'bg-gradient-to-br from-violet-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>
                      {selectedLabel?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{selectedLabel}</div>
                      <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {isTeamConv
                          ? (language === 'pt' ? 'Membro da equipa' : 'Team member')
                          : (language === 'pt' ? 'Cliente' : 'Client')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                        <Video className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowContextPanel(v => !v)}
                        className={`w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors ${showContextPanel ? 'text-violet-400 bg-violet-500/15' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Messages + Context Panel wrapper */}
                  <div className="flex flex-1 min-h-0 overflow-hidden">
                    {/* Messages scroll area */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex-1 overflow-y-auto px-5 py-4">
                        {currentMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-foreground text-2xl font-bold mb-4
                              ${isTeamConv ? 'bg-gradient-to-br from-violet-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>
                              {selectedLabel?.[0]?.toUpperCase()}
                            </div>
                            <p className="text-base font-semibold text-foreground">{selectedLabel}</p>
                            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
                              {language === 'pt'
                                ? 'Início da conversa. Envie a primeira mensagem!'
                                : 'Start of conversation. Send the first message!'}
                            </p>
                          </div>
                        ) : (
                          currentMessages.map((msg, idx) => (
                            <MessageBubble key={msg.id} msg={msg} idx={idx} />
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input Bar */}
                      <div className="px-5 py-4 border-t border-border">
                        <div className={`flex items-end gap-3 bg-muted/50 rounded-2xl border transition-all focus-within:bg-accent px-4 py-3
                          ${isTeamConv ? 'border-violet-500/20 focus-within:border-violet-500/40' : 'border-border focus-within:border-blue-500/40'}`}>

                          <button className="text-muted-foreground hover:text-muted-foreground transition-colors shrink-0 mb-0.5">
                            <Paperclip className="w-5 h-5" />
                          </button>

                          <textarea
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder={language === 'pt' ? `Mensagem para ${selectedLabel}…` : `Message ${selectedLabel}…`}
                            rows={1}
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed"
                            style={{ maxHeight: 120, overflowY: 'auto' }}
                          />

                          <div className="flex items-center gap-1 shrink-0">
                            <button className="text-muted-foreground hover:text-muted-foreground transition-colors">
                              <Smile className="w-5 h-5" />
                            </button>
                            <button className="text-muted-foreground hover:text-muted-foreground transition-colors">
                              <Mic className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim()}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ml-1
                                ${isTeamConv ? 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700' : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'}`}
                            >
                              <Send className="w-4 h-4 text-foreground" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                          {language === 'pt' ? 'Enter para enviar · Shift+Enter para nova linha' : 'Enter to send · Shift+Enter for new line'}
                        </p>
                      </div>
                    </div>

                    {/* Right Context Panel */}
                    {showContextPanel && !isTeamConv && selectedClient && (
                      <MessagesContextPanel
                        client={selectedClient}
                        tasks={tasks.filter(t => t.client_id === selectedClient?.id || t.client_name === selectedClient?.name)}
                        invoices={invoices.filter(i => i.client_id === selectedClient?.id || i.client_name === selectedClient?.name)}
                        language={language}
                      />
                    )}
                  </div>
                </>
              ) : (
                <MessagesWelcome language={language} />
              )}
            </div>
          </div>
        </div>

        {/* ── New Conversation Dialog ── */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="bg-card border-border text-foreground max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-foreground text-sm">{language === 'pt' ? 'Nova Conversa' : 'New Conversation'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button onClick={() => { setNewConvType('team'); setNewConvTarget(''); }}
                  className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors
                    ${newConvType === 'team' ? 'bg-violet-600 text-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}>
                  <Users className="w-3.5 h-3.5" />{language === 'pt' ? 'Equipa' : 'Team'}
                </button>
                <button onClick={() => { setNewConvType('client'); setNewConvTarget(''); }}
                  className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors
                    ${newConvType === 'client' ? 'bg-blue-600 text-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}>
                  <Building2 className="w-3.5 h-3.5" />{language === 'pt' ? 'Cliente' : 'Client'}
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {newConvType === 'team' ? (language === 'pt' ? 'Selecionar membro' : 'Select member') : (language === 'pt' ? 'Selecionar cliente' : 'Select client')}
                </label>
                <div className="max-h-40 overflow-y-auto bg-background rounded-lg border border-border divide-y divide-border">
                  {(newConvType === 'team' ? teamMembers : clients).map(item => {
                    const name = newConvType === 'team' ? item.full_name : item.name;
                    return (
                      <button key={item.id} onClick={() => setNewConvTarget(name)}
                        className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-card transition-colors
                          ${newConvTarget === name ? 'bg-card text-foreground' : 'text-muted-foreground'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-foreground text-xs font-bold shrink-0
                          ${newConvType === 'team' ? 'bg-gradient-to-br from-violet-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>
                          {name?.[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1">{name}</span>
                        {newConvTarget === name && <ArrowRight className="w-3.5 h-3.5 text-violet-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{language === 'pt' ? 'Mensagem' : 'Message'}</label>
                <Input
                  value={newConvMsg}
                  onChange={e => setNewConvMsg(e.target.value)}
                  placeholder={language === 'pt' ? 'Escreva a primeira mensagem…' : 'Write your first message…'}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleStartConversation()}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setShowNewDialog(false)}>
                  {language === 'pt' ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button size="sm" disabled={!newConvTarget || !newConvMsg.trim()} onClick={handleStartConversation}
                  className={`${newConvType === 'team' ? 'bg-violet-600 hover:bg-violet-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />{language === 'pt' ? 'Enviar' : 'Send'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {limitInfo && (
          <PlanLimitModal open={showLimitModal} onClose={() => { setShowLimitModal(false); setLimitInfo(null); }}
            limitType={limitInfo.limitType} currentPlan="free" suggestedPlan={limitInfo.suggestedPlan} />
        )}
      </div>
    </AccessGuard>
  );
}