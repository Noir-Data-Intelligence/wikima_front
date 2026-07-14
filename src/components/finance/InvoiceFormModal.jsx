import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import InvoiceTaxDisclaimer from '../InvoiceTaxDisclaimer';

// Compact label for dense forms
const FL = ({ children }) => (
  <label className="block text-[11px] font-medium text-muted-foreground mb-0.5 tracking-wide">{children}</label>
);

// Compact section divider with title
const Section = ({ title }) => (
  <div className="flex items-center gap-2 pt-3 pb-1">
    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-muted/50" />
  </div>
);

// Compact input style
const inputCls = "h-8 text-xs bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-0 rounded-md px-2.5";
const selectTriggerCls = "h-8 text-xs bg-background border-border text-foreground focus:border-primary/50 rounded-md";

export default function InvoiceFormModal({
  open,
  onOpenChange,
  editingInvoice,
  formData,
  setFormData,
  clients,
  projects,
  isCompany,
  language,
  onSubmit,
  onDelete,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  addItem,
  removeItem,
  updateItem,
  handleClientSelect,
  handleCountryChange,
  statusLabels,
  isSubmitting
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[88vh] overflow-y-auto p-0 border-border"
        style={{ backgroundColor: '#0d1526' }}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: '#0d1526' }}>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              {editingInvoice
                ? (language === 'pt' ? 'Editar Fatura' : 'Edit Invoice')
                : (language === 'pt' ? 'Nova Fatura' : 'New Invoice')}
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {editingInvoice
                ? (language === 'pt' ? 'Atualize os detalhes abaixo' : 'Update the details below')
                : (language === 'pt' ? 'Preencha os detalhes da fatura' : 'Fill in the invoice details')}
            </p>
          </div>
          {formData.invoice_number && (
            <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              {formData.invoice_number}
            </span>
          )}
        </div>

        <form onSubmit={onSubmit} className="px-5 pb-5 space-y-0">

          {/* Row 1: Invoice # + Currency + Status */}
          <div className="pt-3 grid grid-cols-12 gap-2.5">
            <div className="col-span-5">
              <FL>{language === 'pt' ? 'Nº Fatura' : 'Invoice #'}</FL>
              <Input
                className={inputCls}
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="INV-2025-0001"
                required
              />
            </div>
            <div className="col-span-3">
              <FL>{language === 'pt' ? 'Moeda' : 'Currency'}</FL>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="AOA">AOA (Kz)</SelectItem>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <FL>{language === 'pt' ? 'Estado' : 'Status'}</FL>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{statusLabels[language].draft}</SelectItem>
                  <SelectItem value="sent">{statusLabels[language].sent}</SelectItem>
                  <SelectItem value="paid">{statusLabels[language].paid}</SelectItem>
                  <SelectItem value="overdue">{statusLabels[language].overdue}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <div>
              <FL>{language === 'pt' ? 'Data de Emissão' : 'Issue Date'}</FL>
              <Input
                type="date"
                className={inputCls}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <FL>{language === 'pt' ? 'Data de Vencimento' : 'Due Date'}</FL>
              <Input
                type="date"
                className={inputCls}
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Seller Details */}
          <Section title={language === 'pt' ? 'Vendedor' : 'Seller'} />
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <FL>{language === 'pt' ? 'Nome / Empresa' : 'Company Name'}</FL>
              <Input
                className={inputCls}
                value={formData.seller_company_name}
                onChange={(e) => setFormData({ ...formData, seller_company_name: e.target.value })}
                placeholder={language === 'pt' ? 'A sua empresa' : 'Your company'}
                required
              />
            </div>
            <div>
              <FL>{language === 'pt' ? 'NIF / Tax ID' : 'Tax ID'}</FL>
              <Input
                className={inputCls}
                value={formData.seller_tax_id}
                onChange={(e) => setFormData({ ...formData, seller_tax_id: e.target.value })}
                placeholder="PT123456789"
              />
            </div>
            <div>
              <FL>{language === 'pt' ? 'Endereço' : 'Address'}</FL>
              <Input
                className={inputCls}
                value={formData.seller_address}
                onChange={(e) => setFormData({ ...formData, seller_address: e.target.value })}
                placeholder={language === 'pt' ? 'Rua, Cidade' : 'Street, City'}
              />
            </div>
            <div>
              <FL>{language === 'pt' ? 'País' : 'Country'}</FL>
              <Input
                className={inputCls}
                value={formData.seller_country}
                onChange={(e) => setFormData({ ...formData, seller_country: e.target.value })}
                placeholder="Portugal"
              />
            </div>
          </div>

          {/* Project (Company only) */}
          {isCompany && projects && projects.length > 0 && (
            <>
              <Section title={language === 'pt' ? 'Projeto' : 'Project'} />
              <div>
                <FL>{language === 'pt' ? 'Projeto *' : 'Project *'}</FL>
                <Select
                  value={formData.project_id || ''}
                  onValueChange={(v) => {
                    const p = projects.find(p => p.id === v);
                    setFormData({ ...formData, project_id: v, project_name: p?.name || '' });
                  }}
                >
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue placeholder={language === 'pt' ? 'Selecionar projeto...' : 'Select project...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Client Details */}
          <Section title={language === 'pt' ? 'Cliente' : 'Client'} />
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <FL>{language === 'pt' ? 'Cliente' : 'Client'}</FL>
              <Select value={formData.client_name} onValueChange={handleClientSelect}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue placeholder={language === 'pt' ? 'Selecionar...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FL>Email</FL>
              <Input
                type="email"
                className={inputCls}
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <FL>{language === 'pt' ? 'País' : 'Country'}</FL>
              <Input
                className={inputCls}
                value={formData.client_country}
                onChange={(e) => handleCountryChange(e.target.value)}
                placeholder="Portugal"
                required
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {language === 'pt' ? '💡 IVA sugerido automaticamente' : '💡 Tax rate auto-suggested'}
              </p>
            </div>
            <div>
              <FL>{language === 'pt' ? 'NIF / Tax ID (opcional)' : 'Tax ID (optional)'}</FL>
              <Input
                className={inputCls}
                value={formData.client_tax_id}
                onChange={(e) => setFormData({ ...formData, client_tax_id: e.target.value })}
                placeholder="PT987654321"
              />
            </div>
          </div>

          {/* Service Details */}
          <Section title={language === 'pt' ? 'Serviço' : 'Service'} />
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <FL>{language === 'pt' ? 'Categoria' : 'Category'}</FL>
              <Select value={formData.service_category} onValueChange={(v) => setFormData({ ...formData, service_category: v })}>
                <SelectTrigger className={selectTriggerCls}>
                  <SelectValue placeholder={language === 'pt' ? 'Selecionar...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulting">{language === 'pt' ? 'Consultoria' : 'Consulting'}</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="development">{language === 'pt' ? 'Desenvolvimento' : 'Development'}</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="support">{language === 'pt' ? 'Suporte' : 'Support'}</SelectItem>
                  <SelectItem value="other">{language === 'pt' ? 'Outro' : 'Other'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FL>{language === 'pt' ? 'Horas / Quantidade' : 'Hours / Qty'}</FL>
              <Input
                type="number"
                className={inputCls}
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="pt-2">
            <FL>{language === 'pt' ? 'Descrição do Serviço' : 'Service Description'}</FL>
            <Input
              className={inputCls}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={language === 'pt' ? 'O que foi realizado para o cliente' : 'What was delivered to the client'}
            />
          </div>

          {/* Line Items */}
          <Section title={language === 'pt' ? 'Itens' : 'Line Items'} />
          
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-1.5 mb-1 px-0.5">
            <div className="col-span-5 text-[10px] text-muted-foreground">{language === 'pt' ? 'Descrição' : 'Description'}</div>
            <div className="col-span-2 text-[10px] text-muted-foreground">{language === 'pt' ? 'Qtd' : 'Qty'}</div>
            <div className="col-span-2 text-[10px] text-muted-foreground">{language === 'pt' ? 'Preço' : 'Price'}</div>
            <div className="col-span-2 text-[10px] text-muted-foreground">Total</div>
            <div className="col-span-1" />
          </div>

          <div className="space-y-1.5">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-1.5 items-center">
                <div className="col-span-5">
                  <Input
                    className={inputCls}
                    placeholder={language === 'pt' ? 'Descrição do item' : 'Item description'}
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    className={`${inputCls} text-center`}
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    className={inputCls}
                    placeholder="0.00"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    className={`${inputCls} text-right bg-background text-muted-foreground cursor-default`}
                    value={item.total.toFixed(2)}
                    disabled
                    readOnly
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                    className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-2 flex items-center gap-1.5 text-[11px] text-primary hover:text-primary hover:bg-primary/90/5 px-2 py-1 rounded-md transition-colors border border-dashed border-primary/20 hover:border-primary/40 w-full justify-center"
          >
            <Plus className="w-3 h-3" />
            {language === 'pt' ? 'Adicionar linha' : 'Add line'}
          </button>

          {/* Totals */}
          <Section title={language === 'pt' ? 'Resumo' : 'Summary'} />

          {/* Tax disclaimer — compact version */}
          <div className="rounded-md bg-amber-500/5 border border-amber-500/10 px-3 py-2 mb-2">
            <InvoiceTaxDisclaimer language={language} compact />
          </div>

          <div className="flex justify-end">
            <div className="w-72 space-y-1.5">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">Subtotal</span>
                <span className="text-xs font-medium text-foreground tabular-nums">
                  {formData.currency} {calculateSubtotal().toFixed(2)}
                </span>
              </div>

              {/* Discount */}
              <div className="flex justify-between items-center gap-3">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {language === 'pt' ? 'Desconto' : 'Discount'}
                </span>
                <Input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  className={`${inputCls} w-24 text-right`}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Tax Rate */}
              <div className="flex justify-between items-center gap-3">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {language === 'pt' ? 'Taxa IVA / VAT (%)' : 'Tax Rate (%)'}
                </span>
                <Input
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  className={`${inputCls} w-24 text-right`}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              {/* Tax Amount */}
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">
                  {language === 'pt' ? 'Valor IVA / VAT' : 'Tax Amount'}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formData.currency} {calculateTax().toFixed(2)}
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm font-semibold text-foreground">
                  {language === 'pt' ? 'Total' : 'Total Amount'}
                </span>
                <span className="text-base font-bold text-primary tabular-nums">
                  {formData.currency} {calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Private Notes */}
          <Section title={language === 'pt' ? 'Notas' : 'Notes'} />
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={language === 'pt' ? 'Observações internas (não visíveis na fatura)' : 'Internal notes (not visible on invoice)'}
            rows={2}
            className="text-xs bg-background border-border text-foreground placeholder:text-muted-foreground resize-none rounded-md"
          />

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-border mt-4">
            <div>
              {editingInvoice && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="h-8 px-3 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  {language === 'pt' ? 'Eliminar' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-slate-500"
              >
                {language === 'pt' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8 px-4 text-xs bg-primary hover:bg-primary/90 text-foreground font-semibold"
              >
                {isSubmitting
                  ? (language === 'pt' ? 'A guardar...' : 'Saving...')
                  : (language === 'pt' ? 'Guardar Fatura' : 'Save Invoice')}
              </Button>
            </div>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}