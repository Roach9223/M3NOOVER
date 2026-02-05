export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface AvailabilityTemplate {
  id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityException {
  id: string;
  exception_date: string;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
  reason: string | null;
  created_at: string;
}

export interface SessionType {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: 30 | 45 | 60;
  max_athletes: number;
  price_cents: number;
  is_active: boolean;
  created_at: string;
}

export interface SchedulingSettings {
  id: string;
  cancellation_notice_hours: number;
  booking_window_days: number;
  min_booking_notice_hours: number;
  timezone: string;
  created_at: string;
}

export type GoogleSyncStatus = 'pending' | 'synced' | 'failed' | 'not_applicable';

export interface Booking {
  id: string;
  parent_id: string;
  athlete_id: string | null;
  session_type_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  reminder_sent: boolean;
  google_event_id: string | null;
  google_sync_status: GoogleSyncStatus;
  google_sync_error: string | null;
  created_at: string;
  updated_at: string;
  session_type?: SessionType;
  parent?: { id: string; full_name: string | null; email?: string };
  athlete?: { id: string; name: string };
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  bookingCount: number;
  maxAthletes: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: Booking;
  type: 'booking' | 'available' | 'blocked';
}

export interface CreateBookingInput {
  session_type_id: string;
  athlete_id?: string;
  start_time: string;
  notes?: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  created_at: string;
}
