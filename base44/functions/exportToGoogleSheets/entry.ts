import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType } = await req.json();
    const workspaceId = user.current_workspace_id || user.default_workspace_id;

    if (!workspaceId) {
      return Response.json({ error: 'No workspace found' }, { status: 400 });
    }

    // Fetch data based on report type
    let data = [];
    let headers = [];

    if (reportType === 'tasks') {
      const tasks = await base44.entities.Task.filter({ workspace_id: workspaceId });
      headers = ['Title', 'Status', 'Priority', 'Client', 'Deadline', 'Created Date'];
      data = tasks.map(t => [
        t.title || '',
        t.status || '',
        t.priority || '',
        t.client_name || '',
        t.deadline || '',
        t.created_date || ''
      ]);
    } else if (reportType === 'invoices') {
      const invoices = await base44.entities.Invoice.filter({ workspace_id: workspaceId });
      headers = ['Invoice Number', 'Client', 'Amount', 'Status', 'Date', 'Due Date'];
      data = invoices.map(i => [
        i.invoice_number || '',
        i.client_name || '',
        i.total || '',
        i.status || '',
        i.date || '',
        i.due_date || ''
      ]);
    } else if (reportType === 'clients') {
      const clients = await base44.entities.Client.filter({ workspace_id: workspaceId });
      headers = ['Name', 'Email', 'Phone', 'Type', 'Status', 'Total Paid', 'Outstanding'];
      data = clients.map(c => [
        c.name || '',
        c.email || '',
        c.phone || '',
        c.type || '',
        c.status || '',
        c.total_paid || 0,
        c.total_outstanding || 0
      ]);
    } else if (reportType === 'receipts') {
      const receipts = await base44.entities.Receipt.filter({ workspace_id: workspaceId });
      headers = ['Receipt Number', 'Client', 'Amount', 'Currency', 'Date', 'Type'];
      data = receipts.map(r => [
        r.receipt_number || '',
        r.client_name || '',
        r.amount || '',
        r.currency || '',
        r.date || '',
        r.type || ''
      ]);
    } else if (reportType === 'bankstatements') {
      const statements = await base44.entities.BankStatement.filter({ workspace_id: workspaceId });
      headers = ['Bank', 'Account', 'Month', 'Year', 'Status', 'Opening Balance', 'Closing Balance'];
      data = statements.map(s => [
        s.bank_name || '',
        s.account_name || '',
        s.month || '',
        s.year || '',
        s.status || '',
        s.opening_balance || '',
        s.closing_balance || ''
      ]);
    } else {
      return Response.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (data.length === 0) {
      return Response.json({ error: 'No data to export' }, { status: 400 });
    }

    // Get Google Sheets access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

    // Create Google Sheets API request to add data
    const sheetTitle = `WiKima ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`;
    
    // Create a new spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: sheetTitle
        }
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      return Response.json({ error: `Failed to create sheet: ${error.error.message}` }, { status: 500 });
    }

    const sheet = await createResponse.json();
    const spreadsheetId = sheet.spreadsheetId;

    // Prepare values for insertion
    const values = [headers, ...data];

    // Add data to the sheet
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: values
        })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      return Response.json({ error: `Failed to add data: ${error.error.message}` }, { status: 500 });
    }

    // Generate the spreadsheet URL
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    return Response.json({
      success: true,
      spreadsheetId,
      url: sheetUrl,
      title: sheetTitle,
      rowsExported: data.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});