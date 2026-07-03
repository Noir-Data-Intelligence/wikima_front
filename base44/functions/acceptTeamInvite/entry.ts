import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, workspaceId } = await req.json();

    if (!token || !workspaceId) {
      return Response.json({ error: 'Missing token or workspaceId' }, { status: 400 });
    }

    // Find the TeamMember record by token
    const members = await base44.asServiceRole.entities.TeamMember.filter({
      invitation_token: token,
      workspace_id: workspaceId
    });

    if (members.length === 0) {
      return Response.json({ error: 'Invalid or expired invitation token' }, { status: 404 });
    }

    const member = members[0];

    if (member.invitation_status === 'accepted') {
      return Response.json({ error: 'Invitation already accepted', already_accepted: true }, { status: 400 });
    }

    // Check token expiry (7 days)
    if (member.invitation_sent_at) {
      const sentAt = new Date(member.invitation_sent_at);
      const now = new Date();
      const daysDiff = (now - sentAt) / (1000 * 60 * 60 * 24);
      if (daysDiff > 7) {
        await base44.asServiceRole.entities.TeamMember.update(member.id, { invitation_status: 'expired' });
        return Response.json({ error: 'Invitation has expired', expired: true }, { status: 400 });
      }
    }

    // Get the currently logged-in user (if any)
    let currentUser = null;
    try {
      currentUser = await base44.auth.me();
    } catch (e) {
      // Not logged in — that's fine, we'll handle below
    }

    // If user is logged in, link them
    if (currentUser) {
      // Verify the email matches (optional security check — soft warning)
      const emailMatches = currentUser.email.toLowerCase() === member.email.toLowerCase();

      // Update TeamMember: mark as accepted, store user reference
      await base44.asServiceRole.entities.TeamMember.update(member.id, {
        invitation_status: 'accepted',
        joined_at: new Date().toISOString(),
        user_id: currentUser.id,
        full_name: currentUser.full_name || member.full_name,
        email: currentUser.email
      });

      // Create WorkspaceMember record to give access
      const existing = await base44.asServiceRole.entities.WorkspaceMember.filter({
        workspace_id: workspaceId,
        user_email: currentUser.email
      });

      if (existing.length === 0) {
        await base44.asServiceRole.entities.WorkspaceMember.create({
          workspace_id: workspaceId,
          user_email: currentUser.email,
          role: member.app_role || 'member',
          status: 'active',
          joined_date: new Date().toISOString(),
          permissions: {
            can_manage_tasks: true,
            can_manage_clients: false,
            can_manage_documents: true,
            can_manage_invoices: false,
            can_view_financials: false,
            can_manage_members: false
          }
        });
      }

      // Update user's default workspace
      await base44.auth.updateMe({
        current_workspace_id: workspaceId,
        default_workspace_id: workspaceId,
        onboarding_completed: true
      });

      return Response.json({
        success: true,
        member_name: member.full_name,
        workspace_id: workspaceId,
        email_mismatch: !emailMatches,
        logged_in_email: currentUser.email,
        expected_email: member.email
      });
    }

    // Not logged in — return member info so the frontend can redirect to login
    return Response.json({
      success: false,
      needs_login: true,
      member_email: member.email,
      member_name: member.full_name,
      workspace_id: workspaceId,
      token
    });

  } catch (error) {
    console.error('Error accepting invite:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});