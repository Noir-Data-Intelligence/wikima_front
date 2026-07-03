// Authentication service.
//
// Method names and signatures mirror what the app already calls so no UI code
// needs to change. The concrete mechanism (bearer token here) is abstracted:
// tokens live in tokenStore.js and are attached by http.js. Endpoints assume a
// conventional REST auth service under the API gateway.

import { http } from './http';
import { API_BASE_URL } from './config';
import { setToken as storeToken, clearToken } from './tokenStore';

export const auth = {
  /** Current authenticated user. */
  me() {
    return http.get('/auth/me');
  },

  /** Patch the current user's profile; returns the updated user. */
  updateMe(data) {
    return http.put('/auth/me', data);
  },

  /** Email + password login (positional args, as used by the UI). */
  async loginViaEmailPassword(email, password) {
    const res = await http.post('/auth/login', { email, password });
    if (res && res.access_token) storeToken(res.access_token);
    return res;
  },

  /** Register a new account. */
  register(data) {
    return http.post('/auth/register', data);
  },

  /** Verify an OTP code; caller stores res.access_token via setToken. */
  verifyOtp(data) {
    return http.post('/auth/verify-otp', data);
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
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
};

export default auth;
