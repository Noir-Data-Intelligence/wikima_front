// ────────────────────────────────────────────────────────────────────────────
// DEV-ONLY MOCK API
// Lets the app run with NO backend: any email/password logs in, `me()` returns a
// demo user (onboarding already done), and every entity call resolves to empty
// data instead of failing. This exists only so the app pages can be explored
// before the real backend exists.
//
// TO DISABLE (use the real REST API): set VITE_MOCK_AUTH=false in .env and
// restart the dev server. Deleting this file + the MOCK_MODE branches in
// client.js / resource.js also fully removes it.
// ────────────────────────────────────────────────────────────────────────────

import { setToken as storeToken, clearToken } from './tokenStore';

export const MOCK_MODE = import.meta.env.VITE_MOCK_AUTH === 'false' ? false : true;

const EMAIL_KEY = 'mock_user_email';
const MOCK_TOKEN = 'mock-dev-token';

function currentEmail() {
  try {
    return window.localStorage.getItem(EMAIL_KEY) || 'demo@wikima.app';
  } catch {
    return 'demo@wikima.app';
  }
}

function rememberEmail(email) {
  try {
    window.localStorage.setItem(EMAIL_KEY, email || 'demo@wikima.app');
  } catch {
    /* ignore */
  }
}

const mockWorkspace = {
  id: 'mock-ws-1',
  name: 'WiKima Demo',
  type: 'company',
  created_date: new Date().toISOString(),
};

export function mockUser() {
  return {
    id: 'mock-user-1',
    full_name: 'Utilizador Demo',
    name: 'Utilizador Demo',
    email: currentEmail(),
    role: 'admin', // admin → all navigation (incl. WiKima Admin) is visible
    user_profile: 'company', // company profile → richest sidebar
    onboarding_completed: true,
    show_guided_tour: false,
    current_workspace_id: mockWorkspace.id,
    default_workspace_id: mockWorkspace.id,
    profile_photo: null,
    created_date: new Date().toISOString(),
  };
}

export function mockPublicSettings() {
  return { id: 'mock-app', public_settings: {} };
}

const resolve = (v) => Promise.resolve(v);
const noop = () => resolve(null);

export const mockAuth = {
  me: () => resolve(mockUser()),
  updateMe: (data) => resolve({ ...mockUser(), ...data }),
  async loginViaEmailPassword(email) {
    rememberEmail(email);
    storeToken(MOCK_TOKEN);
    return { access_token: MOCK_TOKEN, user: mockUser() };
  },
  async register(data) {
    rememberEmail(data?.email);
    storeToken(MOCK_TOKEN);
    return { access_token: MOCK_TOKEN, requires_otp: false, user: mockUser() };
  },
  verifyOtp() {
    storeToken(MOCK_TOKEN);
    return resolve({ access_token: MOCK_TOKEN, user: mockUser() });
  },
  resendOtp: () => resolve({ ok: true }),
  resetPasswordRequest: () => resolve({ ok: true }),
  resetPassword: () => resolve({ ok: true }),
  setToken: (t) => storeToken(t || MOCK_TOKEN),
  redirectToLogin(nextUrl) {
    const next = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : '';
    window.location.href = `/login${next}`;
  },
  loginWithProvider(_provider, nextPath) {
    storeToken(MOCK_TOKEN);
    window.location.href = nextPath || '/dashboard';
  },
  logout(redirectUrl) {
    clearToken();
    try {
      window.localStorage.removeItem(EMAIL_KEY);
    } catch {
      /* ignore */
    }
    if (redirectUrl) window.location.href = redirectUrl;
  },
};

// A resource whose CRUD methods resolve to safe, empty data. The `workspace`
// resource returns the demo workspace so the shell/switcher have something.
export function mockResource(path) {
  const isWorkspace = path === 'workspace';
  return {
    path,
    list: () => resolve(isWorkspace ? [mockWorkspace] : []),
    filter: () => resolve(isWorkspace ? [mockWorkspace] : []),
    get: () => resolve(isWorkspace ? mockWorkspace : null),
    create: (data) => resolve({ id: `mock-${Math.random().toString(36).slice(2, 9)}`, ...data }),
    update: (id, data) => resolve({ id, ...data }),
    delete: () => resolve({ success: true }),
  };
}

export const mockIntegrations = {
  Core: {
    UploadFile: noop,
    InvokeLLM: noop,
    SendEmail: noop,
    SendSMS: noop,
    GenerateImage: noop,
    ExtractDataFromUploadedFile: noop,
  },
};

export const mockFunctions = {
  invoke: noop,
  gmailOAuth: noop,
  syncGmail: noop,
  outlookOAuth: noop,
  syncOutlook: noop,
};

export const mockAgents = {
  createConversation: () => resolve({ id: 'mock-conv-1' }),
  addMessage: noop,
  subscribeToConversation: () => () => {},
};

export const mockAppLogs = { logUserInApp: noop };
