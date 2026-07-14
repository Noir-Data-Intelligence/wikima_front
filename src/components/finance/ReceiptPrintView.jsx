import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

function buildReceiptHTML(receipt, language) {
  const paymentMethodLabels = {
    cash: language === 'pt' ? 'Dinheiro' : 'Cash',
    transfer: language === 'pt' ? 'Transferência Bancária' : 'Bank Transfer',
    card: language === 'pt' ? 'Cartão' : 'Card',
    mobile: language === 'pt' ? 'Pagamento Móvel' : 'Mobile Payment',
    other: language === 'pt' ? 'Outro' : 'Other'
  };
  const currencySymbols = { EUR: '€', AOA: 'Kz', USD: '$', BRL: 'R$', GBP: '£' };
  const locale = language === 'pt' ? 'pt-PT' : 'en-GB';
  const fmt = (d) => d ? new Date(d).toLocaleDateString(locale) : '—';
  const sym = currencySymbols[receipt.currency] || receipt.currency;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${language === 'pt' ? 'Recibo' : 'Receipt'} — ${receipt.receipt_number}</title>
  <style>
    @page { size: A4; margin: 22mm 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; }
    .seller-block { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
    .seller-logo { max-height: 48px; max-width: 140px; object-fit: contain; }
    .seller-info .company { font-size: 17px; font-weight: 800; color: #111827; }
    .seller-info p { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .header-band { background: #111827; color: #fff; border-radius: 10px; padding: 24px 28px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .header-band .title { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
    .header-band .number { font-size: 13px; color: #9ca3af; margin-top: 5px; }
    .header-band .amount { text-align: right; font-size: 32px; font-weight: 900; }
    .header-band .type { font-size: 11px; color: #9ca3af; margin-top: 5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 6px; }
    .value { font-size: 16px; font-weight: 700; color: #111827; }
    .amount-box { border: 2px solid #e5e7eb; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 28px; }
    .amount-box .amount-value { font-size: 40px; font-weight: 900; color: #111827; }
    .bank-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #4b5563; }
    .bank-box .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 6px; }
    .notes-box { background: #f9fafb; border-radius: 8px; padding: 14px 16px; margin-bottom: 28px; }
    .notes-box p { font-size: 13px; color: #374151; margin-top: 6px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; margin-bottom: 16px; }
    .sig-line { border-top: 1px solid #d1d5db; padding-top: 8px; text-align: center; font-size: 11px; color: #9ca3af; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; margin-top: 24px; }
    .footer p { font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
    .footer .disclaimer { font-size: 11px; color: #d97706; font-weight: 500; }
  </style>
</head>
<body>
  ${(receipt.seller_company_name || receipt.seller_logo_url) ? `
  <div class="seller-block">
    ${receipt.seller_logo_url ? `<img class="seller-logo" src="${receipt.seller_logo_url}" alt="Logo" />` : ''}
    <div class="seller-info">
      ${receipt.seller_company_name ? `<div class="company">${receipt.seller_company_name}</div>` : ''}
      ${receipt.seller_legal_name && receipt.seller_legal_name !== receipt.seller_company_name ? `<p>${receipt.seller_legal_name}</p>` : ''}
      ${receipt.seller_tax_id ? `<p>${language === 'pt' ? 'NIF' : 'Tax ID'}: ${receipt.seller_tax_id}</p>` : ''}
      ${receipt.seller_address ? `<p>${receipt.seller_address}${receipt.seller_country ? `, ${receipt.seller_country}` : ''}</p>` : (receipt.seller_country ? `<p>${receipt.seller_country}</p>` : '')}
      ${receipt.seller_phone ? `<p>${receipt.seller_phone}</p>` : ''}
      ${receipt.seller_email ? `<p>${receipt.seller_email}</p>` : ''}
      ${receipt.seller_website ? `<p>${receipt.seller_website}</p>` : ''}
    </div>
  </div>` : ''}

  <div class="header-band">
    <div>
      <div class="title">${language === 'pt' ? 'RECIBO' : 'RECEIPT'}</div>
      <div class="number">${receipt.receipt_number}</div>
    </div>
    <div style="text-align:right">
      <div class="amount">${receipt.amount.toFixed(2)} ${sym}</div>
      <div class="type">${receipt.type === 'issued' ? (language === 'pt' ? 'Recibo Emitido' : 'Issued Receipt') : (language === 'pt' ? 'Recibo Recebido' : 'Received Receipt')}</div>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="label">${language === 'pt' ? 'Cliente' : 'Client'}</div>
      <div class="value">${receipt.client_name}</div>
    </div>
    <div>
      <div class="label">${language === 'pt' ? 'Data' : 'Date'}</div>
      <div class="value">${fmt(receipt.date)}</div>
    </div>
    <div>
      <div class="label">${language === 'pt' ? 'Método de Pagamento' : 'Payment Method'}</div>
      <div class="value">${paymentMethodLabels[receipt.payment_method] || receipt.payment_method}</div>
    </div>
    ${receipt.invoice_number ? `<div><div class="label">${language === 'pt' ? 'Referência Fatura' : 'Invoice Reference'}</div><div class="value">${receipt.invoice_number}</div></div>` : ''}
  </div>

  <div class="amount-box">
    <div class="label">${language === 'pt' ? 'Valor Total Recebido' : 'Total Amount Received'}</div>
    <div class="amount-value">${receipt.amount.toFixed(2)} ${sym}</div>
  </div>

  ${receipt.notes ? `<div class="notes-box"><div class="label">${language === 'pt' ? 'Notas' : 'Notes'}</div><p>${receipt.notes}</p></div>` : ''}

  ${(receipt.seller_bank_name || receipt.seller_iban || receipt.seller_swift_bic) ? `
  <div class="bank-box">
    <div class="label">${language === 'pt' ? 'Dados Bancários' : 'Banking Details'}</div>
    ${[receipt.seller_bank_name, receipt.seller_iban && `IBAN: ${receipt.seller_iban}`, receipt.seller_swift_bic && `SWIFT: ${receipt.seller_swift_bic}`].filter(Boolean).join(' &nbsp;·&nbsp; ')}
  </div>` : ''}

  <div class="signatures">
    <div class="sig-line">${language === 'pt' ? 'Emitido por' : 'Issued by'}</div>
    <div class="sig-line">${language === 'pt' ? 'Recebido por' : 'Received by'}</div>
  </div>

  <div class="footer">
    <p>${language === 'pt' ? `Documento gerado por WiKima · ${receipt.receipt_number}` : `Document generated by WiKima · ${receipt.receipt_number}`}</p>
    <p class="disclaimer">⚠ ${language === 'pt' ? 'Documento administrativo. A WiKima não é software fiscal certificado. A conformidade fiscal é da responsabilidade do utilizador.' : "Administrative document. WiKima is not certified tax software. Tax compliance remains the user's responsibility."}</p>
  </div>
</body>
</html>`;
}

export default function ReceiptPrintView({ open, onClose, receipt, language }) {
  if (!receipt) return null;

  const handlePrint = () => {
    const html = buildReceiptHTML(receipt, language);
    const win = window.open('', '_blank', 'width=800,height=700');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  const paymentMethodLabels = {
    cash: language === 'pt' ? 'Dinheiro' : 'Cash',
    transfer: language === 'pt' ? 'Transferência Bancária' : 'Bank Transfer',
    card: language === 'pt' ? 'Cartão' : 'Card',
    mobile: language === 'pt' ? 'Pagamento Móvel' : 'Mobile Payment',
    other: language === 'pt' ? 'Outro' : 'Other'
  };
  const currencySymbols = { EUR: '€', AOA: 'Kz', USD: '$', BRL: 'R$', GBP: '£' };
  const fmt = (d) => d ? new Date(d).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB') : '—';
  const sym = currencySymbols[receipt.currency] || receipt.currency;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto p-0 bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 sticky top-0 z-10">
          <span className="font-semibold text-gray-700">
            {language === 'pt' ? 'Pré-visualização do Recibo' : 'Receipt Preview'} — {receipt.receipt_number}
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
          {/* Seller block */}
          {(receipt.seller_company_name || receipt.seller_logo_url) && (
            <div className="flex items-start gap-3 mb-6 pb-5 border-b border-gray-200">
              {receipt.seller_logo_url && (
                <img src={receipt.seller_logo_url} alt="Logo" className="h-11 w-auto object-contain flex-shrink-0" />
              )}
              <div>
                {receipt.seller_company_name && <div className="font-bold text-gray-900 text-base">{receipt.seller_company_name}</div>}
                {receipt.seller_legal_name && receipt.seller_legal_name !== receipt.seller_company_name && <div className="text-xs text-gray-500">{receipt.seller_legal_name}</div>}
                {receipt.seller_tax_id && <div className="text-xs text-gray-500">{language === 'pt' ? 'NIF' : 'Tax ID'}: {receipt.seller_tax_id}</div>}
                {(receipt.seller_address || receipt.seller_country) && <div className="text-xs text-gray-500">{[receipt.seller_address, receipt.seller_country].filter(Boolean).join(', ')}</div>}
                {receipt.seller_phone && <div className="text-xs text-gray-500">{receipt.seller_phone}</div>}
                {receipt.seller_email && <div className="text-xs text-gray-500">{receipt.seller_email}</div>}
                {receipt.seller_website && <div className="text-xs text-gray-500">{receipt.seller_website}</div>}
              </div>
            </div>
          )}

          {/* Header band */}
          <div className="bg-gray-900 text-foreground rounded-xl p-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-black tracking-tight">{language === 'pt' ? 'RECIBO' : 'RECEIPT'}</div>
                <div className="text-gray-300 text-sm mt-1">{receipt.receipt_number}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black">{receipt.amount.toFixed(2)} <span className="text-xl">{sym}</span></div>
                <div className="text-gray-300 text-xs mt-1">
                  {receipt.type === 'issued' ? (language === 'pt' ? 'Recibo Emitido' : 'Issued Receipt') : (language === 'pt' ? 'Recibo Recebido' : 'Received Receipt')}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{language === 'pt' ? 'Cliente' : 'Client'}</div>
              <div className="font-bold text-gray-900 text-lg">{receipt.client_name}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{language === 'pt' ? 'Data' : 'Date'}</div>
              <div className="font-semibold text-gray-800">{fmt(receipt.date)}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{language === 'pt' ? 'Método de Pagamento' : 'Payment Method'}</div>
              <div className="font-semibold text-gray-800">{paymentMethodLabels[receipt.payment_method] || receipt.payment_method}</div>
            </div>
            {receipt.invoice_number && (
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{language === 'pt' ? 'Referência Fatura' : 'Invoice Reference'}</div>
                <div className="font-semibold text-gray-800">{receipt.invoice_number}</div>
              </div>
            )}
          </div>

          <div className="border-2 border-gray-200 rounded-xl p-6 mb-8 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{language === 'pt' ? 'Valor Total Recebido' : 'Total Amount Received'}</div>
            <div className="text-4xl font-black text-gray-900">{receipt.amount.toFixed(2)} {sym}</div>
          </div>

          {receipt.notes && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{language === 'pt' ? 'Notas' : 'Notes'}</div>
              <p className="text-sm text-gray-700">{receipt.notes}</p>
            </div>
          )}

          {(receipt.seller_bank_name || receipt.seller_iban || receipt.seller_swift_bic) && (
            <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-muted-foreground">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{language === 'pt' ? 'Dados Bancários' : 'Banking Details'}</div>
              <span>{[receipt.seller_bank_name, receipt.seller_iban && `IBAN: ${receipt.seller_iban}`, receipt.seller_swift_bic && `SWIFT: ${receipt.seller_swift_bic}`].filter(Boolean).join(' · ')}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mt-12 mb-4">
            <div className="border-t border-gray-300 pt-2 text-center text-xs text-gray-400">{language === 'pt' ? 'Emitido por' : 'Issued by'}</div>
            <div className="border-t border-gray-300 pt-2 text-center text-xs text-gray-400">{language === 'pt' ? 'Recebido por' : 'Received by'}</div>
          </div>

          <div className="border-t border-gray-200 pt-6 text-center space-y-1">
            <p className="text-xs text-gray-400">{language === 'pt' ? `Documento gerado por WiKima · ${receipt.receipt_number}` : `Document generated by WiKima · ${receipt.receipt_number}`}</p>
            <p className="text-xs text-amber-600 font-medium">⚠ {language === 'pt' ? 'Documento administrativo. A WiKima não é software fiscal certificado. A conformidade fiscal é da responsabilidade do utilizador.' : "Administrative document. WiKima is not certified tax software. Tax compliance remains the user's responsibility."}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}