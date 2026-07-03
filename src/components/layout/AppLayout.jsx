import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import AppShell from './AppShell';
import { FullPageSpinner } from '@/components/brand/BrandSpinner';

// Legacy context providers the migrated app pages still depend on.
import { LanguageProvider } from '@/components/LanguageContext';
import { DemoModeProvider } from '@/components/DemoModeContext';
import { TierProvider } from '@/components/TierContext';
import { WorkspaceProvider } from '@/components/WorkspaceContext';
import { UserTypeProvider } from '@/components/UserTypeContext';

// Derive the 3-profile system from user.user_profile (set during onboarding);
// falls back to the current workspace type for legacy accounts.
function deriveProfile(user, workspace) {
  if (user?.user_profile) return user.user_profile; // 'personal' | 'professional' | 'company'
  if (workspace?.type === 'company') return 'company';
  if (workspace?.type === 'personal') return 'personal';
  return 'professional';
}

/**
 * Authenticated shell layout used as a parent route element. Guards auth +
 * onboarding, loads the workspace list for the switcher, and renders the shared
 * AppShell (sidebar + topbar) around nested routes via <Outlet />.
 */
export default function AppLayout() {
  const { user, isAuthenticated, isLoadingAuth, onboardingCompleted } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let active = true;

    (async () => {
      const wsId = user.current_workspace_id || user.default_workspace_id;
      let list = [];
      try {
        list = await api.entities.Workspace.list();
      } catch {
        list = [];
      }
      if (!active) return;
      list = Array.isArray(list) ? list : [];
      setWorkspaces(list);

      let current = wsId ? list.find((w) => w.id === wsId) : null;
      if (!current && wsId) {
        try {
          current = await api.entities.Workspace.get(wsId);
        } catch {
          current = null;
        }
      }
      if (active) setCurrentWorkspace(current || list[0] || null);
    })();

    return () => {
      active = false;
    };
  }, [isAuthenticated, user]);

  if (isLoadingAuth) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (onboardingCompleted === false) return <Navigate to="/onboarding" replace />;

  const isAdmin = user?.role === 'admin';
  const profile = deriveProfile(user, currentWorkspace);

  const handleSelectWorkspace = async (ws) => {
    if (!ws || ws.id === currentWorkspace?.id) return;
    setCurrentWorkspace(ws);
    try {
      await api.auth.updateMe({ current_workspace_id: ws.id });
    } catch {
      /* best-effort; backend may not exist yet */
    }
  };

  return (
    <LanguageProvider>
      <DemoModeProvider>
        <TierProvider>
          <WorkspaceProvider>
            <UserTypeProvider>
              <AppShell
                profile={profile}
                isAdmin={isAdmin}
                user={user}
                workspaces={workspaces}
                currentWorkspace={currentWorkspace}
                onSelectWorkspace={handleSelectWorkspace}
              >
                <Outlet />
              </AppShell>
            </UserTypeProvider>
          </WorkspaceProvider>
        </TierProvider>
      </DemoModeProvider>
    </LanguageProvider>
  );
}
