'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import type { TimeSlot } from '@/types/scheduling';

interface TimeSlotPickerProps {
  sessionTypeId: string;
  onSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot;
}

export function TimeSlotPicker({ sessionTypeId, onSelect, selectedSlot }: TimeSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate dates for the next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      const start = format(selectedDate, 'yyyy-MM-dd');
      const end = format(addDays(selectedDate, 1), 'yyyy-MM-dd');

      try {
        const res = await fetch(
          `/api/scheduling/availability?start=${start}&end=${end}&session_type_id=${sessionTypeId}`
        );
        if (res.ok) {
          const data = await res.json();
          // Convert string dates to Date objects
          const parsed = data.map((slot: Record<string, unknown>) => ({
            ...slot,
            start: new Date(slot.start as string),
            end: new Date(slot.end as string),
          }));
          setSlots(parsed);
        }
      } catch (error) {
        console.error('Failed to fetch slots:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
  }, [selectedDate, sessionTypeId]);

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-3">Select a date</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(startOfDay(date))}
                className={`flex-shrink-0 px-4 py-3 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'bg-accent-500 text-black'
                    : 'bg-charcoal-900 text-white hover:bg-charcoal-800'
                }`}
              >
                <p className="text-xs font-medium uppercase">
                  {isToday ? 'Today' : format(date, 'EEE')}
                </p>
                <p className="text-lg font-bold">{format(date, 'd')}</p>
                <p className="text-xs">{format(date, 'MMM')}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-3">
          Available times for {format(selectedDate, 'EEEE, MMMM d')}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p>No available slots for this date.</p>
            <p className="text-sm mt-1">Please select another date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {availableSlots.map((slot) => {
              const isSelected =
                selectedSlot &&
                slot.start.getTime() === selectedSlot.start.getTime();

              return (
                <button
                  key={slot.start.toISOString()}
                  onClick={() => onSelect(slot)}
                  className={`px-3 py-2 rounded-lg text-center transition-all ${
                    isSelected
                      ? 'bg-accent-500 text-black font-semibold'
                      : 'bg-charcoal-800 text-white hover:bg-charcoal-700'
                  }`}
                >
                  <p className="text-sm font-medium">{format(slot.start, 'h:mm a')}</p>
                  {slot.maxAthletes > 1 && (
                    <p className="text-xs text-neutral-400">
                      {slot.maxAthletes - slot.bookingCount} spots
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
