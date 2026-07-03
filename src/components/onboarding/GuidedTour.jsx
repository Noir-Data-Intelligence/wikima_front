import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { Button } from '@/components/ui/button';
import { ChevronRight, X } from 'lucide-react';

export default function GuidedTour({ onComplete, workspaceType, mainGoals }) {
  const { language } = useLanguage();
  const [step, setStep] = useState(0);

  const tours = {
    pt: [
      {
        title: 'Bem-vindo ao Dashboard',
        description: 'Este é o seu centro de comando. Aqui vê tudo que precisa no seu dia a dia.',
        highlight: 'dashboard'
      },
      {
        title: 'Navegação Lateral',
        description: 'Use a barra lateral para aceder a todas as funcionalidades da WiKima.',
        highlight: 'sidebar'
      },
      {
        title: 'Ações Rápidas',
        description: 'Crie novas tarefas, faturas ou documentos directamente do dashboard.',
        highlight: 'quick-actions'
      },
      {
        title: 'Seu Assistente IA',
        description: 'WIWI o ajuda com recomendações personalizadas baseadas nos seus dados.',
        highlight: 'ai-assistant'
      }
    ],
    en: [
      {
        title: 'Welcome to Dashboard',
        description: 'This is your command center. See everything you need in your daily work.',
        highlight: 'dashboard'
      },
      {
        title: 'Side Navigation',
        description: 'Use the sidebar to access all WiKima features.',
        highlight: 'sidebar'
      },
      {
        title: 'Quick Actions',
        description: 'Create new tasks, invoices, or documents directly from the dashboard.',
        highlight: 'quick-actions'
      },
      {
        title: 'Your AI Assistant',
        description: 'WIWI helps you with personalized recommendations based on your data.',
        highlight: 'ai-assistant'
      }
    ]
  };

  const currentTour = tours[language][step];
  const isLastStep = step === tours[language].length - 1;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={onComplete} />

      {/* Tour Card */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 pointer-events-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{currentTour.title}</h3>
              <p className="text-sm text-muted-foreground">{currentTour.description}</p>
            </div>
            <button
              onClick={onComplete}
              className="ml-4 text-gray-400 hover:text-muted-foreground flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1 mb-4">
            {tours[language].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i === step ? 'bg-blue-600' : i < step ? 'bg-blue-600/50' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                {language === 'pt' ? 'Anterior' : 'Back'}
              </Button>
            )}
            <Button
              size="sm"
              onClick={isLastStep ? onComplete : () => setStep(step + 1)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLastStep ? (language === 'pt' ? 'Começar' : 'Start') : (language === 'pt' ? 'Próximo' : 'Next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}