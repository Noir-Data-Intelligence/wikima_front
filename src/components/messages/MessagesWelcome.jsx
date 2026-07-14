import { MessageSquare } from 'lucide-react';

export default function MessagesWelcome({ language }) {
  const pt = language === 'pt';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/15 to-blue-500/15 border border-border flex items-center justify-center mb-5">
        <MessageSquare className="w-9 h-9 text-violet-400/70" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {pt ? 'Iniciar uma conversa' : 'Start a conversation'}
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        {pt
          ? 'Crie uma nova conversa com a sua equipa ou clientes.'
          : 'Create a new conversation with your team or clients.'}
      </p>
    </div>
  );
}