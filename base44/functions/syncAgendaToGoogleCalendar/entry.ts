import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Push a single Wikima event to Google Calendar (create, update, or delete)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { eventId, action } = await req.json();
    // action: 'upsert' | 'delete'

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Handle delete
    if (action === 'delete') {
      const { googleEventId } = await req.json().catch(() => ({}));
      if (!googleEventId) return Response.json({ success: true, skipped: true });
      const delRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        { method: 'DELETE', headers: authHeader }
      );
      if (!delRes.ok && delRes.status !== 404 && delRes.status !== 410) {
        const err = await delRes.text();
        console.error('Google delete error:', err);
        return Response.json({ error: 'Failed to delete from Google Calendar' }, { status: 500 });
      }
      return Response.json({ success: true });
    }

    // Load event
    const workspaceId = user.current_workspace_id || user.default_workspace_id;
    const events = await base44.entities.AgendaEvent.filter({ workspace_id: workspaceId, id: eventId });
    if (!events || events.length === 0) return Response.json({ error: 'Event not found' }, { status: 404 });

    const event = events[0];
    const startDateTime = `${event.date}T${event.start_time}:00`;
    const endDateTime = `${event.date}T${event.end_time}:00`;

    const calendarEvent = {
      summary: event.title,
      description: [event.description, event.client_name ? `Client: ${event.client_name}` : ''].filter(Boolean).join('\n'),
      start: { dateTime: startDateTime, timeZone: 'Europe/Lisbon' },
      end: { dateTime: endDateTime, timeZone: 'Europe/Lisbon' },
      location: event.location || '',
      extendedProperties: {
        private: { wikima_event_id: event.id }
      },
      reminders: event.reminder_enabled
        ? { useDefault: false, overrides: [{ method: 'popup', minutes: event.reminder_time || 30 }] }
        : { useDefault: true }
    };

    let googleEventId = event.google_event_id;
    let googleRes;

    if (googleEventId) {
      // Update existing
      googleRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        { method: 'PUT', headers: authHeader, body: JSON.stringify(calendarEvent) }
      );
      // If not found, create fresh
      if (googleRes.status === 404 || googleRes.status === 410) {
        googleEventId = null;
      }
    }

    if (!googleEventId) {
      // Create new
      googleRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        { method: 'POST', headers: authHeader, body: JSON.stringify(calendarEvent) }
      );
    }

    if (!googleRes.ok) {
      const err = await googleRes.text();
      console.error('Google Calendar API error:', err);
      return Response.json({ error: 'Google Calendar API error', details: err }, { status: 500 });
    }

    const created = await googleRes.json();

    // Save google_event_id back to Wikima event
    if (created.id !== event.google_event_id) {
      await base44.entities.AgendaEvent.update(event.id, { google_event_id: created.id });
    }

    return Response.json({ success: true, googleEventId: created.id, googleEventUrl: created.htmlLink });

  } catch (error) {
    console.error('syncAgendaToGoogleCalendar error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});