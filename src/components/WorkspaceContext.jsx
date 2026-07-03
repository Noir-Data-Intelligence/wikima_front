import React, { createContext, useContext, useState, useEffect } from 'react';
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
      
      // Get user's workspaces
      const memberRecords = await api.entities.WorkspaceMember.filter({
        user_email: user.email,
        status: 'active'
      });
      
      if (memberRecords.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch all workspace details
      const workspacePromises = memberRecords.map(async (member) => {
        const workspace = await api.entities.Workspace.filter({ id: member.workspace_id });
        return { workspace: workspace[0], role: member.role, permissions: member.permissions };
      });

      const workspaceData = await Promise.all(workspacePromises);
      setWorkspaces(workspaceData.map(w => w.workspace).filter(Boolean));

      // Set current workspace from user preferences or first workspace
      let targetWorkspaceId = user.current_workspace_id || user.default_workspace_id;
      
      if (!targetWorkspaceId && workspaceData.length > 0) {
        targetWorkspaceId = workspaceData[0].workspace.id;
      }

      if (targetWorkspaceId) {
        const currentWs = workspaceData.find(w => w.workspace?.id === targetWorkspaceId);
        if (currentWs) {
          setCurrentWorkspace(currentWs.workspace);
          setMemberRole(currentWs.role);
        }
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
      const user = await api.auth.me();
      
      const newWorkspace = await api.entities.Workspace.create({
        ...workspaceData,
        owner_email: user.email
      });

      // Create workspace member record for owner
      await api.entities.WorkspaceMember.create({
        workspace_id: newWorkspace.id,
        user_email: user.email,
        role: 'owner',
        status: 'active',
        joined_date: new Date().toISOString(),
        permissions: {
          can_manage_tasks: true,
          can_manage_clients: true,
          can_manage_documents: true,
          can_manage_invoices: true,
          can_view_financials: true,
          can_manage_members: true
        }
      });

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