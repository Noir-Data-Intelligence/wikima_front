import React, { useState, useMemo } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import {
  Plus, Bell, Target, Calendar, CheckCircle2, AlertCircle,
  Pencil, Trash2, Receipt, Leaf
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import ActionMenu from '../components/ActionMenu';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { showUndoToast } from '@/utils/showUndoToast';
import MobileMenuButton from '../components/dashboard/MobileMenuButton';
import SimpleRecordDialog from '../components/wallet/SimpleRecordDialog';
import PaymentReminderDialog from '../components/wallet/PaymentReminderDialog';
import SavingsGoalDialog from '../components/wallet/SavingsGoalDialog';
import FinancialCalendar from '../components/wallet/FinancialCalendar';
import MonthlyIntentionDialog from '../components/wallet/MonthlyIntentionDialog';
import MonthlyReflectionDialog from '../components/wallet/MonthlyReflectionDialog';
import MoveToMonthDialog from '../components/wallet/MoveToMonthDialog';
import SnapshotCard from '../components/wallet/SnapshotCard';
import InsightsPanel from '../components/wallet/InsightsPanel';
import QuickWidgets from '../components/wallet/QuickWidgets';
import KakeboCategoryBreakdown from '../components/wallet/KakeboCategoryBreakdown';
import SavingsInvestmentPanel from '../components/wallet/SavingsInvestmentPanel';
import YearlyJourney from '../components/wallet/YearlyJourney';
import AnnualReport from '../components/wallet/AnnualReport';
import { KAKEBO_CATEGORIES } from '../components/wallet/KakeboCategories';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';

const CAT_ICONS = {
  Housing:'🏠', 'Home Services':'💡', Food:'🛒', Transport:'🚗',
  'Children & Education':'🧒', Health:'❤️', 'Leisure & Personal':'🎉',
  'Business & Work':'💼', 'Banks & Other':'🏦', Savings:'🪴', Investments:'📈',
  rent:'🏠', utilities:'💡', subscriptions:'📱', internet:'🌐',
  school:'🎓', insurance:'🛡️', loan:'💰', taxes:'📋', other:'📌'
};

// Tiny ring for goals tab
function Ring({ pct = 0, size = 44, stroke = 4, color = '#8b5cf6' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, pct)) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(120,120,120,0.18)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}



