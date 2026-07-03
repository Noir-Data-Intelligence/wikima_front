/**
 * Gmail Sync Function
 * Syncs emails, threads, labels, and read status
 */

const { google } = require('googleapis');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function parseEmail(message, gmail, auth) {
  const headers = message.payload.headers;
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  let bodyText = '';
  let bodyHtml = '';

  const getPart = (part) => {
    if (part.mimeType === 'text/plain' && part.body.data) {
      bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.mimeType === 'text/html' && part.body.data) {
      bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
    }
    if (part.parts) {
      part.parts.forEach(getPart);
    }
  };

  if (message.payload.parts) {
    message.payload.parts.forEach(getPart);
  } else if (message.payload.body.data) {
    bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  }

  const attachments = [];
  if (message.payload.parts) {
    message.payload.parts.forEach(part => {
      if (part.filename && part.body.attachmentId) {
        attachments.push({
          filename: part.filename,
          size: part.body.size,
          mime_type: part.mimeType,
          attachment_id: part.body.attachmentId
        });
      }
    });
  }

  return {
    external_id: message.id,
    thread_id: message.threadId,
    from_email: getHeader('From').replace(/.*<(.+)>.*/, '$1').trim(),
    from_name: getHeader('From').replace(/<.*>/, '').trim(),
    to_emails: getHeader('To').split(',').map(e => e.trim()),
    subject: getHeader('Subject'),
    body_text: bodyText,
    body_html: bodyHtml,
    date: new Date(parseInt(message.internalDate)).toISOString(),
    is_read: !message.labelIds?.includes('UNREAD'),
    is_sent: message.labelIds?.includes('SENT'),
    labels: message.labelIds || [],
    attachments,
    in_reply_to: getHeader('In-Reply-To')
  };
}

exports.handler = async (event, context) => {
  const { accountId } = JSON.parse(event.body);

  try {
    const account = await context.base44.entities.EmailAccount.get(accountId);
    
    if (!account || account.provider !== 'gmail') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid Gmail account' })
      };
    }

    const decryptedAccessToken = decrypt(account.access_token);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: decryptedAccessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get last sync date
    const lastSync = account.last_sync_date ? new Date(account.last_sync_date).getTime() / 1000 : 0;
    const query = lastSync > 0 ? `after:${Math.floor(lastSync)}` : '';

    // List messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100
    });

    if (!response.data.messages) {
      await context.base44.entities.EmailAccount.update(accountId, {
        last_sync_date: new Date().toISOString()
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ synced: 0 })
      };
    }

    let syncedCount = 0;

    for (const msg of response.data.messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      });

      const emailData = await parseEmail(fullMessage.data, gmail, oauth2Client);

      // Match email to client
      const clients = await context.base44.entities.Client.list('name', 500);
      let matchedClient = null;
      
      for (const client of clients) {
        if (client.email && (
          emailData.from_email.toLowerCase() === client.email.toLowerCase() ||
          emailData.to_emails.some(to => to.toLowerCase() === client.email.toLowerCase())
        )) {
          matchedClient = client;
          break;
        }
      }

      // Check if email already exists
      const existing = await context.base44.entities.Email.filter({
        account_id: accountId,
        external_id: emailData.external_id
      });

      if (existing.length === 0) {
        await context.base44.entities.Email.create({
          account_id: accountId,
          provider: 'gmail',
          client_id: matchedClient?.id || null,
          client_name: matchedClient?.name || null,
          ...emailData
        });
        syncedCount++;
      } else {
        // Update read status and client match
        await context.base44.entities.Email.update(existing[0].id, {
          is_read: emailData.is_read,
          labels: emailData.labels,
          client_id: matchedClient?.id || existing[0].client_id,
          client_name: matchedClient?.name || existing[0].client_name
        });
      }
    }

    await context.base44.entities.EmailAccount.update(accountId, {
      last_sync_date: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ synced: syncedCount })
    };
  } catch (error) {
    console.error('Gmail sync error:', error);
    
    if (error.code === 401) {
      await context.base44.entities.EmailAccount.update(accountId, {
        status: 'expired'
      });
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};