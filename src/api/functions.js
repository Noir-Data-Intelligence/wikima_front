// Backend functions (serverless-style RPC endpoints).
//
// `invoke(name, payload)` posts to /functions/{name}. Named helpers below are
// thin wrappers kept for the existing call sites (gmailOAuth, syncGmail, ...).

import { http } from './http';

export function invoke(name, payload) {
  return http.post(`/functions/${name}`, payload ?? {});
}

export const functions = {
  invoke,
  gmailOAuth: (payload) => invoke('gmailOAuth', payload),
  syncGmail: (payload) => invoke('syncGmail', payload),
  outlookOAuth: (payload) => invoke('outlookOAuth', payload),
  syncOutlook: (payload) => invoke('syncOutlook', payload),
};

export default functions;
