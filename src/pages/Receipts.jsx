import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useUserType } from '../components/UserTypeContext';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import MobileMenuButton from '../components/dashboard/MobileMenuButton';
import ReceiptDialog from '../components/receipts/ReceiptDialog';
import ReceiptPrintView from '../components/finance/ReceiptPrintView';
import AccessGuard from '../components/AccessGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileCheck, Receipt, MoreHorizontal, Printer, Edit, Trash2, ExternalLink, X, TrendingUp, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

const CURRENCY_SYMBOLS = { EUR: '€', AOA: 'Kz', USD: '$', BRL: 'R$', GBP: '£' };

const METHOD_LABELS = {
  pt: { cash: 'Dinheiro', transfer: 'Transferência', card: 'Cartão', mobile: 'Móvel', other: 'Outro' },
  en: { cash: 'Cash', transfer: 'Transfer', card: 'Card', mobile: 'Mobile', other: 'Other' }
};

const STATUS_CONFIG = {
  issued:    { label: { pt: 'Emitido',   en: 'Issued'    }, cls: 'bg-green-500/15 text-green-400 border-green-500/20' },
  refunded:  { label: { pt: 'Reembolsado', en: 'Refunded' }, cls: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  cancelled: { label: { pt: 'Cancelado', en: 'Cancelled' }, cls: 'bg-rose-500/15 text-rose-400 border-rose-500/20' }
};

function StatusBadge({ status, language }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.issued;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>
      {cfg.label[language]}
    </span>
  );
}

