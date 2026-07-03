import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, X,
  Sparkles, Trophy, Zap, Star
} from 'lucide-react';

// ─── Checklist definitions per profile ───────────────────────────────────────

const CHECKLISTS = {
  personal: (pt) => [
    {
      id: 'add_expense',
      label: pt ? 'Registar primeira despesa' : 'Record your first expense',
      desc: pt ? 'Adicione uma despesa para começar a controlar o seu dinheiro.' : 'Add an expense to start tracking your money.',
      to: createPageUrl('Financials'),
      checkFn: ({ expenses }) => expenses.length > 0
    },
    {
      id: 'add_income',
      label: pt ? 'Registar um rendimento' : 'Record an income',
      desc: pt ? 'Registe uma fonte de rendimento (salário, freelance, etc.).' : 'Log an income source (salary, freelance, etc.).',
      to: createPageUrl('Financials'),
      checkFn: ({ expenses }) => expenses.some(e => e.type === 'income')
    },
    {
      id: 'savings_goal',
      label: pt ? 'Criar um objetivo de poupança' : 'Create a savings goal',
      desc: pt ? 'Defina um objetivo financeiro para se manter motivado.' : 'Set a financial goal to stay motivated.',
      to: createPageUrl('Financials'),
      checkFn: ({ savingsGoals }) => savingsGoals.length > 0
    },
    {
      id: 'recurring_payment',
      label: pt ? 'Adicionar pagamento recorrente' : 'Add a recurring payment',
      desc: pt ? 'Registe rendas, subscrições ou outras despesas fixas.' : 'Register rent, subscriptions or other fixed costs.',
      to: createPageUrl('Financials'),
      checkFn: ({ recurringPayments }) => recurringPayments.length > 0
    },
    {
      id: 'add_task',
      label: pt ? 'Criar uma tarefa pessoal' : 'Create a personal task',
      desc: pt ? 'Use as tarefas para organizar o seu dia a dia.' : 'Use tasks to organise your daily life.',
      to: createPageUrl('Tasks'),
      checkFn: ({ tasks }) => tasks.length > 0
    },
    {
      id: 'agenda_event',
      label: pt ? 'Agendar um evento' : 'Schedule an event',
      desc: pt ? 'Marque um compromisso na agenda.' : 'Add an appointment to your calendar.',
      to: createPageUrl('Agenda'),
      checkFn: ({ agendaEvents }) => agendaEvents.length > 0
    }
  ],

  professional: (pt) => [
    {
      id: 'add_client',
      label: pt ? 'Adicionar primeiro cliente' : 'Add your first client',
      desc: pt ? 'Registe um cliente para começar a gerir o seu negócio.' : 'Register a client to start managing your business.',
      to: createPageUrl('Clients'),
      checkFn: ({ clients }) => clients.length > 0
    },
    {
      id: 'create_invoice',
      label: pt ? 'Criar uma fatura' : 'Create an invoice',
      desc: pt ? 'Emita a sua primeira fatura e receba o pagamento.' : 'Issue your first invoice and get paid.',
      to: createPageUrl('Invoices'),
      checkFn: ({ invoices }) => invoices.length > 0
    },
    {
      id: 'add_task',
      label: pt ? 'Criar uma tarefa' : 'Create a task',
      desc: pt ? 'Organize o seu trabalho com tarefas e prazos.' : 'Organise your work with tasks and deadlines.',
      to: createPageUrl('Tasks'),
      checkFn: ({ tasks }) => tasks.length > 0
    },
    {
      id: 'schedule_appointment',
      label: pt ? 'Marcar uma consulta/reunião' : 'Schedule an appointment',
      desc: pt ? 'Use a agenda para gerir os seus compromissos.' : 'Use the calendar to manage your appointments.',
      to: createPageUrl('Agenda'),
      checkFn: ({ agendaEvents }) => agendaEvents.length > 0
    },
    {
      id: 'add_service',
      label: pt ? 'Definir um serviço' : 'Define a service',
      desc: pt ? 'Crie o catálogo dos seus serviços para reutilizar nas faturas.' : 'Create your service catalogue to reuse in invoices.',
      to: createPageUrl('Services'),
      checkFn: ({ services }) => services.length > 0
    },
    {
      id: 'add_expense',
      label: pt ? 'Registar uma despesa de negócio' : 'Record a business expense',
      desc: pt ? 'Controle os seus custos operacionais.' : 'Track your operating costs.',
      to: createPageUrl('Financials'),
      checkFn: ({ expenses }) => expenses.length > 0
    }
  ],

  company: (pt) => [
    {
      id: 'add_client',
      label: pt ? 'Adicionar primeiro cliente' : 'Add your first client',
      desc: pt ? 'Registe um cliente para começar.' : 'Register a client to get started.',
      to: createPageUrl('Clients'),
      checkFn: ({ clients }) => clients.length > 0
    },
    {
      id: 'add_team_member',
      label: pt ? 'Convidar membro da equipa' : 'Invite a team member',
      desc: pt ? 'Adicione colaboradores para trabalhar em conjunto.' : 'Add collaborators to work together.',
      to: createPageUrl('Team'),
      checkFn: ({ teamMembers }) => teamMembers.length > 0
    },
    {
      id: 'create_invoice',
      label: pt ? 'Criar uma fatura' : 'Create an invoice',
      desc: pt ? 'Emita a primeira fatura da empresa.' : 'Issue the company\'s first invoice.',
      to: createPageUrl('Invoices'),
      checkFn: ({ invoices }) => invoices.length > 0
    },
    {
      id: 'assign_task',
      label: pt ? 'Atribuir tarefa a um membro' : 'Assign a task to a team member',
      desc: pt ? 'Delegar trabalho é mais fácil com as tarefas WiKima.' : 'Delegating work is easier with WiKima tasks.',
      to: createPageUrl('Tasks'),
      checkFn: ({ tasks }) => tasks.some(t => t.assigned_to)
    },
    {
      id: 'add_document',
      label: pt ? 'Enviar um documento' : 'Upload a document',
      desc: pt ? 'Centralize contratos, relatórios e ficheiros importantes.' : 'Centralise contracts, reports and important files.',
      to: createPageUrl('Documents'),
      checkFn: ({ documents }) => documents.length > 0
    },
    {
      id: 'view_reports',
      label: pt ? 'Consultar relatórios' : 'View reports',
      desc: pt ? 'Acompanhe o desempenho financeiro da empresa.' : 'Monitor the company\'s financial performance.',
      to: createPageUrl('Reports'),
      checkFn: () => false // manually completable via dismiss / always prompts
    }
  ]
};

