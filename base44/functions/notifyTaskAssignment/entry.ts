import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data } = payload;

    // Only act if assigned_to is set and changed
    const newAssignedTo = data?.assigned_to;
    const oldAssignedTo = old_data?.assigned_to;

    if (!newAssignedTo) {
      console.log('No assigned_to on task, skipping notification.');
      return Response.json({ skipped: true });
    }

    // Skip if assignment didn't change (update event)
    if (event?.type === 'update' && newAssignedTo === oldAssignedTo) {
      console.log('Assignment unchanged, skipping notification.');
      return Response.json({ skipped: true });
    }

    console.log(`Task "${data.title}" assigned to member ID: ${newAssignedTo}`);

    // Get the assignee's TeamMember record
    const members = await base44.asServiceRole.entities.TeamMember.filter({ id: newAssignedTo });
    if (!members || members.length === 0) {
      console.log('TeamMember not found for id:', newAssignedTo);
      return Response.json({ skipped: true, reason: 'member not found' });
    }
    const member = members[0];

    // Determine who assigned the task
    let assignedByName = 'WiKima';
    let assignedByEmail = '';
    try {
      // Try to get the current user from request context
      const user = await base44.auth.me();
      if (user) {
        assignedByName = user.full_name || user.email;
        assignedByEmail = user.email;
      }
    } catch (e) {
      console.log('Could not get assigning user, using fallback.');
    }

    const notificationType = (event?.type === 'update' && oldAssignedTo) ? 'task_reassigned' : 'task_assigned';

    // Create in-app notification record
    const notification = await base44.asServiceRole.entities.TaskAssignmentNotification.create({
      workspace_id: data.workspace_id,
      task_id: data.id || event?.entity_id,
      task_title: data.title,
      task_priority: data.priority || 'medium',
      task_deadline: data.deadline || null,
      assigned_to_id: newAssignedTo,
      assigned_to_name: member.full_name,
      assigned_to_email: member.email,
      assigned_by_name: assignedByName,
      assigned_by_email: assignedByEmail,
      assigned_date: new Date().toISOString(),
      read: false,
      type: notificationType
    });

    console.log('In-app notification created:', notification.id);

    // Send email notification if member has an email
    if (member.email) {
      const priorityLabel = {
        low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent'
      }[data.priority] || 'Medium';

      const deadlineText = data.deadline
        ? new Date(data.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'No deadline set';

      const emailBody = `
Hello ${member.full_name},

You have been assigned a new task in WiKima.

━━━━━━━━━━━━━━━━━━━━
📋 Task: ${data.title}
📅 Assigned on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
⚡ Priority: ${priorityLabel}
🗓️ Deadline: ${deadlineText}
👤 Assigned by: ${assignedByName}
━━━━━━━━━━━━━━━━━━━━

${data.description ? `Details:\n${data.description}\n` : ''}
Log in to WiKima to view and manage this task.

Best regards,
The WiKima Team
      `.trim();

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: member.email,
        subject: `📋 New Task Assigned: ${data.title}`,
        body: emailBody,
        from_name: 'WiKima'
      });

      console.log('Email notification sent to:', member.email);
    }

    return Response.json({ success: true, notification_id: notification.id });
  } catch (error) {
    console.error('notifyTaskAssignment error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});