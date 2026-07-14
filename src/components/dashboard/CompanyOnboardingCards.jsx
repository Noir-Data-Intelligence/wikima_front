import { Link } from 'react-router-dom';
import { Users, CheckSquare, Receipt, UserPlus, ArrowRight } from 'lucide-react';

export default function CompanyOnboardingCards({ language }) {
  const pt = language === 'pt';

  const cards = [
    {
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      title: pt ? 'Adicionar Primeiro Cliente' : 'Add Your First Client',
      desc: pt ? 'Registe os seus clientes para gerir relacionamentos e faturação.' : 'Register clients to manage relationships and billing.',
      action: pt ? 'Adicionar Cliente' : 'Add Client',
      link: '/Clients'
    },
    {
      icon: CheckSquare,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      title: pt ? 'Criar Primeiro Projeto' : 'Create Your First Project',
      desc: pt ? 'Organize o seu trabalho em projetos para melhor acompanhamento.' : 'Organize work into projects for better tracking.',
      action: pt ? 'Criar Projeto' : 'Create Project',
      link: '/Projects'
    },
    {
      icon: UserPlus,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      title: pt ? 'Convidar Equipa' : 'Invite Team Member',
      desc: pt ? 'Adicione membros à sua equipa para colaborar em tarefas.' : 'Add team members to collaborate on tasks.',
      action: pt ? 'Convidar Membro' : 'Invite Member',
      link: '/Team'
    },
    {
      icon: Receipt,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      title: pt ? 'Criar Primeira Fatura' : 'Create Your First Invoice',
      desc: pt ? 'Emita faturas profissionais para os seus serviços.' : 'Issue professional invoices for your services.',
      action: pt ? 'Criar Fatura' : 'Create Invoice',
      link: '/Invoices'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Link
            key={idx}
            to={card.link}
            className={`block p-3 rounded-xl border transition-all hover:scale-[1.02] hover:bg-opacity-15 ${card.bg} ${card.border} hover:bg-accent/50`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${card.bg}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-semibold ${card.color} mb-0.5`}>{card.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{card.desc}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  {card.action} <ArrowRight className="w-3 h-3" />
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}