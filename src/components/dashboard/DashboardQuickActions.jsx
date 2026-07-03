import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  UserPlus, FilePlus, CheckSquare, Upload, Plus,
  Wallet, Target, PiggyBank, BarChart3, Calendar, Users, Receipt
} from 'lucide-react';

// ─── Profile-specific action sets ────────────────────────────────────────────

const ACTIONS_BY_PROFILE = {
  personal: (pt) => [
    {
      label: pt ? 'Adicionar Despesa' : 'Add Expense',
      icon: Wallet,
      color: 'text-red-400',
      bg: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/50',
      to: createPageUrl('Financials')
    },
    {
      label: pt ? 'Adicionar Receita' : 'Add Income',
      icon: Plus,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/50',
      to: createPageUrl('Financials')
    },
    {
      label: pt ? 'Criar Objetivo de Poupança' : 'Create Savings Goal',
      icon: PiggyBank,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 hover:border-yellow-500/50',
      to: createPageUrl('Financials')
    },
    {
      label: pt ? 'Ver Orçamento Mensal' : 'View Monthly Budget',
      icon: BarChart3,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/50',
      to: createPageUrl('Financials')
    }
  ],

  professional: (pt) => [
    {
      label: pt ? 'Adicionar Cliente' : 'Add Client',
      icon: UserPlus,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 hover:border-purple-500/50',
      to: createPageUrl('Clients')
    },
    {
      label: pt ? 'Criar Tarefa' : 'Create Task',
      icon: CheckSquare,
      color: 'text-primary',
      bg: 'bg-primary/10 hover:bg-primary/90/20 border-primary/20 hover:border-primary/50',
      to: createPageUrl('Tasks')
    },
    {
      label: pt ? 'Marcar Consulta' : 'Schedule Appointment',
      icon: Calendar,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/50',
      to: createPageUrl('Agenda')
    },
    {
      label: pt ? 'Criar Fatura' : 'Create Invoice',
      icon: FilePlus,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 hover:border-amber-500/50',
      to: createPageUrl('Invoices')
    }
  ],

  company: (pt) => [
    {
      label: pt ? 'Adicionar Membro' : 'Add Team Member',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/50',
      to: createPageUrl('Team')
    },
    {
      label: pt ? 'Adicionar Cliente' : 'Add Client',
      icon: UserPlus,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 hover:border-purple-500/50',
      to: createPageUrl('Clients')
    },
    {
      label: pt ? 'Criar Fatura' : 'Create Invoice',
      icon: FilePlus,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 hover:border-amber-500/50',
      to: createPageUrl('Invoices')
    },
    {
      label: pt ? 'Ver Relatórios' : 'View Reports',
      icon: BarChart3,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/50',
      to: createPageUrl('Reports')
    }
  ]
};

export default function DashboardQuickActions({ language, userProfile }) {
  const pt = language === 'pt';
  const profileKey = userProfile || 'professional';
  const actionsBuilder = ACTIONS_BY_PROFILE[profileKey] || ACTIONS_BY_PROFILE.professional;
  const actions = actionsBuilder(pt);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Plus className="w-4 h-4 text-blue-300" />
        <h2 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
          {pt ? 'Ações Rápidas' : 'Quick Actions'}
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.to}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all cursor-pointer group ${action.bg}`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${action.color}`} />
              <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors leading-tight">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}