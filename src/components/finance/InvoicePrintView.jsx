import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

function buildInvoiceHTML(invoice, language) {
  const statusLabels = {
    pt: { draft: 'Rascunho', sent: 'Enviada', paid: 'Paga', overdue: 'Vencida', cancelled: 'Cancelada' },
    en: { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' }
  };
  const statusColors = {
    draft: '#f59e0b', sent: '#3b82f6', paid: '#22c55e', overdue: '#ef4444', cancelled: '#6b7280'
  };
  const paymentMethodLabels = {
    bank_transfer: language === 'pt' ? 'Transferência Bancária' : 'Bank Transfer',
    mbway: 'MB Way', paypal: 'PayPal', stripe: 'Stripe',
    cash: language === 'pt' ? 'Dinheiro' : 'Cash',
    other: language === 'pt' ? 'Outro' : 'Other'
  };

  const subtotal = invoice.subtotal || (invoice.items || []).reduce((s, i) => s + (i.total || 0), 0) || 0;
  const tax = invoice.tax || 0;
  const discount = invoice.discount || 0;
  const total = invoice.total || 0;
  const locale = language === 'pt' ? 'pt-PT' : 'en-GB';
  const fmt = (d) => d ? new Date(d).toLocaleDateString(locale) : '—';
  const statusColor = statusColors[invoice.status] || '#6b7280';
  const statusLabel = statusLabels[language]?.[invoice.status] || invoice.status;

  const itemRows = (invoice.items || []).map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
      <td style="padding:10px 14px;font-size:13px;color:#1f2937">${item.description || '—'}</td>
      <td style="padding:10px 14px;font-size:13px;color:#4b5563;text-align:center">${item.quantity}</td>
      <td style="padding:10px 14px;font-size:13px;color:#4b5563;text-align:right">${invoice.currency} ${(item.price || 0).toFixed(2)}</td>
      <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#111827;text-align:right">${invoice.currency} ${(item.total || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${language === 'pt' ? 'Fatura' : 'Invoice'} — ${invoice.invoice_number || ''}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .seller-logo { max-height: 52px; max-width: 160px; object-fit: contain; margin-bottom: 8px; display: block; }
    .seller h1 { font-size: 22px; font-weight: 800; color: #111827; }
    .seller p { font-size: 12px; color: #6b7280; margin-top: 3px; }
    .bank-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #4b5563; }
    .bank-box .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 6px; }
    .doc-title { text-align: right; }
    .doc-title .type { font-size: 36px; font-weight: 900; letter-spacing: -1px; color: #111827; }
    .doc-title .number { font-size: 15px; font-weight: 700; color: #6b7280; margin-top: 4px; }
    .status-badge { display: inline-block; margin-top: 8px; padding: 3px 12px; border-radius: 999px; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: ${statusColor}; }
    .divider { border: none; border-top: 2px solid #e5e7eb; margin: 0 0 28px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 6px; }
    .value { font-size: 16px; font-weight: 700; color: #111827; }
    .value-sm { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .dates { text-align: right; }
    .date-row { margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    thead tr { background: #111827; color: #fff; }
    thead th { padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; }
    thead th:first-child { text-align: left; border-radius: 6px 0 0 6px; }
    thead th:last-child { border-radius: 0 6px 6px 0; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 28px; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; padding: 4px 0; }
    .totals-row.grand { font-size: 17px; font-weight: 800; color: #111827; border-top: 2px solid #111827; padding-top: 8px; margin-top: 4px; }
    .paid-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; color: #166534; font-size: 13px; font-weight: 600; }
    .notes-box { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
    .notes-box .label { color: #92400e; }
    .notes-box p { font-size: 13px; color: #78350f; margin-top: 4px; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; }
    .footer p { font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
    .footer .disclaimer { font-size: 11px; color: #d97706; font-weight: 500; }
  </style>
</head>
<body>
  <div class="header">
    <div class="seller">
      ${invoice.seller_logo_url ? `<img class="seller-logo" src="${invoice.seller_logo_url}" alt="Logo" />` : ''}
      ${invoice.seller_company_name ? `<h1>${invoice.seller_company_name}</h1>` : ''}
      ${invoice.seller_legal_name && invoice.seller_legal_name !== invoice.seller_company_name ? `<p>${invoice.seller_legal_name}</p>` : ''}
      ${invoice.seller_address ? `<p>${invoice.seller_address}</p>` : ''}
      ${invoice.seller_country ? `<p>${invoice.seller_country}</p>` : ''}
      ${invoice.seller_tax_id ? `<p>${language === 'pt' ? 'NIF' : 'Tax ID'}: ${invoice.seller_tax_id}</p>` : ''}
      ${invoice.seller_phone ? `<p>${invoice.seller_phone}</p>` : ''}
      ${invoice.seller_email ? `<p>${invoice.seller_email}</p>` : ''}
      ${invoice.seller_website ? `<p>${invoice.seller_website}</p>` : ''}
    </div>
    <div class="doc-title">
      <div class="type">${language === 'pt' ? 'FATURA' : 'INVOICE'}</div>
      <div class="number">${invoice.invoice_number || ''}</div>
      <div class="status-badge">${statusLabel}</div>
    </div>
  </div>

  <hr class="divider" />

  <div class="parties">
    <div>
      <div class="label">${language === 'pt' ? 'Faturado a' : 'Bill To'}</div>
      <div class="value">${invoice.client_name || ''}</div>
      ${invoice.client_email ? `<div class="value-sm">${invoice.client_email}</div>` : ''}
      ${invoice.client_country ? `<div class="value-sm">${invoice.client_country}</div>` : ''}
      ${invoice.client_tax_id ? `<div class="value-sm">${language === 'pt' ? 'NIF' : 'Tax ID'}: ${invoice.client_tax_id}</div>` : ''}
    </div>
    <div class="dates">
      <div class="date-row">
        <div class="label">${language === 'pt' ? 'Data de Emissão' : 'Issue Date'}</div>
        <div style="font-weight:600;color:#1f2937">${fmt(invoice.date)}</div>
      </div>
      ${invoice.due_date ? `<div class="date-row"><div class="label">${language === 'pt' ? 'Data de Vencimento' : 'Due Date'}</div><div style="font-weight:600;color:#1f2937">${fmt(invoice.due_date)}</div></div>` : ''}
      ${invoice.status === 'paid' && invoice.paid_date ? `<div class="date-row"><div class="label" style="color:#16a34a">${language === 'pt' ? 'Data de Pagamento' : 'Payment Date'}</div><div style="font-weight:600;color:#16a34a">${fmt(invoice.paid_date)}</div></div>` : ''}
    </div>
  </div>

  ${(invoice.items || []).length > 0 ? `
  <table>
    <thead>
      <tr>
        <th style="text-align:left">${language === 'pt' ? 'Descrição' : 'Description'}</th>
        <th style="text-align:center;width:70px">${language === 'pt' ? 'Qtd' : 'Qty'}</th>
        <th style="text-align:right;width:110px">${language === 'pt' ? 'Preço Unit.' : 'Unit Price'}</th>
        <th style="text-align:right;width:110px">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  ` : invoice.description ? `<div style="background:#f9fafb;border-radius:8px;padding:14px;margin-bottom:28px;font-size:13px;color:#374151">${invoice.description}</div>` : ''}

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${invoice.currency} ${subtotal.toFixed(2)}</span></div>
      ${discount > 0 ? `<div class="totals-row"><span>${language === 'pt' ? 'Desconto' : 'Discount'}</span><span>- ${invoice.currency} ${discount.toFixed(2)}</span></div>` : ''}
      ${tax > 0 ? `<div class="totals-row"><span>${language === 'pt' ? 'IVA/VAT' : 'Tax'}${invoice.tax_rate ? ` (${invoice.tax_rate}%)` : ''}</span><span>${invoice.currency} ${tax.toFixed(2)}</span></div>` : ''}
      <div class="totals-row grand"><span>${language === 'pt' ? 'Total' : 'Total'}</span><span>${invoice.currency} ${total.toFixed(2)}</span></div>
    </div>
  </div>

  ${invoice.status === 'paid' && invoice.payment_method ? `
  <div class="paid-box">
    ✓ ${language === 'pt' ? 'Pagamento recebido via' : 'Payment received via'} ${paymentMethodLabels[invoice.payment_method] || invoice.payment_method}${invoice.paid_date ? ' — ' + fmt(invoice.paid_date) : ''}
    ${invoice.payment_notes ? `<div style="margin-top:4px;font-weight:400;font-size:12px">${invoice.payment_notes}</div>` : ''}
  </div>` : ''}

  ${invoice.notes ? `
  <div class="notes-box">
    <div class="label">${language === 'pt' ? 'Notas' : 'Notes'}</div>
    <p>${invoice.notes}</p>
  </div>` : ''}

  ${(invoice.seller_bank_name || invoice.seller_iban || invoice.seller_swift_bic) ? `
  <div class="bank-box">
    <div class="label">${language === 'pt' ? 'Dados Bancários' : 'Banking Details'}</div>
    ${invoice.seller_bank_name ? `<span>${invoice.seller_bank_name}</span>` : ''}
    ${invoice.seller_iban ? ` &nbsp;·&nbsp; IBAN: ${invoice.seller_iban}` : ''}
    ${invoice.seller_swift_bic ? ` &nbsp;·&nbsp; SWIFT: ${invoice.seller_swift_bic}` : ''}
  </div>` : ''}

  <div class="footer">
    <p>${language === 'pt' ? `Documento gerado por WiKima · ${invoice.invoice_number || ''}` : `Document generated by WiKima · ${invoice.invoice_number || ''}`}</p>
    <p class="disclaimer">⚠ ${language === 'pt' ? 'Documento administrativo. A WiKima não é software fiscal certificado. A conformidade fiscal é da responsabilidade do utilizador.' : "Administrative document. WiKima is not certified tax software. Tax compliance remains the user's responsibility."}</p>
  </div>
</body>
</html>`;
}

export default function InvoicePrintView({ open, onClose, invoice, language }) {
  if (!invoice) return null;

  const handlePrint = () => {
    const html = buildInvoiceHTML(invoice, language);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  const statusLabels = {
    pt: { draft: 'Rascunho', sent: 'Enviada', paid: 'Paga', overdue: 'Vencida', cancelled: 'Cancelada' },
    en: { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' }
  };
  const statusColors = {
    draft: '#f59e0b', sent: '#3b82f6', paid: '#22c55e', overdue: '#ef4444', cancelled: '#6b7280'
  };
  const paymentMethodLabels = {
    bank_transfer: language === 'pt' ? 'Transferência Bancária' : 'Bank Transfer',
    mbway: 'MB Way', paypal: 'PayPal', stripe: 'Stripe',
    cash: language === 'pt' ? 'Dinheiro' : 'Cash',
    other: language === 'pt' ? 'Outro' : 'Other'
  };

  const subtotal = invoice.subtotal || (invoice.items || []).reduce((s, i) => s + (i.total || 0), 0) || 0;
  const tax = invoice.tax || 0;
  const discount = invoice.discount || 0;
  const total = invoice.total || 0;
  const fmt = (d) => d ? new Date(d).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB') : '—';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 sticky top-0 z-10">
          <span className="font-semibold text-gray-700">
            {language === 'pt' ? 'Pré-visualização da Fatura' : 'Invoice Preview'} — {invoice.invoice_number}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              {language === 'pt' ? 'Imprimir / PDF' : 'Print / PDF'}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-10 bg-white text-gray-900">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              {invoice.seller_logo_url && <img src={invoice.seller_logo_url} alt="Logo" className="h-12 w-auto object-contain mb-2" />}
              {invoice.seller_company_name && <h1 className="text-2xl font-bold text-gray-900">{invoice.seller_company_name}</h1>}
              {invoice.seller_legal_name && invoice.seller_legal_name !== invoice.seller_company_name && <p className="text-sm text-gray-500 mt-0.5">{invoice.seller_legal_name}</p>}
              {invoice.seller_address && <p className="text-sm text-gray-500 mt-1">{invoice.seller_address}</p>}
              {invoice.seller_country && <p className="text-sm text-gray-500">{invoice.seller_country}</p>}
              {invoice.seller_tax_id && <p className="text-sm text-gray-500">{language === 'pt' ? 'NIF:' : 'Tax ID:'} {invoice.seller_tax_id}</p>}
              {invoice.seller_phone && <p className="text-sm text-gray-500">{invoice.seller_phone}</p>}
              {invoice.seller_email && <p className="text-sm text-gray-500">{invoice.seller_email}</p>}
              {invoice.seller_website && <p className="text-sm text-gray-500">{invoice.seller_website}</p>}
            </div>
            <div className="text-right">
              <div className="text-4xl font-black tracking-tight text-gray-900 mb-1">{language === 'pt' ? 'FATURA' : 'INVOICE'}</div>
              <div className="text-lg font-bold text-muted-foreground">{invoice.invoice_number}</div>
              <div className="inline-block mt-2 px-3 py-1 rounded-full text-foreground text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: statusColors[invoice.status] || '#6b7280' }}>
                {statusLabels[language]?.[invoice.status] || invoice.status}
              </div>
            </div>
          </div>

          <div className="border-t-2 border-gray-200 mb-8" />

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{language === 'pt' ? 'Faturado a' : 'Bill To'}</div>
              <div className="font-bold text-gray-900 text-lg">{invoice.client_name}</div>
              {invoice.client_email && <div className="text-sm text-gray-500">{invoice.client_email}</div>}
              {invoice.client_country && <div className="text-sm text-gray-500">{invoice.client_country}</div>}
              {invoice.client_tax_id && <div className="text-sm text-gray-500">{language === 'pt' ? 'NIF:' : 'Tax ID:'} {invoice.client_tax_id}</div>}
            </div>
            <div className="text-right space-y-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block">{language === 'pt' ? 'Data de Emissão' : 'Issue Date'}</span>
                <span className="font-semibold text-gray-800">{fmt(invoice.date)}</span>
              </div>
              {invoice.due_date && <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block">{language === 'pt' ? 'Data de Vencimento' : 'Due Date'}</span>
                <span className="font-semibold text-gray-800">{fmt(invoice.due_date)}</span>
              </div>}
              {invoice.status === 'paid' && invoice.paid_date && <div>
                <span className="text-xs font-bold uppercase tracking-widest text-green-500 block">{language === 'pt' ? 'Data de Pagamento' : 'Payment Date'}</span>
                <span className="font-semibold text-green-600">{fmt(invoice.paid_date)}</span>
              </div>}
            </div>
          </div>

          {(invoice.items || []).length > 0 && (
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900 text-foreground">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-tl-lg">{language === 'pt' ? 'Descrição' : 'Description'}</th>
                    <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider w-20">{language === 'pt' ? 'Qtd' : 'Qty'}</th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider w-28">{language === 'pt' ? 'Preço Unit.' : 'Unit Price'}</th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider w-28 rounded-tr-lg">{language === 'pt' ? 'Total' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 text-sm text-gray-800">{item.description || '—'}</td>
                      <td className="py-3 px-4 text-sm text-center text-muted-foreground">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-right text-muted-foreground">{invoice.currency} {(item.price || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">{invoice.currency} {(item.total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{invoice.currency} {subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm text-muted-foreground"><span>{language === 'pt' ? 'Desconto' : 'Discount'}</span><span>- {invoice.currency} {discount.toFixed(2)}</span></div>}
              {tax > 0 && <div className="flex justify-between text-sm text-muted-foreground"><span>{language === 'pt' ? 'IVA/VAT' : 'Tax'}{invoice.tax_rate ? ` (${invoice.tax_rate}%)` : ''}</span><span>{invoice.currency} {tax.toFixed(2)}</span></div>}
              <div className="border-t-2 border-gray-900 pt-2 flex justify-between font-bold text-lg text-gray-900"><span>{language === 'pt' ? 'Total' : 'Total'}</span><span>{invoice.currency} {total.toFixed(2)}</span></div>
            </div>
          </div>

          {invoice.status === 'paid' && invoice.payment_method && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold">
                  {language === 'pt' ? 'Pagamento recebido via' : 'Payment received via'} {paymentMethodLabels[invoice.payment_method] || invoice.payment_method}
                  {invoice.paid_date ? ` — ${fmt(invoice.paid_date)}` : ''}
                </span>
              </div>
              {invoice.payment_notes && <p className="text-sm text-green-600 mt-1 pl-4">{invoice.payment_notes}</p>}
            </div>
          )}

          {invoice.notes && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{language === 'pt' ? 'Notas' : 'Notes'}</div>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}

          {(invoice.seller_bank_name || invoice.seller_iban || invoice.seller_swift_bic) && (
            <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-muted-foreground">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{language === 'pt' ? 'Dados Bancários' : 'Banking Details'}</div>
              <span>{[invoice.seller_bank_name, invoice.seller_iban && `IBAN: ${invoice.seller_iban}`, invoice.seller_swift_bic && `SWIFT: ${invoice.seller_swift_bic}`].filter(Boolean).join(' · ')}</span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6 text-center space-y-1">
            <p className="text-xs text-gray-400">{language === 'pt' ? `Documento gerado por WiKima · ${invoice.invoice_number}` : `Document generated by WiKima · ${invoice.invoice_number}`}</p>
            <p className="text-xs text-amber-600 font-medium">⚠ {language === 'pt' ? 'Documento administrativo. A WiKima não é software fiscal certificado. A conformidade fiscal é da responsabilidade do utilizador.' : "Administrative document. WiKima is not certified tax software. Tax compliance remains the user's responsibility."}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}