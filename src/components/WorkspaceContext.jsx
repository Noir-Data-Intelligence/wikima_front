import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/api/client';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberRole, setMemberRole] = useState(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const user = await api.auth.me();

      // GET /workspace already returns only the caller's workspaces (the backend
      // scopes the list to real memberships) — no member-record round-trip needed.
      const list = await api.entities.Workspace.list();
      setWorkspaces(Array.isArray(list) ? list : []);

      if (!list || list.length === 0) {
        setLoading(false);
        return;
      }

      // Set current workspace from user preferences or first workspace
      const targetWorkspaceId = user.current_workspace_id || user.default_workspace_id;
      const currentWs = list.find(w => w.id === targetWorkspaceId) || list[0];
      setCurrentWorkspace(currentWs);

      // The caller's own membership row gives the role in the current workspace.
      try {
        const membership = await api.entities.WorkspaceMember.filter({
          workspace_id: currentWs.id,
          user_email: user.email
        });
        setMemberRole(membership[0]?.role || 'member');
      } catch {
        setMemberRole('member');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId) => {
    try {
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (!workspace) return;

      const user = await api.auth.me();
      
      // Update user's current workspace
      await api.auth.updateMe({ current_workspace_id: workspaceId });
      
      // Get member role for this workspace
      const memberRecord = await api.entities.WorkspaceMember.filter({
        workspace_id: workspaceId,
        user_email: user.email
      });
      
      setCurrentWorkspace(workspace);
      setMemberRole(memberRecord[0]?.role || 'member');
      
      // Reload page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Error switching workspace:', error);
    }
  };

  const createWorkspace = async (workspaceData) => {
    try {
      // The backend derives the owner from the authenticated user and creates the
      // owner membership in the same transaction — no WorkspaceMember.create here.
      const newWorkspace = await api.entities.Workspace.create(workspaceData);

      // Set as current workspace
      await api.auth.updateMe({
        current_workspace_id: newWorkspace.id,
        default_workspace_id: newWorkspace.id
      });

      setCurrentWorkspace(newWorkspace);
      setMemberRole('owner');
      setWorkspaces([...workspaces, newWorkspace]);

      return newWorkspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  const hasPermission = (permission) => {
    if (memberRole === 'owner' || memberRole === 'admin') return true;
    // Add more granular permission checking here
    return true;
  };

  return (
    <WorkspaceContext.Provider 
      value={{
        currentWorkspace,
        workspaces,
        loading,
        memberRole,
        switchWorkspace,
        createWorkspace,
        hasPermission,
        refreshWorkspaces: loadWorkspaces
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};