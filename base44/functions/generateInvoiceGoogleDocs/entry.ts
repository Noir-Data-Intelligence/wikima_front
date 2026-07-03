import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return Response.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Fetch the invoice
    const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId });
    
    if (!invoices || invoices.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[0];

    // Get Google Docs access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledocs');

    // Create a new Google Docs document
    const createDocResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `Invoice-${invoice.invoice_number || invoice.id.slice(0, 8)}`
      })
    });

    if (!createDocResponse.ok) {
      const error = await createDocResponse.json();
      return Response.json({ 
        error: `Failed to create Google Doc: ${error.error.message}` 
      }, { status: 500 });
    }

    const newDoc = await createDocResponse.json();
    const documentId = newDoc.documentId;

    // Build invoice content
    const requests = [
      {
        insertText: {
          text: `INVOICE\n`
        }
      },
      {
        insertText: {
          text: `\n${invoice.seller_company_name || 'Company'}\n`
        }
      }
    ];

    if (invoice.seller_address || invoice.seller_country) {
      requests.push({
        insertText: {
          text: `${invoice.seller_address || ''}${invoice.seller_address && invoice.seller_country ? ', ' : ''}${invoice.seller_country || ''}\n`
        }
      });
    }

    if (invoice.seller_tax_id) {
      requests.push({
        insertText: {
          text: `Tax ID: ${invoice.seller_tax_id}\n`
        }
      });
    }

    // Invoice details
    requests.push({
      insertText: {
        text: `\n\nInvoice Number: ${invoice.invoice_number || invoice.id.slice(0, 8)}\n`
      }
    });

    if (invoice.date) {
      requests.push({
        insertText: {
          text: `Issue Date: ${invoice.date}\n`
        }
      });
    }

    if (invoice.due_date) {
      requests.push({
        insertText: {
          text: `Due Date: ${invoice.due_date}\n`
        }
      });
    }

    // Client details
    requests.push({
      insertText: {
        text: `\n\nBILL TO:\n${invoice.client_name || 'Client'}\n`
      }
    });

    if (invoice.client_email) {
      requests.push({
        insertText: {
          text: `${invoice.client_email}\n`
        }
      });
    }

    if (invoice.client_country || invoice.client_tax_id) {
      requests.push({
        insertText: {
          text: `${invoice.client_country || ''}${invoice.client_country && invoice.client_tax_id ? ' - ' : ''}${invoice.client_tax_id || ''}\n`
        }
      });
    }

    // Line items header
    requests.push({
      insertText: {
        text: `\n\nDESCRIPTION\t\t\tQUANTITY\t\tPRICE\t\tTOTAL\n`
      }
    });

    // Line items
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach(item => {
        requests.push({
          insertText: {
            text: `${item.description || ''}\t${item.quantity || 0}\t${item.price || 0}\t${item.total || 0}\n`
          }
        });
      });
    }

    // Totals
    requests.push({
      insertText: {
        text: `\n\nSubtotal:\t\t\t\t${invoice.currency || 'EUR'} ${(invoice.subtotal || 0).toFixed(2)}\n`
      }
    });

    if (invoice.discount && invoice.discount > 0) {
      requests.push({
        insertText: {
          text: `Discount:\t\t\t\t${invoice.currency || 'EUR'} -${(invoice.discount || 0).toFixed(2)}\n`
        }
      });
    }

    if (invoice.tax && invoice.tax > 0) {
      requests.push({
        insertText: {
          text: `Tax (${invoice.tax_rate || 0}%):\t\t\t${invoice.currency || 'EUR'} ${(invoice.tax || 0).toFixed(2)}\n`
        }
      });
    }

    requests.push({
      insertText: {
        text: `\nTOTAL:\t\t\t\t${invoice.currency || 'EUR'} ${(invoice.total || 0).toFixed(2)}\n`
      }
    });

    // Notes
    if (invoice.notes) {
      requests.push({
        insertText: {
          text: `\n\nNotes:\n${invoice.notes}\n`
        }
      });
    }

    // Update the document with invoice content
    const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      return Response.json({ 
        error: `Failed to update document: ${error.error.message}` 
      }, { status: 500 });
    }

    // Return the Google Docs link
    const docsUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    return Response.json({
      success: true,
      documentId,
      docsUrl,
      message: `Invoice document created: ${invoice.invoice_number || invoice.id.slice(0, 8)}`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});