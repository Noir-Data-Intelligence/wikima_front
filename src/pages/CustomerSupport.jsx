import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageCircle,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Loader2,
  RefreshCw
} from 'lucide-react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import { useLanguage } from '../components/LanguageContext';

export default function CustomerSupport() {
  const { language } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [filter]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
      const interval = setInterval(() => loadMessages(selectedTicket.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      let ticketList;
      if (filter === 'all') {
        ticketList = await api.entities.SupportTicket.list('-last_message_date', 100);
      } else {
        ticketList = await api.entities.SupportTicket.filter(
          { status: filter },
          '-last_message_date',
          100
        );
      }
      setTickets(ticketList);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId) => {
    try {
      const msgs = await api.entities.SupportMessage.filter(
        { ticket_id: ticketId },
        'created_date'
      );
      setMessages(msgs);
      
      // Mark as read by admin
      const unreadMessages = msgs.filter(m => !m.read_by_admin && m.sender_type !== 'admin');
      for (const msg of unreadMessages) {
        await api.entities.SupportMessage.update(msg.id, { read_by_admin: true });
      }
      
      if (unreadMessages.length > 0) {
        await api.entities.SupportTicket.update(ticketId, { unread_by_admin: 0 });
        loadTickets();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setLoading(true);
      const user = await api.auth.me();
      
      const message = await api.entities.SupportMessage.create({
        ticket_id: selectedTicket.id,
        sender_type: 'admin',
        sender_email: user.email,
        sender_name: user.full_name,
        message: newMessage,
        read_by_admin: true,
        read_by_customer: false
      });

      await api.entities.SupportTicket.update(selectedTicket.id, {
        last_message_date: new Date().toISOString(),
        last_message_from: 'admin',
        status: 'waiting_customer',
        unread_by_customer: (selectedTicket.unread_by_customer || 0) + 1
      });

      setMessages([...messages, message]);
      setNewMessage('');
      await loadMessages(selectedTicket.id);
      await loadTickets();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (status) => {
    if (!selectedTicket) return;
    
    try {
      await api.entities.SupportTicket.update(selectedTicket.id, { status });
      setSelectedTicket({ ...selectedTicket, status });
      loadTickets();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const statusColors = {
    open: 'bg-blue-500',
    waiting_customer: 'bg-yellow-500',
    waiting_admin: 'bg-orange-500',
    resolved: 'bg-green-500',
    closed: 'bg-gray-500'
  };

  const statusIcons = {
    open: AlertCircle,
    waiting_customer: Clock,
    waiting_admin: MessageCircle,
    resolved: CheckCircle2,
    closed: CheckCircle2
  };

  const texts = {
    pt: {
      title: 'Suporte ao Cliente',
      tickets: 'Tickets',
      all: 'Todos',
      open: 'Abertos',
      waiting_admin: 'Aguardando Resposta',
      waiting_customer: 'Aguardando Cliente',
      resolved: 'Resolvidos',
      closed: 'Fechados',
      noTickets: 'Nenhum ticket encontrado',
      selectTicket: 'Selecione um ticket',
      typeMessage: 'Digite sua resposta...',
      send: 'Enviar',
      status: 'Estado',
      customer: 'Cliente',
      subject: 'Assunto',
      lastMessage: 'Última mensagem',
      refresh: 'Atualizar'
    },
    en: {
      title: 'Customer Support',
      tickets: 'Tickets',
      all: 'All',
      open: 'Open',
      waiting_admin: 'Waiting for Reply',
      waiting_customer: 'Waiting Customer',
      resolved: 'Resolved',
      closed: 'Closed',
      noTickets: 'No tickets found',
      selectTicket: 'Select a ticket',
      typeMessage: 'Type your reply...',
      send: 'Send',
      status: 'Status',
      customer: 'Customer',
      subject: 'Subject',
      lastMessage: 'Last message',
      refresh: 'Refresh'
    }
  };

  const t = texts[language] || texts.en;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
              <Button
                onClick={loadTickets}
                variant="outline"
                className="border-border text-foreground hover:bg-accent"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t.refresh}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tickets List */}
              <Card className="lg:col-span-1 bg-muted/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t.tickets}</CardTitle>
                  <Tabs value={filter} onValueChange={setFilter} className="mt-4">
                    <TabsList className="grid grid-cols-3 gap-2">
                      <TabsTrigger value="all">{t.all}</TabsTrigger>
                      <TabsTrigger value="open">{t.open}</TabsTrigger>
                      <TabsTrigger value="waiting_admin">{t.waiting_admin}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {tickets.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">{t.noTickets}</p>
                    ) : (
                      tickets.map((ticket) => {
                        const StatusIcon = statusIcons[ticket.status] || AlertCircle;
                        return (
                          <button
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              selectedTicket?.id === ticket.id
                                ? 'bg-accent ring-1 ring-primary/40'
                                : 'bg-muted/50 hover:bg-accent'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <StatusIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-foreground text-sm">
                                  {ticket.customer_name}
                                </span>
                              </div>
                              {ticket.unread_by_admin > 0 && (
                                <Badge className="bg-orange-500 text-foreground text-xs">
                                  {ticket.unread_by_admin}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm mb-1 line-clamp-1">
                              {ticket.subject}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(ticket.last_message_date).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="lg:col-span-2 bg-muted/50 border-border">
                {selectedTicket ? (
                  <>
                    <CardHeader className="border-b border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-foreground">{selectedTicket.subject}</CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {selectedTicket.customer_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {selectedTicket.customer_email}
                            </div>
                          </div>
                        </div>
                        <Select value={selectedTicket.status} onValueChange={updateTicketStatus}>
                          <SelectTrigger className="w-48 bg-muted border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">{t.open}</SelectItem>
                            <SelectItem value="waiting_customer">{t.waiting_customer}</SelectItem>
                            <SelectItem value="resolved">{t.resolved}</SelectItem>
                            <SelectItem value="closed">{t.closed}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col h-[500px]">
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto space-y-4 py-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.sender_type === 'admin'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              {msg.sender_type !== 'admin' && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  {msg.sender_name} ({msg.sender_type === 'ai' ? 'AI' : t.customer})
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(msg.created_date).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Input */}
                      <div className="border-t border-border pt-4">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder={t.typeMessage}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
                            rows={3}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={loading || !newMessage.trim()}
                            size="icon"
                            className="self-end"
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-[600px]">
                    <p className="text-muted-foreground">{t.selectTicket}</p>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}