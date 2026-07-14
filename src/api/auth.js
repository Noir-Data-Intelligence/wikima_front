// Authentication service.
//
// Method names and signatures mirror what the app already calls so no UI code
// needs to change. The concrete mechanism (bearer token here) is abstracted:
// tokens live in tokenStore.js and are attached by http.js. Endpoints assume a
// conventional REST auth service under the API gateway.

import { http } from './http';
import { API_BASE_URL } from './config';
import { setToken as storeToken, clearToken } from './tokenStore';

// ── /auth/me request coalescing ─────────────────────────────────────────────
// The app calls me() from many independent places on every page (auth guards,
// workspace/user contexts, and each data query resolving its workspace id). Left
// un-coalesced that is 15+ identical requests per page. We cache the resolved
// user for a short window and share any in-flight request, so a burst of callers
// collapses to a single network round-trip. Any mutation of the session
// (login/register/verify-otp/logout/updateMe) invalidates or refreshes it.
const ME_TTL_MS = 15000;
let meCache = null; // { user, at }
let meInflight = null;

function invalidateMe() {
  meCache = null;
  meInflight = null;
}

export const auth = {
  /** Current authenticated user (coalesced + briefly cached). */
  me(force = false) {
    const now = Date.now();
    if (!force && meCache && now - meCache.at < ME_TTL_MS) {
      return Promise.resolve(meCache.user);
    }
    if (!force && meInflight) return meInflight;

    meInflight = http
      .get('/auth/me')
      .then((user) => {
        meCache = { user, at: Date.now() };
        meInflight = null;
        return user;
      })
      .catch((err) => {
        meInflight = null;
        throw err;
      });
    return meInflight;
  },

  /** Patch the current user's profile; returns the updated user. */
  async updateMe(data) {
    const user = await http.put('/auth/me', data);
    // Keep the cache coherent with the write instead of forcing a refetch.
    if (user) meCache = { user, at: Date.now() };
    return user;
  },

  /** Email + password login (positional args, as used by the UI). */
  async loginViaEmailPassword(email, password) {
    const res = await http.post('/auth/login', { email, password });
    if (res && res.access_token) storeToken(res.access_token);
    invalidateMe();
    return res;
  },

  /** Register a new account. */
  async register(data) {
    const res = await http.post('/auth/register', data);
    invalidateMe();
    return res;
  },

  /** Verify an OTP code; caller stores res.access_token via setToken. */
  async verifyOtp(data) {
    const res = await http.post('/auth/verify-otp', data);
    invalidateMe();
    return res;
  },

  /** Resend the OTP to an email. */
  resendOtp(email) {
    return http.post('/auth/resend-otp', { email });
  },

  /** Start a password reset (send email/OTP). */
  resetPasswordRequest(email) {
    return http.post('/auth/reset-password/request', { email });
  },

  /** Complete a password reset. */
  resetPassword(data) {
    return http.post('/auth/reset-password', data);
  },

  /** Persist an access token explicitly. */
  setToken(token) {
    storeToken(token);
    invalidateMe();
  },

  /** Redirect the browser to the app login page, preserving where to return. */
  redirectToLogin(nextUrl) {
    const next = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : '';
    window.location.href = `/login${next}`;
  },

  /** Begin an OAuth login with an external provider. */
  loginWithProvider(provider, nextPath) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : '';
    window.location.href = `${API_BASE_URL}/auth/oauth/${provider}${next}`;
  },

  /** Clear the session; optionally redirect afterwards. */
  logout(redirectUrl) {
    clearToken();
    invalidateMe();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
};

export default auth;
