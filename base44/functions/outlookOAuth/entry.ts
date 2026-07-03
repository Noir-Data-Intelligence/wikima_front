/**
 * Outlook OAuth2 Authentication Flow
 * Handles Microsoft authentication, token refresh, and secure storage
 */

const msal = require('@azure/msal-node');
const axios = require('axios');
const crypto = require('crypto');

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

const msalConfig = {
  auth: {
    clientId: process.env.OUTLOOK_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET
  }
};

const pca = new msal.ConfidentialClientApplication(msalConfig);

exports.handler = async (event, context) => {
  const { action, code, accountId } = JSON.parse(event.body);

  try {
    if (action === 'getAuthUrl') {
      const authUrl = await pca.getAuthCodeUrl({
        scopes: [
          'https://graph.microsoft.com/Mail.ReadWrite',
          'https://graph.microsoft.com/Mail.Send',
          'https://graph.microsoft.com/User.Read',
          'offline_access'
        ],
        redirectUri: process.env.OUTLOOK_REDIRECT_URI
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ authUrl })
      };
    }

    if (action === 'exchangeCode') {
      const tokenRequest = {
        code: code,
        scopes: [
          'https://graph.microsoft.com/Mail.ReadWrite',
          'https://graph.microsoft.com/Mail.Send',
          'https://graph.microsoft.com/User.Read',
          'offline_access'
        ],
        redirectUri: process.env.OUTLOOK_REDIRECT_URI
      };

      const response = await pca.acquireTokenByCode(tokenRequest);

      // Get user email
      const userInfo = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${response.accessToken}` }
      });

      const encryptedAccessToken = encrypt(response.accessToken);
      const encryptedRefreshToken = encrypt(response.refreshToken);
      const expiresAt = new Date(response.expiresOn).toISOString();

      return {
        statusCode: 200,
        body: JSON.stringify({
          email: userInfo.data.mail || userInfo.data.userPrincipalName,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt
        })
      };
    }

    if (action === 'refreshToken') {
      const account = await context.base44.entities.EmailAccount.get(accountId);
      const decryptedRefreshToken = decrypt(account.refresh_token);

      const tokenRequest = {
        refreshToken: decryptedRefreshToken,
        scopes: [
          'https://graph.microsoft.com/Mail.ReadWrite',
          'https://graph.microsoft.com/Mail.Send',
          'https://graph.microsoft.com/User.Read'
        ]
      };

      const response = await pca.acquireTokenByRefreshToken(tokenRequest);

      const encryptedAccessToken = encrypt(response.accessToken);
      const expiresAt = new Date(response.expiresOn).toISOString();

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
    console.error('Outlook OAuth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};