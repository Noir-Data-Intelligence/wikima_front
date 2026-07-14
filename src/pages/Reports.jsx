import { useState, useEffect } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useDemoMode } from '../components/DemoModeContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Receipt, BarChart3, Calendar,
  AlertCircle, Users, FileText, Sparkles, DollarSign, Building2, Briefcase,
  FileCheck, ArrowUpRight, ArrowDownRight, Minus, FileDown, Mail, Printer,
  CheckSquare, Activity, Zap, ShieldCheck, CreditCard, Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { buildReportHTML, openPrintWindow } from '@/components/reports/ReportPrintBuilder';

// Tiny pulsing dot for critical items
function PulseDot({ color = 'bg-red-500' }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

// Trend badge: +12% ↑ or -5% ↓
function TrendBadge({ pct }) {
  if (pct === 0) return <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Minus className="w-2.5 h-2.5" />0%</span>;
  const up = pct > 0;
  return (
    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {up ? '+' : ''}{pct}%
    </span>
  );
}

export default function Reports() {
  const { language } = useLanguage();
  const { isDemoMode, demoData } = useDemoMode();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const { data: companyProfile } = useCompanyProfile();

  useEffect(() => {
    api.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  // Animate bars on mount
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  // ── Data queries ────────────────────────────────────────────────────────────
  const { data: tasksData = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const u = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: u.email });
      if (!ws.length) return [];
      return await api.entities.Task.filter({ workspace_id: ws[0].id }, '-created_date');
    },
    initialData: [], enabled: !isDemoMode
  });
  const tasks = isDemoMode ? demoData.tasks : tasksData;

  const { data: invoicesData = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const u = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: u.email });
      if (!ws.length) return [];
      return await api.entities.Invoice.filter({ workspace_id: ws[0].id }, '-date');
    },
    initialData: [], enabled: !isDemoMode
  });
  const invoices = isDemoMode ? demoData.invoices : invoicesData;

  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const u = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: u.email });
      if (!ws.length) return [];
      return await api.entities.Receipt.filter({ workspace_id: ws[0].id }, '-date');
    },
    initialData: [], enabled: !isDemoMode
  });

  const { data: cashRegisters = [] } = useQuery({
    queryKey: ['cashRegisters'],
    queryFn: async () => {
      const u = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: u.email });
      if (!ws.length) return [];
      return await api.entities.CashRegister.filter({ workspace_id: ws[0].id }, '-date');
    },
    initialData: [], enabled: !isDemoMode
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      const u = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: u.email });
      if (!ws.length) return [];
      return await api.entities.BankAccount.filter({ workspace_id: ws[0].id });
    },
    initialData: [], enabled: !isDemoMode
  });

  const { data: bankStatements = [] } = useQuery({
    queryKey: ['bankStatements'],
    queryFn: async () => {
      const u = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: u.email });
      if (!ws.length) return [];
      return await api.entities.BankStatement.filter({ workspace_id: ws[0].id });
    },
    initialData: [], enabled: !isDemoMode
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const u = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: u.email });
      if (!ws.length) return [];
      return await api.entities.Service.filter({ workspace_id: ws[0].id });
    },
    initialData: [], enabled: !isDemoMode
  });

  const { data: agendaEvents = [] } = useQuery({
    queryKey: ['agendaEvents'],
    queryFn: async () => {
      const u = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: u.email });
      if (!ws.length) return [];
      return await api.entities.AgendaEvent.filter({ workspace_id: ws[0].id });
    },
    initialData: [], enabled: !isDemoMode
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const u = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: u.email });
      if (!ws.length) return [];
      return await api.entities.Client.filter({ workspace_id: ws[0].id }, '-created_date');
    },
    initialData: [], enabled: !isDemoMode
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const u = await api.auth.me();
      const ws = await api.entities.Workspace.filter({ owner_email: u.email });
      if (!ws.length) return [];
      return await api.entities.Document.filter({ workspace_id: ws[0].id }, '-created_date');
    },
    initialData: [], enabled: !isDemoMode
  });

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const now = new Date();
  const weekAgo   = new Date(now.getTime() - 7  * 86400000);
  const monthAgo  = new Date(now.getTime() - 30 * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
  const prevMonthStart = new Date(now.getTime() - 60 * 86400000);

  const totalInvoiced  = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalReceived  = receipts.filter(r => r.type === 'received').reduce((s, r) => s + (r.amount || 0), 0);
  const receivedThisMonth = receipts.filter(r => r.type === 'received' && r.date && new Date(r.date) >= monthAgo).reduce((s, r) => s + (r.amount || 0), 0);
  const receivedLastMonth = receipts.filter(r => r.type === 'received' && r.date && new Date(r.date) >= prevMonthStart && new Date(r.date) < monthAgo).reduce((s, r) => s + (r.amount || 0), 0);
  const receivedTrend = receivedLastMonth > 0 ? Math.round(((receivedThisMonth - receivedLastMonth) / receivedLastMonth) * 100) : 0;

  const pendingInvoices  = invoices.filter(i => i.status === 'sent' || i.status === 'draft');
  const overdueInvoices  = invoices.filter(i => i.status === 'sent' && i.due_date && new Date(i.due_date) < now);
  const outstandingAmount = pendingInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const invoicesPaid     = invoices.filter(i => i.status === 'paid').length;
  const invoicesUnpaid   = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length;

  const activeClients   = clients.filter(c => c.status === 'active').length;
  const newClientsMonth = clients.filter(c => new Date(c.created_date) >= monthAgo).length;
  const activeServices  = services.filter(s => s.status === 'active').length;
  const completedServices = services.filter(s => s.status === 'completed').length;
  const upcomingEvents  = agendaEvents.filter(e => e.date && new Date(e.date) >= now && e.status !== 'cancelled').length;

  const currentMonth = format(now, 'yyyy-MM');
  const cashOpenDaysThisMonth   = cashRegisters.filter(c => c.date && c.date.startsWith(currentMonth)).length;
  const cashDifferencesDetected = cashRegisters.filter(c => c.difference && Math.abs(c.difference) > 0).length;
  const activeBankAccounts      = bankAccounts.filter(b => b.status === 'active').length;
  const statementsReceived      = bankStatements.filter(s => s.status === 'received').length;
  const statementsMissing       = Math.max(0, bankAccounts.length * 3 - statementsReceived);

  const overdueTasks       = tasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now);
  const completedWeek      = tasks.filter(t => t.status === 'completed' && new Date(t.updated_date) >= weekAgo).length;
  const completedMonth     = tasks.filter(t => t.status === 'completed' && new Date(t.updated_date) >= monthAgo).length;
  const createdMonth       = tasks.filter(t => new Date(t.created_date) >= monthAgo).length;
  const invoicesWeek       = invoices.filter(i => i.date && new Date(i.date) >= weekAgo).length;
  const prevWeekCompleted  = tasks.filter(t => t.status === 'completed' && new Date(t.updated_date) >= twoWeeksAgo && new Date(t.updated_date) < weekAgo).length;
  const weekOverWeek       = prevWeekCompleted > 0 ? Math.round(((completedWeek - prevWeekCompleted) / prevWeekCompleted) * 100) : 0;
  const completionRate     = createdMonth > 0 ? Math.round((completedMonth / createdMonth) * 100) : 0;
  const highPriorityTasks  = tasks.filter(t => (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'completed').length;

  // Weekly chart data
  const dayNames = language === 'pt'
    ? ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const progressData = Array.from({ length: 7 }, (_, i) => {
    const d  = new Date(now.getTime() - (6 - i) * 86400000);
    const ds = new Date(d); ds.setHours(0,0,0,0);
    const de = new Date(d); de.setHours(23,59,59,999);
    const isToday = i === 6;
    return {
      day: dayNames[d.getDay()],
      isToday,
      completed: tasks.filter(t => t.status === 'completed' && new Date(t.updated_date) >= ds && new Date(t.updated_date) <= de).length,
      invoices:  invoices.filter(inv => inv.date && new Date(inv.date) >= ds && new Date(inv.date) <= de).length,
    };
  });
  const maxBar = Math.max(...progressData.map(d => Math.max(d.completed, d.invoices)), 1);
  const totalWeekTasks    = progressData.reduce((s, d) => s + d.completed, 0);
  const totalWeekInvoices = progressData.reduce((s, d) => s + d.invoices, 0);

  // Business health
  const healthFactors = [
    { key: 'invoices', score: invoicesPaid > 0 ? Math.min(100, Math.round((invoicesPaid / (invoicesPaid + invoicesUnpaid || 1)) * 100)) : 0, label: language === 'pt' ? 'Faturas pagas' : 'Paid invoices' },
    { key: 'tasks',    score: completionRate,                                                                                                   label: language === 'pt' ? 'Conclusão tarefas' : 'Task completion' },
    { key: 'clients',  score: Math.min(100, activeClients * 10),                                                                               label: language === 'pt' ? 'Clientes ativos' : 'Active clients' },
    { key: 'docs',     score: Math.min(100, documents.length * 5),                                                                             label: language === 'pt' ? 'Documentação' : 'Documentation' },
  ];
  const healthScore = Math.round(healthFactors.reduce((s, f) => s + f.score, 0) / healthFactors.length);
  const healthColor    = healthScore >= 70 ? 'text-emerald-400' : healthScore >= 40 ? 'text-yellow-400' : 'text-red-400';
  const healthBarColor = healthScore >= 70 ? 'bg-emerald-500' : healthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  // AI-style health insights
  const healthInsights = [
    overdueInvoices.length > 0
      ? { text: language === 'pt' ? `${overdueInvoices.length} fatura(s) requerem follow-up urgente` : `${overdueInvoices.length} invoice(s) require urgent follow-up`, critical: true }
      : { text: language === 'pt' ? 'Pagamentos de faturas em dia' : 'Invoice payments on track', critical: false },
    activeClients > 2
      ? { text: language === 'pt' ? 'Atividade de clientes estável' : 'Client activity is stable', critical: false }
      : { text: language === 'pt' ? 'Adiciona mais clientes para crescer' : 'Add more clients to grow your pipeline', critical: false },
    overdueTasks.length === 0 && overdueInvoices.length === 0
      ? { text: language === 'pt' ? 'Sem riscos operacionais críticos' : 'No critical operational risks detected', critical: false }
      : { text: language === 'pt' ? 'Verifica itens em atraso acima' : 'Review overdue items flagged above', critical: true },
  ];

  // Attention alerts
  const alerts = [
    overdueInvoices.length > 0   && { icon: Receipt,      color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25',    label: language === 'pt' ? `${overdueInvoices.length} fatura(s) em atraso` : `${overdueInvoices.length} overdue invoice(s)`,       action: () => navigate(createPageUrl('Invoices')),      critical: true  },
    overdueTasks.length > 0      && { icon: AlertCircle,  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25', label: language === 'pt' ? `${overdueTasks.length} tarefa(s) atrasada(s)` : `${overdueTasks.length} overdue task(s)`,            action: () => navigate(createPageUrl('Tasks')),         critical: true  },
    statementsMissing > 0        && { icon: Building2,    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25', label: language === 'pt' ? `${statementsMissing} extracto(s) em falta` : `${statementsMissing} missing statement(s)`,          action: () => navigate(createPageUrl('Banks')),         critical: false },
    highPriorityTasks > 0        && { icon: Zap,          color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25', label: language === 'pt' ? `${highPriorityTasks} tarefa(s) alta prioridade` : `${highPriorityTasks} high-priority task(s)`,     action: () => navigate(createPageUrl('Tasks')),         critical: false },
    cashDifferencesDetected > 0  && { icon: DollarSign,   color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/25',   label: language === 'pt' ? `${cashDifferencesDetected} diferença(s) de caixa` : `${cashDifferencesDetected} cash difference(s)`, action: () => navigate(createPageUrl('CashRegister')), critical: false },
  ].filter(Boolean);

  // Proactive suggestions when all clear
  const clearSuggestions = [
    statementsMissing === 0 && documents.length < 3
      ? (language === 'pt' ? 'Carrega documentos para melhorar a tua pontuação.' : 'Upload documents to improve your organization score.')
      : null,
    newClientsMonth === 0
      ? (language === 'pt' ? 'Adiciona novos clientes para expandir o teu pipeline.' : 'Add new clients to expand your pipeline.')
      : null,
    upcomingEvents === 0
      ? (language === 'pt' ? 'Agenda eventos futuros na tua Agenda.' : 'Schedule upcoming events in your Agenda.')
      : null,
  ].filter(Boolean).slice(0, 2);

  // Recent activity
  const recentActivity = [
    ...invoices.slice(0, 3).map(i => ({
      icon: Receipt, color: 'text-primary', bg: 'bg-primary/15',
      label: `${i.invoice_number || 'Invoice'} — ${i.client_name}`,
      sub: i.status === 'paid' ? (language === 'pt' ? 'Paga' : 'Paid') : i.status,
      date: i.date || i.created_date,
    })),
    ...clients.slice(0, 2).map(c => ({
      icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/15',
      label: c.name,
      sub: language === 'pt' ? 'Novo cliente' : 'New client',
      date: c.created_date,
    })),
    ...tasks.filter(t => t.status === 'completed').slice(0, 2).map(t => ({
      icon: CheckSquare, color: 'text-green-400', bg: 'bg-green-500/15',
      label: t.title,
      sub: language === 'pt' ? 'Tarefa concluída' : 'Task completed',
      date: t.updated_date,
    })),
  ].filter(a => a.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);

  // Executive summary text
  const execSummary = (() => {
    const issues = overdueInvoices.length + overdueTasks.length;
    if (issues === 0 && healthScore >= 70) return language === 'pt'
      ? `O teu negócio está saudável esta semana. ${completedWeek > 0 ? `${completedWeek} tarefa(s) concluída(s).` : ''} Sem riscos operacionais detectados.`
      : `Your business is healthy this week. ${completedWeek > 0 ? `${completedWeek} task(s) completed.` : ''} No operational risks detected.`;
    if (overdueInvoices.length > 0 && overdueTasks.length > 0) return language === 'pt'
      ? `${overdueInvoices.length} fatura(s) e ${overdueTasks.length} tarefa(s) requerem atenção. Verifica os alertas abaixo.`
      : `${overdueInvoices.length} invoice(s) and ${overdueTasks.length} task(s) require attention. Review alerts below.`;
    if (overdueInvoices.length > 0) return language === 'pt'
      ? `${overdueInvoices.length} fatura(s) pendente(s) requer(em) follow-up. ${completedWeek > 0 ? `${completedWeek} tarefa(s) concluída(s) esta semana.` : ''}`
      : `${overdueInvoices.length} pending invoice(s) require follow-up. ${completedWeek > 0 ? `${completedWeek} task(s) completed this week.` : ''}`;
    return language === 'pt'
      ? `Operação estável. ${overdueTasks.length > 0 ? `${overdueTasks.length} tarefa(s) atrasada(s).` : 'Tarefas em dia.'} ${invoicesWeek > 0 ? `${invoicesWeek} fatura(s) esta semana.` : ''}`
      : `Operations stable. ${overdueTasks.length > 0 ? `${overdueTasks.length} overdue task(s).` : 'Tasks on track.'} ${invoicesWeek > 0 ? `${invoicesWeek} invoice(s) this week.` : ''}`;
  })();

  const printReport = (reportType) => {
    const period = `${format(now, language === 'pt' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')}`;
    const generatedBy = currentUser?.full_name || currentUser?.email || '';

    let title, sections;

    if (reportType === 'financial') {
      title = language === 'pt' ? 'Relatório Financeiro' : 'Financial Report';
      sections = [
        {
          type: 'kpi-grid',
          title: language === 'pt' ? 'Resumo Financeiro' : 'Financial Summary',
          items: [
            { label: language === 'pt' ? 'Total Faturado' : 'Total Invoiced', value: `€${totalInvoiced.toFixed(2)}` },
            { label: language === 'pt' ? 'Valor em Aberto' : 'Outstanding', value: `€${outstandingAmount.toFixed(2)}` },
            { label: language === 'pt' ? 'Recebido este mês' : 'Received This Month', value: `€${receivedThisMonth.toFixed(2)}` },
            { label: language === 'pt' ? 'Recibos emitidos' : 'Receipts Issued', value: receipts.length },
          ]
        },
        {
          type: 'stat-rows',
          title: language === 'pt' ? 'Estado das Faturas' : 'Invoice Status',
          items: [
            { label: language === 'pt' ? 'Faturas pagas' : 'Paid invoices', value: invoicesPaid, highlight: true },
            { label: language === 'pt' ? 'Faturas pendentes' : 'Pending invoices', value: invoicesUnpaid },
            { label: language === 'pt' ? 'Faturas em atraso' : 'Overdue invoices', value: overdueInvoices.length },
            { label: language === 'pt' ? 'Contas bancárias ativas' : 'Active bank accounts', value: activeBankAccounts },
            { label: language === 'pt' ? 'Extractos recebidos' : 'Statements received', value: statementsReceived },
          ]
        },
        {
          type: 'table',
          title: language === 'pt' ? 'Últimas Faturas' : 'Recent Invoices',
          columns: [
            { key: 'invoice_number', label: language === 'pt' ? 'Fatura' : 'Invoice' },
            { key: 'client_name', label: language === 'pt' ? 'Cliente' : 'Client' },
            { key: 'date', label: language === 'pt' ? 'Data' : 'Date' },
            { key: 'total', label: language === 'pt' ? 'Total' : 'Total' },
            { key: 'status', label: language === 'pt' ? 'Estado' : 'Status' },
          ],
          rows: invoices.slice(0, 20).map(i => ({
            invoice_number: i.invoice_number || '—',
            client_name: i.client_name,
            date: i.date || '—',
            total: `€${(i.total || 0).toFixed(2)}`,
            status: i.status,
          }))
        }
      ];
    } else if (reportType === 'operations') {
      title = language === 'pt' ? 'Relatório Operacional' : 'Operations Report';
      sections = [
        {
          type: 'kpi-grid',
          title: language === 'pt' ? 'Resumo Operacional' : 'Operational Summary',
          items: [
            { label: language === 'pt' ? 'Clientes Ativos' : 'Active Clients', value: activeClients },
            { label: language === 'pt' ? 'Serviços Ativos' : 'Active Services', value: activeServices },
            { label: language === 'pt' ? 'Tarefas Concluídas (mês)' : 'Tasks Completed (month)', value: completedMonth },
            { label: language === 'pt' ? 'Próximos Eventos' : 'Upcoming Events', value: upcomingEvents },
          ]
        },
        {
          type: 'stat-rows',
          title: language === 'pt' ? 'Desempenho de Tarefas' : 'Task Performance',
          items: [
            { label: language === 'pt' ? 'Total de tarefas' : 'Total tasks', value: tasks.length },
            { label: language === 'pt' ? 'Concluídas esta semana' : 'Completed this week', value: completedWeek, highlight: true },
            { label: language === 'pt' ? 'Em atraso' : 'Overdue', value: overdueTasks.length },
            { label: language === 'pt' ? 'Alta prioridade' : 'High priority', value: highPriorityTasks },
            { label: language === 'pt' ? 'Taxa de conclusão' : 'Completion rate', value: `${completionRate}%`, highlight: true },
          ]
        },
        {
          type: 'table',
          title: language === 'pt' ? 'Tarefas em Atraso' : 'Overdue Tasks',
          columns: [
            { key: 'title', label: language === 'pt' ? 'Tarefa' : 'Task' },
            { key: 'priority', label: language === 'pt' ? 'Prioridade' : 'Priority' },
            { key: 'deadline', label: language === 'pt' ? 'Prazo' : 'Deadline' },
            { key: 'status', label: language === 'pt' ? 'Estado' : 'Status' },
          ],
          rows: overdueTasks.slice(0, 20).map(t => ({
            title: t.title,
            priority: t.priority,
            deadline: t.deadline ? t.deadline.split('T')[0] : '—',
            status: t.status,
          }))
        }
      ];
    } else {
      title = language === 'pt' ? 'Relatório Completo' : 'Full Business Report';
      sections = [
        {
          type: 'kpi-grid',
          title: language === 'pt' ? 'KPIs Principais' : 'Key Metrics',
          items: [
            { label: language === 'pt' ? 'Total Faturado' : 'Total Invoiced', value: `€${totalInvoiced.toFixed(2)}` },
            { label: language === 'pt' ? 'Clientes Ativos' : 'Active Clients', value: activeClients },
            { label: language === 'pt' ? 'Tarefas Concluídas' : 'Tasks Completed', value: completedMonth },
            { label: language === 'pt' ? 'Saúde do Negócio' : 'Business Health', value: `${healthScore}%` },
          ]
        },
        {
          type: 'stat-rows',
          title: language === 'pt' ? 'Estado Financeiro' : 'Financial Status',
          items: [
            { label: language === 'pt' ? 'Faturas pagas' : 'Paid invoices', value: invoicesPaid, highlight: true },
            { label: language === 'pt' ? 'Valor em aberto' : 'Outstanding amount', value: `€${outstandingAmount.toFixed(2)}` },
            { label: language === 'pt' ? 'Em atraso' : 'Overdue', value: overdueInvoices.length },
            { label: language === 'pt' ? 'Recibos registados' : 'Receipts logged', value: receipts.length },
          ]
        },
        {
          type: 'stat-rows',
          title: language === 'pt' ? 'Operações' : 'Operations',
          items: [
            { label: language === 'pt' ? 'Clientes novos (mês)' : 'New clients (month)', value: newClientsMonth, highlight: true },
            { label: language === 'pt' ? 'Serviços ativos' : 'Active services', value: activeServices },
            { label: language === 'pt' ? 'Tarefas em atraso' : 'Overdue tasks', value: overdueTasks.length },
            { label: language === 'pt' ? 'Documentos arquivados' : 'Documents archived', value: documents.length },
            { label: language === 'pt' ? 'Contas bancárias' : 'Bank accounts', value: activeBankAccounts },
          ]
        }
      ];
    }

    const html = buildReportHTML({
      companyProfile,
      reportTitle: title,
      reportPeriod: `${language === 'pt' ? 'Gerado em' : 'Generated on'} ${period}`,
      generatedBy,
      language,
      sections,
    });
    openPrintWindow(html);
  };

  const exportCSV = (data, name) => {
    if (!data.length) { toast.error('No data'); return; }
    const csv = [Object.keys(data[0]).join(','), ...data.map(r => Object.values(r).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${name}_${format(now, 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const handleEmailReport = async () => {
    if (!emailRecipient.includes('@')) { toast.error('Invalid email'); return; }
    setLoadingReport(true);
    setShowEmailDialog(false);
    await new Promise(r => setTimeout(r, 1200));
    toast.success(`Report sent to ${emailRecipient}`);
    setEmailRecipient('');
    setLoadingReport(false);
  };

  const exportToGoogleSheets = async (type) => {
    setLoadingReport(true);
    try {
      const { data } = await api.functions.invoke('exportToGoogleSheets', { reportType: type });
      if (data.success) { toast.success(`Exported: ${data.rowsExported} rows`); window.open(data.url, '_blank'); }
    } catch (e) { toast.error(e.message); }
    finally { setLoadingReport(false); }
  };

  return (
    <div className="flex h-screen bg-background">
      
      

      <div className="p-4 lg:pt-8 md:p-8 md:pt-8 flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto space-y-3.5">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {language === 'pt' ? 'Relatórios & Progresso' : 'Reports & Progress'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'pt' ? 'Cockpit operacional do teu negócio' : 'Your business operational cockpit'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5">
                    <Mail className="w-3.5 h-3.5" />{language === 'pt' ? 'Enviar' : 'Email'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{language === 'pt' ? 'Enviar Relatório' : 'Email Report'}</DialogTitle>
                    <DialogDescription>{language === 'pt' ? 'Envia um resumo para o email desejado' : 'Send a summary to the desired email'}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <input type="email" placeholder="email@exemplo.com" value={emailRecipient} onChange={e => setEmailRecipient(e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground" />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowEmailDialog(false)}>{language === 'pt' ? 'Cancelar' : 'Cancel'}</Button>
                      <Button size="sm" onClick={handleEmailReport} disabled={loadingReport}><Mail className="w-3.5 h-3.5 mr-1" />{language === 'pt' ? 'Enviar' : 'Send'}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 gap-1.5">
                    <FileDown className="w-3.5 h-3.5" />{language === 'pt' ? 'Exportar' : 'Export'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{language === 'pt' ? 'Exportar Dados' : 'Export Data'}</DialogTitle>
                    <DialogDescription>{language === 'pt' ? 'Escolha formato e tipo de dados' : 'Choose format and data type'}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 mt-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">{language === 'pt' ? 'Imprimir / PDF' : 'Print / PDF'}</p>
                    {[
                      { label: language === 'pt' ? 'Relatório Financeiro (PDF)' : 'Financial Report (PDF)',   icon: Printer, fn: () => printReport('financial') },
                      { label: language === 'pt' ? 'Relatório Operacional (PDF)' : 'Operations Report (PDF)', icon: Printer, fn: () => printReport('operations') },
                      { label: language === 'pt' ? 'Relatório Completo (PDF)' : 'Full Business Report (PDF)', icon: Printer, fn: () => printReport('full') },
                    ].map((item, i) => (
                      <button key={i} onClick={item.fn} disabled={loadingReport}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card hover:bg-muted border border-border text-sm text-foreground transition-colors text-left">
                        <item.icon className="w-4 h-4 text-violet-400 shrink-0" />{item.label}
                      </button>
                    ))}
                    <div className="h-px bg-muted my-1" />
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">{language === 'pt' ? 'Exportar Dados' : 'Export Data'}</p>
                    {[
                      { label: language === 'pt' ? 'Tarefas (CSV)' : 'Tasks (CSV)',                      icon: FileText, fn: () => exportCSV(tasks.map(t => ({ Title: t.title, Status: t.status, Priority: t.priority })), 'tasks') },
                      { label: language === 'pt' ? 'Faturas (CSV)' : 'Invoices (CSV)',                   icon: Receipt,  fn: () => exportCSV(invoices.map(i => ({ Invoice: i.invoice_number, Client: i.client_name, Amount: i.total, Status: i.status })), 'invoices') },
                      { label: language === 'pt' ? 'Clientes (CSV)' : 'Clients (CSV)',                   icon: Users,    fn: () => exportCSV(clients.map(c => ({ Name: c.name, Email: c.email || '', Status: c.status })), 'clients') },
                      { label: language === 'pt' ? 'Tarefas (Google Sheets)' : 'Tasks (Google Sheets)',  icon: FileText, fn: () => exportToGoogleSheets('tasks') },
                      { label: language === 'pt' ? 'Faturas (Google Sheets)' : 'Invoices (Google Sheets)', icon: Receipt, fn: () => exportToGoogleSheets('invoices') },
                    ].map((item, i) => (
                      <button key={i} onClick={item.fn} disabled={loadingReport}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card hover:bg-muted border border-border text-sm text-foreground transition-colors text-left">
                        <item.icon className="w-4 h-4 text-primary shrink-0" />{item.label}
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ── Executive Summary ──────────────────────────────────────── */}
          <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
            alerts.some(a => a.critical)
              ? 'bg-orange-500/8 border-orange-500/20'
              : 'bg-emerald-500/8 border-emerald-500/20'
          }`}>
            <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${alerts.some(a => a.critical) ? 'text-orange-400' : 'text-emerald-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground mb-0.5">
                {language === 'pt' ? 'Resumo Executivo' : 'Executive Summary'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{execSummary}</p>
            </div>
            <div className="text-[10px] text-muted-foreground shrink-0 hidden md:block">
              {format(now, 'dd MMM yyyy')}
            </div>
          </div>

          {/* ── TIER 1: Primary KPIs ──────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              {
                icon: Wallet, bg: 'bg-primary/15', color: 'text-primary',
                label: language === 'pt' ? 'Recebido este mês' : 'Received This Month',
                value: `€${receivedThisMonth.toLocaleString('pt-PT', { minimumFractionDigits: 0 })}`,
                sub: language === 'pt' ? 'vs mês anterior' : 'vs last month',
                trend: receivedTrend, nav: 'Invoices',
              },
              {
                icon: CreditCard, bg: 'bg-orange-500/15', color: 'text-orange-400',
                label: language === 'pt' ? 'Valor em Aberto' : 'Outstanding Amount',
                value: `€${outstandingAmount.toLocaleString('pt-PT', { minimumFractionDigits: 0 })}`,
                sub: overdueInvoices.length > 0 ? `${overdueInvoices.length} ${language === 'pt' ? 'em atraso' : 'overdue'}` : (language === 'pt' ? 'Em dia' : 'On track'),
                subColor: overdueInvoices.length > 0 ? 'text-red-400' : 'text-emerald-400',
                nav: 'Invoices', critical: overdueInvoices.length > 0,
              },
              {
                icon: Users, bg: 'bg-emerald-500/15', color: 'text-emerald-400',
                label: language === 'pt' ? 'Clientes Ativos' : 'Active Clients',
                value: activeClients,
                sub: `+${newClientsMonth} ${language === 'pt' ? 'este mês' : 'this month'}`,
                subColor: newClientsMonth > 0 ? 'text-emerald-400' : 'text-muted-foreground',
                nav: 'Clients',
              },
              {
                icon: AlertCircle, bg: 'bg-red-500/15', color: 'text-red-400',
                label: language === 'pt' ? 'Tarefas em Atraso' : 'Overdue Tasks',
                value: overdueTasks.length,
                sub: highPriorityTasks > 0 ? `${highPriorityTasks} ${language === 'pt' ? 'alta prioridade' : 'high priority'}` : (language === 'pt' ? 'Sem urgências' : 'No urgencies'),
                subColor: highPriorityTasks > 0 ? 'text-orange-400' : 'text-emerald-400',
                nav: 'Tasks', critical: overdueTasks.length > 0,
              },
            ].map((k, i) => (
              <button key={i} onClick={() => navigate(createPageUrl(k.nav))}
                className={`bg-card border rounded-lg px-3 py-3 flex flex-col gap-1.5 hover:border-border transition-all duration-200 text-left group relative overflow-hidden ${
                  k.critical ? 'border-red-500/30 hover:border-red-400/50' : 'border-border'
                }`}>
                {k.critical && (
                  <div className="absolute inset-0 bg-red-500/[0.03] pointer-events-none" />
                )}
                <div className="flex items-center justify-between relative">
                  <div className={`w-7 h-7 rounded-md ${k.bg} flex items-center justify-center`}>
                    <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {k.trend !== undefined && k.trend !== null && <TrendBadge pct={k.trend} />}
                    {k.critical && <PulseDot />}
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>
                <div className="relative">
                  <p className="text-xl font-bold text-foreground leading-tight tabular-nums">{k.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{k.label}</p>
                </div>
                {k.sub && <p className={`text-[10px] relative ${k.subColor || 'text-muted-foreground'}`}>{k.sub}</p>}
              </button>
            ))}
          </div>

          {/* ── Row: Attention + Activity ──────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-3">

            {/* Attention Needed */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {language === 'pt' ? 'Atenção Necessária' : 'Attention Needed'}
                </span>
                {alerts.length > 0 && (
                  <span className="ml-auto text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">{alerts.length}</span>
                )}
              </div>
              <div className="p-2 space-y-1.5">
                {alerts.length === 0 ? (
                  <div className="px-2 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-medium text-emerald-400">
                        {language === 'pt' ? 'Sem problemas urgentes detectados hoje.' : 'No urgent issues detected today.'}
                      </span>
                    </div>
                    {clearSuggestions.length > 0 && (
                      <div className="space-y-1 pl-6">
                        {clearSuggestions.map((s, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground leading-snug">→ {s}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : alerts.map((a, i) => (
                  <button key={i} onClick={a.action}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md border ${a.border} ${a.bg} hover:opacity-90 transition-opacity text-left`}>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {a.critical && <PulseDot />}
                      <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
                    </div>
                    <span className="text-xs text-foreground">{a.label}</span>
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {language === 'pt' ? 'Actividade Recente' : 'Recent Activity'}
                </span>
              </div>
              <div className="divide-y divide-[#334155]/60">
                {recentActivity.length === 0 ? (
                  <div className="py-6 text-center space-y-1">
                    <Activity className="w-5 h-5 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">{language === 'pt' ? 'Sem actividade recente' : 'No recent activity'}</p>
                  </div>
                ) : recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-6 h-6 rounded-md ${a.bg} flex items-center justify-center shrink-0`}>
                      <a.icon className={`w-3 h-3 ${a.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{a.label}</p>
                      <p className="text-[10px] text-muted-foreground">{a.sub}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {a.date ? format(new Date(a.date), 'dd/MM') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row: Weekly Chart + Business Health ───────────────────── */}
          <div className="grid md:grid-cols-3 gap-3">

            {/* Weekly Activity Chart */}
            <div className="md:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    {language === 'pt' ? 'Actividade Semanal' : 'Weekly Activity'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {weekOverWeek !== 0 && (
                    <TrendBadge pct={weekOverWeek} />
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary inline-block" />{language === 'pt' ? 'Tarefas' : 'Tasks'}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-500 inline-block" />{language === 'pt' ? 'Faturas' : 'Invoices'}</span>
                  </div>
                </div>
              </div>

              {/* Weekly summary pills */}
              <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
                {totalWeekTasks > 0 && (
                  <span className="text-[10px] bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded-full">
                    {totalWeekTasks} {language === 'pt' ? 'tarefas concluídas' : 'tasks completed'}
                  </span>
                )}
                {totalWeekInvoices > 0 && (
                  <span className="text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/25 px-2 py-0.5 rounded-full">
                    {totalWeekInvoices} {language === 'pt' ? 'faturas emitidas' : 'invoices issued'}
                  </span>
                )}
                {totalWeekTasks === 0 && totalWeekInvoices === 0 && (
                  <span className="text-[10px] text-muted-foreground">{language === 'pt' ? 'Sem actividade esta semana' : 'No activity this week'}</span>
                )}
              </div>

              {/* Chart */}
              <div className="px-4 pb-3 pt-1">
                <div className="flex items-end gap-1.5" style={{ height: '96px' }}>
                  {progressData.map((d, i) => {
                    const taskH  = mounted ? Math.max((d.completed / maxBar) * 80, d.completed > 0 ? 6 : 2) : 2;
                    const invH   = mounted ? Math.max((d.invoices  / maxBar) * 80, d.invoices  > 0 ? 6 : 2) : 2;
                    const total  = d.completed + d.invoices;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        {/* Value above bars */}
                        <div className="text-[9px] text-muted-foreground tabular-nums h-3 flex items-center">
                          {total > 0 ? total : ''}
                        </div>
                        {/* Bars */}
                        <div className="w-full flex items-end gap-0.5" style={{ height: '76px' }}>
                          <div
                            className={`flex-1 rounded-t transition-all duration-700 ease-out ${d.isToday ? 'bg-primary' : 'bg-primary/70'}`}
                            style={{ height: `${taskH}px` }}
                          />
                          <div
                            className={`flex-1 rounded-t transition-all duration-700 ease-out ${d.isToday ? 'bg-violet-400' : 'bg-violet-500/60'}`}
                            style={{ height: `${invH}px`, transitionDelay: `${i * 40}ms` }}
                          />
                        </div>
                        {/* Day label */}
                        <span className={`text-[9px] ${d.isToday ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Business Health */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {language === 'pt' ? 'Saúde do Negócio' : 'Business Health'}
                </span>
              </div>
              <div className="p-3 space-y-3">
                {/* Score row */}
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold tabular-nums ${healthColor}`}>{healthScore}%</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    healthScore >= 70 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : healthScore >= 40 ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                    : 'bg-red-500/15 border-red-500/30 text-red-400'}`}>
                    {healthScore >= 70
                      ? (language === 'pt' ? 'Saudável' : 'Healthy')
                      : healthScore >= 40 ? (language === 'pt' ? 'Estável' : 'Stable')
                      : (language === 'pt' ? 'Atenção' : 'Attention')}
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-1.5">
                  <div className={`h-full rounded-full transition-all duration-1000 ${healthBarColor}`}
                    style={{ width: mounted ? `${healthScore}%` : '0%' }} />
                </div>

                {/* Factor bars */}
                <div className="space-y-1.5">
                  {healthFactors.map((f, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-muted-foreground truncate">{f.label}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums ml-1">{f.score}%</span>
                      </div>
                      <div className="w-full bg-background rounded-full h-1">
                        <div className={`h-full rounded-full transition-all duration-700 ${f.score >= 70 ? 'bg-emerald-500' : f.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: mounted ? `${f.score}%` : '0%', transitionDelay: `${i * 120}ms` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI insights */}
                <div className="space-y-1 pt-1 border-t border-border/60">
                  {healthInsights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      {ins.critical
                        ? <PulseDot color="bg-orange-400" />
                        : <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1 shrink-0" />
                      }
                      <p className={`text-[10px] leading-snug ${ins.critical ? 'text-orange-300' : 'text-muted-foreground'}`}>
                        {ins.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── TIER 2: Secondary KPIs ─────────────────────────────────── */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { icon: Briefcase,   bg: 'bg-blue-500/15',   color: 'text-blue-400',   label: language === 'pt' ? 'Serviços Ativos' : 'Active Services',      value: activeServices,    sub: language === 'pt' ? 'em curso' : 'ongoing',  nav: 'Services'  },
              { icon: FileCheck,   bg: 'bg-teal-500/15',   color: 'text-teal-400',   label: language === 'pt' ? 'Completos' : 'Completed',                  value: completedServices, sub: language === 'pt' ? 'serviços' : 'services',  nav: 'Services'  },
              { icon: Calendar,    bg: 'bg-indigo-500/15', color: 'text-indigo-400', label: language === 'pt' ? 'Próximos Eventos' : 'Upcoming Events',      value: upcomingEvents,    sub: language === 'pt' ? 'agendados' : 'scheduled', nav: 'Agenda'    },
              { icon: FileText,    bg: 'bg-slate-500/15',  color: 'text-muted-foreground',  label: language === 'pt' ? 'Documentos' : 'Documents',                 value: documents.length,  sub: language === 'pt' ? 'arquivados' : 'archived',  nav: 'Documents' },
              { icon: Building2,   bg: 'bg-primary/15',   color: 'text-primary',   label: language === 'pt' ? 'Contas Bancárias' : 'Bank Accounts',        value: activeBankAccounts,sub: language === 'pt' ? 'ativas' : 'active',       nav: 'Banks'     },
              { icon: Receipt,     bg: 'bg-green-500/15',  color: 'text-green-400',  label: language === 'pt' ? 'Recibos' : 'Receipts',                     value: receipts.length,   sub: language === 'pt' ? 'registados' : 'logged',    nav: 'Receipts'  },
            ].map((k, i) => (
              <button key={i} onClick={() => navigate(createPageUrl(k.nav))}
                className="bg-card border border-border rounded-lg px-2.5 py-2.5 flex flex-col items-center gap-1 hover:border-border hover:bg-[#243047] transition-all duration-200 group text-center">
                <div className={`w-6 h-6 rounded-md ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`w-3 h-3 ${k.color}`} />
                </div>
                <p className="text-base font-bold text-foreground tabular-nums leading-tight">{k.value}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-tight">{k.label}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{k.sub}</p>
              </button>
            ))}
          </div>

          {/* ── TIER 3: Insight Rows ───────────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-3">

            {/* Invoice Status */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <Receipt className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {language === 'pt' ? 'Estado Faturas' : 'Invoice Status'}
                </span>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { label: language === 'pt' ? 'Pagas' : 'Paid',       value: invoicesPaid,         color: 'bg-emerald-500' },
                  { label: language === 'pt' ? 'Pendentes' : 'Pending', value: invoicesUnpaid,        color: 'bg-orange-500' },
                  { label: language === 'pt' ? 'Em atraso' : 'Overdue', value: overdueInvoices.length, color: 'bg-red-500' },
                ].map((row, i) => {
                  const total = invoicesPaid + invoicesUnpaid;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground">{row.label}</span>
                        <span className="text-[11px] font-semibold text-foreground tabular-nums">{row.value}</span>
                      </div>
                      <div className="w-full bg-background rounded-full h-1.5">
                        <div className={`h-full rounded-full transition-all duration-700 ${row.color}`}
                          style={{ width: mounted ? `${total > 0 ? (row.value / total) * 100 : 0}%` : '0%', transitionDelay: `${i * 150}ms` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Priority */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {language === 'pt' ? 'Tarefas por Prioridade' : 'Tasks by Priority'}
                </span>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { label: language === 'pt' ? 'Urgente' : 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, color: 'bg-red-500' },
                  { label: language === 'pt' ? 'Alta' : 'High',      value: tasks.filter(t => t.priority === 'high').length,   color: 'bg-orange-500' },
                  { label: language === 'pt' ? 'Média' : 'Medium',   value: tasks.filter(t => t.priority === 'medium').length, color: 'bg-yellow-500' },
                  { label: language === 'pt' ? 'Baixa' : 'Low',      value: tasks.filter(t => t.priority === 'low').length,    color: 'bg-slate-500' },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground">{row.label}</span>
                      <span className="text-[11px] font-semibold text-foreground tabular-nums">{row.value}</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-1.5">
                      <div className={`h-full rounded-full transition-all duration-700 ${row.color}`}
                        style={{ width: mounted ? `${tasks.length > 0 ? (row.value / tasks.length) * 100 : 0}%` : '0%', transitionDelay: `${i * 120}ms` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash & Banks */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {language === 'pt' ? 'Caixa & Banca' : 'Cash & Banks'}
                </span>
              </div>
              <div className="divide-y divide-[#334155]/60">
                {[
                  { label: language === 'pt' ? 'Contas ativas' : 'Active accounts',           value: activeBankAccounts,       alert: false },
                  { label: language === 'pt' ? 'Extractos OK' : 'Statements OK',              value: statementsReceived,       alert: false },
                  { label: language === 'pt' ? 'Extractos em falta' : 'Missing statements',   value: statementsMissing,        alert: statementsMissing > 0 },
                  { label: language === 'pt' ? 'Sessões caixa (mês)' : 'Cash sessions (month)', value: cashOpenDaysThisMonth,  alert: false },
                  { label: language === 'pt' ? 'Diferenças caixa' : 'Cash differences',       value: cashDifferencesDetected,  alert: cashDifferencesDetected > 0 },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">{row.label}</span>
                    <div className="flex items-center gap-1.5">
                      {row.alert && row.value > 0 && <PulseDot color="bg-orange-400" />}
                      <span className={`text-[11px] font-semibold tabular-nums ${row.alert && row.value > 0 ? 'text-orange-400' : 'text-foreground'}`}>{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}