import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Handles Google Calendar webhook events → syncs changes into Wikima AgendaEvents
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const state = body?.data?._provider_meta?.['x-goog-resource-state'];
    console.log('Google Calendar webhook state:', state);

    // Acknowledge sync notifications immediately
    if (state === 'sync') return Response.json({ status: 'sync_ack' });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Load sync token
    const syncRecords = await base44.asServiceRole.entities.SyncState.filter({ key: 'google_calendar' });
    const syncRecord = syncRecords.length > 0 ? syncRecords[0] : null;

    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&singleEvents=true';
    if (syncRecord?.sync_token) {
      url += `&syncToken=${encodeURIComponent(syncRecord.sync_token)}`;
    } else {
      url += '&timeMin=' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    let res = await fetch(url, { headers: authHeader });

    // syncToken expired — full refresh
    if (res.status === 410) {
      console.log('syncToken expired, doing full refresh');
      url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&singleEvents=true'
        + '&timeMin=' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      res = await fetch(url, { headers: authHeader });
    }

    if (!res.ok) {
      const err = await res.text();
      console.error('Google Calendar list error:', err);
      return Response.json({ status: 'api_error', error: err });
    }

    // Drain all pages
    const allItems = [];
    let pageData = await res.json();
    let newSyncToken = null;

    while (true) {
      allItems.push(...(pageData.items || []));
      if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
      if (!pageData.nextPageToken) break;
      const nextRes = await fetch(url + `&pageToken=${pageData.nextPageToken}`, { headers: authHeader });
      if (!nextRes.ok) break;
      pageData = await nextRes.json();
    }

    console.log(`Processing ${allItems.length} Google Calendar changes`);

    // Get all workspaces to find Wikima events by google_event_id
    for (const gEvent of allItems) {
      const googleEventId = gEvent.id;
      const isDeleted = gEvent.status === 'cancelled';

      // Skip events that originated from Wikima (we pushed them)
      const wikimaId = gEvent.extendedProperties?.private?.wikima_event_id;

      // Find existing Wikima event linked to this Google event
      const existingWikimaEvents = await base44.asServiceRole.entities.AgendaEvent.filter({ google_event_id: googleEventId });
      const existingEvent = existingWikimaEvents.length > 0 ? existingWikimaEvents[0] : null;

      if (isDeleted) {
        if (existingEvent) {
          console.log('Deleting Wikima event for cancelled Google event:', googleEventId);
          await base44.asServiceRole.entities.AgendaEvent.delete(existingEvent.id);
        }
        continue;
      }

      // Skip if this event was created/modified by Wikima itself (avoid loops)
      if (wikimaId && existingEvent && wikimaId === existingEvent.id) {
        // This is a Wikima-originated event; only update if google modified the title/description/time
        // We still update to capture edits made in Google Calendar
      }

      // Parse date/time
      const startRaw = gEvent.start?.dateTime || gEvent.start?.date;
      const endRaw = gEvent.end?.dateTime || gEvent.end?.date;
      if (!startRaw) continue;

      const startDate = new Date(startRaw);
      const endDate = new Date(endRaw);

      const date = startDate.toISOString().split('T')[0];
      const start_time = startRaw.includes('T')
        ? startDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Lisbon' })
        : '09:00';
      const end_time = endRaw?.includes('T')
        ? endDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Lisbon' })
        : '10:00';

      const eventPayload = {
        title: gEvent.summary || '(No title)',
        description: gEvent.description || '',
        date,
        start_time,
        end_time,
        location: gEvent.location || '',
        google_event_id: googleEventId
      };

      if (existingEvent) {
        console.log('Updating Wikima event from Google:', googleEventId);
        await base44.asServiceRole.entities.AgendaEvent.update(existingEvent.id, eventPayload);
      } else if (!wikimaId) {
        // New event from Google that doesn't exist in Wikima — create it
        // Find workspace to assign it to
        const workspaces = await base44.asServiceRole.entities.Workspace.list();
        if (workspaces.length > 0) {
          console.log('Creating Wikima event from Google:', googleEventId);
          await base44.asServiceRole.entities.AgendaEvent.create({
            ...eventPayload,
            workspace_id: workspaces[0].id,
            status: 'scheduled'
          });
        }
      }
    }

    // Save new sync token
    if (newSyncToken) {
      if (syncRecord) {
        await base44.asServiceRole.entities.SyncState.update(syncRecord.id, { sync_token: newSyncToken, key: 'google_calendar' });
      } else {
        await base44.asServiceRole.entities.SyncState.create({ key: 'google_calendar', sync_token: newSyncToken });
      }
    }

    return Response.json({ status: 'ok', processed: allItems.length });

  } catch (error) {
    console.error('googleCalendarWebhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});