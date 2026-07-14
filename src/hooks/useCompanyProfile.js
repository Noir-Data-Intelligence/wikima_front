import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

/**
 * Returns the company_info + settings from the current workspace.
 * Cached via React Query — always reads the latest saved data.
 */
export function useCompanyProfile() {
  return useQuery({
    queryKey: ['company_profile'],
    queryFn: async () => {
      const user = await api.auth.me();
      const wsId = user?.current_workspace_id || user?.default_workspace_id;
      if (!wsId) return null;
      const ws = await api.entities.Workspace.get(wsId).catch(() => null);
      if (!ws) return null;
      return {
        // company_info lives inside the workspace's jsonb settings on the backend.
        company_info: ws.settings?.company_info || ws.company_info || {},
        settings: ws.settings || {},
      };
    },
    staleTime: 60_000, // re-fetch at most every 60s
  });
}