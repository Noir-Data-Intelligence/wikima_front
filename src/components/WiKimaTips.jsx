import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from './LanguageContext';

export default function WiKimaTips({ context = 'general' }) {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  const tips = {
    tasks: {
      pt: [
        "💡 Dica: Tarefas urgentes ficam mais fáceis quando as divides em passos pequenos.",
        "💡 Sabias que podes delegar tarefas repetitivas? Eu posso ajudar-te a automatizá-las.",
        "💡 Um lembrete amigável: bloqueia 10 minutos no final do dia para rever as tuas tarefas de amanhã."
      ],
      en: [
        "💡 Tip: Urgent tasks become easier when you break them into small steps.",
        "💡 Did you know you can delegate repetitive tasks? I can help automate them.",
        "💡 A friendly reminder: block 10 minutes at the end of the day to review tomorrow's tasks."
      ]
    },
    invoices: {
      pt: [
        "💡 Lembra-te: faturas enviadas na segunda-feira têm mais hipóteses de serem pagas rapidamente.",
        "💡 Dica rápida: uma mensagem de follow-up educada pode fazer toda a diferença.",
        "💡 Sabias? Clientes que recebem lembretes amigáveis pagam 40% mais rápido."
      ],
      en: [
        "💡 Remember: invoices sent on Mondays are more likely to be paid quickly.",
        "💡 Quick tip: a polite follow-up message can make all the difference.",
        "💡 Did you know? Clients who receive friendly reminders pay 40% faster."
      ]
    },
    documents: {
      pt: [
        "💡 Organiza os teus documentos por cliente para os encontrar mais rapidamente.",
        "💡 Dica: adiciona etiquetas aos documentos importantes — vais agradecer-me depois!",
        "💡 Sabias? Podes pesquisar documentos pelo nome do cliente ou pela categoria."
      ],
      en: [
        "💡 Organize your documents by client to find them faster.",
        "💡 Tip: add tags to important documents — you'll thank me later!",
        "💡 Did you know? You can search documents by client name or category."
      ]
    },
    general: {
      pt: [
        "💡 Estou aqui para te ajudar com qualquer tarefa administrativa. Basta perguntares!",
        "💡 Dica do dia: pequenas vitórias diárias somam-se a grandes resultados.",
        "💡 Lembra-te: não tens de fazer tudo sozinha. Eu estou aqui para isso."
      ],
      en: [
        "💡 I'm here to help with any administrative task. Just ask!",
        "💡 Tip of the day: small daily wins add up to big results.",
        "💡 Remember: you don't have to do everything alone. That's what I'm here for."
      ]
    }
  };

  if (dismissed) return null;

  const contextTips = tips[context]?.[language] || tips.general[language];
  const randomTip = contextTips[Math.floor(Math.random() * contextTips.length)];

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-foreground">{randomTip}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}