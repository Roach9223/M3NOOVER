/**
 * Utility functions for generating "Add to Calendar" links
 * No OAuth required - these generate URLs that open calendar apps with pre-filled event data
 */

const LOCATION = 'Self Made Training Facility, Temecula, CA';

interface CalendarEventData {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmssZ format in UTC)
 */
function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format date for ICS file (YYYYMMDDTHHmmssZ format in UTC)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate Google Calendar link
 * Opens Google Calendar with event pre-filled
 */
export function getGoogleCalendarUrl(event: CalendarEventData): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}`,
    details: event.description,
    location: event.location || LOCATION,
    trp: 'false', // Don't show "busy" status
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook.com calendar link
 * Opens Outlook web calendar with event pre-filled
 */
export function getOutlookCalendarUrl(event: CalendarEventData): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
    location: event.location || LOCATION,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate ICS file content for Apple Calendar / iCal download
 */
export function generateICSContent(event: CalendarEventData): string {
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@m3noover.app`;
  const now = formatICSDate(new Date());
  const location = event.location || LOCATION;

  // Escape special characters for ICS format
  const escapeICS = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  // Fold long lines (ICS spec requires lines <= 75 chars)
  const foldLine = (line: string): string => {
    const result: string[] = [];
    let remaining = line;
    while (remaining.length > 75) {
      result.push(remaining.substring(0, 75));
      remaining = ' ' + remaining.substring(75);
    }
    result.push(remaining);
    return result.join('\r\n');
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//M3FIT//Training Session//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(event.startTime)}`,
    `DTEND:${formatICSDate(event.endTime)}`,
    foldLine(`SUMMARY:${escapeICS(event.title)}`),
    foldLine(`DESCRIPTION:${escapeICS(event.description)}`),
    foldLine(`LOCATION:${escapeICS(location)}`),
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/**
 * Download an ICS file
 */
export function downloadICSFile(event: CalendarEventData, filename?: string): void {
  const content = generateICSContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'm3fit-session.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create event data from a booking
 */
export function createEventFromBooking(booking: {
  start_time: string;
  end_time: string;
  session_type?: { name: string } | null;
  notes?: string | null;
}): CalendarEventData {
  const sessionName = booking.session_type?.name || 'Training Session';
  const description = booking.notes
    ? `Training session with Coach Chuck\n\nNotes: ${booking.notes}`
    : 'Training session with Coach Chuck';

  return {
    title: `M3FIT: ${sessionName}`,
    description,
    startTime: new Date(booking.start_time),
    endTime: new Date(booking.end_time),
    location: LOCATION,
  };
}
