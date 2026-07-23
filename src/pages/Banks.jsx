import React, { useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Search, Building2, FileText, Upload,
  CheckCircle, AlertCircle, Edit, X, ArrowUpRight,
  ArrowDownRight, Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import BankAccountDialog from '../components/banks/BankAccountDialog';
import StatementUploadDialog from '../components/banks/StatementUploadDialog';
import AccessGuard from '../components/AccessGuard';

const currencySymbols = { AOA: 'Kz', EUR: '€', USD: '$', BRL: 'R$', GBP: '£' };

const statusMap = {
  active:   { pt: 'Activa',   en: 'Active',   cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  inactive: { pt: 'Inactiva', en: 'Inactive', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  closed:   { pt: 'Fechada',  en: 'Closed',   cls: 'bg-slate-500/15 text-muted-foreground border-slate-500/30' }
};

export default function Banks() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [view, setView] = useState('accounts');

  React.useEffect(() => {
    api.auth.me().catch(() => { window.location.href = createPageUrl('Landing'); });
  }, []);

  const { data: accounts = [] } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;
      if (!wsId) return [];
      return await api.entities.BankAccount.filter({ workspace_id: wsId }, '-created_date');
    }
  });

  const { data: statements = [] } = useQuery({
    queryKey: ['bankStatements'],
    queryFn: async () => {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;
      if (!wsId) return [];
      return await api.entities.BankStatement.filter({ workspace_id: wsId }, '-year', '-month');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id) => api.entities.BankAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bankAccounts']);
      toast.success(language === 'pt' ? 'Conta eliminada!' : 'Account deleted!');
    }
  });

  const filteredAccounts = accounts.filter(a => {
    const q = searchTerm.toLowerCase();
    const match = a.bank_name?.toLowerCase().includes(q) || a.account_name?.toLowerCase().includes(q) || a.account_number?.toLowerCase().includes(q);
    return match && (filterStatus === 'all' || a.status === filterStatus);
  });

  const activeCount  = accounts.filter(a => a.status === 'active').length;
  const totalBalance = statements.reduce((s, st) => s + (st.closing_balance || 0), 0);

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear  = now.getFullYear();
  const monthlyStatements = statements.filter(s => s.month === thisMonth && s.year === thisYear);
  const monthlyInflow  = monthlyStatements.reduce((s, st) => s + Math.max(0, (st.closing_balance || 0) - (st.opening_balance || 0)), 0);
  const monthlyOutflow = monthlyStatements.reduce((s, st) => s + Math.max(0, (st.opening_balance || 0) - (st.closing_balance || 0)), 0);

  const getAccountStatements = (id) => statements.filter(s => s.bank_account_id === id);

  const getMissingStatements = (account) => {
    const acctStmts = getAccountStatements(account.id);
    const missing = [];
    for (let m = 1; m <= thisMonth; m++) {
      if (!acctStmts.some(s => s.year === thisYear && s.month === m)) missing.push({ year: thisYear, month: m });
    }
    return missing;
  };

  const kpis = [
    { label: language === 'pt' ? 'Contas Activas' : 'Active Accounts', value: activeCount, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
    { label: language === 'pt' ? 'Saldo Total' : 'Total Balance', value: `€ ${totalBalance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: language === 'pt' ? 'Entradas Mês' : 'Monthly Inflow', value: `€ ${monthlyInflow.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, icon: ArrowUpRight, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: language === 'pt' ? 'Saídas Mês' : 'Monthly Outflow', value: `€ ${monthlyOutflow.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, icon: ArrowDownRight, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  const colHdr = "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider";

  return (
    <AccessGuard page="Banks">
      <div className="min-h-screen bg-background">
        
        

        <div className="p-4 lg:pt-8 md:p-8 md:pt-8">
          <div className="max-w-[1400px] mx-auto space-y-3">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  {language === 'pt' ? 'Contas Bancárias' : 'Bank Accounts'}
                </h1>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {language === 'pt'
                    ? 'Controle saldos, extractos e transferências das suas contas empresariais.'
                    : 'Track balances, statements and linked transfers across your business accounts.'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={accounts.length === 0}
                  onClick={() => setView(view === 'accounts' ? 'statements' : 'accounts')}
                  className="h-8 text-xs border-border text-muted-foreground hover:text-foreground hover:border-slate-500 bg-transparent disabled:opacity-40"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  {view === 'accounts'
                    ? (language === 'pt' ? 'Ver Extractos' : 'View Statements')
                    : (language === 'pt' ? 'Ver Contas' : 'View Accounts')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setEditingAccount(null); setShowAccountDialog(true); }}
                  className="bg-primary hover:bg-primary/90 h-8 text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {language === 'pt' ? 'Nova Conta' : 'New Account'}
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {kpis.map((k, i) => (
                <div key={i} className="bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-md ${k.bg} flex items-center justify-center flex-shrink-0`}>
                    <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{k.label}</p>
                    <p className="text-sm font-bold text-foreground tabular-nums leading-tight">{k.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder={language === 'pt' ? 'Pesquisar contas...' : 'Search accounts...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-xs bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {view === 'accounts' && (
                <div className="flex gap-2 items-center">
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="h-8 px-3 rounded-md bg-card border border-border text-foreground text-xs"
                  >
                    <option value="all">{language === 'pt' ? 'Todos' : 'All Status'}</option>
                    <option value="active">{language === 'pt' ? 'Activas' : 'Active'}</option>
                    <option value="inactive">{language === 'pt' ? 'Inactivas' : 'Inactive'}</option>
                    <option value="closed">{language === 'pt' ? 'Fechadas' : 'Closed'}</option>
                  </select>
                  {(searchTerm || filterStatus !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground px-2">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Accounts Table */}
            {view === 'accounts' && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border bg-card">
                  <div className="col-span-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Banco' : 'Bank'}</div>
                  <div className="col-span-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Conta' : 'Account'}</div>
                  <div className="col-span-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Moeda' : 'Currency'}</div>
                  <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Extractos' : 'Statements'}</div>
                  <div className="col-span-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Estado' : 'Status'}</div>
                  <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Acções' : 'Actions'}</div>
                </div>

                {filteredAccounts.length === 0 ? (
                  <div className="py-7 text-center">
                    <Building2 className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground mb-3">
                      {accounts.length === 0
                        ? (language === 'pt' ? 'Nenhuma conta bancária ainda.' : 'No bank accounts yet.')
                        : (language === 'pt' ? 'Nenhuma conta corresponde ao filtro.' : 'No accounts match the filter.')}
                    </p>
                    {accounts.length === 0 && (
                      <Button size="sm" onClick={() => setShowAccountDialog(true)}
                        className="bg-primary hover:bg-primary/90 h-7 text-xs gap-1.5">
                        <Plus className="w-3 h-3" />
                        {language === 'pt' ? 'Adicionar Conta' : 'Add Account'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredAccounts.map(account => {
                      const missing = getMissingStatements(account);
                      const acctStmts = getAccountStatements(account.id);
                      const st = statusMap[account.status] || statusMap.active;
                      return (
                        <div key={account.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors">
                          {/* Bank */}
                          <div className="col-span-3 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground truncate">{account.bank_name}</span>
                          </div>
                          {/* Account name + number */}
                          <div className="col-span-3">
                            <p className="text-xs text-foreground font-medium truncate">{account.account_name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{account.account_number}</p>
                          </div>
                          {/* Currency */}
                          <div className="col-span-1">
                            <span className="text-xs text-muted-foreground">{account.currency}</span>
                          </div>
                          {/* Statements count + missing alert */}
                          <div className="col-span-2 flex items-center justify-end gap-1.5">
                            <span className="text-xs text-muted-foreground tabular-nums">{acctStmts.length}</span>
                            {missing.length > 0 && (
                              <span title={`${missing.length} missing`}>
                                <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                              </span>
                            )}
                          </div>
                          {/* Status */}
                          <div className="col-span-1">
                            <Badge className={`text-[10px] border px-1.5 py-0 ${st.cls}`}>
                              {language === 'pt' ? st.pt : st.en}
                            </Badge>
                          </div>
                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setSelectedAccount(account); setShowStatementDialog(true); }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/90/10 transition-colors"
                              title={language === 'pt' ? 'Carregar extracto' : 'Upload statement'}
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingAccount(account); setShowAccountDialog(true); }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              title={language === 'pt' ? 'Editar' : 'Edit'}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Statements View */}
            {view === 'statements' && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border bg-card">
                  <div className="col-span-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Banco' : 'Bank'}</div>
                  <div className="col-span-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Conta' : 'Account'}</div>
                  <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Mês/Ano' : 'Month/Year'}</div>
                  <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Estado' : 'Status'}</div>
                  <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Verificado' : 'Verified'}</div>
                </div>
                {statements.length === 0 ? (
                  <div className="py-10 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{language === 'pt' ? 'Nenhum extracto carregado.' : 'No statements uploaded yet.'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {statements.slice(0, 20).map(s => (
                      <div key={s.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors">
                        <div className="col-span-3 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-xs text-foreground truncate">{s.bank_name}</span>
                        </div>
                        <div className="col-span-3">
                          <span className="text-xs text-muted-foreground truncate">{s.account_name}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground tabular-nums">{String(s.month).padStart(2,'0')}/{s.year}</span>
                        </div>
                        <div className="col-span-2">
                          <Badge className={`text-[10px] border px-1.5 py-0 ${s.status === 'received' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'}`}>
                            {s.status === 'received' ? (language === 'pt' ? 'Recebido' : 'Received') : (language === 'pt' ? 'Pendente' : 'Pending')}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          {s.accountant_verified
                            ? <span className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle className="w-3 h-3" /> {language === 'pt' ? 'Sim' : 'Yes'}</span>
                            : <span className="text-[10px] text-muted-foreground">—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        <BankAccountDialog
          open={showAccountDialog}
          onClose={() => { setShowAccountDialog(false); setEditingAccount(null); }}
          account={editingAccount}
          onSuccess={() => queryClient.invalidateQueries(['bankAccounts'])}
        />

        {selectedAccount && (
          <StatementUploadDialog
            open={showStatementDialog}
            onClose={() => { setShowStatementDialog(false); setSelectedAccount(null); }}
            account={selectedAccount}
            onSuccess={() => queryClient.invalidateQueries(['bankStatements'])}
          />
        )}
      </div>
    </AccessGuard>
  );
}