import { useState, useEffect, useRef } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function CustomerSupportChat() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [showForm, setShowForm] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing ticket from localStorage
  useEffect(() => {
    const savedTicketId = localStorage.getItem('customer_support_ticket_id');
    if (savedTicketId) {
      loadTicket(savedTicketId);
    }
  }, []);

  const loadTicket = async (ticketId) => {
    try {
      setLoading(true);
      const tickets = await api.entities.SupportTicket.filter({ id: ticketId });
      if (tickets.length > 0) {
        setTicket(tickets[0]);
        setShowForm(false);
        await loadMessages(ticketId);
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId) => {
    try {
      const msgs = await api.entities.SupportMessage.filter(
        { ticket_id: ticketId, internal_note: false },
        '-created_date'
      );
      setMessages(msgs.reverse());
      
      // Mark messages as read by customer
      const unreadMessages = msgs.filter(m => !m.read_by_customer && m.sender_type !== 'customer');
      for (const msg of unreadMessages) {
        await api.entities.SupportMessage.update(msg.id, { read_by_customer: true });
      }
      
      // Update ticket unread count
      if (unreadMessages.length > 0) {
        await api.entities.SupportTicket.update(ticketId, { unread_by_customer: 0 });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !subject) return;

    try {
      setLoading(true);
      const newTicket = await api.entities.SupportTicket.create({
        customer_name: customerName,
        customer_email: customerEmail,
        subject: subject,
        status: 'open',
        last_message_date: new Date().toISOString(),
        last_message_from: 'customer'
      });

      setTicket(newTicket);
      localStorage.setItem('customer_support_ticket_id', newTicket.id);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;

    try {
      setLoading(true);
      const message = await api.entities.SupportMessage.create({
        ticket_id: ticket.id,
        sender_type: 'customer',
        sender_email: ticket.customer_email,
        sender_name: ticket.customer_name,
        message: newMessage,
        read_by_customer: true,
        read_by_admin: false
      });

      await api.entities.SupportTicket.update(ticket.id, {
        last_message_date: new Date().toISOString(),
        last_message_from: 'customer',
        status: 'waiting_admin',
        unread_by_admin: (ticket.unread_by_admin || 0) + 1
      });

      setMessages([...messages, message]);
      setNewMessage('');
      await loadMessages(ticket.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Poll for new messages
  useEffect(() => {
    if (!ticket || !isOpen) return;

    const interval = setInterval(() => {
      loadMessages(ticket.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [ticket, isOpen]);

  const texts = {
    pt: {
      title: 'Suporte ao Cliente',
      subtitle: 'Como podemos ajudar?',
      name: 'Seu nome',
      email: 'Seu email',
      subject: 'Assunto',
      startChat: 'Iniciar conversa',
      typeMessage: 'Digite sua mensagem...',
      send: 'Enviar',
      newConversation: 'Nova conversa'
    },
    en: {
      title: 'Customer Support',
      subtitle: 'How can we help?',
      name: 'Your name',
      email: 'Your email',
      subject: 'Subject',
      startChat: 'Start conversation',
      typeMessage: 'Type your message...',
      send: 'Send',
      newConversation: 'New conversation'
    }
  };

  const t = texts[language] || texts.en;

  return (
    <>
      {/* Chat Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full shadow-lg transition-all hover:scale-110 z-50 flex items-center justify-center"
        style={{ backgroundColor: '#e97c3f' }}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-foreground" />
        ) : (
          <MessageCircle className="w-5 h-5 text-foreground" />
        )}
      </button>

      {/* Compact Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-[72px] right-4 w-[300px] max-w-[calc(100vw-2rem)] h-[380px] shadow-2xl flex flex-col z-50 rounded-lg overflow-hidden" style={{ backgroundColor: '#1c2d5f', border: '1px solid rgba(255,255,255,0.2)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <div>
              <h3 className="font-semibold text-foreground text-xs">{t.title}</h3>
              <p className="text-[9px] text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {showForm ? (
              <form onSubmit={createTicket} className="p-2.5 space-y-2 overflow-y-auto">
                <Input
                  placeholder={t.name}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-8 text-xs"
                />
                <Input
                  type="email"
                  placeholder={t.email}
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-8 text-xs"
                />
                <Input
                  placeholder={t.subject}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-8 text-xs"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-8 text-xs"
                  style={{ backgroundColor: '#e97c3f' }}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.startChat}
                </Button>
              </form>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-2 py-1 ${
                          msg.sender_type === 'customer'
                            ? 'text-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                        style={msg.sender_type === 'customer' ? { backgroundColor: '#e97c3f' } : {}}
                      >
                        {msg.sender_type !== 'customer' && (
                          <p className="text-[8px] text-muted-foreground mb-0.5 font-medium">{msg.sender_name || 'Support'}</p>
                        )}
                        <p className="text-[11px] leading-snug">{msg.message}</p>
                        <p className="text-[8px] text-muted-foreground mt-0.5">
                          {new Date(msg.created_date).toLocaleTimeString(language === 'pt' ? 'pt-PT' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-2 py-1.5 border-t border-border flex-shrink-0">
                  <div className="flex gap-1.5">
                    <Input
                      placeholder={t.typeMessage}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-[11px] h-7"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={loading || !newMessage.trim()}
                      size="icon"
                      className="flex-shrink-0 h-7 w-7"
                      style={{ backgroundColor: '#e97c3f' }}
                    >
                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </>
  );
}