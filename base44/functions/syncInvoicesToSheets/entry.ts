import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get access token for Google Sheets
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

    // Get user's workspace
    const workspaceMembers = await base44.entities.WorkspaceMember.filter({ user_email: user.email });
    if (!workspaceMembers || workspaceMembers.length === 0) {
      return Response.json({ error: 'No workspace found' }, { status: 404 });
    }
    const workspaceId = workspaceMembers[0].workspace_id;

    // Fetch all invoices
    const invoices = await base44.entities.Invoice.filter({ workspace_id: workspaceId });

    // Create or get spreadsheet
    const spreadsheetTitle = 'WiKima Invoices';
    
    // Create new spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: spreadsheetTitle
        },
        sheets: [{
          properties: {
            title: 'Invoices',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }]
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      return Response.json({ error: `Failed to create spreadsheet: ${error}` }, { status: 500 });
    }

    const spreadsheet = await createResponse.json();
    const spreadsheetId = spreadsheet.spreadsheetId;

    // Prepare data for sheets
    const headers = [
      'Invoice Number',
      'Client Name',
      'Date',
      'Due Date',
      'Status',
      'Subtotal',
      'Tax',
      'Total',
      'Currency',
      'Payment Method',
      'Paid Date',
      'Notes'
    ];

    const rows = invoices.map(inv => [
      inv.invoice_number || '',
      inv.client_name || '',
      inv.date || '',
      inv.due_date || '',
      inv.status || '',
      inv.subtotal || 0,
      inv.tax || 0,
      inv.total || 0,
      inv.currency || 'EUR',
      inv.payment_method || '',
      inv.paid_date || '',
      inv.notes || ''
    ]);

    const allData = [headers, ...rows];

    // Write data to spreadsheet
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Invoices!A1:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: allData
        })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      return Response.json({ error: `Failed to update spreadsheet: ${error}` }, { status: 500 });
    }

    // Format header row
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.11, green: 0.18, blue: 0.37 },
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      bold: true
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: headers.length
                }
              }
            }
          ]
        })
      }
    );

    return Response.json({
      success: true,
      message: `Synced ${invoices.length} invoices to Google Sheets`,
      spreadsheetId: spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      invoicesCount: invoices.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});