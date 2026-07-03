/**
 * Outlook Sync Function
 * Syncs emails, threads, folders, and read status
 */

const axios = require('axios');
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

async function parseOutlookEmail(message) {
  return {
    external_id: message.id,
    thread_id: message.conversationId,
    from_email: message.from?.emailAddress?.address || '',
    from_name: message.from?.emailAddress?.name || '',
    to_emails: message.toRecipients?.map(r => r.emailAddress.address) || [],
    cc_emails: message.ccRecipients?.map(r => r.emailAddress.address) || [],
    subject: message.subject || '',
    body_text: message.bodyPreview || '',
    body_html: message.body?.content || '',
    date: message.receivedDateTime,
    is_read: message.isRead,
    is_sent: message.isDraft === false && message.sender?.emailAddress?.address,
    labels: message.categories || [],
    attachments: message.hasAttachments ? 
      (message.attachments || []).map(att => ({
        filename: att.name,
        size: att.size,
        mime_type: att.contentType,
        attachment_id: att.id
      })) : [],
    in_reply_to: message.inferenceClassification
  };
}

exports.handler = async (event, context) => {
  const { accountId } = JSON.parse(event.body);

  try {
    const account = await context.base44.entities.EmailAccount.get(accountId);
    
    if (!account || account.provider !== 'outlook') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid Outlook account' })
      };
    }

    const decryptedAccessToken = decrypt(account.access_token);

    const headers = {
      Authorization: `Bearer ${decryptedAccessToken}`,
      'Content-Type': 'application/json'
    };

    // Build filter query
    let filterQuery = '';
    if (account.last_sync_date) {
      const lastSync = new Date(account.last_sync_date).toISOString();
      filterQuery = `?$filter=receivedDateTime ge ${lastSync}`;
    }

    // Get messages
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/messages${filterQuery}&$top=100&$expand=attachments`,
      { headers }
    );

    let syncedCount = 0;

    for (const message of response.data.value) {
      const emailData = await parseOutlookEmail(message);

      // Check if email already exists
      const existing = await context.base44.entities.Email.filter({
        account_id: accountId,
        external_id: emailData.external_id
      });

      if (existing.length === 0) {
        await context.base44.entities.Email.create({
          account_id: accountId,
          provider: 'outlook',
          ...emailData
        });
        syncedCount++;
      } else {
        // Update read status
        await context.base44.entities.Email.update(existing[0].id, {
          is_read: emailData.is_read,
          labels: emailData.labels
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
    console.error('Outlook sync error:', error);
    
    if (error.response?.status === 401) {
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