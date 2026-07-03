// Central API configuration.
//
// Prepared for a microservices REST backend: every resource resolves its base
// URL through here. By default all traffic goes to a single gateway
// (VITE_API_URL). To split a resource onto its own microservice later, add an
// entry to `serviceBaseUrls` — no call sites need to change.

const DEFAULT_BASE_URL = '/api';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

// Optional per-service overrides. Key = logical service name, value = base URL.
// Example (future): { billing: 'https://billing.internal/api' }
export const serviceBaseUrls = {};

/** Resolve the base URL for a given logical service (falls back to the gateway). */
export function baseUrlFor(service) {
  if (service && serviceBaseUrls[service]) {
    return serviceBaseUrls[service].replace(/\/$/, '');
  }
  return API_BASE_URL;
}
