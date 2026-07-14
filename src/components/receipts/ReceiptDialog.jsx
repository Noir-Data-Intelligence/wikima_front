import { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { api } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

const BLANK = {
  receipt_number: '',
  client_id: '',
  client_name: '',
  project_id: '',
  project_name: '',
  invoice_id: '',
  invoice_number: '',
  amount: '',
  currency: 'EUR',
  payment_method: 'transfer',
  date: new Date().toISOString().split('T')[0],
  status: 'issued',
  notes: '',
  seller_company_name: '',
  seller_legal_name: '',
  seller_tax_id: '',
  seller_address: '',
  seller_country: '',
  seller_phone: '',
  seller_email: '',
  seller_website: '',
  seller_logo_url: '',
  seller_bank_name: '',
  seller_iban: '',
  seller_swift_bic: ''
};

export default function ReceiptDialog({ open, onClose, receipt, onSuccess, prefillInvoice, companyProfile, projects = [], isCompany = false, defaultProjectId = '', defaultProjectName = '' }) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState(BLANK);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    loadClients();

    const ci = companyProfile?.company_info || {};
    const settings = companyProfile?.settings || {};

    if (receipt) {
      setFormData({
        receipt_number: receipt.receipt_number || '',
        client_id: receipt.client_id || '',
        client_name: receipt.client_name || '',
        project_id: receipt.project_id || '',
        project_name: receipt.project_name || '',
        invoice_id: receipt.invoice_id || '',
        invoice_number: receipt.invoice_number || '',
        amount: receipt.amount || '',
        currency: receipt.currency || 'EUR',
        payment_method: receipt.payment_method || 'transfer',
        date: receipt.date || new Date().toISOString().split('T')[0],
        status: receipt.status || 'issued',
        notes: receipt.notes || '',
        // Preserve historic seller snapshot
        seller_company_name: receipt.seller_company_name || '',
        seller_legal_name: receipt.seller_legal_name || '',
        seller_tax_id: receipt.seller_tax_id || '',
        seller_address: receipt.seller_address || '',
        seller_country: receipt.seller_country || '',
        seller_phone: receipt.seller_phone || '',
        seller_email: receipt.seller_email || '',
        seller_website: receipt.seller_website || '',
        seller_logo_url: receipt.seller_logo_url || '',
        seller_bank_name: receipt.seller_bank_name || '',
        seller_iban: receipt.seller_iban || '',
        seller_swift_bic: receipt.seller_swift_bic || ''
      });
      if (receipt.client_id) loadInvoicesForClient(receipt.client_id);
    } else if (prefillInvoice) {
      const nextNum = `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      setFormData({
        receipt_number: nextNum,
        client_id: prefillInvoice.client_id || '',
        client_name: prefillInvoice.client_name || '',
        project_id: prefillInvoice.project_id || defaultProjectId || '',
        project_name: prefillInvoice.project_name || defaultProjectName || '',
        invoice_id: prefillInvoice.id || '',
        invoice_number: prefillInvoice.invoice_number || '',
        amount: prefillInvoice.total || '',
        currency: prefillInvoice.currency || settings.currency || 'EUR',
        payment_method: prefillInvoice.payment_method || 'transfer',
        date: prefillInvoice.paid_date || new Date().toISOString().split('T')[0],
        status: 'issued',
        notes: '',
        // Snapshot company profile at creation time
        seller_company_name: ci.company_name || '',
        seller_legal_name: ci.legal_name || '',
        seller_tax_id: ci.tax_number || '',
        seller_address: ci.address || '',
        seller_country: ci.country || '',
        seller_phone: ci.phone || '',
        seller_email: ci.email || '',
        seller_website: ci.website || '',
        seller_logo_url: ci.logo_url || '',
        seller_bank_name: ci.bank_name || '',
        seller_iban: ci.iban || '',
        seller_swift_bic: ci.swift_bic || ''
      });
      if (prefillInvoice.client_id) loadInvoicesForClient(prefillInvoice.client_id);
    } else {
      setFormData({
        ...BLANK,
        currency: settings.currency || 'EUR',
        project_id: defaultProjectId || '',
        project_name: defaultProjectName || '',
        // Snapshot company profile at creation time
        seller_company_name: ci.company_name || '',
        seller_legal_name: ci.legal_name || '',
        seller_tax_id: ci.tax_number || '',
        seller_address: ci.address || '',
        seller_country: ci.country || '',
        seller_phone: ci.phone || '',
        seller_email: ci.email || '',
        seller_website: ci.website || '',
        seller_logo_url: ci.logo_url || '',
        seller_bank_name: ci.bank_name || '',
        seller_iban: ci.iban || '',
        seller_swift_bic: ci.swift_bic || ''
      });
    }
  }, [open, receipt, prefillInvoice]);

  const loadClients = async () => {
    try {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;
      const list = await api.entities.Client.filter({ workspace_id: wsId });
      setClients(list);
    } catch {}
  };

  const loadInvoicesForClient = async (clientId) => {
    try {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;
      // Load only paid invoices to maintain invoice-receipt hierarchy
      const list = await api.entities.Invoice.filter({ workspace_id: wsId, client_id: clientId, status: 'paid' });
      setInvoices(list);
    } catch {}
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setFormData(prev => ({ ...prev, client_id: clientId, client_name: client?.name || '', invoice_id: '', invoice_number: '' }));
    loadInvoicesForClient(clientId);
  };

  const handleInvoiceChange = (invoiceId) => {
    const inv = invoices.find(i => i.id === invoiceId);
    setFormData(prev => ({
      ...prev,
      invoice_id: invoiceId,
      invoice_number: inv?.invoice_number || '',
      amount: inv ? inv.total : prev.amount,
      currency: inv?.currency || prev.currency,
      payment_method: inv?.payment_method || prev.payment_method,
      date: inv?.paid_date || prev.date
    }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error(language === 'pt' ? 'Ficheiro muito grande (máx 10MB)' : 'File too large (max 10MB)');
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.receipt_number || !formData.client_name || !formData.amount) {
      toast.error(language === 'pt' ? 'Preencha os campos obrigatórios' : 'Fill required fields');
      return;
    }

    setLoading(true);
    try {
      const user = await api.auth.me();
      const wsId = user.current_workspace_id || user.default_workspace_id;

      let fileUrl = receipt?.file_url || null;
      let fileName = receipt?.file_name || null;
      let fileSize = receipt?.file_size || null;

      if (file) {
        const result = await api.integrations.Core.UploadFile({ file });
        fileUrl = result.file_url;
        fileName = file.name;
        fileSize = file.size;
      }

      const data = {
        workspace_id: wsId,
        receipt_number: formData.receipt_number,
        client_id: formData.client_id || null,
        client_name: formData.client_name,
        project_id: formData.project_id || null,
        project_name: formData.project_name || null,
        invoice_id: formData.invoice_id || null,
        invoice_number: formData.invoice_number || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        payment_method: formData.payment_method,
        date: formData.date,
        status: formData.status,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        notes: formData.notes,
        seller_company_name: formData.seller_company_name || null,
        seller_legal_name: formData.seller_legal_name || null,
        seller_tax_id: formData.seller_tax_id || null,
        seller_address: formData.seller_address || null,
        seller_country: formData.seller_country || null,
        seller_phone: formData.seller_phone || null,
        seller_email: formData.seller_email || null,
        seller_website: formData.seller_website || null,
        seller_logo_url: formData.seller_logo_url || null,
        seller_bank_name: formData.seller_bank_name || null,
        seller_iban: formData.seller_iban || null,
        seller_swift_bic: formData.seller_swift_bic || null
      };

      if (receipt) {
        await api.entities.Receipt.update(receipt.id, data);
      } else {
        await api.entities.Receipt.create(data);
        if (fileUrl) {
          await api.entities.Document.create({
            workspace_id: wsId,
            title: `Recibo ${formData.receipt_number} - ${formData.client_name}`,
            file_url: fileUrl,
            category: 'other',
            client_id: formData.client_id,
            client_name: formData.client_name,
            file_type: file?.type || 'application/pdf',
            file_size: fileSize,
            tags: ['receipt', formData.receipt_number, formData.client_name],
            notes: `Recibo de pagamento: ${formData.amount} ${formData.currency}`
          });
        }
      }

      toast.success(language === 'pt' ? 'Recibo guardado!' : 'Receipt saved!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(language === 'pt' ? 'Erro ao guardar' : 'Error saving');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, children) => (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );

  const inputCls = "bg-background border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50";
  const selectCls = "bg-background border-border text-foreground text-sm";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            {receipt
              ? (language === 'pt' ? 'Editar Recibo' : 'Edit Receipt')
              : prefillInvoice
                ? (language === 'pt' ? 'Gerar Recibo' : 'Generate Receipt')
                : (language === 'pt' ? 'Novo Recibo' : 'New Receipt')}
          </DialogTitle>
          {prefillInvoice && (
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'pt'
                ? `A gerar a partir da fatura ${prefillInvoice.invoice_number || ''}`
                : `Generating from invoice ${prefillInvoice.invoice_number || ''}`}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid md:grid-cols-2 gap-3">
            {field(language === 'pt' ? 'Número do Recibo *' : 'Receipt Number *',
              <Input value={formData.receipt_number} onChange={e => setFormData(p => ({ ...p, receipt_number: e.target.value }))} required placeholder="REC-2026-0001" className={inputCls} />
            )}
            {field(language === 'pt' ? 'Data *' : 'Date *',
              <Input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} required className={inputCls} />
            )}
          </div>

          {isCompany && projects.length > 0 && field(language === 'pt' ? 'Projeto *' : 'Project *',
            <Select value={formData.project_id} onValueChange={v => {
              const p = projects.find(p => p.id === v);
              setFormData(prev => ({ ...prev, project_id: v, project_name: p?.name || '' }));
            }}>
              <SelectTrigger className={selectCls}>
                <SelectValue placeholder={language === 'pt' ? 'Selecionar projeto' : 'Select project'} />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="grid md:grid-cols-2 gap-3">
          {field(language === 'pt' ? 'Cliente *' : 'Client *',
            <Select value={formData.client_id} onValueChange={handleClientChange}>
              <SelectTrigger className={selectCls}>
                <SelectValue placeholder={language === 'pt' ? 'Selecionar cliente' : 'Select client'} />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {field(language === 'pt' ? 'Fatura Paga *' : 'Paid Invoice *',
            <Select value={formData.invoice_id} onValueChange={handleInvoiceChange} disabled={!formData.client_id}>
              <SelectTrigger className={selectCls}>
                <SelectValue placeholder={
                  !formData.client_id
                    ? (language === 'pt' ? 'Selecione primeiro um cliente' : 'Select a client first')
                    : invoices.length === 0
                      ? (language === 'pt' ? 'Sem faturas pagas' : 'No paid invoices')
                      : (language === 'pt' ? 'Selecionar fatura' : 'Select invoice')
                } />
              </SelectTrigger>
              <SelectContent>
                {invoices.map(inv => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoice_number} — {inv.total?.toFixed(2)} {inv.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {field(language === 'pt' ? 'Valor *' : 'Amount *',
              <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} required placeholder="0.00" className={inputCls} />
            )}
            {field(language === 'pt' ? 'Moeda' : 'Currency',
              <Select value={formData.currency} onValueChange={v => setFormData(p => ({ ...p, currency: v }))}>
                <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="AOA">AOA (Kz)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            )}
            {field(language === 'pt' ? 'Estado' : 'Status',
              <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="issued">{language === 'pt' ? 'Emitido' : 'Issued'}</SelectItem>
                  <SelectItem value="refunded">{language === 'pt' ? 'Reembolsado' : 'Refunded'}</SelectItem>
                  <SelectItem value="cancelled">{language === 'pt' ? 'Cancelado' : 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {field(language === 'pt' ? 'Método de Pagamento' : 'Payment Method',
            <Select value={formData.payment_method} onValueChange={v => setFormData(p => ({ ...p, payment_method: v }))}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{language === 'pt' ? 'Dinheiro' : 'Cash'}</SelectItem>
                <SelectItem value="transfer">{language === 'pt' ? 'Transferência' : 'Transfer'}</SelectItem>
                <SelectItem value="card">{language === 'pt' ? 'Cartão' : 'Card'}</SelectItem>
                <SelectItem value="mobile">{language === 'pt' ? 'Móvel' : 'Mobile'}</SelectItem>
                <SelectItem value="other">{language === 'pt' ? 'Outro' : 'Other'}</SelectItem>
              </SelectContent>
            </Select>
          )}

          {field(language === 'pt' ? 'Ficheiro do Recibo' : 'Receipt File',
            <label className="flex items-center gap-3 w-full h-14 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-background px-4">
              {file ? <FileText className="w-5 h-5 text-primary flex-shrink-0" /> :
               receipt?.file_url ? <FileText className="w-5 h-5 text-green-400 flex-shrink-0" /> :
               <Upload className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
              <span className="text-xs text-muted-foreground truncate">
                {file ? file.name : receipt?.file_name || (language === 'pt' ? 'Escolher ficheiro (PDF, imagem)' : 'Choose file (PDF, image)')}
              </span>
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
            </label>
          )}

          {field(language === 'pt' ? 'Notas' : 'Notes',
            <Textarea
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder={language === 'pt' ? 'Observações adicionais...' : 'Additional notes...'}
              rows={2}
              className={inputCls}
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-muted-foreground hover:text-foreground h-8 text-xs">
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 h-8 text-xs">
              {loading ? (language === 'pt' ? 'A guardar...' : 'Saving...') : (language === 'pt' ? 'Guardar Recibo' : 'Save Receipt')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}