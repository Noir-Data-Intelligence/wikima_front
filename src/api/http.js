// Core HTTP client built on the native fetch API (no third-party SDK).
//
// Responsibilities:
//  - resolve URLs against the configured API base
//  - attach the Authorization header from the token store
//  - JSON encode/decode, plus multipart (FormData) support for uploads
//  - normalize every failure into an `ApiError` carrying { status, data }
//    so callers (e.g. AuthContext) can branch on `err.status` / `err.data`.

import { API_BASE_URL } from './config';
import { getToken } from './tokenStore';

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path, baseUrl = API_BASE_URL) {
  if (/^https?:\/\//i.test(path)) return path;
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function toQueryString(params) {
  if (!params || typeof params !== 'object') return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => usp.append(key, v));
    } else if (typeof value === 'object') {
      usp.append(key, JSON.stringify(value));
    } else {
      usp.append(key, value);
    }
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text || null;
}

async function request(method, path, { query, body, headers, baseUrl, signal } = {}) {
  const url = buildUrl(path, baseUrl) + toQueryString(query);

  const finalHeaders = { Accept: 'application/json', ...(headers || {}) };
  const token = getToken();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body; // let the browser set the multipart boundary
  } else if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, { method, headers: finalHeaders, body: payload, signal });
  } catch (networkError) {
    // Backend unreachable / CORS / aborted — surface a normalized error.
    throw new ApiError(networkError.message || 'Network request failed', {
      status: 0,
      data: null,
    });
  }

  const data = await parseBody(response);

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, { status: response.status, data });
  }

  return data;
}

export const http = {
  request,
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  del: (path, opts) => request('DELETE', path, opts),
};

export default http;
