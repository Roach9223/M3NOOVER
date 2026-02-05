import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addDays, format, parse, setHours, setMinutes, isBefore, isAfter, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { TimeSlot } from '@/types/scheduling';

const TIMEZONE = 'America/Los_Angeles';

export async function GET(request: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');
  const sessionTypeId = searchParams.get('session_type_id');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'start and end dates required' }, { status: 400 });
  }

  // Get settings
  const { data: settings } = await supabase
    .from('scheduling_settings')
    .select('*')
    .single();

  const bookingWindowDays = settings?.booking_window_days || 30;
  const minNoticeHours = settings?.min_booking_notice_hours || 2;

  // Get session type for duration
  let durationMinutes = 60;
  let maxAthletes = 1;
  if (sessionTypeId) {
    const { data: sessionType } = await supabase
      .from('session_types')
      .select('duration_minutes, max_athletes')
      .eq('id', sessionTypeId)
      .single();
    if (sessionType) {
      durationMinutes = sessionType.duration_minutes;
      maxAthletes = sessionType.max_athletes;
    }
  }

  // Get availability templates
  const { data: templates } = await supabase
    .from('availability_templates')
    .select('*')
    .eq('is_active', true);

  // Get exceptions for date range
  const { data: exceptions } = await supabase
    .from('availability_exceptions')
    .select('*')
    .gte('exception_date', startDate)
    .lte('exception_date', endDate);

  // Get existing bookings for date range
  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_time, end_time, session_type_id')
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .in('status', ['confirmed', 'pending']);

  // Calculate available slots
  const slots: TimeSlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  const minBookingTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);
  const maxBookingDate = addDays(now, bookingWindowDays);

  let currentDate = start;
  while (currentDate <= end && currentDate <= maxBookingDate) {
    const dayOfWeek = toZonedTime(currentDate, TIMEZONE).getDay();
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    // Check if entire day is blocked
    const dayException = exceptions?.find(
      (e) => e.exception_date === dateStr && !e.start_time && !e.is_available
    );

    if (!dayException) {
      // Get templates for this day
      const dayTemplates = templates?.filter((t) => t.day_of_week === dayOfWeek) || [];

      for (const template of dayTemplates) {
        // Parse template times
        const [startHour, startMin] = template.start_time.split(':').map(Number);
        const [endHour, endMin] = template.end_time.split(':').map(Number);

        // Create time slots based on session duration
        let slotStart = setMinutes(setHours(startOfDay(currentDate), startHour), startMin);
        const slotEnd = setMinutes(setHours(startOfDay(currentDate), endHour), endMin);

        while (isBefore(slotStart, slotEnd)) {
          const slotEndTime = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

          if (isAfter(slotEndTime, slotEnd)) break;

          // Check if slot is in the past or before min notice time
          if (isBefore(slotStart, minBookingTime)) {
            slotStart = slotEndTime;
            continue;
          }

          // Check for time-specific exceptions
          const slotTimeStr = format(slotStart, 'HH:mm:ss');
          const timeException = exceptions?.find(
            (e) =>
              e.exception_date === dateStr &&
              e.start_time === slotTimeStr &&
              !e.is_available
          );

          if (!timeException) {
            // Count existing bookings for this slot
            const slotStartISO = slotStart.toISOString();
            const overlappingBookings = bookings?.filter((b) => {
              const bookingStart = new Date(b.start_time);
              const bookingEnd = new Date(b.end_time);
              return (
                (isBefore(bookingStart, slotEndTime) && isAfter(bookingEnd, slotStart))
              );
            }) || [];

            const bookingCount = overlappingBookings.length;
            const available = bookingCount < maxAthletes;

            slots.push({
              start: slotStart,
              end: slotEndTime,
              available,
              bookingCount,
              maxAthletes,
            });
          }

          slotStart = slotEndTime;
        }
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  return NextResponse.json(slots);
}
