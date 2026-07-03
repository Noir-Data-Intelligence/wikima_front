import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();
    const invoice = await base44.entities.Invoice.get(invoiceId);

    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create PDF
    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', 20, yPos);
    yPos += 15;

    // Invoice Number and Date
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice #: ${invoice.invoice_number || invoice.id.slice(0, 8)}`, 20, yPos);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 120, yPos);
    yPos += 6;
    if (invoice.due_date) {
      doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 120, yPos);
      yPos += 6;
    }
    doc.text(`Currency: ${invoice.currency}`, 120, yPos);
    yPos += 10;

    // Seller Details
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('FROM:', 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (invoice.seller_company_name) {
      doc.text(invoice.seller_company_name, 20, yPos);
      yPos += 5;
    }
    if (invoice.seller_tax_id) {
      doc.text(`Tax ID: ${invoice.seller_tax_id}`, 20, yPos);
      yPos += 5;
    }
    if (invoice.seller_address) {
      doc.text(invoice.seller_address, 20, yPos);
      yPos += 5;
    }
    if (invoice.seller_country) {
      doc.text(invoice.seller_country, 20, yPos);
      yPos += 5;
    }
    yPos += 5;

    // Client Details
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TO:', 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.client_name, 20, yPos);
    yPos += 5;
    if (invoice.client_email) {
      doc.text(invoice.client_email, 20, yPos);
      yPos += 5;
    }
    if (invoice.client_country) {
      doc.text(invoice.client_country, 20, yPos);
      yPos += 5;
    }
    if (invoice.client_tax_id) {
      doc.text(`Tax ID: ${invoice.client_tax_id}`, 20, yPos);
      yPos += 5;
    }
    yPos += 10;

    // Line Items
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('ITEMS', 20, yPos);
    yPos += 8;

    // Table headers
    doc.setFontSize(9);
    doc.text('Description', 20, yPos);
    doc.text('Qty', 110, yPos);
    doc.text('Price', 135, yPos);
    doc.text('Total', 170, yPos, { align: 'right' });
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    // Items
    doc.setFont(undefined, 'normal');
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach(item => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(item.description || '', 20, yPos, { maxWidth: 85 });
        doc.text(String(item.quantity || 0), 110, yPos);
        doc.text(`${invoice.currency} ${(item.price || 0).toFixed(2)}`, 135, yPos);
        doc.text(`${invoice.currency} ${(item.total || 0).toFixed(2)}`, 170, yPos, { align: 'right' });
        yPos += 6;
      });
    }

    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    // Totals
    doc.setFontSize(10);
    const totalsX = 120;
    const valuesX = 170;

    doc.text('Subtotal:', totalsX, yPos);
    doc.text(`${invoice.currency} ${(invoice.subtotal || 0).toFixed(2)}`, valuesX, yPos, { align: 'right' });
    yPos += 6;

    if (invoice.discount && invoice.discount > 0) {
      doc.text('Discount:', totalsX, yPos);
      doc.text(`${invoice.currency} ${invoice.discount.toFixed(2)}`, valuesX, yPos, { align: 'right' });
      yPos += 6;
    }

    if (invoice.tax_rate) {
      doc.text(`Tax (${invoice.tax_rate}%):`, totalsX, yPos);
      doc.text(`${invoice.currency} ${(invoice.tax || 0).toFixed(2)}`, valuesX, yPos, { align: 'right' });
      yPos += 6;
    }

    yPos += 2;
    doc.line(totalsX, yPos, 190, yPos);
    yPos += 6;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', totalsX, yPos);
    doc.text(`${invoice.currency} ${(invoice.total || 0).toFixed(2)}`, valuesX, yPos, { align: 'right' });
    yPos += 10;

    // Payment status
    if (invoice.status === 'paid' && invoice.paid_date) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 150, 0);
      doc.text(`✓ PAID on ${new Date(invoice.paid_date).toLocaleDateString()}`, 20, yPos);
      if (invoice.payment_method) {
        yPos += 5;
        doc.text(`Payment method: ${invoice.payment_method}`, 20, yPos);
      }
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    }

    // Notes
    if (invoice.notes) {
      yPos += 5;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Notes:', 20, yPos);
      yPos += 5;
      doc.setFont(undefined, 'normal');
      doc.text(invoice.notes, 20, yPos, { maxWidth: 170 });
    }

    // Footer disclaimer
    yPos = 280;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('This invoice is for informational and record-keeping purposes only.', 105, yPos, { align: 'center' });

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number || invoice.id.slice(0, 8)}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});