export default function Financials() {
  const { language } = useLanguage();
  const now = new Date();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showIntentionDialog, setShowIntentionDialog] = useState(false);
  const [showReflectionDialog, setShowReflectionDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, item: null });
  const [selectedMonth, setSelectedMonth] = useState(now); // For navigating month by month
  const [yearlyView, setYearlyView] = useState('journey'); // 'journey' | 'report'
  const [moveToMonthData, setMoveToMonthData] = useState({ open: false, transaction: null });

  const getWorkspaceId = async () => {
    const u = await api.auth.me();
    return u.current_workspace_id || u.default_workspace_id;
  };

  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const wsId = await getWorkspaceId();
      if (!wsId) return [];
      return api.entities.Expense.filter({ workspace_id: wsId }, '-date');
    }
  });

  const { data: recurringPayments = [], refetch: refetchPayments } = useQuery({
    queryKey: ['recurring-payments'],
    queryFn: async () => {
      const wsId = await getWorkspaceId();
      if (!wsId) return [];
      return api.entities.RecurringPayment.filter({ workspace_id: wsId }, 'next_due_date');
    }
  });

  const { data: savingsGoals = [], refetch: refetchGoals } = useQuery({
    queryKey: ['savings-goals'],
    queryFn: async () => {
      const wsId = await getWorkspaceId();
      if (!wsId) return [];
      return api.entities.SavingsGoal.filter({ workspace_id: wsId });
    }
  });

  const { data: financialGoals = [], refetch: refetchFinGoals } = useQuery({
    queryKey: ['financial-goals'],
    queryFn: async () => {
      const wsId = await getWorkspaceId();
      if (!wsId) return [];
      return api.entities.FinancialGoal.filter({ workspace_id: wsId }, '-month');
    }
  });

  const { data: monthlyReviews = [] } = useQuery({
    queryKey: ['monthly-reviews'],
    queryFn: async () => {
      const wsId = await getWorkspaceId();
      if (!wsId) return [];
      return api.entities.MonthlyReview.filter({ workspace_id: wsId }, '-month');
    }
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const handleRecord = async (recordData) => {
    const wsId = await getWorkspaceId();
    await api.entities.Expense.create({ ...recordData, workspace_id: wsId });
    refetchExpenses();
    toast.success(language === 'pt' ? '✅ Registado!' : '✅ Recorded!');
  };

  const handleEditExpense = async (recordData) => {
    const wsId = await getWorkspaceId();
    await api.entities.Expense.update(editingExpense.id, { ...recordData, workspace_id: wsId });
    setEditingExpense(null);
    refetchExpenses();
    toast.success(language === 'pt' ? '✅ Atualizado!' : '✅ Updated!');
  };

  const handleMoveToMonth = async (newDate) => {
    if (!moveToMonthData.transaction) return;
    const wsId = await getWorkspaceId();
    await api.entities.Expense.update(moveToMonthData.transaction.id, { 
      date: newDate, 
      workspace_id: wsId 
    });
    setMoveToMonthData({ open: false, transaction: null });
    refetchExpenses();
    toast.success(language === 'pt' ? '✅ Transação movida!' : '✅ Transaction moved!');
  };

  const handleDeleteExpense = async (id) => {
    const expense = expenses.find(e => e.id === id);
    await api.entities.Expense.delete(id);
    refetchExpenses();
    showUndoToast({
      message: language === 'pt' ? 'Registo eliminado' : 'Record deleted',
      onUndo: async () => {
        const wsId = await getWorkspaceId();
        await api.entities.Expense.create({ ...expense, workspace_id: wsId });
        refetchExpenses();
        toast.success(language === 'pt' ? '✅ Reposto!' : '✅ Restored!');
      }
    });
  };

  const handleSaveReminder = async (data) => {
    const wsId = await getWorkspaceId();
    if (editingReminder?.id) {
      await api.entities.RecurringPayment.update(editingReminder.id, { ...data, workspace_id: wsId });
    } else {
      await api.entities.RecurringPayment.create({ ...data, workspace_id: wsId, status: 'active' });
    }
    setEditingReminder(null);
    refetchPayments();
    toast.success(language === 'pt' ? '🔔 Guardado!' : '🔔 Saved!');
  };

  const handleDeleteReminder = async (id) => {
    const reminder = recurringPayments.find(p => p.id === id);
    await api.entities.RecurringPayment.delete(id);
    refetchPayments();
    showUndoToast({
      message: language === 'pt' ? 'Pagamento eliminado' : 'Payment deleted',
      onUndo: async () => {
        const wsId = await getWorkspaceId();
        await api.entities.RecurringPayment.create({ ...reminder, workspace_id: wsId });
        refetchPayments();
        toast.success(language === 'pt' ? '✅ Reposto!' : '✅ Restored!');
      }
    });
  };

  const handleSaveGoal = async (data) => {
    const wsId = await getWorkspaceId();
    if (editingGoal?.id) {
      await api.entities.SavingsGoal.update(editingGoal.id, { ...data, workspace_id: wsId });
    } else {
      await api.entities.SavingsGoal.create({ ...data, workspace_id: wsId, status: 'active' });
    }
    setEditingGoal(null);
    refetchGoals();
    toast.success(language === 'pt' ? '🎯 Meta guardada!' : '🎯 Goal saved!');
  };

  const handleDeleteGoal = async (id) => {
    const goal = savingsGoals.find(g => g.id === id);
    await api.entities.SavingsGoal.delete(id);
    refetchGoals();
    showUndoToast({
      message: language === 'pt' ? 'Meta eliminada' : 'Goal deleted',
      onUndo: async () => {
        const wsId = await getWorkspaceId();
        await api.entities.SavingsGoal.create({ ...goal, workspace_id: wsId });
        refetchGoals();
        toast.success(language === 'pt' ? '✅ Reposta!' : '✅ Restored!');
      }
    });
  };

  const handleMarkGoalProgress = async (goal, amount) => {
    const newAmount = Math.min((goal.current_amount || 0) + amount, goal.target_amount);
    const newStatus = newAmount >= goal.target_amount ? 'achieved' : 'active';
    await api.entities.SavingsGoal.update(goal.id, { current_amount: newAmount, status: newStatus });
    if (newStatus === 'achieved') toast.success(language === 'pt' ? '🎉 Meta atingida!' : '🎉 Goal achieved!');
    refetchGoals();
  };

  const handleSaveIntention = async (data) => {
    const wsId = await getWorkspaceId();
    await api.entities.FinancialGoal.create({
      workspace_id: wsId, title: 'Monthly Intention',
      target_amount: parseFloat(data.amount_to_keep), month: selectedMonthStr, status: 'active', ...data
    });
    refetchFinGoals();
    toast.success(language === 'pt' ? '✨ Intenção guardada' : '✨ Intention saved');
  };

  const handleSaveReflection = async (data) => {
    const wsId = await getWorkspaceId();
    await api.entities.MonthlyReview.create({
      workspace_id: wsId, month: selectedMonthStr,
      total_income: walletIncome, total_expenses: totalExpenses,
      balance: walletBalance, ai_reflection: JSON.stringify(data)
    });
    toast.success(language === 'pt' ? '🌙 Reflexão guardada' : '🌙 Reflection saved');
  };

  // ── Calculations ───────────────────────────────────────────────────────
  const todayStr = now.toISOString().split('T')[0];
  const thisMonthStr = now.toISOString().slice(0, 7);
  const selectedMonthStr = selectedMonth.toISOString().slice(0, 7);
  const isCurrentMonth = selectedMonthStr === thisMonthStr;
  const isFutureMonth = selectedMonth > new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), now.getDate());
  
  const thisMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const lastMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
  const lastMonthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 0);
  const locale = language === 'pt' ? ptBR : enUS;
  const monthName = format(selectedMonth, 'MMMM', { locale });
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const dayOfMonth = Math.min(now.getDate(), daysInMonth); // Cap at actual days in selected month
  
  const thisMonthTransactions = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= thisMonthStart && d < new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
  });
  const lastMonthTransactions = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  const totalExpenses = thisMonthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const walletIncome = thisMonthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const walletBalance = walletIncome - totalExpenses;
  const balanceOk = walletBalance >= 0;
  const recordCount = thisMonthTransactions.length;

  const lastMonthExpenses = lastMonthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

  const currentMonthGoals = financialGoals.filter(g => g.month === selectedMonthStr);
  const hasIntention = currentMonthGoals.length > 0;
  const intentionGoal = currentMonthGoals[0];
  const savingsTarget = intentionGoal ? parseFloat(intentionGoal.amount_to_keep || intentionGoal.target_amount || 0) : 0;
  const savingsPct = savingsTarget > 0 ? Math.min(100, Math.round((walletBalance / savingsTarget) * 100)) : 0;

  const hasReflection = monthlyReviews.some(r => r.month === selectedMonthStr);
  const canReflect = isCurrentMonth && dayOfMonth >= 25;

  const activePayments = recurringPayments.filter(p => p.status === 'active');
  const todayPayments = activePayments.filter(p => p.next_due_date === todayStr);
  const soon7 = new Date(now.getTime() + 7 * 86400000);
  const upcomingPayments = activePayments.filter(p => {
    if (!p.next_due_date) return false;
    const d = new Date(p.next_due_date);
    return d >= now && d <= soon7 && p.next_due_date !== todayStr;
  });
  const overduePayments = activePayments.filter(p => p.next_due_date && p.next_due_date < todayStr);
  const allGood = todayPayments.length === 0 && overduePayments.length === 0;

  const getDaysUntil = (dateStr) => !dateStr ? null : differenceInDays(new Date(dateStr), new Date(todayStr));
  const getUrgencyColor = (dateStr) => {
    const d = getDaysUntil(dateStr);
    if (d === null) return 'text-muted-foreground';
    if (d < 0) return 'text-red-400';
    if (d === 0) return 'text-sky-300';
    if (d <= 3) return 'text-sky-400/80';
    return 'text-muted-foreground';
  };
  const getUrgencyLabel = (dateStr) => {
    const d = getDaysUntil(dateStr);
    if (d === null) return '';
    if (d < 0) return language === 'pt' ? `${Math.abs(d)}d em atraso` : `${Math.abs(d)}d overdue`;
    if (d === 0) return language === 'pt' ? 'Hoje' : 'Today';
    if (d === 1) return language === 'pt' ? 'Amanhã' : 'Tomorrow';
    return language === 'pt' ? `Em ${d} dias` : `In ${d} days`;
  };

  // Main insight for snapshot
  const mainInsight = useMemo(() => {
    if (isFutureMonth) return language === 'pt'
      ? 'O teu mês está por começar. Planeia com intenção. 🌱'
      : 'Your month hasn\'t started yet. Plan with intention. 🌱';
    if (recordCount === 0) return language === 'pt'
      ? 'Regista o teu primeiro movimento para começar a tua jornada.'
      : 'Record your first transaction to begin your journey.';
    if (!hasIntention) return language === 'pt'
      ? 'Define uma intenção para este mês — é o primeiro passo para clareza financeira.'
      : 'Set a monthly intention — the first step towards financial clarity.';
    if (balanceOk && savingsPct >= 80) return language === 'pt'
      ? 'Muito perto da tua meta de poupança. 🌿'
      : 'Very close to your savings goal. 🌿';
    return null;
  }, [recordCount, hasIntention, balanceOk, savingsPct, language, isFutureMonth]);

  const tabs = [
    { key: 'overview',  label: language === 'pt' ? 'Visão Geral' : 'Overview' },
    { key: 'payments',  label: language === 'pt' ? 'Pagamentos' : 'Payments', alert: todayPayments.length + overduePayments.length },
    { key: 'goals',     label: language === 'pt' ? 'Metas' : 'Goals' },
    { key: 'history',   label: language === 'pt' ? 'Histórico' : 'History' },
    { key: 'yearly',    label: language === 'pt' ? 'Anual' : 'Yearly' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      {/* Ambient glow overlay (subtle, theme-neutral) */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 20% 10%, rgba(108, 158, 255, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(233, 124, 63, 0.03) 0%, transparent 50%)'
      }} />
      
      
      

      <main className="p-4 lg:pt-8 md:p-8 md:pt-8 relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-5">

          {/* ── Header with month navigation ───────────────── */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <h1 className="text-lg font-bold text-foreground tracking-tight">
                    {language === 'pt' ? 'Finanças Pessoais' : 'Personal Finance'}
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                  {language === 'pt' ? `Jornada · ${monthName}` : `Journey · ${monthName}`}
                </p>
              </div>

              {/* Button hierarchy: primary → secondary → ghost */}
              <div className="flex items-center gap-2">
                {!hasIntention && isCurrentMonth && (
                  <button onClick={() => setShowIntentionDialog(true)}
                    className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-border px-3 py-1.5 rounded-xl transition-all bg-muted/50 hover:bg-accent">
                    🎯 {language === 'pt' ? 'Intenção' : 'Intention'}
                  </button>
                )}
                {canReflect && !hasReflection && isCurrentMonth && (
                  <button onClick={() => setShowReflectionDialog(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5">
                    🌙
                  </button>
                )}
                <Button onClick={() => setShowRecordDialog(true)}
                  className="h-8 text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 gap-1.5 rounded-xl px-3 text-foreground font-medium shadow-lg shadow-emerald-500/20">
                  <Plus className="w-3.5 h-3.5" />
                  {language === 'pt' ? 'Registar' : 'Record'}
                </Button>
              </div>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}
                className="w-9 h-9 rounded-xl bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex items-center justify-center"
              >
                ‹
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">{monthName}</span>
                <span className="text-xs text-muted-foreground">{selectedMonth.getFullYear()}</span>
                {!isCurrentMonth && (
                  <button
                    onClick={() => setSelectedMonth(now)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all bg-emerald-500/10 hover:bg-emerald-500/15"
                  >
                    {language === 'pt' ? 'Voltar ao mês atual' : 'Back to current'}
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}
                className="w-9 h-9 rounded-xl bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex items-center justify-center"
              >
                ›
              </button>
            </div>
          </div>

          {/* ── Snapshot card ───────────────────────────────── */}
          <SnapshotCard
            income={walletIncome}
            expenses={totalExpenses}
            balance={walletBalance}
            balanceOk={balanceOk}
            savingsTarget={savingsTarget}
            savingsPct={savingsPct}
            dayOfMonth={dayOfMonth}
            daysInMonth={daysInMonth}
            lastMonthExpenses={lastMonthExpenses}
            insight={mainInsight}
            language={language}
            isFutureMonth={isFutureMonth}
          />

          {/* ── Monthly ritual — calm, generous spacing ──────── */}
          <div className="rounded-3xl bg-background border border-border p-6 shadow-xl shadow-black/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-5 font-semibold">
              {language === 'pt' ? 'Ritual mensal' : 'Monthly ritual'}
            </p>
            {isFutureMonth ? (
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">🌱</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {language === 'pt'
                    ? 'Este mês está por começar. Planeia as tuas intenções financeiras.'
                    : 'This month hasn\'t started yet. Plan your financial intentions.'}
                </p>
                <button 
                  onClick={() => setShowIntentionDialog(true)}
                  className="text-xs text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl hover:bg-emerald-500/10 transition-colors font-medium"
                >
                  {language === 'pt' ? 'Definir intenção →' : 'Set intention →'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
              {[
                {
                  done: recordCount >= 3,
                  active: recordCount === 0,
                  emoji: '✏️',
                  label: language === 'pt' ? 'Registar' : 'Record',
                  sublabel: recordCount > 0
                    ? `${recordCount} ${language === 'pt' ? 'registos' : 'entries'}`
                    : (language === 'pt' ? 'Começar aqui' : 'Start here'),
                  onClick: () => setShowRecordDialog(true),
                },
                {
                  done: hasIntention,
                  active: !hasIntention && recordCount >= 1,
                  emoji: '🎯',
                  label: language === 'pt' ? 'Intenção' : 'Intention',
                  sublabel: hasIntention
                    ? (language === 'pt' ? 'Definida' : 'Set')
                    : (language === 'pt' ? 'Definir meta' : 'Set goal'),
                  onClick: () => !hasIntention && setShowIntentionDialog(true),
                },
                {
                  done: hasReflection,
                  active: canReflect && !hasReflection,
                  emoji: '🌙',
                  label: language === 'pt' ? 'Reflexão' : 'Reflect',
                  sublabel: hasReflection
                    ? (language === 'pt' ? 'Concluída' : 'Done')
                    : canReflect
                      ? (language === 'pt' ? 'Disponível' : 'Available')
                      : (language === 'pt' ? 'Dia 25+' : 'Day 25+'),
                  onClick: () => canReflect && setShowReflectionDialog(true),
                },
              ].map((step) => (
                <button key={step.label} onClick={step.onClick}
                  className={`flex flex-col items-center gap-3 py-4 px-2 rounded-2xl text-center transition-all duration-200 ${
                    step.done
                      ? 'bg-emerald-500/10 border border-emerald-500/25'
                      : step.active
                        ? 'bg-muted/60 border border-border hover:bg-accent'
                        : 'bg-transparent border border-border hover:bg-accent'
                  }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    step.done ? 'bg-emerald-500/20 text-emerald-300' :
                    step.active ? 'bg-accent text-foreground' : 'bg-muted/60 text-muted-foreground'
                  }`}>
                    {step.done ? '✓' : step.emoji}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${step.done ? 'text-emerald-300' : step.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    <p className={`text-[9px] mt-0.5 ${step.done ? 'text-emerald-400/70' : 'text-muted-foreground/70'}`}>
                      {step.sublabel}
                    </p>
                  </div>
                </button>
              ))}
              </div>
            )}
          </div>

          {/* ── Tabs ────────────────────────────────────────── */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl border border-border">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-accent text-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}>
                {tab.label}
                {tab.alert > 0 && (
                  <span className="w-4 h-4 bg-red-500 rounded-full text-[8px] text-foreground flex items-center justify-center font-bold">{tab.alert}</span>
                )}
              </button>
            ))}
          </div>

          {/* ══ OVERVIEW TAB ════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-4">

              {/* AI Reflections */}
              <InsightsPanel
                transactions={thisMonthTransactions}
                lastMonthTransactions={lastMonthTransactions}
                savingsPct={savingsPct}
                hasIntention={hasIntention}
                balanceOk={balanceOk}
                language={language}
              />

              {/* Savings & Investment panel */}
              <SavingsInvestmentPanel
                income={walletIncome}
                transactions={thisMonthTransactions}
                language={language}
              />

              {/* Quick widgets */}
              <QuickWidgets
                transactions={thisMonthTransactions}
                savingsGoals={savingsGoals}
                upcomingPayments={upcomingPayments}
                language={language}
              />

              {/* Kakebo category breakdown */}
              <KakeboCategoryBreakdown
                transactions={thisMonthTransactions}
                language={language}
              />

              {/* Empty state with encouragement */}
              {recordCount === 0 && (
                <div className="rounded-3xl border border-dashed border-border bg-background p-10 text-center space-y-4">
                  <p className="text-4xl">🌱</p>
                  <div>
                    <p className="text-foreground text-sm font-medium mb-1">
                      {language === 'pt'
                        ? 'O teu jardim financeiro está à espera de começar.'
                        : 'Your financial garden is waiting to grow.'}
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {language === 'pt'
                        ? 'Regista o teu primeiro gasto e começa a ganhar clareza.'
                        : 'Record your first expense and start gaining clarity.'}
                    </p>
                  </div>
                  <button onClick={() => setShowRecordDialog(true)}
                    className="text-xs text-emerald-400 border border-emerald-500/30 px-5 py-2.5 rounded-2xl hover:bg-emerald-500/10 transition-colors font-medium">
                    {language === 'pt' ? 'Registar agora →' : 'Record now →'}
                  </button>
                </div>
              )}

              {/* Savings goals teaser */}
              {savingsGoals.filter(g => g.status === 'active').length > 0 && (
                <div className="rounded-3xl bg-background border border-border overflow-hidden shadow-xl shadow-black/20">
                  <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
                        {language === 'pt' ? 'Metas ativas' : 'Active goals'}
                      </span>
                    </div>
                    <button onClick={() => setActiveTab('goals')} className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors font-medium">
                      {language === 'pt' ? 'Ver todas →' : 'See all →'}
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    {savingsGoals.filter(g => g.status === 'active').slice(0, 2).map(goal => {
                      const pct = goal.target_amount > 0 ? Math.min(100, Math.round(((goal.current_amount || 0) / goal.target_amount) * 100)) : 0;
                      return (
                        <div key={goal.id} className="flex items-center gap-3.5">
                          <span className="text-xl">{goal.emoji || '🎯'}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-foreground font-medium">{goal.name}</span>
                              <span className="text-violet-400 font-semibold">{pct}%</span>
                            </div>
                            <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PAYMENTS TAB ════════════════════════════════ */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'pt' ? 'Pagamentos Recorrentes' : 'Recurring Payments'}
                </p>
                <button onClick={() => { setEditingReminder(null); setShowReminderDialog(true); }}
                  className="text-xs text-sky-400/70 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/35 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" />{language === 'pt' ? 'Adicionar' : 'Add'}
                </button>
              </div>

              {/* Overdue */}
              {overduePayments.length > 0 && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/6 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-red-500/12 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400/80" />
                    <span className="text-xs text-red-300/70 uppercase tracking-wider">{language === 'pt' ? 'Em atraso' : 'Overdue'}</span>
                  </div>
                  {overduePayments.map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < overduePayments.length - 1 ? 'border-b border-red-500/8' : ''}`}>
                      <span className="text-lg">{CAT_ICONS[p.category] || '📌'}</span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">{p.name}</p>
                        <p className="text-xs text-red-400/70">{getUrgencyLabel(p.next_due_date)}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground/80">€{(p.amount || 0).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Due today */}
              {todayPayments.length > 0 && (
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/6 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-sky-500/12 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-sky-400/80" />
                    <span className="text-xs text-sky-300/70 uppercase tracking-wider">{language === 'pt' ? 'Para hoje' : 'Due today'}</span>
                  </div>
                  {todayPayments.map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < todayPayments.length - 1 ? 'border-b border-sky-500/8' : ''}`}>
                      <span className="text-lg">{CAT_ICONS[p.category] || '📌'}</span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">{p.name}</p>
                        <p className="text-xs text-sky-300/70">{language === 'pt' ? 'Vence hoje' : 'Due today'}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground/80">€{(p.amount || 0).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* All good */}
              {allGood && (
                <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/6 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400/70" />
                    <div>
                      <p className="text-sm text-emerald-300/80 font-medium">
                        {language === 'pt' ? 'Tudo organizado hoje.' : 'Everything is organized today.'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'pt' ? 'Sem pagamentos em atraso ou para hoje.' : 'No overdue or due-today payments.'}
                      </p>
                    </div>
                  </div>
                  {/* Upcoming */}
                  {upcomingPayments.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                        {language === 'pt' ? 'Próximos 7 dias' : 'Next 7 days'}
                      </p>
                      <div className="space-y-1.5">
                        {upcomingPayments.map(p => (
                          <div key={p.id} className="flex items-center gap-2.5 text-xs">
                            <span>{CAT_ICONS[p.category] || '📌'}</span>
                            <span className="text-muted-foreground flex-1">{p.name}</span>
                            <span className="text-sky-400/60">{getUrgencyLabel(p.next_due_date)}</span>
                            <span className="text-muted-foreground tabular-nums">€{(p.amount || 0).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick widgets when all good */}
              {allGood && (
                <QuickWidgets
                  transactions={thisMonthTransactions}
                  savingsGoals={savingsGoals}
                  upcomingPayments={[]}
                  language={language}
                />
              )}

              {/* Calendar */}
              {activePayments.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {language === 'pt' ? 'Calendário' : 'Calendar'}
                    </span>
                  </div>
                  <FinancialCalendar payments={activePayments} language={language} />
                </div>
              )}

              {/* Payment list */}
              {activePayments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
                  <Bell className="w-7 h-7 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground text-sm">{language === 'pt' ? 'Sem pagamentos recorrentes.' : 'No recurring payments.'}</p>
                  <p className="text-foreground/18 text-xs">{language === 'pt' ? 'Adiciona renda, Netflix, internet...' : 'Add rent, Netflix, internet...'}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {language === 'pt' ? 'Todos os pagamentos' : 'All payments'}
                    </span>
                  </div>
                  {activePayments.map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-3.5 group ${i < activePayments.length - 1 ? 'border-b border-border' : ''}`}>
                      <span className="text-xl shrink-0">{CAT_ICONS[p.category] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{p.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-xs ${getUrgencyColor(p.next_due_date)}`}>{getUrgencyLabel(p.next_due_date)}</span>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className="text-xs text-muted-foreground">{p.billing_cycle}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground/75 shrink-0">€{(p.amount || 0).toFixed(0)}</p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionMenu
                          onEdit={() => setEditingReminder(p)}
                          onDelete={() => setDeleteConfirm({ open: true, type: 'reminder', item: p })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activePayments.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/40 border border-border text-xs">
                  <span className="text-muted-foreground">{language === 'pt' ? 'Total mensal estimado' : 'Estimated monthly total'}</span>
                  <span className="font-semibold text-muted-foreground">
                    €{activePayments.filter(p => p.billing_cycle === 'monthly' || !p.billing_cycle).reduce((s, p) => s + (p.amount || 0), 0).toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ══ GOALS TAB ═══════════════════════════════════ */}
          {activeTab === 'goals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'pt' ? 'Metas de Poupança' : 'Savings Goals'}
                </p>
                <button onClick={() => { setEditingGoal(null); setShowGoalDialog(true); }}
                  className="text-xs text-violet-400/70 hover:text-violet-300 border border-violet-500/20 hover:border-violet-500/35 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" />{language === 'pt' ? 'Nova meta' : 'New goal'}
                </button>
              </div>

              {savingsGoals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-2">
                  <p className="text-3xl">🎯</p>
                  <p className="text-muted-foreground text-sm">{language === 'pt' ? 'Nenhuma meta ainda.' : 'No goals yet.'}</p>
                  <p className="text-foreground/18 text-xs">{language === 'pt' ? 'Férias, emergência, novo equipamento...' : 'Vacation, emergency fund, new equipment...'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savingsGoals.map(goal => {
                    const pct = goal.target_amount > 0 ? Math.min(100, Math.round(((goal.current_amount || 0) / goal.target_amount) * 100)) : 0;
                    const remaining = goal.target_amount - (goal.current_amount || 0);
                    const achieved = goal.status === 'achieved' || pct >= 100;
                    return (
                      <div key={goal.id} className={`rounded-2xl border p-4 transition-all ${achieved ? 'border-emerald-500/20 bg-emerald-500/6' : 'border-border bg-card'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Ring pct={pct} size={44} stroke={4} color={achieved ? '#34d399' : '#8b5cf6'} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm">{goal.emoji || '🎯'}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{goal.name}</p>
                              {goal.target_date && (
                                <p className="text-xs text-muted-foreground">{language === 'pt' ? 'Meta:' : 'By:'} {format(new Date(goal.target_date), 'MMM yyyy', { locale })}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {achieved && (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-400/80 border border-emerald-500/20 px-2 py-0.5 rounded-full">🎉</span>
                            )}
                            <ActionMenu
                              onEdit={() => setEditingGoal(goal)}
                              onDelete={() => setDeleteConfirm({ open: true, type: 'goal', item: goal })}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">€{(goal.current_amount || 0).toFixed(0)} / €{goal.target_amount.toFixed(0)}</span>
                          <span className={achieved ? 'text-emerald-400/80' : 'text-violet-400/80'}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mb-3">
                          <div className={`h-full rounded-full transition-all duration-700 ${achieved ? 'bg-emerald-400/70' : 'bg-violet-500/70'}`} style={{ width: `${pct}%` }} />
                        </div>
                        {!achieved && remaining > 0 && (
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-foreground/22">{language === 'pt' ? `Faltam €${remaining.toFixed(0)}` : `€${remaining.toFixed(0)} to go`}</p>
                            <div className="flex gap-1">
                              {[10, 50, 100].map(amt => (
                                <button key={amt} onClick={() => handleMarkGoalProgress(goal, amt)}
                                  className="text-[10px] px-2 py-0.5 rounded-lg bg-violet-500/12 border border-violet-500/20 text-violet-300/70 hover:bg-violet-500/20 transition-colors">
                                  +€{amt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ HISTORY TAB ═════════════════════════════════ */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'pt' ? `Registos · ${monthName}` : `Records · ${monthName}`}
                </p>
                <button onClick={() => setShowRecordDialog(true)}
                  className="text-xs text-emerald-400/70 hover:text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" />{language === 'pt' ? 'Adicionar' : 'Add'}
                </button>
              </div>

              {thisMonthTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
                  <Receipt className="w-7 h-7 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground text-sm">{language === 'pt' ? 'Sem registos este mês.' : 'No records this month.'}</p>
                  <button onClick={() => setShowRecordDialog(true)} className="text-xs text-emerald-400/70 border border-emerald-500/20 px-4 py-1.5 rounded-xl hover:bg-emerald-500/6 transition-colors">
                    {language === 'pt' ? 'Registar agora →' : 'Record now →'}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  {thisMonthTransactions.map((t, i) => {
                    const catMeta = KAKEBO_CATEGORIES.find(c => c.key === t.category);
                    const emoji = catMeta?.emoji || CAT_ICONS[t.category] || '💸';
                    const label = t.subcategory || (catMeta ? (language === 'pt' ? catMeta.pt : catMeta.en) : t.category);
                    const isIncome = t.type === 'income';
                    const isSaving = t.type === 'savings' || t.category === 'Savings';
                    const isInvest = t.type === 'investment' || t.category === 'Investments';
                    return (
                      <div key={t.id} className={`flex items-center gap-3.5 px-4 py-4 group ${i < thisMonthTransactions.length - 1 ? 'border-b border-border' : ''}`}>
                        <span className="text-xl shrink-0">{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground/80 truncate font-medium">{t.note || label}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-foreground/38">{t.date}</p>
                            {t.subcategory && <span className="text-[10px] text-muted-foreground">· {t.subcategory}</span>}
                            {t.feeling && <span className="text-[10px] text-muted-foreground">· {t.feeling}</span>}
                          </div>
                        </div>
                        <p className={`text-sm font-semibold tabular-nums shrink-0 ${
                          isIncome ? 'text-emerald-400' :
                          isSaving ? 'text-teal-400' :
                          isInvest ? 'text-yellow-400' :
                          'text-foreground/55'
                        }`}>
                          {isIncome || isSaving || isInvest ? '+' : '−'}€{(t.amount || 0).toFixed(0)}
                        </p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ActionMenu
                            onEdit={() => setEditingExpense(t)}
                            onDelete={() => setDeleteConfirm({ open: true, type: 'expense', item: t })}
                            onDuplicate={async () => {
                              const wsId = await getWorkspaceId();
                              await api.entities.Expense.create({ ...t, id: undefined, date: new Date().toISOString().split('T')[0] });
                              refetchExpenses();
                              toast.success(language === 'pt' ? '✅ Duplicado!' : '✅ Duplicated!');
                            }}
                            onMoveToMonth={() => setMoveToMonthData({ open: true, transaction: t })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ YEARLY TAB ══════════════════════════════════ */}
          {activeTab === 'yearly' && (
            <div className="space-y-4">
              {/* View switcher */}
              <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border">
                <button
                  onClick={() => setYearlyView('journey')}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    yearlyView === 'journey'
                      ? 'bg-accent text-foreground shadow-sm'
                      : 'text-foreground/38 hover:text-muted-foreground'
                  }`}
                >
                  {language === 'pt' ? 'Jornada' : 'Journey'}
                </button>
                <button
                  onClick={() => setYearlyView('report')}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    yearlyView === 'report'
                      ? 'bg-accent text-foreground shadow-sm'
                      : 'text-foreground/38 hover:text-muted-foreground'
                  }`}
                >
                  {language === 'pt' ? 'Relatório Anual' : 'Annual Report'}
                </button>
              </div>
              
              {yearlyView === 'journey' ? (
                <YearlyJourney expenses={expenses} language={language} />
              ) : (
                <AnnualReport
                  expenses={expenses}
                  financialGoals={financialGoals}
                  monthlyReviews={monthlyReviews}
                  language={language}
                />
              )}
            </div>
          )}

          {/* ── Bottom habit widgets (overview tab only) ────── */}
          {activeTab === 'overview' && (() => {
            const expT = thisMonthTransactions.filter(t => t.type === 'expense');
            const byDay = {};
            expT.forEach(t => { byDay[t.date] = (byDay[t.date] || 0) + (t.amount || 0); });
            const days = Object.entries(byDay).sort(([,a],[,b]) => a - b);
            const bestDay = days[0];
            const worstDay = days[days.length - 1];
            // Savings streak (consecutive days with no expense > 0)
            const recordedDates = new Set(expT.map(t => t.date));
            let streak = 0;
            const d = new Date();
            while (!recordedDates.has(d.toISOString().split('T')[0]) && streak < 30) {
              streak++;
              d.setDate(d.getDate() - 1);
            }
            // Recurring vs one-off
            const recurringTotal = recurringPayments.filter(p => p.status === 'active')
              .reduce((s, p) => s + (p.amount || 0), 0);

            const widgets2 = [];
            if (bestDay) {
              const bestDayDate = new Date(bestDay[0]);
              const dayName = bestDayDate.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
              widgets2.push({
                emoji: '🌤️',
                label: language === 'pt' ? 'Melhor dia' : 'Best day',
                value: `€${bestDay[1].toFixed(0)}`,
                sub: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                context: language === 'pt' ? 'Dia com maior atividade financeira' : 'Most active financial day',
              });
            }
            if (worstDay && worstDay[0] !== bestDay?.[0]) {
              const worstDayDate = new Date(worstDay[0]);
              const dayName = worstDayDate.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
              widgets2.push({
                emoji: '📍',
                label: language === 'pt' ? 'Dia mais dispendioso' : 'Most expensive day',
                value: `€${worstDay[1].toFixed(0)}`,
                sub: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                context: language === 'pt' ? 'Dia de maior despesa' : 'Highest spending day',
              });
            }
            if (streak > 0) widgets2.push({
              emoji: '🔥',
              label: language === 'pt' ? 'Dias sem despesas' : 'Expense-free days',
              value: `${streak}`,
              unit: language === 'pt' ? 'DIAS' : 'DAYS',
              sub: streak >= 30 
                ? (language === 'pt' ? '🎯 Um mês inteiro!' : '🎯 A whole month!')
                : (language === 'pt' ? 'seguidos' : 'in a row'),
              highlight: streak >= 7,
            });
            if (recurringTotal > 0) widgets2.push({
              emoji: '🔄',
              label: language === 'pt' ? 'Despesas fixas' : 'Fixed expenses',
              value: `€${recurringTotal.toFixed(0)}`,
              sub: language === 'pt' ? 'por mês' : 'per month',
            });

            if (widgets2.length === 0) return null;
            return (
              <div className="grid grid-cols-2 gap-2.5">
                {widgets2.slice(0, 4).map((w, i) => (
                  <div key={i} className={`rounded-2xl p-4 border transition-all duration-300 hover:scale-[1.02] ${
                    w.highlight 
                      ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/10'
                      : 'bg-background border-border hover:border-border hover:shadow-lg hover:shadow-black/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-lg">{w.emoji}</span>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium">{w.label}</p>
                    </div>
                    {w.unit ? (
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-foreground">{w.value}</p>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{w.unit}</p>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{w.value}</p>
                    )}
                    <div className="mt-2 space-y-0.5">
                      <p className={`text-[10px] ${w.highlight ? 'text-muted-foreground font-medium' : 'text-muted-foreground/70'}`}>
                        {w.sub}
                      </p>
                      {w.context && (
                        <p className="text-[9px] text-muted-foreground/50">
                          {w.context}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Footer note - more elegant */}
          <div className="px-4 py-3.5 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/30 border border-border text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {language === 'pt'
                ? '💼 As finanças empresariais são geridas separadamente em Faturas.'
                : '💼 Business finances are managed separately in Invoices.'}
            </p>
          </div>

        </div>
      </main>

      {/* Dialogs */}
      <SimpleRecordDialog open={showRecordDialog} onClose={() => setShowRecordDialog(false)} onSave={handleRecord} language={language} selectedMonth={selectedMonth} />
      <PaymentReminderDialog open={showReminderDialog} onClose={() => { setShowReminderDialog(false); setEditingReminder(null); }} onSave={handleSaveReminder} language={language} editData={editingReminder} />
      <SavingsGoalDialog open={showGoalDialog} onClose={() => { setShowGoalDialog(false); setEditingGoal(null); }} onSave={handleSaveGoal} language={language} editData={editingGoal} />
      <MonthlyIntentionDialog open={showIntentionDialog} onClose={() => setShowIntentionDialog(false)} onSave={handleSaveIntention} language={language} />
      <MonthlyReflectionDialog
        open={showReflectionDialog}
        onClose={() => setShowReflectionDialog(false)}
        onSave={handleSaveReflection}
        language={language}
        monthData={{ income: walletIncome, expenses: totalExpenses }}
        transactions={thisMonthTransactions}
      />
      
      {/* Edit expense dialog - reuse SimpleRecordDialog with edit data */}
      <SimpleRecordDialog 
        open={!!editingExpense} 
        onClose={() => setEditingExpense(null)} 
        onSave={handleEditExpense} 
        language={language}
        editData={editingExpense}
        selectedMonth={selectedMonth}
      />
      
      {/* Move to month dialog */}
      <MoveToMonthDialog
        open={moveToMonthData.open}
        onClose={() => setMoveToMonthData({ open: false, transaction: null })}
        onMove={handleMoveToMonth}
        transaction={moveToMonthData.transaction}
      />
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: null, item: null })}
        onConfirm={async () => {
          if (deleteConfirm.type === 'expense') {
            await handleDeleteExpense(deleteConfirm.item.id);
          } else if (deleteConfirm.type === 'reminder') {
            await handleDeleteReminder(deleteConfirm.item.id);
          } else if (deleteConfirm.type === 'goal') {
            await handleDeleteGoal(deleteConfirm.item.id);
          }
          setDeleteConfirm({ open: false, type: null, item: null });
        }}
        title={
          deleteConfirm.type === 'expense' ? (language === 'pt' ? 'Eliminar registo?' : 'Delete record?') :
          deleteConfirm.type === 'reminder' ? (language === 'pt' ? 'Eliminar pagamento?' : 'Delete payment?') :
          (language === 'pt' ? 'Eliminar meta?' : 'Delete goal?')
        }
        description={language === 'pt' ? 'Esta ação não pode ser desfeita.' : 'This action cannot be undone.'}
      />
    </div>
  );
}