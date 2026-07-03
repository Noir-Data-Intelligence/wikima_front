// Pluggable auth-token storage.
//
// The concrete auth mechanism is intentionally undecided. Today we keep a
// bearer token in localStorage. To move to httpOnly cookie sessions later,
// this is the ONLY file that changes (return null from getToken and let the
// browser attach the cookie via `credentials: 'include'` in http.js).

const STORAGE_KEY = 'auth_token';

const memory = { token: null };

const hasLocalStorage = (() => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
})();

export function getToken() {
  if (hasLocalStorage) {
    return window.localStorage.getItem(STORAGE_KEY);
  }
  return memory.token;
}

export function setToken(token) {
  if (!token) {
    clearToken();
    return;
  }
  if (hasLocalStorage) {
    window.localStorage.setItem(STORAGE_KEY, token);
  } else {
    memory.token = token;
  }
}

export function clearToken() {
  if (hasLocalStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  memory.token = null;
}
