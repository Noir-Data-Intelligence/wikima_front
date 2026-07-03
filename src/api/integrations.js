// Integration helpers (file upload, LLM, email/SMS, image, extraction).
//
// Exposed under `Core` to match the existing call sites
// (`integrations.Core.UploadFile(...)`, etc). Each maps to a REST endpoint on
// the integrations microservice.

import { http } from './http';

export const Core = {
  /** Upload a file (multipart). Returns { file_url }. */
  async UploadFile({ file }) {
    const form = new FormData();
    form.append('file', file);
    return http.post('/integrations/upload', form);
  },

  /** Invoke an LLM prompt. */
  InvokeLLM(payload) {
    return http.post('/integrations/llm', payload);
  },

  /** Send a transactional email. */
  SendEmail(payload) {
    return http.post('/integrations/email', payload);
  },

  /** Send an SMS. */
  SendSMS(payload) {
    return http.post('/integrations/sms', payload);
  },

  /** Generate an image from a prompt. */
  GenerateImage(payload) {
    return http.post('/integrations/generate-image', payload);
  },

  /** Extract structured data from a previously uploaded file. */
  ExtractDataFromUploadedFile(payload) {
    return http.post('/integrations/extract-data', payload);
  },
};

export const integrations = { Core };

export default integrations;
