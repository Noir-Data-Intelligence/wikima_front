import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  TrendingUp, Users, CheckSquare, Receipt, Package, Calendar,
  DollarSign, AlertTriangle, Briefcase, Home, ClipboardList,
  UserCheck, ShoppingCart, Building2
} from 'lucide-react';

// ─── Sector KPI definitions ───────────────────────────────────────────────────
// Each sector returns 4 KPI cards from the provided data snapshot.

function buildKPIs(sector, data, pt) {
  const {
    tasks, invoices, clients, products, agendaEvents,
    teamMembers, services, cashRegisters,
    revenueThisMonth, pendingInvoices, activeTasks, activeClients
  } = data;

  const todayStr = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  const monthStart = new Date(); monthStart.setDate(1);

  const todayEvents = agendaEvents.filter(e => e.date === todayStr && e.status !== 'cancelled');
  const weekEvents = agendaEvents.filter(e => e.date >= todayStr && e.date <= weekEndStr && e.status !== 'cancelled');
  const lowStock = products.filter(p => (p.quantity_available ?? 0) < (p.minimum_stock_level ?? 10));
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const monthServices = services.filter(s => {
    const d = s.created_date ? s.created_date.split('T')[0] : '';
    return d >= monthStart.toISOString().split('T')[0];
  });
  const openCash = cashRegisters.filter(r => r.status === 'open');
  const todayCash = openCash.reduce((sum, r) => sum + (r.opening_amount || 0), 0);
  const activeTeam = teamMembers.filter(m => m.status === 'active');

  const sectors = {
    construction: [
      { icon: Briefcase, color: 'text-blue-400',   label: pt ? 'Projetos Ativos'     : 'Active Projects',    value: String(tasks.filter(t => t.status === 'in_progress').length), to: 'Tasks' },
      { icon: CheckSquare, color: 'text-primary',  label: pt ? 'Tarefas Abertas'     : 'Open Tasks',         value: String(activeTasks.length), to: 'Tasks' },
      { icon: Users, color: 'text-purple-400',       label: pt ? 'Membros de Equipa'   : 'Team Members',       value: String(activeTeam.length), to: 'Team' },
      { icon: Receipt, color: 'text-amber-400',      label: pt ? 'Faturas Pendentes'   : 'Pending Invoices',   value: String(pendingInvoices.length), to: 'Invoices' },
    ],
    consulting: [
      { icon: Users, color: 'text-blue-400',         label: pt ? 'Clientes Ativos'     : 'Active Clients',     value: String(activeClients), to: 'Clients' },
      { icon: Briefcase, color: 'text-primary',     label: pt ? 'Projetos Ativos'     : 'Active Projects',    value: String(tasks.filter(t => t.status === 'in_progress').length), to: 'Tasks' },
      { icon: Calendar, color: 'text-purple-400',    label: pt ? 'Reuniões Esta Semana': 'Meetings This Week', value: String(weekEvents.length), to: 'Agenda' },
      { icon: TrendingUp, color: 'text-emerald-400', label: pt ? 'Receita Mensal'      : 'Monthly Revenue',    value: `€${revenueThisMonth.toFixed(0)}`, to: 'Invoices' },
    ],
    retail: [
      { icon: Package, color: 'text-blue-400',       label: pt ? 'Produtos em Stock'   : 'Products in Stock',  value: String(products.filter(p => p.status !== 'discontinued').length), to: 'Stock' },
      { icon: TrendingUp, color: 'text-emerald-400', label: pt ? 'Vendas Este Mês'     : 'Sales This Month',   value: `€${revenueThisMonth.toFixed(0)}`, to: 'Invoices' },
      { icon: AlertTriangle, color: 'text-red-400',  label: pt ? 'Alertas Stock Baixo' : 'Low Stock Alerts',   value: String(lowStock.length), to: 'Stock' },
      { icon: Receipt, color: 'text-amber-400',      label: pt ? 'Faturas Pendentes'   : 'Pending Orders',     value: String(pendingInvoices.length), to: 'Invoices' },
    ],
    beauty: [
      { icon: Calendar, color: 'text-pink-400',      label: pt ? 'Marcações Hoje'      : "Today's Appointments", value: String(todayEvents.length), to: 'Agenda' },
      { icon: Users, color: 'text-blue-400',          label: pt ? 'Clientes Ativos'     : 'Active Clients',     value: String(activeClients), to: 'Clients' },
      { icon: ClipboardList, color: 'text-purple-400',label: pt ? 'Serviços Este Mês'  : 'Services This Month', value: String(monthServices.length), to: 'Services' },
      { icon: DollarSign, color: 'text-emerald-400',  label: pt ? 'Caixa Hoje'          : 'Cash Today',         value: `€${todayCash.toFixed(0)}`, to: 'CashRegister' },
    ],
    restaurant: [
      { icon: TrendingUp, color: 'text-emerald-400', label: pt ? 'Receita Diária'      : 'Daily Revenue',      value: `€${revenueThisMonth.toFixed(0)}`, to: 'Invoices' },
      { icon: ShoppingCart, color: 'text-blue-400',  label: pt ? 'Encomendas Hoje'     : 'Orders Today',       value: String(invoices.filter(i => i.date === todayStr).length), to: 'Invoices' },
      { icon: AlertTriangle, color: 'text-red-400',  label: pt ? 'Alertas Inventário'  : 'Inventory Alerts',   value: String(lowStock.length), to: 'Stock' },
      { icon: Users, color: 'text-purple-400',        label: pt ? 'Equipa em Turno'     : 'Staff on Shift',     value: String(activeTeam.length), to: 'Team' },
    ],
    real_estate: [
      { icon: Building2, color: 'text-blue-400',     label: pt ? 'Propriedades Ativas' : 'Active Properties',  value: String(services.filter(s => s.status === 'active').length), to: 'Services' },
      { icon: Users, color: 'text-primary',          label: pt ? 'Clientes Ativos'     : 'Active Clients',     value: String(activeClients), to: 'Clients' },
      { icon: Calendar, color: 'text-purple-400',    label: pt ? 'Visitas Agendadas'   : 'Visits Scheduled',   value: String(weekEvents.length), to: 'Agenda' },
      { icon: ClipboardList, color: 'text-amber-400',label: pt ? 'Contratos Pendentes' : 'Pending Contracts',  value: String(pendingInvoices.length), to: 'Invoices' },
    ],
    healthcare: [
      { icon: Calendar, color: 'text-emerald-400',   label: pt ? 'Consultas Hoje'      : 'Appointments Today', value: String(todayEvents.length), to: 'Agenda' },
      { icon: Users, color: 'text-blue-400',          label: pt ? 'Pacientes Ativos'    : 'Active Patients',    value: String(activeClients), to: 'Clients' },
      { icon: ClipboardList, color: 'text-purple-400',label: pt ? 'Serviços Este Mês'  : 'Services This Month', value: String(monthServices.length), to: 'Services' },
      { icon: Receipt, color: 'text-amber-400',       label: pt ? 'Faturas Pendentes'   : 'Pending Invoices',   value: String(pendingInvoices.length), to: 'Invoices' },
    ],
    logistics: [
      { icon: Package, color: 'text-blue-400',        label: pt ? 'Itens em Stock'      : 'Items in Stock',     value: String(products.filter(p => p.status !== 'discontinued').length), to: 'Stock' },
      { icon: CheckSquare, color: 'text-primary',    label: pt ? 'Tarefas Abertas'     : 'Open Tasks',         value: String(activeTasks.length), to: 'Tasks' },
      { icon: Users, color: 'text-purple-400',         label: pt ? 'Clientes Ativos'     : 'Active Clients',     value: String(activeClients), to: 'Clients' },
      { icon: TrendingUp, color: 'text-emerald-400',  label: pt ? 'Receita Mensal'      : 'Monthly Revenue',    value: `€${revenueThisMonth.toFixed(0)}`, to: 'Invoices' },
    ],
    marketing: [
      { icon: Users, color: 'text-blue-400',          label: pt ? 'Clientes Ativos'     : 'Active Clients',     value: String(activeClients), to: 'Clients' },
      { icon: CheckSquare, color: 'text-primary',    label: pt ? 'Projetos em Curso'   : 'Active Projects',    value: String(tasks.filter(t => t.status === 'in_progress').length), to: 'Tasks' },
      { icon: TrendingUp, color: 'text-emerald-400',  label: pt ? 'Receita Mensal'      : 'Monthly Revenue',    value: `€${revenueThisMonth.toFixed(0)}`, to: 'Invoices' },
      { icon: Receipt, color: 'text-amber-400',        label: pt ? 'Faturas Pendentes'   : 'Pending Invoices',   value: String(pendingInvoices.length), to: 'Invoices' },
    ],
    accounting: [
      { icon: Receipt, color: 'text-amber-400',        label: pt ? 'Faturas em Atraso'   : 'Overdue Invoices',  value: String(overdueInvoices.length), to: 'Invoices' },
      { icon: Users, color: 'text-blue-400',           label: pt ? 'Clientes Ativos'     : 'Active Clients',    value: String(activeClients), to: 'Clients' },
      { icon: TrendingUp, color: 'text-emerald-400',   label: pt ? 'Receita Mensal'      : 'Monthly Revenue',   value: `€${revenueThisMonth.toFixed(0)}`, to: 'Invoices' },
      { icon: DollarSign, color: 'text-purple-400',    label: pt ? 'Por Receber'         : 'Outstanding',       value: `€${pendingInvoices.reduce((s,i)=>s+(i.total||0),0).toFixed(0)}`, to: 'Invoices' },
    ],
    legal: [
      { icon: Users, color: 'text-blue-400',          label: pt ? 'Clientes Ativos'     : 'Active Clients',    value: String(activeClients), to: 'Clients' },
      { icon: CheckSquare, color: 'text-primary',    label: pt ? 'Tarefas Abertas'     : 'Open Tasks',        value: String(activeTasks.length), to: 'Tasks' },
      { icon: Calendar, color: 'text-purple-400',     label: pt ? 'Reuniões Esta Semana': 'Meetings This Week',value: String(weekEvents.length), to: 'Agenda' },
      { icon: Receipt, color: 'text-amber-400',        label: pt ? 'Faturas Pendentes'   : 'Pending Invoices',  value: String(pendingInvoices.length), to: 'Invoices' },
    ],
    technology: [
      { icon: CheckSquare, color: 'text-primary',    label: pt ? 'Tarefas Ativas'      : 'Active Tasks',      value: String(activeTasks.length), to: 'Tasks' },
      { icon: Users, color: 'text-blue-400',           label: pt ? 'Clientes Ativos'     : 'Active Clients',    value: String(activeClients), to: 'Clients' },
      { icon: Users, color: 'text-purple-400',         label: pt ? 'Membros de Equipa'   : 'Team Members',      value: String(activeTeam.length), to: 'Team' },
      { icon: TrendingUp, color: 'text-emerald-400',   label: pt ? 'Receita Mensal'      : 'Monthly Revenue',   value: `€${revenueThisMonth.toFixed(0)}`, to: 'Invoices' },
    ],
    education: [
      { icon: Calendar, color: 'text-blue-400',       label: pt ? 'Aulas Hoje'          : 'Sessions Today',    value: String(todayEvents.length), to: 'Agenda' },
      { icon: Users, color: 'text-primary',           label: pt ? 'Alunos Ativos'       : 'Active Students',   value: String(activeClients), to: 'Clients' },
      { icon: ClipboardList, color: 'text-purple-400', label: pt ? 'Serviços Este Mês'  : 'Services This Month',value: String(monthServices.length), to: 'Services' },
      { icon: TrendingUp, color: 'text-emerald-400',   label: pt ? 'Receita Mensal'      : 'Monthly Revenue',   value: `€${revenueThisMonth.toFixed(0)}`, to: 'Invoices' },
    ],
  };

  // Default / other
  const defaultKPIs = [
    { icon: Users, color: 'text-blue-400',           label: pt ? 'Clientes Ativos'   : 'Active Clients',    value: String(activeClients), to: 'Clients' },
    { icon: CheckSquare, color: 'text-primary',     label: pt ? 'Tarefas Ativas'    : 'Active Tasks',      value: String(activeTasks.length), to: 'Tasks' },
    { icon: TrendingUp, color: 'text-emerald-400',   label: pt ? 'Receita Mensal'    : 'Monthly Revenue',   value: `€${revenueThisMonth.toFixed(0)}`, to: 'Invoices' },
    { icon: Receipt, color: 'text-amber-400',         label: pt ? 'Faturas Pendentes' : 'Pending Invoices',  value: String(pendingInvoices.length), to: 'Invoices' },
  ];

  return sectors[sector] || defaultKPIs;
}

export default function SmartKPISection({ sector, data, language }) {
  const pt = language === 'pt';
  const kpis = buildKPIs(sector || 'other', data, pt);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {kpis.map(({ icon: Icon, color, label, value, to }) => (
        <Link key={label} to={createPageUrl(to)} className="block group">
          <div
            className="rounded-xl p-4 border transition-all duration-150 group-hover:border-border"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color} mb-0.5`}>{value}</p>
            <p className="text-xs text-muted-foreground leading-tight">{label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}