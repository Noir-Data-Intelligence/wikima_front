import { useState } from 'react';
import { api } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import OpenCashDialog from '../components/cashregister/OpenCashDialog';
import CloseCashDialog from '../components/cashregister/CloseCashDialog';
import CashEntryDialog from '../components/cashregister/CashEntryDialog';
import AccessGuard from '../components/AccessGuard';
import { Button } from '@/components/ui/button';
import {
  Wallet, LockOpen, Lock, ArrowUpCircle, ArrowDownCircle,
  TrendingUp, TrendingDown, CalendarDays, Clock, User, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import { enUS } from 'date-fns/locale/en-US';

const CURRENCY_SYMBOLS = { EUR: '€', AOA: 'Kz', USD: '$', BRL: 'R$', GBP: '£' };

function fmt(amount, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || currency || '';
  return `${sym}${(amount || 0).toFixed(2)}`;
}

function fmtDate(d, lang) {
  if (!d) return '—';
  return format(new Date(d + 'T00:00:00'), 'd MMM yyyy', { locale: lang === 'pt' ? pt : enUS });
}

function StatusPill({ status, language }) {
  if (status === 'open') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      {language === 'pt' ? 'Aberta' : 'Open'}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/15 text-muted-foreground border border-slate-500/20">
      {language === 'pt' ? 'Fechada' : 'Closed'}
    </span>
  );
}

