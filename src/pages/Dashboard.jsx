import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useLanguage } from '../components/LanguageContext';
import { useDemoMode } from '../components/DemoModeContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import {
  CheckSquare, Calendar, Receipt, Users, AlertCircle,
  ArrowRight, TrendingUp, Wallet, Lightbulb, Activity, FolderOpen
} from 'lucide-react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import MobileMenuButton from '../components/dashboard/MobileMenuButton';
import WikimaAI from '../components/dashboard/WikimaAI';
import GuidedTour from '../components/onboarding/GuidedTour';
import DashboardQuickActions from '../components/dashboard/DashboardQuickActions';
import DashboardWelcomeBanner from '../components/dashboard/DashboardWelcomeBanner';
import GettingStartedChecklist from '../components/dashboard/GettingStartedChecklist';
import DashboardTodayFocus from '../components/dashboard/DashboardTodayFocus';
import SmartKPISection from '../components/dashboard/SmartKPISection';
import SmartRecentActivity from '../components/dashboard/SmartRecentActivity';
import SmartInsights from '../components/dashboard/SmartInsights';
import SmartUpcomingSection from '../components/dashboard/SmartUpcomingSection';
import { usePersonalPayments } from '../hooks/usePersonalPayments';
import { differenceInDays } from 'date-fns';

// Derive the 3-profile system from user.user_profile (set during onboarding)
// Falls back to workspace type for legacy accounts
function deriveProfile(workspace, user) {
  if (user?.user_profile) return user.user_profile; // 'personal' | 'professional' | 'company'
  if (workspace?.type === 'company') return 'company';
  if (workspace?.type === 'personal') return 'personal';
  return 'professional';
}

