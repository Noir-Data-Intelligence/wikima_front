// Application API client — replaces the former Base44 SDK client.
//
// Exposes the same nested shape the app already consumes
// (`api.entities.X`, `api.auth`, `api.integrations.Core`, `api.functions`,
// `api.agents`) but backed by our own fetch-based layer against a configurable
// REST/microservices backend. See config.js for base URL resolution.

import { http } from './http';
import { entities } from './entities';
import { auth } from './auth';
import { integrations } from './integrations';
import { functions } from './functions';
import { agents } from './agents';
import {
  MOCK_MODE, mockAuth, mockPublicSettings, mockIntegrations,
  mockFunctions, mockAgents, mockAppLogs,
} from './mock';

// App-level metadata (public settings, feature flags, ...).
const realApp = {
  getPublicSettings() {
    return http.get('/app/public-settings');
  },
};
const mockApp = {
  getPublicSettings() {
    return Promise.resolve(mockPublicSettings());
  },
};

// Lightweight activity logging (best-effort; callers ignore failures).
const realAppLogs = {
  logUserInApp(page) {
    return http.post('/app/logs/user-in-app', { page });
  },
};

// In MOCK_MODE (no backend) swap the network-backed services for in-memory
// mocks. `entities` is already mocked at the resource layer (see resource.js).
export const api = {
  entities,
  auth: MOCK_MODE ? mockAuth : auth,
  integrations: MOCK_MODE ? mockIntegrations : integrations,
  functions: MOCK_MODE ? mockFunctions : functions,
  agents: MOCK_MODE ? mockAgents : agents,
  app: MOCK_MODE ? mockApp : realApp,
  appLogs: MOCK_MODE ? mockAppLogs : realAppLogs,
};

export default api;