export default function CashRegister() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [entryType, setEntryType] = useState('income');
  const [selectedCash, setSelectedCash] = useState(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: cashRegisters = [], isLoading } = useQuery({
    queryKey: ['cashRegisters'],
    queryFn: async () => {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;
      const regs = await api.entities.CashRegister.filter({ workspace_id: wsId });
      return regs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['cashRegisters'] });

  const todayCash = cashRegisters.find(c => c.date === today);
  const history = cashRegisters.filter(c => c.date !== today);

  const isOpen = todayCash?.status === 'open';

  const openEntry = (type) => {
    setEntryType(type);
    setShowEntryDialog(true);
  };

  // KPIs from all closed sessions this month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthSessions = cashRegisters.filter(c => c.date?.startsWith(thisMonth) && c.status === 'closed');
  const monthDiff = monthSessions.reduce((s, c) => s + (c.difference || 0), 0);

  return (
    <AccessGuard page="CashRegister">
      <div className="min-h-screen bg-background">
        
        

        <div className="p-4 lg:pt-8 md:p-8 md:pt-8">
          <div className="max-w-[1400px] mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  {language === 'pt' ? 'Controlo de Caixa' : 'Cash Control'}
                </h1>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {language === 'pt'
                    ? 'Gestão diária de movimentos e saldos de caixa.'
                    : 'Daily cash flow management and balance control.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isOpen && (
                  <>
                    <Button
                      onClick={() => openEntry('expense')}
                      variant="ghost"
                      className="h-8 px-3 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-rose-500/50 gap-1.5"
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5 text-rose-400" />
                      {language === 'pt' ? 'Despesa' : 'Expense'}
                    </Button>
                    <Button
                      onClick={() => openEntry('income')}
                      variant="ghost"
                      className="h-8 px-3 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-green-500/50 gap-1.5"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5 text-green-400" />
                      {language === 'pt' ? 'Entrada' : 'Income'}
                    </Button>
                    <Button
                      onClick={() => { setSelectedCash(todayCash); setShowCloseDialog(true); }}
                      className="h-8 px-3 text-xs bg-rose-600/80 hover:bg-rose-600 gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {language === 'pt' ? 'Fechar Caixa' : 'Close Register'}
                    </Button>
                  </>
                )}
                {!todayCash && (
                  <Button
                    onClick={() => setShowOpenDialog(true)}
                    className="h-8 px-3 text-xs bg-primary hover:bg-cyan-700 gap-1.5"
                  >
                    <LockOpen className="w-3.5 h-3.5" />
                    {language === 'pt' ? 'Abrir Caixa' : 'Open Register'}
                  </Button>
                )}
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
              <div className="bg-card border border-border rounded-lg px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Saldo abertura' : 'Opening balance'}</p>
                  <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-3 h-3 text-primary" />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {todayCash ? fmt(todayCash.opening_amount, todayCash.currency) : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{language === 'pt' ? 'sessão de hoje' : "today's session"}</p>
              </div>

              <div className="bg-card border border-border rounded-lg px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Saldo fecho' : 'Closing balance'}</p>
                  <div className="w-6 h-6 rounded bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-3 h-3 text-purple-400" />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {todayCash?.status === 'closed' ? fmt(todayCash.closing_amount, todayCash.currency) : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{isOpen ? (language === 'pt' ? 'caixa aberta' : 'register open') : (language === 'pt' ? 'após fecho' : 'after closing')}</p>
              </div>

              <div className="bg-card border border-border rounded-lg px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Diferença hoje' : "Today's diff"}</p>
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${(todayCash?.difference || 0) >= 0 ? 'bg-green-500/15' : 'bg-rose-500/15'}`}>
                    {(todayCash?.difference || 0) >= 0
                      ? <TrendingUp className="w-3 h-3 text-green-400" />
                      : <TrendingDown className="w-3 h-3 text-rose-400" />}
                  </div>
                </div>
                <p className={`text-xl font-bold tabular-nums ${todayCash?.status === 'closed' ? ((todayCash?.difference || 0) >= 0 ? 'text-green-400' : 'text-rose-400') : 'text-muted-foreground'}`}>
                  {todayCash?.status === 'closed'
                    ? `${(todayCash.difference || 0) >= 0 ? '+' : ''}${fmt(todayCash.difference, todayCash.currency)}`
                    : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{language === 'pt' ? 'fecho vs abertura' : 'closing vs opening'}</p>
              </div>

              <div className="bg-card border border-border rounded-lg px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Resultado mensal' : 'Monthly result'}</p>
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${monthDiff >= 0 ? 'bg-green-500/15' : 'bg-orange-500/15'}`}>
                    <CalendarDays className={`w-3 h-3 ${monthDiff >= 0 ? 'text-green-400' : 'text-orange-400'}`} />
                  </div>
                </div>
                <p className={`text-xl font-bold tabular-nums ${monthDiff >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                  {monthSessions.length === 0 ? '—' : `${monthDiff >= 0 ? '+' : ''}€${monthDiff.toFixed(2)}`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{monthSessions.length} {language === 'pt' ? 'sessões' : 'sessions'}</p>
              </div>
            </div>

            {/* Today's session panel */}
            {isLoading ? (
              <div className="bg-card border border-border rounded-lg py-12 flex justify-center mb-4">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-cyan-400 rounded-full animate-spin" />
              </div>
            ) : todayCash ? (
              <div className={`bg-card border rounded-lg p-4 mb-4 ${isOpen ? 'border-primary/30' : 'border-border'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOpen ? 'bg-primary/15' : 'bg-muted/50'}`}>
                      {isOpen ? <LockOpen className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {language === 'pt' ? 'Sessão de Hoje' : "Today's Session"}
                        </p>
                        <StatusPill status={todayCash.status} language={language} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(todayCash.date + 'T00:00:00'), "EEEE, d 'de' MMMM yyyy", { locale: language === 'pt' ? pt : enUS })}
                      </p>
                    </div>
                  </div>
                  {todayCash.opened_by && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {todayCash.opened_by}
                    </div>
                  )}
                </div>

                {/* Session numbers */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-background rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{language === 'pt' ? 'Abertura' : 'Opening'}</p>
                    <p className="text-base font-bold text-foreground tabular-nums">{fmt(todayCash.opening_amount, todayCash.currency)}</p>
                    {todayCash.opened_at && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(todayCash.opened_at), 'HH:mm')}
                      </p>
                    )}
                  </div>

                  {todayCash.status === 'closed' ? (
                    <>
                      <div className="bg-background rounded-lg px-3 py-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{language === 'pt' ? 'Fecho' : 'Closing'}</p>
                        <p className="text-base font-bold text-foreground tabular-nums">{fmt(todayCash.closing_amount, todayCash.currency)}</p>
                        {todayCash.closed_at && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {format(new Date(todayCash.closed_at), 'HH:mm')}
                          </p>
                        )}
                      </div>
                      <div className={`rounded-lg px-3 py-2.5 ${(todayCash.difference || 0) >= 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{language === 'pt' ? 'Diferença' : 'Difference'}</p>
                        <p className={`text-base font-bold tabular-nums ${(todayCash.difference || 0) >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                          {(todayCash.difference || 0) >= 0 ? '+' : ''}{fmt(todayCash.difference, todayCash.currency)}
                        </p>
                      </div>
                      <div className="bg-background rounded-lg px-3 py-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{language === 'pt' ? 'Fechado por' : 'Closed by'}</p>
                        <p className="text-xs text-muted-foreground truncate">{todayCash.closed_by || '—'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-background rounded-lg px-3 py-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{language === 'pt' ? 'Estado' : 'Status'}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-xs text-green-400 font-medium">{language === 'pt' ? 'Sessão ativa' : 'Active session'}</span>
                        </div>
                      </div>
                      <div className="col-span-2 bg-background rounded-lg px-3 py-2.5 flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          {language === 'pt'
                            ? 'Use os botões de Entrada/Despesa para registar movimentos de caixa durante o dia.'
                            : 'Use the Income/Expense buttons to record cash movements throughout the day.'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Notes */}
                {(todayCash.opening_notes || todayCash.closing_notes) && (
                  <div className="mt-3 pt-3 border-t border-border flex gap-4">
                    {todayCash.opening_notes && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">{language === 'pt' ? 'Notas abertura:' : 'Opening notes:'} </span>
                        <span className="text-muted-foreground">{todayCash.opening_notes}</span>
                      </div>
                    )}
                    {todayCash.closing_notes && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">{language === 'pt' ? 'Notas fecho:' : 'Closing notes:'} </span>
                        <span className="text-muted-foreground">{todayCash.closing_notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Empty state */
              <div className="bg-card border border-dashed border-border rounded-lg py-6 mb-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {language === 'pt' ? 'Nenhuma sessão de caixa aberta hoje.' : 'No cash session opened today.'}
                </p>
                <p className="text-xs text-muted-foreground mb-5">
                  {language === 'pt'
                    ? 'Abra a caixa para começar a registar movimentos diários.'
                    : 'Open the register to start recording daily movements.'}
                </p>
                <Button onClick={() => setShowOpenDialog(true)} className="bg-primary hover:bg-cyan-700 h-8 text-xs gap-2">
                  <LockOpen className="w-3.5 h-3.5" />
                  {language === 'pt' ? 'Abrir Registo' : 'Open Register'}
                </Button>
              </div>
            )}

            {/* History */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {language === 'pt' ? 'Histórico de Sessões' : 'Session History'}
              </h2>

              {history.length === 0 ? (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border bg-card">
                    <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Data' : 'Date'}</div>
                    <div className="col-span-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Aberto por' : 'Opened by'}</div>
                    <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Abertura' : 'Opening'}</div>
                    <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Fecho' : 'Closing'}</div>
                    <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Diferença' : 'Difference'}</div>
                    <div className="col-span-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Estado' : 'Status'}</div>
                  </div>
                  <div className="py-6 text-center">
                    <p className="text-xs text-muted-foreground">{language === 'pt' ? 'Sem histórico de caixa.' : 'No cash history yet.'}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border bg-card">
                    <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Data' : 'Date'}</div>
                    <div className="col-span-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Aberto por' : 'Opened by'}</div>
                    <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Abertura' : 'Opening'}</div>
                    <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Fecho' : 'Closing'}</div>
                    <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Diferença' : 'Difference'}</div>
                    <div className="col-span-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Estado' : 'Status'}</div>
                  </div>
                  <div className="divide-y divide-[#334155]/50">
                    {history.map(cash => (
                      <div key={cash.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-white/[0.02] transition-colors">
                        <div className="col-span-2">
                          <span className="text-sm text-foreground">{fmtDate(cash.date, language)}</span>
                        </div>
                        <div className="col-span-3">
                          <span className="text-xs text-muted-foreground truncate">{cash.opened_by || '—'}</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="text-xs font-medium text-foreground tabular-nums">{fmt(cash.opening_amount, cash.currency)}</span>
                        </div>
                        <div className="col-span-2 text-right">
                          {cash.status === 'closed'
                            ? <span className="text-xs font-medium text-foreground tabular-nums">{fmt(cash.closing_amount, cash.currency)}</span>
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                        <div className="col-span-2 text-right">
                          {cash.status === 'closed' ? (
                            <span className={`text-xs font-semibold tabular-nums ${(cash.difference || 0) >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                              {(cash.difference || 0) >= 0 ? '+' : ''}{fmt(cash.difference, cash.currency)}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                        <div className="col-span-1">
                          <StatusPill status={cash.status} language={language} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        <OpenCashDialog open={showOpenDialog} onClose={() => setShowOpenDialog(false)} onSuccess={refresh} />
        {selectedCash && (
          <CloseCashDialog open={showCloseDialog} onClose={() => setShowCloseDialog(false)} onSuccess={refresh} cashRegister={selectedCash} />
        )}
        <CashEntryDialog
          open={showEntryDialog}
          onClose={() => setShowEntryDialog(false)}
          onSuccess={refresh}
          cashRegister={todayCash}
          type={entryType}
          language={language}
        />
      </div>
    </AccessGuard>
  );
}