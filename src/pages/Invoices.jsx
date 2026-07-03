import React, { useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Receipt, CheckCircle, TrendingUp, Clock, Filter, X, Download, Sheet, Calendar } from 'lucide-react';
import InvoiceTableRow from '../components/finance/InvoiceTableRow';
import { toast } from 'sonner';
import { usePlanCheck } from '../components/usePlanCheck';
import PlanLimitModal from '../components/PlanLimitModal';
import MarkPaymentDialog from '../components/MarkPaymentDialog';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import MobileMenuButton from '../components/dashboard/MobileMenuButton';
import AccessGuard from '../components/AccessGuard';
import InvoicePrintView from '../components/finance/InvoicePrintView';
import InvoiceFormModal from '../components/finance/InvoiceFormModal';
import ReceiptDialog from '../components/receipts/ReceiptDialog';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useUserType } from '../components/UserTypeContext';

export default function Invoices() {
  const { t, language } = useLanguage();
  const { userType } = useUserType();
  const isCompany = userType === 'company';
  const queryClient = useQueryClient();
  const { checkLimit, incrementUsage } = usePlanCheck();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptPrefill, setReceiptPrefill] = useState(null);
  const [syncingToSheets, setSyncingToSheets] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [periodPreset, setPeriodPreset] = useState('this_month');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [formData, setFormData] = useState({
    invoice_number: '',
    client_name: '',
    client_email: '',
    client_country: '',
    client_tax_id: '',
    seller_company_name: '',
    seller_tax_id: '',
    seller_address: '',
    seller_country: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'draft',
    items: [{ description: '', quantity: 1, price: 0, total: 0 }],
    tax_rate: 0,
    tax: 0,
    currency: 'EUR',
    notes: '',
    service_category: '',
    description: '',
    hours: '',
    discount: 0,
    project_id: '',
    project_name: ''
  });

  const { data: companyProfile } = useCompanyProfile();

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.Invoice.filter({ workspace_id: workspaceId }, '-date');
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.Client.filter({ workspace_id: workspaceId }, 'name');
    }
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    enabled: isCompany,
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.Project.filter({ workspace_id: workspaceId }, 'name');
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Invoice.create(data),
    onSuccess: async () => {
      await incrementUsage('invoices');
      queryClient.invalidateQueries(['invoices']);
      setShowDialog(false);
      resetForm();
      toast.success(language === 'pt' ? '✅ Fatura criada! Boa — uma a menos para te preocupares.' : '✅ Invoice created! Nice — one less thing to worry about.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      setShowDialog(false);
      resetForm();
      toast.success(language === 'pt' ? '✅ Atualizada! Está tudo organizado.' : '✅ Updated! Everything is organized.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      toast.success(language === 'pt' ? 'Fatura eliminada' : 'Invoice deleted');
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ invoice, paymentData }) => {
      // Update invoice status
      await api.entities.Invoice.update(invoice.id, {
        status: 'paid',
        paid_date: paymentData.paid_date,
        payment_method: paymentData.payment_method,
        payment_notes: paymentData.payment_notes
      });

      // Check if income entry already exists for this invoice
      const existingIncome = await api.entities.Expense.filter({
        note: `[Invoice:${invoice.id}]`
      });

      // Create income entry in Wallet if not already synced
      if (existingIncome.length === 0) {
        const currentUser = await api.auth.me();
        const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
        
        await api.entities.Expense.create({
          workspace_id: workspaceId,
          type: 'income',
          amount: invoice.total,
          category: 'Sales',
          transaction_type: 'business',
          date: paymentData.paid_date,
          note: `[Invoice:${invoice.id}] ${invoice.invoice_number || `#${invoice.id.slice(0, 8)}`} - ${invoice.client_name}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['expenses']);
      toast.success(language === 'pt' ? '✅ Pagamento registado e adicionado ao Wallet!' : '✅ Payment recorded and added to Wallet!');
    }
  });

  const handleMarkPaid = async (invoice, paymentData) => {
    await markPaidMutation.mutateAsync({ invoice, paymentData });
  };

  const handleExportPDF = async (invoice) => {
    const limit = checkLimit('invoice_exports');
    if (!limit.allowed) {
      setLimitInfo(limit);
      setShowLimitModal(true);
      return;
    }

    try {
      const response = await api.functions.invoke('generateInvoicePDF', {
        invoiceId: invoice.id
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number || invoice.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success(language === 'pt' ? 'PDF exportado!' : 'PDF exported!');
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao exportar PDF' : 'Error exporting PDF');
    }
  };

  const handleExportCSV = () => {
    const limit = checkLimit('invoice_exports');
    if (!limit.allowed) {
      setLimitInfo(limit);
      setShowLimitModal(true);
      return;
    }

    if (filteredInvoices.length === 0) {
      toast.error(language === 'pt' ? 'Nenhuma fatura para exportar' : 'No invoices to export');
      return;
    }

    const headers = ['Invoice Number', 'Client', 'Date', 'Due Date', 'Status', 'Currency', 'Subtotal', 'Tax', 'Total', 'Payment Date', 'Payment Method'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number || inv.id.slice(0, 8),
      inv.client_name,
      inv.date,
      inv.due_date || '',
      inv.status,
      inv.currency,
      inv.subtotal?.toFixed(2) || '0.00',
      inv.tax?.toFixed(2) || '0.00',
      inv.total?.toFixed(2) || '0.00',
      inv.paid_date || '',
      inv.payment_method || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    toast.success(language === 'pt' ? 'CSV exportado!' : 'CSV exported!');
  };

  const handleSyncToSheets = async () => {
    if (invoices.length === 0) {
      toast.error(language === 'pt' ? 'Nenhuma fatura para sincronizar' : 'No invoices to sync');
      return;
    }

    setSyncingToSheets(true);
    try {
      const response = await api.functions.invoke('syncInvoicesToSheets', {});
      
      if (response.data.success) {
        toast.success(
          language === 'pt' 
            ? `✅ ${response.data.invoicesCount} faturas sincronizadas com sucesso!` 
            : `✅ ${response.data.invoicesCount} invoices synced successfully!`
        );
        
        // Open the spreadsheet in a new tab
        if (response.data.spreadsheetUrl) {
          window.open(response.data.spreadsheetUrl, '_blank');
        }
      } else {
        toast.error(response.data.error || 'Sync failed');
      }
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao sincronizar com Google Sheets' : 'Error syncing to Google Sheets');
    } finally {
      setSyncingToSheets(false);
    }
  };

  const handleGenerateGoogleDocs = async (invoice) => {
    try {
      const response = await api.functions.invoke('generateInvoiceGoogleDocs', {
        invoiceId: invoice.id
      });
      
      if (response.data.success) {
        toast.success(language === 'pt' ? '✅ Documento Google Docs criado!' : '✅ Google Docs created!');
        window.open(response.data.docsUrl, '_blank');
      } else {
        toast.error(response.data.error || 'Failed to create document');
      }
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao criar documento Google Docs' : 'Error creating Google Docs');
    }
  };

  const getNextInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const seq = String(invoices.length + 1).padStart(4, '0');
    const prefix = companyProfile?.company_info?.invoice_prefix || 'INV';
    return `${prefix}-${year}-${seq}`;
  };

  const resetForm = () => {
    const ci = companyProfile?.company_info || {};
    const settings = companyProfile?.settings || {};
    setFormData({
      invoice_number: getNextInvoiceNumber(),
      client_name: '',
      client_email: '',
      client_country: '',
      client_tax_id: '',
      // Auto-populate seller fields from Company Profile
      seller_company_name: ci.company_name || '',
      seller_tax_id: ci.tax_number || '',
      seller_address: ci.address || '',
      seller_country: ci.country || '',
      seller_logo_url: ci.logo_url || '',
      seller_legal_name: ci.legal_name || '',
      seller_phone: ci.phone || '',
      seller_email: ci.email || '',
      seller_website: ci.website || '',
      seller_bank_name: ci.bank_name || '',
      seller_iban: ci.iban || '',
      seller_swift_bic: ci.swift_bic || '',
      date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'draft',
      items: [{ description: '', quantity: 1, price: 0, total: 0 }],
      tax_rate: ci.default_tax_rate || 0,
      tax: 0,
      currency: settings.currency || 'EUR',
      notes: '',
      service_category: '',
      description: '',
      hours: '',
      discount: 0,
      project_id: '',
      project_name: ''
    });
    setEditingInvoice(null);
  };

  // Tax rate suggestions by country
  const suggestTaxRate = (country) => {
    const taxRates = {
      'Portugal': 23,
      'Spain': 21,
      'France': 20,
      'Germany': 19,
      'Italy': 22,
      'United Kingdom': 20,
      'Ireland': 23,
      'Netherlands': 21,
      'Belgium': 21,
      'Austria': 20,
      'Sweden': 25,
      'Denmark': 25,
      'Finland': 24,
      'Poland': 23,
      'Czech Republic': 21,
      'Greece': 24,
      'Romania': 19,
      'Bulgaria': 20,
      'Croatia': 25,
      'United States': 0, // Varies by state
      'Canada': 5, // GST only
      'Brazil': 0, // Complex system
      'Australia': 10,
      'New Zealand': 15,
      'Japan': 10,
      'South Korea': 10,
      'China': 13,
      'India': 18,
      'Singapore': 9,
      'Switzerland': 7.7,
      'Norway': 25,
      'Mexico': 16
    };
    return taxRates[country] || 0;
  };

  const handleClientSelect = (clientName) => {
    const client = clients.find(c => c.name === clientName);
    setFormData({
      ...formData,
      client_name: clientName,
      client_email: client?.email || ''
    });
  };

  const handleCountryChange = (country) => {
    const suggestedRate = suggestTaxRate(country);
    setFormData({
      ...formData,
      client_country: country,
      tax_rate: suggestedRate
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, price: 0, total: 0 }]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].price || 0);
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const afterDiscount = subtotal - (formData.discount || 0);
    return afterDiscount * ((formData.tax_rate || 0) / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const afterDiscount = subtotal - (formData.discount || 0);
    const taxAmount = calculateTax();
    return afterDiscount + taxAmount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingInvoice) {
      const limit = checkLimit('invoices');
      if (!limit.allowed) {
        setLimitInfo(limit);
        setShowLimitModal(true);
        setShowDialog(false);
        return;
      }
    }
    
    // Add workspace_id to invoice data
    const currentUser = await api.auth.me();
    const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
    
    const invoiceData = {
      ...formData,
      workspace_id: workspaceId,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal()
    };

    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data: invoiceData });
    } else {
      createMutation.mutate(invoiceData);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number || '',
      client_name: invoice.client_name || '',
      client_email: invoice.client_email || '',
      client_country: invoice.client_country || '',
      client_tax_id: invoice.client_tax_id || '',
      seller_company_name: invoice.seller_company_name || '',
      seller_tax_id: invoice.seller_tax_id || '',
      seller_address: invoice.seller_address || '',
      seller_country: invoice.seller_country || '',
      date: invoice.date || '',
      due_date: invoice.due_date || '',
      status: invoice.status || 'draft',
      items: invoice.items || [{ description: '', quantity: 1, price: 0, total: 0 }],
      tax_rate: invoice.tax_rate || 0,
      tax: invoice.tax || 0,
      currency: invoice.currency || 'EUR',
      notes: invoice.notes || '',
      service_category: invoice.service_category || '',
      description: invoice.description || '',
      hours: invoice.hours || '',
      discount: invoice.discount || 0,
      project_id: invoice.project_id || '',
      project_name: invoice.project_name || ''
    });
    setShowDialog(true);
  };

  const statusLabels = {
    pt: { draft: 'Rascunho', sent: 'Enviada', paid: 'Paga', overdue: 'Vencida', cancelled: 'Cancelada' },
    en: { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' }
  };

  // --- Period filter helpers ---
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Compare invoice date by year+month to avoid timezone/time issues
  const isInPeriod = (invoice) => {
    if (!invoice.date) return false;
    // Parse as local date parts (YYYY-MM-DD)
    const [y, m] = invoice.date.split('-').map(Number);
    const invYear = y;
    const invMonth = m - 1; // 0-based

    if (periodPreset === 'this_month') {
      return invYear === currentYear && invMonth === currentMonth;
    }
    if (periodPreset === 'last_month') {
      const lm = currentMonth === 0 ? 11 : currentMonth - 1;
      const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
      return invYear === ly && invMonth === lm;
    }
    if (periodPreset === 'this_year') {
      return invYear === currentYear;
    }
    if (periodPreset === 'custom') {
      const invDate = new Date(invoice.date);
      const from = filterDateFrom ? new Date(filterDateFrom) : null;
      const to = filterDateTo ? new Date(filterDateTo + 'T23:59:59') : null;
      if (from && invDate < from) return false;
      if (to && invDate > to) return false;
      return true;
    }
    return true; // all_time
  };

  // Period-scoped invoices (for KPIs)
  const periodInvoices = invoices.filter(isInPeriod);

  // KPI: draft invoices excluded from financial figures
  const financialInvoices = periodInvoices.filter(inv => inv.status === 'sent' || inv.status === 'paid' || inv.status === 'overdue');
  const totalBilled = financialInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPaid = financialInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPending = financialInvoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalInvoices = periodInvoices.length; // drafts count in total invoice count

  const filteredInvoices = periodInvoices.filter(invoice => {
    const searchMatch = !searchTerm ||
      invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || invoice.status === filterStatus;
    const clientMatch = filterClient === 'all' || invoice.client_name === filterClient;
    const projectMatch = filterProject === 'all' || invoice.project_id === filterProject;
    return searchMatch && statusMatch && clientMatch && projectMatch;
  });

  // Mark invoice as sent
  const handleSendInvoice = (invoice) => {
    if (confirm(language === 'pt' ? 'Marcar esta fatura como enviada?' : 'Mark this invoice as sent?')) {
      updateMutation.mutate({ id: invoice.id, data: { status: 'sent' } });
    }
  };

  // --- Row actions ---
  const handleDuplicate = (invoice) => {
    // Issue date: 1st of NEXT month from today
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    // Due date: 30 days after issue date
    const nextDue = new Date(nextMonthDate);
    nextDue.setDate(nextDue.getDate() + 30);

    setEditingInvoice(null);
    setFormData({
      invoice_number: getNextInvoiceNumber(),
      client_name: invoice.client_name || '',
      client_email: invoice.client_email || '',
      client_country: invoice.client_country || '',
      client_tax_id: invoice.client_tax_id || '',
      seller_company_name: invoice.seller_company_name || '',
      seller_tax_id: invoice.seller_tax_id || '',
      seller_address: invoice.seller_address || '',
      seller_country: invoice.seller_country || '',
      date: nextMonthDate.toISOString().split('T')[0],
      due_date: nextDue.toISOString().split('T')[0],
      status: 'draft',
      items: invoice.items || [{ description: '', quantity: 1, price: 0, total: 0 }],
      tax_rate: invoice.tax_rate || 0,
      tax: invoice.tax || 0,
      currency: invoice.currency || 'EUR',
      notes: invoice.notes || '',
      service_category: invoice.service_category || '',
      description: invoice.description || '',
      hours: invoice.hours || '',
      discount: invoice.discount || 0,
      project_id: invoice.project_id || '',
      project_name: invoice.project_name || ''
    });
    setShowDialog(true);
  };

  const handleCancelInvoice = (invoice) => {
    if (confirm(language === 'pt' ? 'Cancelar esta fatura?' : 'Cancel this invoice?')) {
      updateMutation.mutate({ id: invoice.id, data: { status: 'cancelled' } });
    }
  };

  const handleViewInvoice = (invoice) => {
    setPrintInvoice(invoice);
    setShowPrintView(true);
  };

  const handleGenerateReceipt = (invoice) => {
    setReceiptPrefill(invoice);
    setShowReceiptDialog(true);
  };

  const periodPresetLabels = {
    pt: {
      this_month: 'Este Mês',
      last_month: 'Mês Passado',
      this_year: 'Este Ano',
      all_time: 'Sempre',
      custom: 'Personalizado'
    },
    en: {
      this_month: 'This Month',
      last_month: 'Last Month',
      this_year: 'This Year',
      all_time: 'All Time',
      custom: 'Custom'
    }
  };

  return (
    <AccessGuard page="Invoices">
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      
      

      {/* Main Content */}
      <main className="p-4 lg:pt-8 md:p-8 md:pt-8">
        <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {language === 'pt' ? 'Faturas' : 'Invoices'}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {language === 'pt' 
              ? 'Gira faturas, pagamentos e faturamento de clientes com segurança.'
              : 'Manage invoices, payments and client billing securely.'}
          </p>
        </div>

        <div className="flex gap-2">
          {invoices.length > 0 && (
            <>
              <Button
                onClick={handleSyncToSheets}
                disabled={syncingToSheets}
                className="gap-2 h-9 px-3 text-xs bg-card hover:bg-card border border-border hover:border-green-500/40 text-green-400 hover:text-green-300 transition-all"
              >
                <Sheet className="w-3.5 h-3.5" />
                {syncingToSheets ? (language === 'pt' ? 'A sincronizar...' : 'Syncing...') : 'Sheets'}
              </Button>
              <Button
                onClick={handleExportCSV}
                className="gap-2 h-9 px-3 text-xs bg-card hover:bg-card border border-border hover:border-primary/40 text-primary hover:text-primary transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </Button>
            </>
          )}
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-primary hover:bg-cyan-700 gap-2 h-9 px-3 text-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {language === 'pt' ? 'Nova Fatura' : 'New Invoice'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{language === 'pt' ? 'Faturado' : 'Billed'}</p>
              <div className="w-5 h-5 rounded bg-primary/15 flex items-center justify-center">
                <TrendingUp className="w-2.5 h-2.5 text-primary" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">€{totalBilled.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{language === 'pt' ? 'Recebido' : 'Paid'}</p>
              <div className="w-5 h-5 rounded bg-green-500/15 flex items-center justify-center">
                <CheckCircle className="w-2.5 h-2.5 text-green-400" />
              </div>
            </div>
            <p className="text-xl font-bold text-green-400 tabular-nums">€{totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{language === 'pt' ? 'Pendente' : 'Pending'}</p>
              <div className="w-5 h-5 rounded bg-orange-500/15 flex items-center justify-center">
                <Clock className="w-2.5 h-2.5 text-orange-400" />
              </div>
            </div>
            <p className="text-xl font-bold text-orange-400 tabular-nums">€{totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{language === 'pt' ? 'Faturas' : 'Invoices'}</p>
              <div className="w-5 h-5 rounded bg-purple-500/15 flex items-center justify-center">
                <Receipt className="w-2.5 h-2.5 text-purple-400" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">{totalInvoices}</p>
          </CardContent>
        </Card>
      </div>

      {/* Period + Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3 p-2.5 bg-card border border-border rounded-lg">
        <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />

        {/* Period preset pills */}
        <div className="flex gap-1 flex-wrap">
          {['this_month', 'last_month', 'this_year', 'all_time', 'custom'].map(preset => (
            <button
              key={preset}
              onClick={() => { setPeriodPreset(preset); }}
              className={`h-6 px-2.5 rounded-full text-[11px] font-medium transition-all ${
                periodPreset === preset
                  ? 'bg-primary text-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {periodPresetLabels[language][preset]}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-muted" />

        {/* Status filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-28 h-7 bg-background border-border text-muted-foreground text-[11px] rounded-md">
            <SelectValue placeholder={language === 'pt' ? 'Estado' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'pt' ? 'Todos' : 'All'}</SelectItem>
            <SelectItem value="draft">{statusLabels[language].draft}</SelectItem>
            <SelectItem value="sent">{statusLabels[language].sent}</SelectItem>
            <SelectItem value="paid">{statusLabels[language].paid}</SelectItem>
            <SelectItem value="overdue">{statusLabels[language].overdue}</SelectItem>
          </SelectContent>
        </Select>

        {/* Client filter */}
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-36 h-7 bg-background border-border text-muted-foreground text-[11px] rounded-md">
            <SelectValue placeholder={language === 'pt' ? 'Clientes' : 'Clients'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'pt' ? 'Todos' : 'All Clients'}</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Project filter (company only) */}
        {isCompany && projects.length > 0 && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-36 h-7 bg-background border-border text-muted-foreground text-[11px] rounded-md">
              <SelectValue placeholder={language === 'pt' ? 'Projetos' : 'Projects'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'pt' ? 'Todos Projetos' : 'All Projects'}</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Custom date range (only shown when preset=custom) */}
        {periodPreset === 'custom' && (
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-28 h-7 bg-background border-border text-muted-foreground text-[11px] rounded-md"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-28 h-7 bg-background border-border text-muted-foreground text-[11px] rounded-md"
            />
          </div>
        )}

        {(filterStatus !== 'all' || filterClient !== 'all' || filterProject !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterStatus('all'); setFilterClient('all'); setFilterProject('all'); }}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            {language === 'pt' ? 'Limpar' : 'Clear'}
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border bg-card">
          <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Fatura #' : 'Invoice #'}</div>
          <div className="col-span-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Cliente' : 'Client'}</div>
          <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Estado' : 'Status'}</div>
          <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Valor' : 'Amount'}</div>
          <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Vencimento' : 'Due Date'}</div>
          <div className="col-span-1" />
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {periodPreset === 'this_month'
                ? (language === 'pt' ? 'Nenhuma fatura este mês ainda.' : 'No invoices for this month yet.')
                : (language === 'pt' ? 'Nenhuma fatura encontrada.' : 'No invoices found.')}
            </p>
            <p className="text-muted-foreground text-xs mb-5 max-w-xs mx-auto">
              {language === 'pt'
                ? 'Crie uma fatura ou ajuste os filtros para ver resultados.'
                : 'Create an invoice or adjust the filters to see results.'}
            </p>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-primary hover:bg-cyan-700 gap-2 h-8 text-xs">
              <Plus className="w-3.5 h-3.5" />
              {language === 'pt' ? 'Criar Fatura' : 'Create Invoice'}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#334155]/50">
            {filteredInvoices.map((invoice) => (
              <InvoiceTableRow
                key={invoice.id}
                invoice={invoice}
                language={language}
                statusLabels={statusLabels}
                onEdit={handleEdit}
                onView={handleViewInvoice}
                onMarkPaid={(inv) => { setSelectedInvoice(inv); setShowPaymentDialog(true); }}
                onDuplicate={handleDuplicate}
                onCancel={handleCancelInvoice}
                onExportPDF={handleExportPDF}
                onSend={handleSendInvoice}
                onGenerateReceipt={handleGenerateReceipt}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Payment Summary Footer */}
      {filteredInvoices.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="bg-card/60 border border-border/60 rounded-lg px-3 py-2.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{language === 'pt' ? 'Em aberto' : 'Outstanding'}</span>
            <span className="text-sm font-bold text-orange-400 tabular-nums">
              €{filteredInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.total || 0), 0).toFixed(2)}
            </span>
          </div>
          <div className="bg-card/60 border border-border/60 rounded-lg px-3 py-2.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{language === 'pt' ? 'Cobrado' : 'Collected'}</span>
            <span className="text-sm font-bold text-green-400 tabular-nums">
              €{filteredInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0).toFixed(2)}
            </span>
          </div>
          <div className="bg-card/60 border border-border/60 rounded-lg px-3 py-2.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{language === 'pt' ? 'Total filtrado' : 'Filtered Total'}</span>
            <span className="text-sm font-bold text-foreground tabular-nums">
              €{filteredInvoices.reduce((s, i) => s + (i.total || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

        </div>
      </main>

      {/* Invoice Form Modal */}
      <InvoiceFormModal
        open={showDialog}
        onOpenChange={setShowDialog}
        editingInvoice={editingInvoice}
        formData={formData}
        setFormData={setFormData}
        clients={clients}
        projects={projects}
        isCompany={isCompany}
        language={language}
        onSubmit={handleSubmit}
        onDelete={() => {
          if (confirm(language === 'pt' ? 'Eliminar este registo?' : 'Delete this record?')) {
            deleteMutation.mutate(editingInvoice.id);
            setShowDialog(false);
          }
        }}
        calculateSubtotal={calculateSubtotal}
        calculateTax={calculateTax}
        calculateTotal={calculateTotal}
        addItem={addItem}
        removeItem={removeItem}
        updateItem={updateItem}
        handleClientSelect={handleClientSelect}
        handleCountryChange={handleCountryChange}
        statusLabels={statusLabels}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Plan Limit Modal */}
      {limitInfo && (
        <PlanLimitModal
          open={showLimitModal}
          onClose={() => {
            setShowLimitModal(false);
            setLimitInfo(null);
          }}
          limitType={limitInfo.limitType}
          currentPlan="free"
          suggestedPlan={limitInfo.suggestedPlan}
        />
      )}

      {/* Invoice Print View */}
      <InvoicePrintView
        open={showPrintView}
        onClose={() => { setShowPrintView(false); setPrintInvoice(null); }}
        invoice={printInvoice}
        language={language}
      />

      {/* Generate Receipt Dialog (from paid invoice) */}
      <ReceiptDialog
        open={showReceiptDialog}
        onClose={() => { setShowReceiptDialog(false); setReceiptPrefill(null); }}
        receipt={null}
        prefillInvoice={receiptPrefill}
        onSuccess={() => {
          queryClient.invalidateQueries(['receipts']);
          toast.success(language === 'pt' ? '✅ Recibo criado!' : '✅ Receipt created!');
        }}
      />

      {/* Mark Payment Dialog */}
      <MarkPaymentDialog
        open={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onMarkPaid={handleMarkPaid}
      />
    </div>
    </AccessGuard>
  );
}