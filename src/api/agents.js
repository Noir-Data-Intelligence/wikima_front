// Conversational agents service.
//
// Mirrors the SDK surface used by WiwiChat: createConversation / addMessage /
// subscribeToConversation. Realtime updates are implemented as a polling
// fallback here (returns an unsubscribe); swap for SSE/WebSocket when the
// backend exposes one.

import { http } from './http';

const conversationId = (conversation) =>
  typeof conversation === 'object' && conversation ? conversation.id : conversation;

export const agents = {
  createConversation(payload) {
    return http.post('/agents/conversations', payload ?? {});
  },

  addMessage(conversation, message) {
    const id = conversationId(conversation);
    return http.post(`/agents/conversations/${encodeURIComponent(id)}/messages`, message);
  },

  /**
   * Subscribe to conversation updates. Polls the conversation and invokes
   * `callback(data)` on each successful fetch. Returns an unsubscribe fn.
   */
  subscribeToConversation(conversation, callback, { intervalMs = 3000 } = {}) {
    const id = conversationId(conversation);
    let active = true;

    const tick = async () => {
      if (!active) return;
      try {
        const data = await http.get(`/agents/conversations/${encodeURIComponent(id)}`);
        if (active && data) callback(data);
      } catch {
        // ignore transient errors; next poll retries
      }
    };

    tick();
    const timer = setInterval(tick, intervalMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
  },
};

export default agents;
