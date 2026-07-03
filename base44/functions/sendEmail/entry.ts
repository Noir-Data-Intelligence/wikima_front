/**
 * Send Email Function
 * Sends emails through user's Gmail or Outlook account
 */

const { google } = require('googleapis');
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

async function sendGmail(account, to, subject, body, attachments = [], inReplyTo = null) {
  const decryptedAccessToken = decrypt(account.access_token);

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: decryptedAccessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Build email
  const messageParts = [
    `From: ${account.email_address}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    ''
  ];

  if (inReplyTo) {
    messageParts.splice(3, 0, `In-Reply-To: ${inReplyTo}`);
  }

  messageParts.push(body);

  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });

  return result.data.id;
}

async function sendOutlook(account, to, subject, body, attachments = [], inReplyTo = null) {
  const decryptedAccessToken = decrypt(account.access_token);

  const headers = {
    Authorization: `Bearer ${decryptedAccessToken}`,
    'Content-Type': 'application/json'
  };

  const emailData = {
    message: {
      subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: to.split(',').map(email => ({
        emailAddress: { address: email.trim() }
      }))
    },
    saveToSentItems: true
  };

  if (inReplyTo) {
    // Reply to existing message
    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/me/messages/${inReplyTo}/reply`,
      {
        comment: body
      },
      { headers }
    );
    return response.data.id;
  } else {
    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/sendMail',
      emailData,
      { headers }
    );
    return 'sent';
  }
}

exports.handler = async (event, context) => {
  const { accountId, to, subject, body, attachments, inReplyTo } = JSON.parse(event.body);

  try {
    const account = await context.base44.entities.EmailAccount.get(accountId);
    
    if (!account) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Account not found' })
      };
    }

    let messageId;

    if (account.provider === 'gmail') {
      messageId = await sendGmail(account, to, subject, body, attachments, inReplyTo);
    } else if (account.provider === 'outlook') {
      messageId = await sendOutlook(account, to, subject, body, attachments, inReplyTo);
    } else {
      throw new Error('Invalid provider');
    }

    // Store sent email
    await context.base44.entities.Email.create({
      account_id: accountId,
      provider: account.provider,
      external_id: messageId,
      thread_id: inReplyTo || messageId,
      from_email: account.email_address,
      from_name: account.email_address,
      to_emails: to.split(',').map(e => e.trim()),
      subject,
      body_html: body,
      date: new Date().toISOString(),
      is_read: true,
      is_sent: true,
      labels: ['SENT'],
      attachments: attachments || []
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId })
    };
  } catch (error) {
    console.error('Send email error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};