// ─── Milestone messages ───────────────────────────────────────────────────────

const MILESTONES = {
  25: {
    pt: '🚀 Ótimo começo! Já completou 25% da configuração.',
    en: '🚀 Great start! You\'ve completed 25% of the setup.'
  },
  50: {
    pt: '⚡ Já a meio caminho! Continue assim.',
    en: '⚡ Halfway there! Keep it up.'
  },
  75: {
    pt: '🌟 Quase lá! Só mais um passo para terminar.',
    en: '🌟 Almost there! Just one more step to finish.'
  },
  100: {
    pt: '🏆 Configuração completa! Bem-vindo ao WiKima.',
    en: '🏆 Setup complete! Welcome to WiKima.'
  }
};

function MilestoneToast({ pct, pt, onClose }) {
  const msg = MILESTONES[pct];
  if (!msg) return null;
  return (
    <div className="flex items-start gap-3 bg-gradient-to-r from-[#1a2d5a] to-[#1e3260] border border-amber-400/30 rounded-xl px-4 py-3 mb-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-400">
      <span className="text-lg mt-0.5 flex-shrink-0">{pct === 100 ? '🏆' : pct === 75 ? '🌟' : pct === 50 ? '⚡' : '🚀'}</span>
      <p className="text-sm text-amber-100 flex-1">{msg[pt ? 'pt' : 'en']}</p>
      <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground transition-colors flex-shrink-0 mt-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GettingStartedChecklist({ profile, language, data, userId }) {
  const pt = language === 'pt';
  const storageKey = `wikima_checklist_${userId || 'default'}_${profile}`;
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [shownMilestones, setShownMilestones] = useState([]);
  const [activeMilestone, setActiveMilestone] = useState(null);
  const prevPctRef = useRef(null);

  // Load persisted state
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (saved.hidden) setHidden(true);
      if (saved.collapsed) setCollapsed(true);
      if (saved.shownMilestones) setShownMilestones(saved.shownMilestones);
    } catch {}
  }, [storageKey]);

  const persist = (patch) => {
    try {
      const current = JSON.parse(localStorage.getItem(storageKey) || '{}');
      localStorage.setItem(storageKey, JSON.stringify({ ...current, ...patch }));
    } catch {}
  };

  const steps = (CHECKLISTS[profile] || CHECKLISTS.professional)(pt);
  const completedIds = steps.filter(s => s.checkFn(data)).map(s => s.id);
  const completedCount = completedIds.length;
  const total = steps.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Milestone detection
  useEffect(() => {
    if (prevPctRef.current === null) { prevPctRef.current = pct; return; }
    const prev = prevPctRef.current;
    prevPctRef.current = pct;
    if (pct === prev) return;

    for (const milestone of [25, 50, 75, 100]) {
      if (pct >= milestone && prev < milestone && !shownMilestones.includes(milestone)) {
        setActiveMilestone(milestone);
        const updated = [...shownMilestones, milestone];
        setShownMilestones(updated);
        persist({ shownMilestones: updated });
        break;
      }
    }
  }, [pct]);

  // Don't show if all done and user dismissed, or explicitly hidden
  if (hidden) return null;

  // Hide once fully completed and dismissed
  const handleHide = () => {
    setHidden(true);
    persist({ hidden: true });
  };

  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    persist({ collapsed: next });
  };

  const progressColor = pct === 100 ? '#10b981' : pct >= 50 ? '#e97c3f' : '#60a5fa';

  return (
    <div className="mb-6">
      {activeMilestone && (
        <MilestoneToast
          pct={activeMilestone}
          pt={pt}
          onClose={() => setActiveMilestone(null)}
        />
      )}

      <div className="rounded-xl border border-white/8 bg-background overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white/3 transition-colors"
          onClick={handleCollapse}
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            {pct === 100
              ? <Trophy className="w-3.5 h-3.5 text-amber-400" />
              : <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground">
                {pt ? 'Primeiros Passos' : 'Getting Started'}
              </p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${progressColor}20`, color: progressColor }}>
                {pct}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden w-full">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: progressColor }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-muted-foreground">{completedCount}/{total}</span>
            {collapsed
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronUp className="w-4 h-4 text-muted-foreground" />
            }
            <button
              onClick={(e) => { e.stopPropagation(); handleHide(); }}
              className="ml-1 text-muted-foreground hover:text-muted-foreground transition-colors"
              title={pt ? 'Esconder' : 'Hide'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Steps list */}
        {!collapsed && (
          <div className="border-t border-white/6 px-4 py-3 space-y-1">
            {steps.map((step) => {
              const done = completedIds.includes(step.id);
              return (
                <Link
                  key={step.id}
                  to={step.to}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all group ${done ? 'opacity-60' : 'hover:bg-white/4'}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {done
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <Circle className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground transition-colors" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-muted-foreground' : 'text-foreground/85 group-hover:text-foreground'} transition-colors`}>
                      {step.label}
                    </p>
                    {!done && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.desc}</p>
                    )}
                  </div>
                  {done && (
                    <span className="text-[10px] text-emerald-400/70 font-medium flex-shrink-0 mt-0.5">
                      {pt ? 'Feito' : 'Done'}
                    </span>
                  )}
                </Link>
              );
            })}

            {pct === 100 && (
              <div className="mt-2 px-3 py-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/15 flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-300">
                  {pt ? 'Configuração completa! Está a tirar o máximo partido do WiKima.' : 'Setup complete! You\'re getting the most out of WiKima.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}