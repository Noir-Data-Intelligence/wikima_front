import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Resend } from 'npm:resend@4.0.0';

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      memberEmail, memberName, memberRole, workspaceId, workspaceName,
      appRole, teamMemberId, companyName, companyLogoUrl
    } = await req.json();

    if (!memberEmail || !workspaceId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = generateToken();
    const origin = req.headers.get('origin') || 'https://wikima.app';
    const inviteUrl = `${origin}/AcceptInvite?token=${token}&workspace=${workspaceId}`;
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expirationStr = expirationDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    const displayCompany = companyName || workspaceName || 'WiKima';
    const displayInviter = user.full_name || user.email || 'Your team';
    const displayRole    = memberRole || 'Team Member';
    const roleLabel      = appRole === 'admin' ? 'Administrator' : appRole === 'manager' ? 'Manager' : appRole === 'owner' ? 'Owner' : 'Employee';

    // Update existing or create new TeamMember record
    const inviteData = {
      invitation_token: token,
      invitation_status: 'pending',
      invitation_sent_at: new Date().toISOString(),
      invited_by_email: user.email,
      invited_by_name: user.full_name
    };

    if (teamMemberId) {
      await base44.asServiceRole.entities.TeamMember.update(teamMemberId, inviteData);
    } else {
      await base44.asServiceRole.entities.TeamMember.create({
        workspace_id: workspaceId,
        full_name: memberName,
        email: memberEmail,
        role: displayRole,
        app_role: appRole || 'member',
        status: 'active',
        ...inviteData
      });
    }

    console.log(`Sending invitation to ${memberEmail} for workspace ${workspaceId}`);

    const logoSection = companyLogoUrl
      ? `<img src="${companyLogoUrl}" alt="${displayCompany}" style="max-height:48px; max-width:160px; margin-bottom:12px; border-radius:8px;" />`
      : '';

    const emailBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;margin:0;padding:24px 0;">
  <div style="max-width:560px;margin:0 auto;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1c2d5f 0%,#1e3a7a 100%);border-radius:16px 16px 0 0;padding:36px 40px 28px;text-align:center;">
      ${logoSection}
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;margin-bottom:4px;">Wi<span style="color:#e97c3f;">Ki</span>ma</div>
      <p style="color:rgba(255,255,255,0.55);margin:0;font-size:13px;">Business Management Platform</p>
    </div>

    <!-- Body -->
    <div style="background:#1e293b;padding:40px;">
      <h2 style="color:#fff;font-size:20px;margin:0 0 8px;font-weight:700;">You've been invited! 🎉</h2>
      <p style="color:#94a3b8;font-size:15px;line-height:1.65;margin:0 0 6px;">
        <strong style="color:#e2e8f0;">${displayInviter}</strong> has invited you to join the team at
        <strong style="color:#e97c3f;">${displayCompany}</strong> on WiKima.
      </p>

      <!-- Role pill -->
      <div style="display:inline-block;background:#e97c3f22;border:1px solid #e97c3f55;border-radius:8px;padding:8px 16px;margin:16px 0 24px;">
        <span style="color:#e97c3f;font-size:13px;font-weight:600;">Your role: ${displayRole} · ${roleLabel}</span>
      </div>

      <!-- Info box -->
      <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:28px;border:1px solid #334155;">
        <p style="color:#64748b;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">With WiKima you can:</p>
        <div style="margin-bottom:8px;"><span style="color:#e97c3f;">✓ </span><span style="color:#cbd5e1;font-size:13px;">View and manage tasks assigned to you</span></div>
        <div style="margin-bottom:8px;"><span style="color:#e97c3f;">✓ </span><span style="color:#cbd5e1;font-size:13px;">Collaborate with your team in real-time</span></div>
        <div><span style="color:#e97c3f;">✓ </span><span style="color:#cbd5e1;font-size:13px;">Access shared documents and agenda</span></div>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${inviteUrl}" style="display:inline-block;background:#e97c3f;color:#fff;font-weight:700;font-size:16px;padding:15px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
          Accept Invitation →
        </a>
      </div>

      <p style="color:#475569;font-size:12px;text-align:center;margin:0 0 4px;">
        This invitation expires on <strong style="color:#64748b;">${expirationStr}</strong>.
      </p>
      <p style="color:#334155;font-size:11px;text-align:center;margin:0;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#0f172a;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #1e293b;">
      <p style="color:#334155;font-size:11px;margin:0;">
        WiKima · Business Management · <a href="https://wikima.app" style="color:#475569;">wikima.app</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const { error: emailError } = await resend.emails.send({
      from: 'WiKima <onboarding@resend.dev>',
      to: memberEmail,
      subject: `${displayInviter} invited you to join ${displayCompany} on WiKima`,
      html: emailBody
    });

    if (emailError) {
      console.error('Resend error:', JSON.stringify(emailError));
      throw new Error(emailError.message);
    }

    console.log(`Invitation sent successfully to ${memberEmail}`);
    return Response.json({ success: true, token, expiresAt: expirationDate.toISOString() });

  } catch (error) {
    console.error('inviteTeamMember error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});