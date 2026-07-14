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
const ROLE_KEY = 'mock_user_role';
const PROFILE_KEY = 'mock_user_profile';
const NAME_KEY = 'mock_user_name';
const MOCK_TOKEN = 'mock-dev-token';

function lsGet(key, fallback) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function lsRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function currentEmail() {
  return lsGet(EMAIL_KEY, 'demo@wikima.app');
}

function rememberEmail(email) {
  lsSet(EMAIL_KEY, email || 'demo@wikima.app');
}

// Persona = which user TYPE the mock `me()` returns. Lets us test the different
// sidebars/permissions (personal / professional / company / platform admin)
// from the login screen without a backend. See setMockPersona / Login.jsx.
export function setMockPersona({ email, full_name, role, user_profile }) {
  if (email) lsSet(EMAIL_KEY, email);
  if (full_name) lsSet(NAME_KEY, full_name);
  if (role) lsSet(ROLE_KEY, role);
  if (user_profile) lsSet(PROFILE_KEY, user_profile);
  storeToken(MOCK_TOKEN);
}

// Reset persona to the default (platform admin, company) — used on a manual
// email/password login so it always lands on the "everything visible" account.
function clearPersona() {
  lsRemove(ROLE_KEY);
  lsRemove(PROFILE_KEY);
  lsRemove(NAME_KEY);
}

const mockWorkspace = {
  id: 'mock-ws-1',
  name: 'WiKima Demo',
  type: 'business', // matches the backend enum: 'personal' | 'business'
  created_date: new Date().toISOString(),
};

export function mockUser() {
  const name = lsGet(NAME_KEY, 'Utilizador Demo');
  return {
    id: 'mock-user-1',
    full_name: name,
    name,
    email: currentEmail(),
    role: lsGet(ROLE_KEY, 'admin'), // admin → all navigation (incl. WiKima Admin) is visible
    user_profile: lsGet(PROFILE_KEY, 'company'), // personal | professional | company
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
    clearPersona(); // manual login → default (platform admin) account
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
