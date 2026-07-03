import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = user.current_workspace_id || user.default_workspace_id;

    if (!workspaceId) {
      return Response.json({ error: 'No workspace found' }, { status: 400 });
    }

    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    // Fetch all agenda events for the workspace
    const events = await base44.entities.AgendaEvent.filter({ workspace_id: workspaceId });

    if (events.length === 0) {
      return Response.json({ success: true, synced: 0, message: 'No events to sync' });
    }

    let syncedCount = 0;
    const errors = [];

    // Get the primary calendar ID
    const calendarRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!calendarRes.ok) {
      return Response.json({ 
        error: 'Failed to access Google Calendar',
        details: await calendarRes.json()
      }, { status: 500 });
    }

    // Sync each event to Google Calendar
    for (const event of events) {
      try {
        // Convert WiKima event format to Google Calendar format
        const [startHour, startMin] = event.start_time.split(':').map(Number);
        const [endHour, endMin] = event.end_time.split(':').map(Number);

        const eventDate = new Date(event.date);
        const startDateTime = new Date(eventDate);
        startDateTime.setHours(startHour, startMin, 0);

        const endDateTime = new Date(eventDate);
        endDateTime.setHours(endHour, endMin, 0);

        const googleEvent = {
          summary: event.title,
          description: event.description || '',
          location: event.location || '',
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'UTC'
          },
          reminders: event.reminder_enabled ? {
            useDefault: false,
            overrides: [
              {
                method: 'notification',
                minutes: event.reminder_time || 30
              }
            ]
          } : {
            useDefault: true
          }
        };

        // Add client name if available
        if (event.client_name) {
          googleEvent.description = `${googleEvent.description}\n\nClient: ${event.client_name}`.trim();
        }

        // Create event in Google Calendar
        const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(googleEvent)
        });

        if (createRes.ok) {
          syncedCount++;
        } else {
          const error = await createRes.json();
          errors.push({
            event: event.title,
            error: error.error?.message || 'Unknown error'
          });
        }
      } catch (error) {
        errors.push({
          event: event.title,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      synced: syncedCount,
      total: events.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});