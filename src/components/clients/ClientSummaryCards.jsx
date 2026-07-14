import { Users, TrendingUp, Bell, Receipt } from 'lucide-react';

export default function ClientSummaryCards({ clients, invoices, language }) {
  const pt = language === 'pt';
  const today = new Date().toISOString().split('T')[0];

  const totalClients = clients.filter(c => c.pipeline_stage === 'active_client').length;
  const activeLeads = clients.filter(c => ['lead', 'contacted', 'negotiation'].includes(c.pipeline_stage || 'lead')).length;
  const followUpsToday = clients.filter(c => c.next_action_date && c.next_action_date <= today && c.status !== 'inactive').length;
  const pendingPayments = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length;

  const cards = [
    { icon: Users,     color: 'text-primary',    bg: 'bg-primary/8 border-primary/20',   value: totalClients,    label: pt ? 'Clientes Ativos'  : 'Active Clients' },
    { icon: TrendingUp,color: 'text-amber-400',   bg: 'bg-amber-500/8 border-amber-500/20', value: activeLeads,     label: pt ? 'Leads Ativos'     : 'Active Leads' },
    { icon: Bell,      color: 'text-blue-400',    bg: 'bg-blue-500/8 border-blue-500/20',   value: followUpsToday,  label: pt ? 'Follow-ups Hoje'  : 'Follow-ups Today', highlight: followUpsToday > 0 },
    { icon: Receipt,   color: 'text-rose-400',    bg: 'bg-rose-500/8 border-rose-500/20',   value: pendingPayments, label: pt ? 'Pagamentos Pend.' : 'Pending Payments', highlight: pendingPayments > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
      {cards.map(({ icon: Icon, color, bg, value, label, highlight }) => (
        <div key={label} className={`flex items-center gap-3 px-3 py-3 rounded-xl border ${bg} ${highlight ? 'ring-1 ring-white/10' : ''}`}>
          <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
          <div className="min-w-0">
            <p className={`text-lg font-bold leading-none ${highlight && value > 0 ? color : 'text-foreground'}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}