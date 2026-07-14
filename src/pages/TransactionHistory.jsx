import React from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { ArrowLeft, Receipt, TrendingUp, TrendingDown, Wallet, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ActionMenu from '../components/ActionMenu';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import SimpleRecordDialog from '../components/wallet/SimpleRecordDialog';
import { showUndoToast } from '@/utils/showUndoToast';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';

export default function TransactionHistory() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [filterType, setFilterType] = React.useState('all'); // all, income, expense, savings, investment
  const [filterMonth, setFilterMonth] = React.useState(new Date());
  const [editingExpense, setEditingExpense] = React.useState(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState({ open: false, type: null, item: null });
  const [showRecordDialog, setShowRecordDialog] = React.useState(false);

  const getWorkspaceId = async () => {
    const u = await api.auth.me();
    return u.current_workspace_id || u.default_workspace_id;
  };

  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses-history'],
    queryFn: async () => {
      const wsId = await getWorkspaceId();
      if (!wsId) return [];
      return api.entities.Expense.filter({ workspace_id: wsId }, '-date');
    }
  });

  const filteredExpenses = React.useMemo(() => {
    const monthStr = filterMonth.toISOString().slice(0, 7);
    return expenses.filter(e => {
      const eMonth = new Date(e.date).toISOString().slice(0, 7);
      const monthMatch = eMonth === monthStr;
      const typeMatch = filterType === 'all' || e.type === filterType;
      return monthMatch && typeMatch;
    });
  }, [expenses, filterMonth, filterType]);

  const incomeTotal = filteredExpenses.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const expenseTotal = filteredExpenses.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = incomeTotal - expenseTotal;

  const handleEditExpense = async (recordData) => {
    const wsId = await getWorkspaceId();
    await api.entities.Expense.update(editingExpense.id, { ...recordData, workspace_id: wsId });
    setEditingExpense(null);
    refetchExpenses();
    toast.success(language === 'pt' ? '✅ Atualizado!' : '✅ Updated!');
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

  const locale = language === 'pt' ? ptBR : enUS;
  const monthName = format(filterMonth, 'MMMM yyyy', { locale });

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      
      

      <main className="p-4 lg:pt-8 md:p-8 md:pt-8 relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-5">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {language === 'pt' ? 'Histórico de Transações' : 'Transaction History'}
              </h1>
              <p className="text-xs text-muted-foreground">{language === 'pt' ? 'Todas as tuas transações' : 'All your transactions'}</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300/70">{language === 'pt' ? 'Receitas' : 'Income'}</span>
              </div>
              <p className="text-xl font-bold text-emerald-400">€{incomeTotal.toFixed(0)}</p>
            </div>
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-300/70">{language === 'pt' ? 'Despesas' : 'Expenses'}</span>
              </div>
              <p className="text-xl font-bold text-red-400">€{expenseTotal.toFixed(0)}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${balance >= 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Wallet className={`w-4 h-4 ${balance >= 0 ? 'text-amber-400' : 'text-red-400'}`} />
                <span className={`text-xs ${balance >= 0 ? 'text-amber-300/70' : 'text-red-300/70'}`}>{language === 'pt' ? 'Saldo' : 'Balance'}</span>
              </div>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-amber-400' : 'text-red-400'}`}>€{balance.toFixed(0)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border">
              {[
                { key: 'all', label: language === 'pt' ? 'Todos' : 'All' },
                { key: 'income', label: language === 'pt' ? 'Receitas' : 'Income' },
                { key: 'expense', label: language === 'pt' ? 'Despesas' : 'Expenses' },
                { key: 'savings', label: language === 'pt' ? 'Poupança' : 'Savings' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setFilterType(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterType === tab.key
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilterMonth(new Date(filterMonth.getFullYear(), filterMonth.getMonth() - 1, 1))}
                className="w-8 h-8 rounded-lg bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex items-center justify-center">
                ‹
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground font-medium">{monthName}</span>
              </div>
              <button onClick={() => setFilterMonth(new Date(filterMonth.getFullYear(), filterMonth.getMonth() + 1, 1))}
                className="w-8 h-8 rounded-lg bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex items-center justify-center">
                ›
              </button>
            </div>
          </div>

          {/* Transaction List */}
          {filteredExpenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
              <Receipt className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-sm">{language === 'pt' ? 'Sem transações neste mês.' : 'No transactions this month.'}</p>
              <button onClick={() => setShowRecordDialog(true)} className="text-xs text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl hover:bg-emerald-500/10 transition-colors">
                {language === 'pt' ? 'Registar transação →' : 'Record transaction →'}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {filteredExpenses.map((t, i) => {
                const emoji = t.type === 'income' ? '💰' : t.type === 'savings' ? '🪴' : t.type === 'investment' ? '📈' : '💸';
                const isPositive = t.type === 'income' || t.type === 'savings' || t.type === 'investment';
                return (
                  <div key={t.id} className={`flex items-center gap-3.5 px-4 py-4 group ${i < filteredExpenses.length - 1 ? 'border-b border-border' : ''}`}>
                    <span className="text-xl shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/80 truncate font-medium">{t.note || t.category}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-foreground/38">{t.date}</span>
                        {t.subcategory && <span className="text-[10px] text-muted-foreground">· {t.subcategory}</span>}
                        {t.feeling && <span className="text-[10px] text-muted-foreground">· {t.feeling}</span>}
                      </div>
                    </div>
                    <p className={`text-sm font-semibold tabular-nums shrink-0 ${
                      isPositive ? 'text-emerald-400' : 'text-foreground/55'
                    }`}>
                      {isPositive ? '+' : '−'}€{(t.amount || 0).toFixed(0)}
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
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick add button */}
          <button onClick={() => setShowRecordDialog(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-foreground shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-105">
            <Plus className="w-6 h-6" />
          </button>

        </div>
      </main>

      {/* Dialogs */}
      <SimpleRecordDialog 
        open={!!editingExpense} 
        onClose={() => setEditingExpense(null)} 
        onSave={handleEditExpense} 
        language={language}
        editData={editingExpense}
      />
      <SimpleRecordDialog 
        open={showRecordDialog} 
        onClose={() => setShowRecordDialog(false)} 
        onSave={async (data) => {
          const wsId = await getWorkspaceId();
          await api.entities.Expense.create({ ...data, workspace_id: wsId });
          refetchExpenses();
          toast.success(language === 'pt' ? '✅ Registado!' : '✅ Recorded!');
          setShowRecordDialog(false);
        }} 
        language={language} 
        selectedMonth={filterMonth}
      />
      <DeleteConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: null, item: null })}
        onConfirm={async () => {
          if (deleteConfirm.type === 'expense') {
            await handleDeleteExpense(deleteConfirm.item.id);
          }
          setDeleteConfirm({ open: false, type: null, item: null });
        }}
        title={language === 'pt' ? 'Eliminar registo?' : 'Delete record?'}
        description={language === 'pt' ? 'Esta ação não pode ser desfeita.' : 'This action cannot be undone.'}
      />
    </div>
  );
}