export default function Dashboard() {
  const { language } = useLanguage();
  const { isDemoMode, demoData } = useDemoMode();
  const { overdue: overduePayments, dueToday: paymentsDueToday, dueSoon: paymentsDueSoon, upcoming7: paymentsNextWeek } = usePersonalPayments();
  const [user, setUser] = React.useState(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showTour, setShowTour] = React.useState(false);
  const [workspace, setWorkspace] = React.useState(null);
  const pt = language === 'pt';

  React.useEffect(() => {
    if (!isDemoMode) loadUser();
    else setUser({ full_name: 'Demo User', email: 'demo@wikima.app' });
  }, [isDemoMode]);

  const loadUser = async () => {
    try {
      const currentUser = await api.auth.me();
      if (!currentUser) { window.location.href = createPageUrl('Landing'); return; }
      setUser(currentUser);
      if (currentUser.current_workspace_id || currentUser.default_workspace_id) {
        const ws = await api.entities.Workspace.get(currentUser.current_workspace_id || currentUser.default_workspace_id);
        setWorkspace(ws);
        if (currentUser.show_guided_tour) {
          setShowTour(true);
          await api.auth.updateMe({ show_guided_tour: false });
        }
      }
    } catch {
      window.location.href = createPageUrl('Landing');
    }
  };

  // ─── Data fetching ───────────────────────────────────────────────────────────
  const getWsId = async () => {
    const u = await api.auth.me();
    return u.current_workspace_id || u.default_workspace_id;
  };

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Task.filter({ workspace_id: id }); }
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Invoice.filter({ workspace_id: id }); }
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Client.filter({ workspace_id: id }); }
  });
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Document.filter({ workspace_id: id }); }
  });
  const { data: agendaEvents = [] } = useQuery({
    queryKey: ['dashboard-agenda'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.AgendaEvent.filter({ workspace_id: id }); }
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ['dashboard-expenses'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Expense.filter({ workspace_id: id }, '-created_date', 1); }
  });
  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['dashboard-savings'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.SavingsGoal.filter({ workspace_id: id }, '-created_date', 1); }
  });
  const { data: recurringPayments = [] } = useQuery({
    queryKey: ['dashboard-recurring'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.RecurringPayment.filter({ workspace_id: id }, '-created_date', 1); }
  });
  const { data: services = [] } = useQuery({
    queryKey: ['dashboard-services'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Service.filter({ workspace_id: id }, '-created_date', 1); }
  });
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['dashboard-team'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.TeamMember.filter({ workspace_id: id }, '-created_date', 1); }
  });
  const { data: products = [] } = useQuery({
    queryKey: ['dashboard-products'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Product.filter({ workspace_id: id }); }
  });
  const { data: cashRegisters = [] } = useQuery({
    queryKey: ['dashboard-cash'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.CashRegister.filter({ workspace_id: id }); }
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['dashboard-projects'], enabled: !isDemoMode,
    queryFn: async () => { const id = await getWsId(); if (!id) return []; return api.entities.Project.filter({ workspace_id: id }); }
  });

  const allTasks = isDemoMode ? demoData.tasks : tasks;
  const allInvoices = isDemoMode ? demoData.invoices : invoices;
  const allClients = isDemoMode ? demoData.clients : clients;
  const allDocuments = isDemoMode ? demoData.documents : documents;

  // ─── Date helpers ────────────────────────────────────────────────────────────
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayMidnight = new Date(todayStr);
  const tomorrowStr = new Date(new Date(todayStr).setDate(new Date(todayStr).getDate() + 1)).toISOString().split('T')[0];
  const in3daysStr = new Date(new Date(todayStr).setDate(new Date(todayStr).getDate() + 3)).toISOString().split('T')[0];

  // ─── Derived data ────────────────────────────────────────────────────────────
  const activeTasks = allTasks.filter(t => !['completed', 'cancelled'].includes(t.status));
  const tasksDueToday = activeTasks.filter(t => t.deadline && t.deadline.split('T')[0] === todayStr);
  const overdueTasks = activeTasks.filter(t => t.deadline && new Date(t.deadline).setHours(0,0,0,0) < todayMidnight.getTime());
  const tasksThisWeek = activeTasks.filter(t => t.deadline && t.deadline.split('T')[0] > todayStr && t.deadline.split('T')[0] <= in3daysStr);

  const todayEvents = agendaEvents.filter(e => e.date === todayStr && e.status !== 'cancelled').sort((a, b) => a.start_time?.localeCompare(b.start_time));
  const upcomingEvents = agendaEvents.filter(e => e.date > todayStr && e.date <= in3daysStr && e.status !== 'cancelled').sort((a,b)=>a.date.localeCompare(b.date));

  const followUpClients = allClients.filter(c => c.next_action_date && c.next_action_date <= todayStr && c.status !== 'inactive');
  const upcomingFollowUps = allClients.filter(c => c.next_action_date && c.next_action_date > todayStr && c.next_action_date <= in3daysStr && c.status !== 'inactive');

  const overdueInvoices = allInvoices.filter(i => i.status === 'overdue');
  const pendingInvoices = allInvoices.filter(i => i.status === 'sent' || i.status === 'overdue');

  // Revenue this month (paid)
  const revenueThisMonth = allInvoices.filter(i => {
    if (i.status !== 'paid' || !i.paid_date) return false;
    const d = new Date(i.paid_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, i) => s + (i.total || 0), 0);

  const outstanding = pendingInvoices.reduce((s, i) => s + (i.total || 0), 0);

  // ─── User profile ────────────────────────────────────────────────────────────
  const profile = deriveProfile(workspace, user);
  const isPersonal = profile === 'personal';
  const isCompany = profile === 'company';

  // Business sector (for smart KPIs)
  const businessSector = workspace?.company_info?.business_sector || null;

  // Smart KPI data snapshot
  const smartData = {
    tasks: allTasks,
    invoices: allInvoices,
    clients: allClients,
    documents: allDocuments,
    products,
    agendaEvents,
    teamMembers,
    services,
    cashRegisters,
    revenueThisMonth,
    pendingInvoices,
    activeTasks,
    activeClients: allClients.filter(c => c.status !== 'inactive').length,
  };

  // ─── TODAY FOCUS items ───────────────────────────────────────────────────────
  const todayFocusItems = [
    ...overdueTasks.slice(0, 3).map(t => ({
      id: `overdue-${t.id}`, type: 'overdue',
      icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20',
      label: t.title,
      meta: pt ? '⚠️ Em atraso' : '⚠️ Overdue',
      to: createPageUrl('Tasks')
    })),
    ...overdueInvoices.map(i => ({
      id: `inv-${i.id}`, type: 'invoice',
      icon: Receipt, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
      label: `${i.client_name} — €${(i.total || 0).toFixed(0)}`,
      meta: pt ? 'Fatura em atraso' : 'Overdue invoice',
      to: createPageUrl('Invoices')
    })),
    ...overduePayments.map(p => ({
      id: `pay-overdue-${p.id}`, type: 'payment',
      icon: Wallet, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20',
      label: p.name,
      meta: pt ? '💸 Pagamento em atraso' : '💸 Payment overdue',
      to: createPageUrl('Financials')
    })),
    ...tasksDueToday.map(t => ({
      id: `task-${t.id}`, type: 'task',
      icon: CheckSquare, color: 'text-primary', bg: 'bg-primary/10 border-primary/20',
      label: t.title,
      meta: t.priority === 'urgent' ? (pt ? '🔴 urgente' : '🔴 urgent') : t.priority === 'high' ? (pt ? '🟠 alta' : '🟠 high') : (pt ? 'Para hoje' : 'Due today'),
      to: createPageUrl('Tasks')
    })),
    ...todayEvents.map(e => ({
      id: `event-${e.id}`, type: 'event',
      icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20',
      label: e.title,
      meta: `${e.start_time}${e.end_time ? ' – ' + e.end_time : ''}`,
      to: createPageUrl('Agenda')
    })),
    ...followUpClients.map(c => ({
      id: `client-${c.id}`, type: 'client',
      icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
      label: c.name,
      meta: c.next_action || (pt ? 'Follow-up pendente' : 'Follow-up due'),
      to: createPageUrl('ClientProfile') + `?id=${c.id}`
    })),
    ...paymentsDueToday.map(p => ({
      id: `pay-today-${p.id}`, type: 'payment',
      icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
      label: p.name,
      meta: pt ? '💰 Pagar hoje' : '💰 Due today',
      to: createPageUrl('Financials')
    })),
  ];

  // ─── UPCOMING items ──────────────────────────────────────────────────────────
  const upcomingItems = [
    ...upcomingFollowUps.map(c => ({
      id: `upf-${c.id}`,
      icon: Users, color: 'text-blue-400',
      label: `${pt ? 'Follow-up:' : 'Follow-up:'} ${c.name}`,
      when: c.next_action_date === tomorrowStr ? (pt ? 'amanhã' : 'tomorrow') : `${differenceInDays(new Date(c.next_action_date), new Date(todayStr))}d`,
      to: createPageUrl('Clients')
    })),
    ...upcomingEvents.map(e => ({
      id: `upe-${e.id}`,
      icon: Calendar, color: 'text-purple-400',
      label: e.start_time ? `${e.title} · ${e.start_time}` : e.title,
      when: e.date === tomorrowStr ? (pt ? 'amanhã' : 'tomorrow') : `${differenceInDays(new Date(e.date), new Date(todayStr))}d`,
      to: createPageUrl('Agenda')
    })),
    ...tasksThisWeek.slice(0, 3).map(t => ({
      id: `upt-${t.id}`,
      icon: CheckSquare, color: 'text-primary',
      label: t.title,
      when: t.deadline?.split('T')[0] === tomorrowStr ? (pt ? 'amanhã' : 'tomorrow') : `${differenceInDays(new Date(t.deadline.split('T')[0]), new Date(todayStr))}d`,
      to: createPageUrl('Tasks')
    })),
    ...paymentsDueSoon.map(p => ({
      id: `ups-${p.id}`,
      icon: Wallet, color: 'text-yellow-400',
      label: p.name,
      when: p.daysUntil === 1 ? (pt ? 'amanhã' : 'tomorrow') : `${p.daysUntil}d`,
      to: createPageUrl('Financials')
    })),
    ...paymentsNextWeek.slice(0, 2).map(p => ({
      id: `upw-${p.id}`,
      icon: Wallet, color: 'text-muted-foreground',
      label: p.name,
      when: `${p.daysUntil}d`,
      to: createPageUrl('Financials')
    })),
  ].slice(0, 5);

  // ─── KPI strip — adaptive by profile ────────────────────────────────────────
  const getGreeting = () => {
    const hour = now.getHours();
    const name = user?.full_name?.split(' ')[0] || '';
    const g = hour < 12 ? (pt ? 'Bom dia' : 'Good morning')
      : hour < 18 ? (pt ? 'Boa tarde' : 'Good afternoon')
      : (pt ? 'Boa noite' : 'Good evening');
    return name ? `${g}, ${name}` : g;
  };

  const dateLabel = now.toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  // KPI tiles depend on profile
  const kpiTiles = [];

  if (!isPersonal) {
    kpiTiles.push({
      icon: TrendingUp, color: 'text-emerald-400',
      label: pt ? 'Recebido este mês' : 'Received this month',
      value: `€${revenueThisMonth.toFixed(0)}`
    });
    if (outstanding > 0) kpiTiles.push({
      icon: Receipt, color: 'text-amber-400',
      label: pt ? 'Por receber' : 'Outstanding',
      value: `€${outstanding.toFixed(0)}`
    });
  }

  if (!isPersonal) kpiTiles.push({
    icon: Users, color: 'text-blue-400',
    label: pt ? 'Clientes' : 'Clients',
    value: String(allClients.filter(c => c.status !== 'inactive').length)
  });

  kpiTiles.push({
    icon: CheckSquare, color: 'text-purple-400',
    label: pt ? 'Tarefas ativas' : 'Active tasks',
    value: String(activeTasks.length)
  });

  if (isPersonal || profile === 'professional') {
    const upcoming = [...overduePayments, ...paymentsDueToday, ...paymentsDueSoon];
    if (upcoming.length > 0) kpiTiles.push({
      icon: Wallet, color: 'text-yellow-400',
      label: pt ? 'Pagamentos pendentes' : 'Payments pending',
      value: String(upcoming.length)
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {showTour && (
        <GuidedTour onComplete={() => setShowTour(false)} workspaceType={workspace?.type} mainGoals={user?.main_goals || []} />
      )}
      
      

      <main className="p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1600px]">

          {/* Greeting */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">{dateLabel}</p>
              <h1 className="mt-0.5 font-display text-2xl font-bold text-foreground sm:text-3xl">{getGreeting()} 👋</h1>
            </div>
          </div>

          {/* Welcome Banner — profile-specific */}
          <DashboardWelcomeBanner
            userProfile={profile}
            language={language}
            userName={user?.full_name || ''}
          />

          {/* Quick Actions — profile-specific */}
          <DashboardQuickActions language={language} userProfile={profile} />

          {/* Getting Started Checklist — auto-hides once dismissed */}
          {!isDemoMode && (
            <GettingStartedChecklist
              profile={profile}
              language={language}
              userId={user?.id}
              data={{
                tasks: allTasks,
                invoices: allInvoices,
                clients: allClients,
                documents: allDocuments,
                agendaEvents,
                expenses,
                savingsGoals,
                recurringPayments,
                services,
                teamMembers
              }}
            />
          )}

          {/* ── Section 2: Smart KPI Cards (sector-aware) ── */}
          {isCompany && (
            <SmartKPISection sector={businessSector} data={smartData} language={language} />
          )}

          {/* Compact KPI strip for non-company profiles */}
          {!isCompany && (
            <div className="flex flex-wrap gap-2 mb-6">
              {kpiTiles.map(({ icon: Icon, color, label, value }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-white/8 text-sm">
                  <Icon className={`w-3 h-3 ${color}`} />
                  <span className="text-foreground/45 text-xs">{label}</span>
                  <span className={`font-semibold text-xs ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Content grid: main column (2/3) + side column (1/3) ── */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">

          {/* ── Active Projects (Company only) ── */}
          {isCompany && projects.filter(p => ['planning','active','on_hold'].includes(p.status)).length > 0 && (() => {
            const STATUS_CFG = {
              planning:  { dot: 'bg-blue-400',    label_pt: 'Planeamento', label_en: 'Planning'  },
              active:    { dot: 'bg-emerald-400', label_pt: 'Ativo',       label_en: 'Active'    },
              on_hold:   { dot: 'bg-yellow-400',  label_pt: 'Em Espera',   label_en: 'On Hold'   },
              completed: { dot: 'bg-teal-400',    label_pt: 'Concluído',   label_en: 'Completed' },
            };
            const activeProjects = projects
              .filter(p => ['planning','active','on_hold'].includes(p.status))
              .sort((a, b) => {
                const pri = { urgent: 0, high: 1, medium: 2, low: 3 };
                return (pri[a.priority] ?? 2) - (pri[b.priority] ?? 2);
              })
              .slice(0, 5);

            return (
              <div className="rounded-xl border p-4 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-orange-400" />
                    <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {pt ? 'Projetos Ativos' : 'Active Projects'}
                    </h2>
                  </div>
                  <Link to="/Projects" className="text-[10px] text-orange-400/70 hover:text-orange-400 transition-colors flex items-center gap-1">
                    {pt ? 'Ver todos' : 'View all'} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {activeProjects.map(proj => {
                    const cfg = STATUS_CFG[proj.status] || STATUS_CFG.planning;
                    const isOverdue = proj.due_date && new Date(proj.due_date) < new Date() && proj.status !== 'completed';
                    return (
                      <Link key={proj.id} to={`/ProjectProfile?id=${proj.id}`}
                        className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/[0.03] border border-white/6 hover:bg-white/[0.06] hover:border-white/12 transition-all cursor-pointer group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-orange-200 transition-colors">{proj.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              {proj.client_name && <span className="text-[10px] text-muted-foreground truncate">{proj.client_name}</span>}
                              {proj.owner_name && <span className="text-[10px] text-muted-foreground truncate">· {proj.owner_name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="flex items-center gap-1 text-[10px]">
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              <span className="text-muted-foreground">{pt ? cfg.label_pt : cfg.label_en}</span>
                            </span>
                            {proj.due_date && (
                              <span className={`text-[10px] tabular-nums ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                                {isOverdue ? (pt ? 'Atrasado' : 'Overdue') : new Date(proj.due_date).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Today's Focus + Upcoming */}
          <DashboardTodayFocus
            todayFocusItems={todayFocusItems}
            upcomingItems={upcomingItems}
            overdueTasks={overdueTasks}
            overdueInvoices={overdueInvoices}
            overduePayments={overduePayments}
            language={language}
          />

          {/* ── Section 3: Recent Activity ── */}
          {isCompany && (
            <div className="rounded-xl border p-4 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">
                  {pt ? 'Actividade Recente' : 'Recent Activity'}
                </h2>
              </div>
              <SmartRecentActivity
                tasks={allTasks}
                clients={allClients}
                invoices={allInvoices}
                documents={allDocuments}
                agendaEvents={agendaEvents}
                language={language}
                isCompany={isCompany}
              />
            </div>
          )}

          {/* ── Section 4: Upcoming Tasks / Meetings / Deadlines ── */}
          {isCompany && (
            <SmartUpcomingSection
              tasks={allTasks}
              agendaEvents={agendaEvents}
              language={language}
              isCompany={isCompany}
            />
          )}

          </div>{/* end main column */}

          {/* ── Side column ── */}
          <div className="space-y-5">

          {/* WiKima AI — slim */}
          <div className="rounded-xl border border-primary/15 bg-background px-4 py-3 mb-5">
            <WikimaAI
              tasks={allTasks}
              clients={allClients}
              invoices={allInvoices}
              documents={allDocuments}
              agendaEvents={agendaEvents}
              userName={user?.full_name || ''}
              isCompany={isCompany}
              projects={projects}
              products={products}
              teamMembers={teamMembers}
            />
          </div>

          {/* Pending invoice reminder */}
          {pendingInvoices.filter(i => i.status === 'sent').length > 0 && (
            <Link to={createPageUrl('Invoices')}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/6 border border-amber-500/15 mb-4 hover:bg-amber-500/10 transition-colors">
                <Receipt className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300/90 flex-1">
                  {pendingInvoices.filter(i => i.status === 'sent').length === 1
                    ? (pt ? '1 fatura enviada aguarda pagamento' : '1 invoice awaiting payment')
                    : (pt ? `${pendingInvoices.filter(i => i.status === 'sent').length} faturas aguardam pagamento` : `${pendingInvoices.filter(i => i.status === 'sent').length} invoices awaiting payment`)}
                </p>
                <ArrowRight className="w-3 h-3 text-amber-400/50 flex-shrink-0" />
              </div>
            </Link>
          )}

          {/* ── Section 5: Business Insights ── */}
          {isCompany && (
            <div className="rounded-xl border p-4 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">
                  {pt ? 'Insights de Negócio' : 'Business Insights'}
                </h2>
              </div>
              <SmartInsights data={smartData} sector={businessSector} language={language} isCompany={isCompany} />
            </div>
          )}

          </div>{/* end side column */}
          </div>{/* end content grid */}

        </div>
      </main>
    </div>
  );
}