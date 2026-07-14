import { useState, useEffect, useRef } from 'react';
import { api } from '@/api/client';
import { usePlanCheck } from '../usePlanCheck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sparkles, Send, X, Loader2, Lock } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import ReactMarkdown from 'react-markdown';

export default function WiwiChat({ compact = false, onClose = null }) {
  const { language } = useLanguage();
  const { checkLimit } = usePlanCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const welcomeMessage = language === 'pt' 
    ? "Olá! 👋 Sou a WiKima, a tua assistente administrativa. Estou aqui para te ajudar a organizar o teu dia. Como posso ajudar?"
    : "Hello! 👋 I'm WiKima, your administrative assistant. I'm here to help organize your day. How can I help?";

  useEffect(() => {
    const aiAccess = checkLimit('ai');
    if (aiAccess.allowed) {
      initConversation();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    try {
      const conv = await api.agents.createConversation({
        agent_name: 'wiwi',
        metadata: {
          name: 'WIWI Chat',
          language: language
        }
      });
      setConversation(conv);
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = api.agents.subscribeToConversation(
      conversation.id,
      (data) => {
        setMessages(data.messages);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversation?.id]);

  const handleSend = async () => {
    if (!input.trim() || !conversation) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      await api.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Check if AI is accessible
  const aiAccess = checkLimit('ai');
  if (!aiAccess.allowed) {
    return (
      <>
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-purple-700" />
                </div>
                <DialogTitle className="text-xl">
                  {language === 'pt' ? 'Assistente IA Bloqueado' : 'AI Assistant Locked'}
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="py-4">
              <p className="text-gray-700 mb-4">
                {language === 'pt' 
                  ? 'O Assistente IA WiKima está disponível a partir do plano Starter (€15/mês).'
                  : 'The WiKima AI Assistant is available starting from the Starter Plan (€15/month).'}
              </p>
              <p className="text-gray-700 mb-4">
                {language === 'pt' 
                  ? 'Faça upgrade agora para desbloquear automação inteligente e suporte.'
                  : 'Upgrade now to unlock smart automation and support.'}
              </p>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-indigo-900">
                    {language === 'pt' ? 'Incluído no Starter' : 'Included in Starter'}
                  </span>
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• {language === 'pt' ? 'Assistente IA básico' : 'Basic AI assistant'}</li>
                  <li>• {language === 'pt' ? 'Sugestões automáticas' : 'Automatic suggestions'}</li>
                  <li>• {language === 'pt' ? 'Lembretes inteligentes' : 'Smart reminders'}</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
                {language === 'pt' ? 'Talvez mais tarde' : 'Maybe later'}
              </Button>
              <a href="https://www.paypal.com/ncp/payment/R3Z9L7BZQT646" target="_blank" rel="noopener noreferrer">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  {language === 'pt' ? 'Upgrade para Starter — €15/mês' : 'Upgrade to Starter — €15/mo'}
                </Button>
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          onClick={() => setShowUpgradeModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg z-50"
          size="icon"
        >
          <Lock className="w-6 h-6" />
        </Button>
      </>
    );
  }

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <span className="font-semibold text-amber-900">WiKima</span>
                <p className="text-xs text-muted-foreground">{language === 'pt' ? 'Tua assistente' : 'Your assistant'}</p>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === 'user'
                    ? 'ml-8 bg-indigo-600 text-foreground rounded-2xl rounded-tr-sm'
                    : 'mr-8 bg-white rounded-2xl rounded-tl-sm'
                } p-3 text-sm shadow-sm`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown className="prose prose-sm max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{language === 'pt' ? 'A pensar na melhor forma de te ajudar...' : 'Thinking of the best way to help you...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'pt' ? 'Escreva algo…' : 'Type something…'}
              disabled={isLoading}
              className="text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-amber-700 hover:bg-amber-800"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
      <div className="p-4 border-b bg-gradient-to-r from-amber-700 to-orange-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">WiKima</h3>
            <p className="text-xs text-amber-100">
              {language === 'pt' ? 'Tua assistente administrativa' : 'Your administrative assistant'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-amber-700 text-foreground rounded-2xl rounded-tr-sm'
                  : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'
              } p-4 shadow-sm`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown className="prose prose-sm max-w-none">
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-amber-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">
              {language === 'pt' ? 'A preparar uma resposta para ti...' : 'Preparing a response for you...'}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'pt' ? 'Escreva algo…' : 'Type something…'}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-amber-700 hover:bg-amber-800"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}