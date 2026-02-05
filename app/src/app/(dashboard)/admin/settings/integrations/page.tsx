'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import type { GoogleCalendarStatus, SyncResult } from '@/types/integrations';

type ExtendedStatus = GoogleCalendarStatus & { configured: boolean };

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ExtendedStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/google-calendar/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Handle URL params from OAuth callback
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
      // Clear URL params
      window.history.replaceState({}, '', '/admin/settings/integrations');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'Google Calendar access was denied.',
        missing_params: 'Missing OAuth parameters. Please try again.',
        invalid_state: 'Invalid OAuth state. Please try again.',
        not_authenticated: 'You must be logged in to connect.',
        not_admin: 'Admin access is required.',
        token_exchange_failed: 'Failed to complete OAuth. Please try again.',
        not_configured: 'Google Calendar integration is not configured.',
      };
      setMessage({ type: 'error', text: errorMessages[error] || 'An error occurred.' });
      window.history.replaceState({}, '', '/admin/settings/integrations');
    }
  }, [searchParams, fetchStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/integrations/google-calendar/auth');
      if (res.ok) {
        const { authUrl } = await res.json();
        window.location.href = authUrl;
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to start OAuth flow.' });
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      setMessage({ type: 'error', text: 'Failed to connect. Please try again.' });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? Future bookings will no longer sync.')) {
      return;
    }

    setDisconnecting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/integrations/google-calendar/disconnect', {
        method: 'POST',
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Google Calendar disconnected.' });
        await fetchStatus();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to disconnect.' });
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setMessage({ type: 'error', text: 'Failed to disconnect. Please try again.' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setMessage(null);

    try {
      const res = await fetch('/api/integrations/google-calendar/sync', {
        method: 'POST',
      });

      if (res.ok) {
        const result: SyncResult = await res.json();
        setSyncResult(result);
        await fetchStatus();

        if (result.synced > 0 && result.failed === 0) {
          setMessage({ type: 'success', text: `Successfully synced ${result.synced} booking(s).` });
        } else if (result.synced === 0 && result.failed === 0) {
          setMessage({ type: 'success', text: 'All bookings are already synced.' });
        } else if (result.failed > 0) {
          setMessage({
            type: 'error',
            text: `Synced ${result.synced}, failed ${result.failed}. Check below for details.`,
          });
        }
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Sync failed.' });
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      setMessage({ type: 'error', text: 'Sync failed. Please try again.' });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Los_Angeles',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-neutral-400 mt-1">Connect external services</p>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Google Calendar Card */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-charcoal-800">
          <div className="flex items-center gap-4">
            {/* Google Calendar Icon */}
            <div className="p-3 bg-charcoal-800 rounded-lg">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22 12l-10 10L2 12l10-10z" />
                <path fill="#34A853" d="M12 22V12l10 10z" />
                <path fill="#FBBC05" d="M2 12l10 10V12z" />
                <path fill="#EA4335" d="M12 2v10L2 2z" />
                <path fill="#FFFFFF" d="M12 2l10 10H12z" />
                <rect fill="#FFFFFF" x="6" y="6" width="12" height="12" rx="1" />
                <path
                  fill="#4285F4"
                  d="M16 10.5h-3V8a.5.5 0 00-.5-.5h-1a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h4.5a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">Google Calendar</h2>
              <p className="text-sm text-neutral-400">
                Automatically sync bookings to your Google Calendar
              </p>
            </div>
            {status?.connected && (
              <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm font-medium rounded-full">
                Connected
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!status?.configured ? (
            <div className="text-center py-4">
              <p className="text-neutral-400 mb-4">
                Google Calendar integration is not configured. Please add the required environment
                variables.
              </p>
              <code className="block bg-charcoal-800 p-4 rounded-lg text-sm text-neutral-300 text-left">
                GOOGLE_CLIENT_ID=your-client-id
                <br />
                GOOGLE_CLIENT_SECRET=your-secret
                <br />
                INTEGRATION_ENCRYPTION_KEY=your-key
              </code>
            </div>
          ) : status?.connected ? (
            <>
              {/* Connection Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-charcoal-800">
                  <span className="text-neutral-400">Connected as</span>
                  <span className="text-white font-medium">{status.email || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-charcoal-800">
                  <span className="text-neutral-400">Calendar</span>
                  <span className="text-white">{status.calendarId || 'Primary'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-charcoal-800">
                  <span className="text-neutral-400">Last synced</span>
                  <span className="text-white">{formatDate(status.lastSync)}</span>
                </div>
              </div>

              {/* Error Banner */}
              {status.lastError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">
                    <strong>Last error:</strong> {status.lastError}
                  </p>
                </div>
              )}

              {/* Sync Result */}
              {syncResult && syncResult.errors.length > 0 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-400 font-medium mb-2">Sync errors:</p>
                  <ul className="text-sm text-yellow-400/80 space-y-1">
                    {syncResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>
                        Booking {err.bookingId.slice(0, 8)}...: {err.error}
                      </li>
                    ))}
                    {syncResult.errors.length > 5 && (
                      <li>...and {syncResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleSync} disabled={syncing}>
                  {syncing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Sync Now
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-neutral-400 mb-6">
                Connect your Google Calendar to automatically sync training sessions. Bookings will
                appear on your calendar with client details.
              </p>
              <Button variant="primary" onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Connecting...
                  </>
                ) : (
                  'Connect Google Calendar'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-charcoal-900/50 border border-charcoal-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-3">How it works</h3>
        <ul className="text-sm text-neutral-400 space-y-2">
          <li className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-accent-500 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            When a session is booked, it automatically appears on your calendar
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-accent-500 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Updated or cancelled bookings sync automatically
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-accent-500 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Events include client name, session type, and notes
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-accent-500 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            1-hour reminder is set for each session
          </li>
        </ul>
      </div>
    </div>
  );
}
