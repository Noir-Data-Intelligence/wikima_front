/**
 * Gmail OAuth2 Authentication Flow
 * Handles authentication, token refresh, and secure storage
 */

const { google } = require('googleapis');
const crypto = require('crypto');

// Encryption for tokens
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

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

exports.handler = async (event, context) => {
  const { action, code, accountId } = event.body || event;

  // Validate secrets are configured
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REDIRECT_URI) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Gmail OAuth is not configured. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REDIRECT_URI in app secrets.' 
      })
    };
  }

  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'TOKEN_ENCRYPTION_KEY not configured. Please add it to app secrets.' 
      })
    };
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  try {
    if (action === 'getAuthUrl') {
      // Generate OAuth2 authorization URL
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        prompt: 'consent'
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ authUrl })
      };
    }

    if (action === 'exchangeCode') {
      if (!code) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Authorization code is required' })
        };
      }

      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Failed to obtain valid tokens from Google' })
        };
      }

      oauth2Client.setCredentials(tokens);

      // Get user email
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });

      if (!profile.data.emailAddress) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Failed to retrieve user email from Gmail' })
        };
      }

      // Encrypt tokens
      const encryptedAccessToken = encrypt(tokens.access_token);
      const encryptedRefreshToken = encrypt(tokens.refresh_token);

      // Calculate expiration (tokens.expiry_date is in milliseconds)
      const expiresAt = new Date(tokens.expiry_date).toISOString();

      return {
        statusCode: 200,
        body: JSON.stringify({
          email: profile.data.emailAddress,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt
        })
      };
    }

    if (action === 'refreshToken') {
      // Refresh expired token
      const account = await context.base44.entities.EmailAccount.get(accountId);
      const decryptedRefreshToken = decrypt(account.refresh_token);

      oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();

      const encryptedAccessToken = encrypt(credentials.access_token);
      const expiresAt = new Date(Date.now() + credentials.expiry_date).toISOString();

      await context.base44.entities.EmailAccount.update(accountId, {
        access_token: encryptedAccessToken,
        token_expires_at: expiresAt,
        status: 'active'
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action' })
    };
  } catch (error) {
    console.error('Gmail OAuth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};