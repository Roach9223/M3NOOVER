'use client';

import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { CalendarEvent } from '@/types/scheduling';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

interface ScheduleCalendarProps {
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  defaultView?: 'day' | 'week' | 'month';
  selectable?: boolean;
  min?: Date;
  max?: Date;
}

const eventStyleGetter = (event: CalendarEvent) => {
  let backgroundColor = '#00D4FF'; // accent-500
  let borderColor = '#00D4FF';

  if (event.type === 'blocked') {
    backgroundColor = '#4B5563'; // gray
    borderColor = '#4B5563';
  } else if (event.type === 'available') {
    backgroundColor = '#10B981'; // green
    borderColor = '#10B981';
  }

  return {
    style: {
      backgroundColor,
      borderColor,
      borderRadius: '6px',
      opacity: 0.9,
      color: 'white',
      border: `1px solid ${borderColor}`,
      display: 'block',
    },
  };
};

export function ScheduleCalendar({
  events,
  onSelectEvent,
  onSelectSlot,
  defaultView = 'week',
  selectable = false,
  min,
  max,
}: ScheduleCalendarProps) {
  const defaultMin = new Date();
  defaultMin.setHours(6, 0, 0, 0);

  const defaultMax = new Date();
  defaultMax.setHours(21, 0, 0, 0);

  return (
    <div className="h-[600px] bg-charcoal-900 rounded-xl p-4 calendar-dark">
      <style jsx global>{`
        .calendar-dark .rbc-calendar {
          background: transparent;
          color: #e5e5e5;
        }
        .calendar-dark .rbc-toolbar {
          margin-bottom: 1rem;
        }
        .calendar-dark .rbc-toolbar button {
          color: #e5e5e5;
          border: 1px solid #374151;
          background: #1f2937;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }
        .calendar-dark .rbc-toolbar button:hover {
          background: #374151;
        }
        .calendar-dark .rbc-toolbar button.rbc-active {
          background: #00D4FF;
          color: black;
          border-color: #00D4FF;
        }
        .calendar-dark .rbc-header {
          background: #1f2937;
          border-color: #374151;
          padding: 0.75rem;
          font-weight: 600;
        }
        .calendar-dark .rbc-time-view,
        .calendar-dark .rbc-month-view {
          border-color: #374151;
        }
        .calendar-dark .rbc-time-header-content,
        .calendar-dark .rbc-time-content {
          border-color: #374151;
        }
        .calendar-dark .rbc-timeslot-group {
          border-color: #374151;
        }
        .calendar-dark .rbc-time-slot {
          border-color: #374151;
        }
        .calendar-dark .rbc-day-slot .rbc-time-slot {
          border-color: #374151;
        }
        .calendar-dark .rbc-today {
          background: rgba(0, 212, 255, 0.1);
        }
        .calendar-dark .rbc-off-range-bg {
          background: #111827;
        }
        .calendar-dark .rbc-event {
          padding: 4px 8px;
        }
        .calendar-dark .rbc-event-label {
          display: none;
        }
        .calendar-dark .rbc-current-time-indicator {
          background: #00D4FF;
        }
        .calendar-dark .rbc-day-bg + .rbc-day-bg {
          border-color: #374151;
        }
        .calendar-dark .rbc-month-row + .rbc-month-row {
          border-color: #374151;
        }
        .calendar-dark .rbc-date-cell {
          padding: 0.5rem;
        }
        .calendar-dark .rbc-time-gutter {
          background: #1f2937;
        }
        .calendar-dark .rbc-label {
          color: #9ca3af;
          padding: 0 0.5rem;
        }
      `}</style>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views[defaultView.toUpperCase() as keyof typeof Views]}
        views={['day', 'week', 'month']}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable={selectable}
        eventPropGetter={eventStyleGetter}
        min={min || defaultMin}
        max={max || defaultMax}
        step={30}
        timeslots={2}
      />
    </div>
  );
}
