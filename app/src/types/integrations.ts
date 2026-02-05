export type IntegrationType = 'google_calendar';

export type GoogleSyncStatus = 'pending' | 'synced' | 'failed' | 'not_applicable';

export interface AdminIntegration {
  id: string;
  integration_type: IntegrationType;
  encrypted_access_token: string | null;
  encrypted_refresh_token: string;
  token_expiry: string | null;
  account_email: string | null;
  calendar_id: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarTokens {
  access_token: string;
  refresh_token: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
}

export interface GoogleCalendarStatus {
  connected: boolean;
  email: string | null;
  calendarId: string | null;
  lastSync: string | null;
  lastError: string | null;
}

export interface GoogleCalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: Array<{ bookingId: string; error: string }>;
}
