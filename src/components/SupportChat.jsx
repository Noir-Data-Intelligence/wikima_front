import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, HelpCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from './LanguageContext';

export default function SupportChat({ isOpen, onClose }) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: language === 'pt' 
        ? 'Olá 👋 Como podemos ajudá-lo hoje?' 
        : 'Hi 👋 How can we help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const messagesEndRef = useRef(null);

  const categories = [
    {
      id: 'help',
      label: language === 'pt' ? 'Ajuda / Como Usar' : 'Help / Usage',
      icon: HelpCircle,
      color: '#e97c3f'
    },
    {
      id: 'technical',
      label: language === 'pt' ? 'Problema Técnico' : 'Technical Issue',
      icon: AlertCircle,
      color: '#ef4444'
    },
    {
      id: 'feedback',
      label: language === 'pt' ? 'Sugestão / Feedback' : 'Suggestion / Feedback',
      icon: Lightbulb,
      color: '#22c55e'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputMessage,
      category: selectedCategory,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Auto-response
    setTimeout(() => {
      const autoResponse = {
        id: messages.length + 2,
        role: 'assistant',
        content: language === 'pt'
          ? 'Obrigado pela sua mensagem! A nossa equipa irá rever e responder em breve. Enquanto isso, pode continuar a usar a WiKima normalmente.'
          : 'Thank you for your message! Our team will review and respond shortly. In the meantime, you can continue using WiKima normally.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, autoResponse]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div 
        className="pointer-events-auto rounded-2xl shadow-2xl flex flex-col"
        style={{
          backgroundColor: 'hsl(var(--sidebar-background))',
          width: '400px',
          maxWidth: '100vw',
          height: '600px',
          maxHeight: '80vh',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: '1px'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(233, 124, 63, 0.15)' }}>
              <MessageCircle className="w-5 h-5" style={{ color: '#e97c3f' }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {language === 'pt' ? 'Suporte WiKima' : 'WiKima Support'}
              </h3>
              <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {language === 'pt' ? 'Estamos aqui para ajudar' : 'We\'re here to help'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Selection */}
        {!selectedCategory && (
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
            <p className="text-sm mb-3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {language === 'pt' ? 'Como podemos ajudar?' : 'How can we help?'}
            </p>
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border transition-all hover:brightness-110"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                  <span className="text-sm text-foreground">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e97c3f transparent' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-2"
                style={{
                  backgroundColor: msg.role === 'user' ? '#e97c3f' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'pt' ? 'Escreva a sua mensagem...' : 'Type your message...'}
              className="flex-1 text-foreground placeholder:text-muted-foreground"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.15)'
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="text-foreground"
              style={{ backgroundColor: '#e97c3f' }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {selectedCategory && (
            <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {language === 'pt' ? 'Categoria: ' : 'Category: '}
              {categories.find(c => c.id === selectedCategory)?.label}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}