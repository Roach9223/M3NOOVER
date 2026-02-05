import { google, calendar_v3 } from 'googleapis';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { encrypt, decrypt, isEncryptionConfigured } from './encryption';
import { logger } from './logger';
import type { AdminIntegration, GoogleCalendarEvent, GoogleCalendarTokens } from '@/types/integrations';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const TIMEZONE = 'America/Los_Angeles';

/**
 * Check if Google Calendar integration is fully configured
 */
export function isGoogleCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    isEncryptionConfigured()
  );
}

/**
 * Get OAuth2 client instance
 */
function getOAuth2Client() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`;

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent', // Force refresh token to be returned
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleCalendarTokens> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error('No refresh token received. Please revoke access and try again.');
  }

  return {
    access_token: tokens.access_token || '',
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || undefined,
    scope: tokens.scope || undefined,
    token_type: tokens.token_type || undefined,
  };
}

/**
 * Get user's email from Google
 */
export async function getUserEmail(accessToken: string): Promise<string | null> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return data.email || null;
  } catch {
    return null;
  }
}

/**
 * Store integration tokens in database
 */
export async function storeIntegrationTokens(
  tokens: GoogleCalendarTokens,
  email: string | null
): Promise<void> {
  const supabase = await createSupabaseClient();

  const encryptedAccessToken = tokens.access_token ? encrypt(tokens.access_token) : null;
  const encryptedRefreshToken = encrypt(tokens.refresh_token);
  const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;

  // Upsert integration record
  const { error } = await supabase
    .from('admin_integrations')
    .upsert(
      {
        integration_type: 'google_calendar',
        encrypted_access_token: encryptedAccessToken,
        encrypted_refresh_token: encryptedRefreshToken,
        token_expiry: tokenExpiry,
        account_email: email,
        calendar_id: 'primary',
        is_active: true,
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'integration_type',
      }
    );

  if (error) {
    throw new Error(`Failed to store integration: ${error.message}`);
  }
}

/**
 * Get stored integration from database
 */
export async function getStoredIntegration(): Promise<AdminIntegration | null> {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('admin_integrations')
    .select('*')
    .eq('integration_type', 'google_calendar')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AdminIntegration;
}

/**
 * Get authenticated Calendar client with auto-refresh
 */
export async function getCalendarClient(): Promise<calendar_v3.Calendar | null> {
  const integration = await getStoredIntegration();
  if (!integration) {
    return null;
  }

  const oauth2Client = getOAuth2Client();

  // Decrypt tokens
  const refreshToken = decrypt(integration.encrypted_refresh_token);
  const accessToken = integration.encrypted_access_token
    ? decrypt(integration.encrypted_access_token)
    : null;

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
    access_token: accessToken,
    expiry_date: integration.token_expiry ? new Date(integration.token_expiry).getTime() : undefined,
  });

  // Set up token refresh handler
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const supabase = await createSupabaseClient();
      await supabase
        .from('admin_integrations')
        .update({
          encrypted_access_token: encrypt(tokens.access_token),
          token_expiry: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('integration_type', 'google_calendar');
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create a calendar event for a booking
 */
export async function createCalendarEvent(booking: {
  id: string;
  start_time: string;
  end_time: string;
  session_type?: { name: string } | null;
  parent?: { full_name: string | null } | null;
  notes?: string | null;
}): Promise<string | null> {
  const calendar = await getCalendarClient();
  if (!calendar) {
    return null;
  }

  const integration = await getStoredIntegration();
  const calendarId = integration?.calendar_id || 'primary';

  const sessionTypeName = booking.session_type?.name || 'Training Session';
  const parentName = booking.parent?.full_name || 'Client';

  const event: GoogleCalendarEvent = {
    summary: `M3FIT: ${sessionTypeName}`,
    description: `Client: ${parentName}\nSession: ${sessionTypeName}${booking.notes ? `\nNotes: ${booking.notes}` : ''}`,
    start: {
      dateTime: booking.start_time,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: booking.end_time,
      timeZone: TIMEZONE,
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 60 }],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return response.data.id || null;
  } catch (error) {
    logger.error('Failed to create calendar event', error);
    throw error;
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  booking: {
    id: string;
    start_time: string;
    end_time: string;
    session_type?: { name: string } | null;
    parent?: { full_name: string | null } | null;
    notes?: string | null;
  }
): Promise<boolean> {
  const calendar = await getCalendarClient();
  if (!calendar) {
    return false;
  }

  const integration = await getStoredIntegration();
  const calendarId = integration?.calendar_id || 'primary';

  const sessionTypeName = booking.session_type?.name || 'Training Session';
  const parentName = booking.parent?.full_name || 'Client';

  const event: GoogleCalendarEvent = {
    summary: `M3FIT: ${sessionTypeName}`,
    description: `Client: ${parentName}\nSession: ${sessionTypeName}${booking.notes ? `\nNotes: ${booking.notes}` : ''}`,
    start: {
      dateTime: booking.start_time,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: booking.end_time,
      timeZone: TIMEZONE,
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 60 }],
    },
  };

  try {
    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });

    return true;
  } catch (error: unknown) {
    // If event not found, try creating a new one
    if ((error as { code?: number })?.code === 404) {
      const newEventId = await createCalendarEvent(booking);
      if (newEventId) {
        // Update booking with new event ID
        const supabase = await createSupabaseClient();
        await supabase
          .from('bookings')
          .update({ google_event_id: newEventId })
          .eq('id', booking.id);
        return true;
      }
    }
    logger.error('Failed to update calendar event', error);
    throw error;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const calendar = await getCalendarClient();
  if (!calendar) {
    return false;
  }

  const integration = await getStoredIntegration();
  const calendarId = integration?.calendar_id || 'primary';

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    return true;
  } catch (error: unknown) {
    // Ignore 404 errors (event already deleted)
    if ((error as { code?: number })?.code === 404) {
      return true;
    }
    logger.error('Failed to delete calendar event', error);
    throw error;
  }
}

/**
 * Revoke access and delete integration
 */
export async function revokeAccess(): Promise<void> {
  const integration = await getStoredIntegration();
  if (!integration) {
    return;
  }

  try {
    const oauth2Client = getOAuth2Client();
    const refreshToken = decrypt(integration.encrypted_refresh_token);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    await oauth2Client.revokeCredentials();
  } catch (error) {
    logger.error('Failed to revoke Google credentials', error);
    // Continue with deletion even if revoke fails
  }

  const supabase = await createSupabaseClient();
  await supabase
    .from('admin_integrations')
    .delete()
    .eq('integration_type', 'google_calendar');
}

/**
 * Sync a single booking to Google Calendar
 */
export async function syncBookingToCalendar(bookingId: string): Promise<void> {
  const supabase = await createSupabaseClient();

  // Get booking with related data
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      session_type:session_types(name),
      parent:profiles!parent_id(full_name)
    `)
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  // Skip cancelled bookings
  if (booking.status === 'cancelled') {
    if (booking.google_event_id) {
      await deleteCalendarEvent(booking.google_event_id);
    }
    await supabase
      .from('bookings')
      .update({
        google_sync_status: 'not_applicable',
        google_event_id: null,
      })
      .eq('id', bookingId);
    return;
  }

  try {
    let eventId = booking.google_event_id;

    if (eventId) {
      // Update existing event
      await updateCalendarEvent(eventId, booking);
    } else {
      // Create new event
      eventId = await createCalendarEvent(booking);
    }

    // Update booking with sync status
    await supabase
      .from('bookings')
      .update({
        google_event_id: eventId,
        google_sync_status: 'synced',
        google_sync_error: null,
      })
      .eq('id', bookingId);

    // Update last sync timestamp
    await supabase
      .from('admin_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('integration_type', 'google_calendar');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('bookings')
      .update({
        google_sync_status: 'failed',
        google_sync_error: errorMessage,
      })
      .eq('id', bookingId);

    await supabase
      .from('admin_integrations')
      .update({
        last_error: errorMessage,
      })
      .eq('integration_type', 'google_calendar');

    throw error;
  }
}