function RowMenu({ receipt, language, onPrint, onEdit, onDelete, onOpenFile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-muted-foreground hover:bg-accent/50 transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 rounded-lg border border-border py-1 shadow-xl" style={{ backgroundColor: '#0d1a2d' }}>
          <MenuItem icon={<Printer className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Ver / PDF' : 'View / PDF'} onClick={() => { onPrint(receipt); setOpen(false); }} />
          <MenuItem icon={<Edit className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Editar' : 'Edit'} onClick={() => { onEdit(receipt); setOpen(false); }} />
          {receipt.file_url && (
            <MenuItem icon={<ExternalLink className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Abrir ficheiro' : 'Open file'} onClick={() => { onOpenFile(receipt); setOpen(false); }} />
          )}
          <div className="h-px bg-muted my-1" />
          <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label={language === 'pt' ? 'Eliminar' : 'Delete'} color="text-rose-400" onClick={() => { onDelete(receipt); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, color = 'text-muted-foreground' }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-accent/50 transition-colors ${color}`}>
      <span className="opacity-70">{icon}</span>
      {label}
    </button>
  );
}

export default function Receipts() {
  const { language } = useLanguage();
  const { userType } = useUserType();
  const isCompany = userType === 'company';
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(null);
  const [prefillInvoice, setPrefillInvoice] = useState(null);

  const { data: companyProfile } = useCompanyProfile();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    enabled: isCompany,
    queryFn: async () => {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;
      return api.entities.Project.filter({ workspace_id: wsId }, 'name');
    }
  });

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;
      return api.entities.Receipt.filter({ workspace_id: wsId }, '-date');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Receipt.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['receipts']);
      toast.success(language === 'pt' ? 'Recibo eliminado' : 'Receipt deleted');
    }
  });

  const handleDelete = (receipt) => {
    if (confirm(language === 'pt' ? 'Eliminar este recibo?' : 'Delete this receipt?')) {
      deleteMutation.mutate(receipt.id);
    }
  };

  const hasActiveFilters = filterStatus !== 'all' || filterMethod !== 'all' || filterDateFrom || filterDateTo || filterProject !== 'all';

  const filtered = receipts.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      r.receipt_number?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q) ||
      r.invoice_number?.toLowerCase().includes(q) ||
      r.payment_method?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchMethod = filterMethod === 'all' || r.payment_method === filterMethod;
    const matchProject = filterProject === 'all' || r.project_id === filterProject;
    let matchDate = true;
    if (r.date) {
      if (filterDateFrom && r.date < filterDateFrom) matchDate = false;
      if (filterDateTo && r.date > filterDateTo) matchDate = false;
    }
    return matchSearch && matchStatus && matchMethod && matchDate && matchProject;
  });

  // KPIs
  const issuedReceipts = receipts.filter(r => r.status === 'issued' || !r.status);
  const totalAmount = issuedReceipts.reduce((s, r) => s + (r.amount || 0), 0);
  const refundedAmount = receipts.filter(r => r.status === 'refunded').reduce((s, r) => s + (r.amount || 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthCount = receipts.filter(r => r.date?.startsWith(thisMonth)).length;

  const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB') : '—';

  return (
    <AccessGuard page="Receipts">
      <div className="min-h-screen bg-background">
        
        

        <div className="p-4 lg:pt-8 md:p-8 md:pt-8">
          <div className="max-w-[1400px] mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  {language === 'pt' ? 'Recibos' : 'Receipts'}
                </h1>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {language === 'pt'
                    ? 'Confirmações de pagamento ligadas a faturas pagas.'
                    : 'Payment confirmations linked to paid invoices.'}
                </p>
              </div>
              <Button
                onClick={() => { setSelectedReceipt(null); setPrefillInvoice(null); setShowDialog(true); }}
                className="bg-primary hover:bg-cyan-700 gap-2 h-9 px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === 'pt' ? 'Novo Recibo' : 'New Receipt'}
              </Button>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
              <div className="bg-card border border-border rounded-lg px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Total recibos' : 'Total receipts'}</p>
                  <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-3 h-3 text-primary" />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">{receipts.length}</p>
              </div>

              <div className="bg-card border border-border rounded-lg px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Valor emitido' : 'Issued amount'}</p>
                  <div className="w-6 h-6 rounded bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  </div>
                </div>
                <p className="text-xl font-bold text-green-400 tabular-nums">€{totalAmount.toFixed(2)}</p>
              </div>

              <div className="bg-card border border-border rounded-lg px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Reembolsado' : 'Refunded'}</p>
                  <div className="w-6 h-6 rounded bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                    <RefreshCcw className="w-3 h-3 text-orange-400" />
                  </div>
                </div>
                <p className="text-xl font-bold text-orange-400 tabular-nums">€{refundedAmount.toFixed(2)}</p>
              </div>

              <div className="bg-card border border-border rounded-lg px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Este mês' : 'This month'}</p>
                  <div className="w-6 h-6 rounded bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-3 h-3 text-purple-400" />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">{monthCount}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-3 p-2.5 bg-card border border-border rounded-lg">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder={language === 'pt' ? 'Recibo, cliente, fatura, método...' : 'Receipt, client, invoice, method...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-7 bg-background border-border text-muted-foreground text-xs"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-7 bg-background border-border text-muted-foreground text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'pt' ? 'Todos estados' : 'All statuses'}</SelectItem>
                  <SelectItem value="issued">{language === 'pt' ? 'Emitido' : 'Issued'}</SelectItem>
                  <SelectItem value="refunded">{language === 'pt' ? 'Reembolsado' : 'Refunded'}</SelectItem>
                  <SelectItem value="cancelled">{language === 'pt' ? 'Cancelado' : 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger className="w-36 h-7 bg-background border-border text-muted-foreground text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'pt' ? 'Todos os métodos' : 'All methods'}</SelectItem>
                  <SelectItem value="cash">{language === 'pt' ? 'Dinheiro' : 'Cash'}</SelectItem>
                  <SelectItem value="transfer">{language === 'pt' ? 'Transferência' : 'Transfer'}</SelectItem>
                  <SelectItem value="card">{language === 'pt' ? 'Cartão' : 'Card'}</SelectItem>
                  <SelectItem value="mobile">{language === 'pt' ? 'Móvel' : 'Mobile'}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-28 h-7 bg-background border-border text-muted-foreground text-[11px]"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-28 h-7 bg-background border-border text-muted-foreground text-[11px]"
                />
              </div>

              {isCompany && projects.length > 0 && (
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-36 h-7 bg-background border-border text-muted-foreground text-[11px]">
                    <SelectValue placeholder={language === 'pt' ? 'Projetos' : 'Projects'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'pt' ? 'Todos os Projetos' : 'All Projects'}</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterStatus('all'); setFilterMethod('all'); setFilterDateFrom(''); setFilterDateTo(''); setFilterProject('all'); }}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3 mr-1" />
                  {language === 'pt' ? 'Limpar' : 'Clear'}
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border bg-card">
                <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Recibo #' : 'Receipt #'}</div>
                <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Fatura' : 'Invoice'}</div>
                <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Cliente' : 'Client'}</div>
                <div className="col-span-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Data' : 'Date'}</div>
                <div className="col-span-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Método' : 'Method'}</div>
                <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Valor' : 'Amount'}</div>
                <div className="col-span-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Estado' : 'Status'}</div>
                <div className="col-span-1" />
              </div>

              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-3">
                    <FileCheck className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {searchTerm || hasActiveFilters
                      ? (language === 'pt' ? 'Nenhum recibo encontrado.' : 'No receipts found.')
                      : (language === 'pt' ? 'Sem recibos ainda.' : 'No receipts yet.')}
                  </p>
                  <p className="text-muted-foreground text-xs mb-5">
                    {language === 'pt'
                      ? 'Gere recibos a partir de faturas pagas ou crie manualmente.'
                      : 'Generate receipts from paid invoices or create manually.'}
                  </p>
                  {!searchTerm && !hasActiveFilters && (
                    <Button
                      onClick={() => { setSelectedReceipt(null); setPrefillInvoice(null); setShowDialog(true); }}
                      className="bg-primary hover:bg-cyan-700 h-8 text-xs gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {language === 'pt' ? 'Novo Recibo' : 'New Receipt'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#334155]/50">
                  {filtered.map(receipt => (
                    <div key={receipt.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-white/[0.02] transition-colors group">
                      {/* Receipt # */}
                      <div className="col-span-2">
                        <span className="text-sm font-mono font-medium text-primary">{receipt.receipt_number}</span>
                      </div>

                      {/* Invoice ref */}
                      <div className="col-span-2">
                        {receipt.invoice_number ? (
                          <span className="text-xs font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/30">{receipt.invoice_number}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Client */}
                      <div className="col-span-2 truncate">
                        <span className="text-sm text-foreground truncate">{receipt.client_name}</span>
                      </div>

                      {/* Date */}
                      <div className="col-span-1">
                        <span className="text-xs text-muted-foreground">{fmt(receipt.date)}</span>
                      </div>

                      {/* Method */}
                      <div className="col-span-1">
                        <span className="text-xs text-muted-foreground">{METHOD_LABELS[language][receipt.payment_method] || receipt.payment_method}</span>
                      </div>

                      {/* Amount */}
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                          {CURRENCY_SYMBOLS[receipt.currency] || ''}{receipt.amount?.toFixed(2)}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="col-span-1">
                        <StatusBadge status={receipt.status || 'issued'} language={language} />
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex justify-end">
                        <RowMenu
                          receipt={receipt}
                          language={language}
                          onPrint={(r) => { setPrintReceipt(r); setShowPrintView(true); }}
                          onEdit={(r) => { setSelectedReceipt(r); setPrefillInvoice(null); setShowDialog(true); }}
                          onDelete={handleDelete}
                          onOpenFile={(r) => window.open(r.file_url, '_blank')}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer summary */}
            {filtered.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="bg-card/60 border border-border/60 rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{language === 'pt' ? 'Recibos filtrados' : 'Filtered'}</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">{filtered.length}</span>
                </div>
                <div className="bg-card/60 border border-border/60 rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{language === 'pt' ? 'Emitidos' : 'Issued'}</span>
                  <span className="text-sm font-bold text-green-400 tabular-nums">{filtered.filter(r => !r.status || r.status === 'issued').length}</span>
                </div>
                <div className="bg-card/60 border border-border/60 rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{language === 'pt' ? 'Total filtrado' : 'Filtered total'}</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    €{filtered.reduce((s, r) => s + (r.amount || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>

        <ReceiptPrintView
          open={showPrintView}
          onClose={() => { setShowPrintView(false); setPrintReceipt(null); }}
          receipt={printReceipt}
          language={language}
        />

        <ReceiptDialog
          open={showDialog}
          onClose={() => { setShowDialog(false); setSelectedReceipt(null); setPrefillInvoice(null); }}
          receipt={selectedReceipt}
          prefillInvoice={prefillInvoice}
          companyProfile={companyProfile}
          projects={projects}
          isCompany={isCompany}
          onSuccess={() => queryClient.invalidateQueries(['receipts'])}
        />
      </div>
    </AccessGuard>
  );
}