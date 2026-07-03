import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Deletes a Google Calendar event by its google_event_id
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { googleEventId } = await req.json();
    if (!googleEventId) return Response.json({ success: true, skipped: true });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const delRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!delRes.ok && delRes.status !== 404 && delRes.status !== 410) {
      const err = await delRes.text();
      console.error('Google delete error:', err);
      return Response.json({ error: 'Failed to delete', details: err }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('deleteGoogleCalendarEvent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});