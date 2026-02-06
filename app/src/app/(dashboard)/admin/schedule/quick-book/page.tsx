'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { SessionTypeSelector, TimeSlotPicker } from '@/components/scheduling';
import { formatAmountForDisplay } from '@/lib/format';
import { format } from 'date-fns';
import type { SessionType, TimeSlot } from '@/types/scheduling';

interface Client {
  id: string;
  full_name: string;
  email: string;
  athletes: Athlete[];
}

interface Athlete {
  id: string;
  name: string;
}

type BookingStep = 'client' | 'type' | 'time' | 'confirm';

export default function QuickBookPage() {
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>('client');
  const [clients, setClients] = useState<Client[]>([]);
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, typesRes] = await Promise.all([
          fetch('/api/admin/clients'),
          fetch('/api/scheduling/session-types'),
        ]);

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData);
        }

        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setSessionTypes(typesData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredClients = clients.filter(
    (client) =>
      client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    // If only one athlete, auto-select
    if (client.athletes?.length === 1) {
      setSelectedAthlete(client.athletes[0]);
    } else {
      setSelectedAthlete(null);
    }
    setStep('type');
  };

  const handleTypeSelect = (type: SessionType) => {
    setSelectedType(type);
    setStep('time');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedType || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: selectedClient.id,
          athlete_id: selectedAthlete?.id || undefined,
          session_type_id: selectedType.id,
          start_time: selectedSlot.start.toISOString(),
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        router.push('/admin/schedule?booked=true');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to book session');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepIndex = ['client', 'type', 'time', 'confirm'].indexOf(step);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/schedule">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Quick Book</h1>
          <p className="text-neutral-400 mt-1">
            {step === 'client' && 'Select a client'}
            {step === 'type' && 'Select session type'}
            {step === 'time' && 'Choose date and time'}
            {step === 'confirm' && 'Confirm booking'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {['client', 'type', 'time', 'confirm'].map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              stepIndex >= i ? 'bg-accent-500' : 'bg-charcoal-800'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Client */}
      {step === 'client' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search clients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-charcoal-900 border border-charcoal-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          {/* Client List */}
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <p>No clients found.</p>
              <Link href="/admin/clients/new" className="text-accent-500 hover:underline mt-2 inline-block">
                Add a new client
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="w-full p-4 bg-charcoal-900 border border-charcoal-800 rounded-xl text-left hover:border-charcoal-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{client.full_name || 'Unnamed'}</p>
                      <p className="text-sm text-neutral-400">{client.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-400">
                        {client.athletes?.length || 0} athlete{client.athletes?.length !== 1 ? 's' : ''}
                      </p>
                      {client.athletes?.length > 0 && (
                        <p className="text-xs text-neutral-500">
                          {client.athletes.map((a) => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Session Type */}
      {step === 'type' && selectedClient && (
        <div>
          {/* Selected Client Summary */}
          <div className="mb-6 p-4 bg-charcoal-900 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{selectedClient.full_name}</p>
                <p className="text-sm text-neutral-400">{selectedClient.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep('client')}>
                Change
              </Button>
            </div>

            {/* Athlete Selector */}
            {selectedClient.athletes?.length > 1 && (
              <div className="mt-4 pt-4 border-t border-charcoal-800">
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Select Athlete
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.athletes.map((athlete) => (
                    <button
                      key={athlete.id}
                      onClick={() => setSelectedAthlete(athlete)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        selectedAthlete?.id === athlete.id
                          ? 'bg-accent-500 text-black font-medium'
                          : 'bg-charcoal-800 text-white hover:bg-charcoal-700'
                      }`}
                    >
                      {athlete.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedClient.athletes?.length === 1 && (
              <p className="mt-2 text-sm text-neutral-400">
                Booking for: <span className="text-white">{selectedClient.athletes[0].name}</span>
              </p>
            )}
          </div>

          <SessionTypeSelector
            sessionTypes={sessionTypes}
            selectedId={selectedType?.id}
            onSelect={handleTypeSelect}
          />
        </div>
      )}

      {/* Step 3: Select Time */}
      {step === 'time' && selectedClient && selectedType && (
        <div>
          {/* Summary */}
          <div className="mb-6 p-4 bg-charcoal-900 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Client</p>
                <p className="text-white">{selectedClient.full_name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep('client')}>
                Change
              </Button>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-charcoal-800">
              <div>
                <p className="text-sm text-neutral-500">Session Type</p>
                <p className="text-white">{selectedType.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep('type')}>
                Change
              </Button>
            </div>
          </div>

          <TimeSlotPicker
            sessionTypeId={selectedType.id}
            selectedSlot={selectedSlot || undefined}
            onSelect={handleSlotSelect}
          />
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && selectedClient && selectedType && selectedSlot && (
        <div className="space-y-6">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Booking Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                <span className="text-neutral-400">Client</span>
                <span className="text-white font-medium">{selectedClient.full_name}</span>
              </div>
              {selectedAthlete && (
                <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                  <span className="text-neutral-400">Athlete</span>
                  <span className="text-white font-medium">{selectedAthlete.name}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                <span className="text-neutral-400">Session Type</span>
                <span className="text-white font-medium">{selectedType.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                <span className="text-neutral-400">Date</span>
                <span className="text-white font-medium">
                  {format(selectedSlot.start, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                <span className="text-neutral-400">Time</span>
                <span className="text-white font-medium">
                  {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                <span className="text-neutral-400">Duration</span>
                <span className="text-white font-medium">{selectedType.duration_minutes} minutes</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-neutral-400">Price</span>
                <span className="text-2xl font-bold text-accent-500">
                  {formatAmountForDisplay(selectedType.price_cents)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for this booking..."
              className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep('time')} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
