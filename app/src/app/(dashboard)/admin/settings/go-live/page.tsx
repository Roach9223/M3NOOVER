'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { STRIPE_PRODUCTS } from '@/lib/stripe/products';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'checking' | 'pass' | 'fail' | 'warning';
  details?: string;
}

export default function GoLivePage() {
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: 'stripe_keys',
      label: 'Stripe API Keys',
      description: 'Live API keys are configured (not test keys)',
      status: 'checking',
    },
    {
      id: 'stripe_webhook',
      label: 'Stripe Webhook Secret',
      description: 'Webhook secret is configured for payment events',
      status: 'checking',
    },
    {
      id: 'stripe_products',
      label: 'Stripe Products',
      description: 'Subscription and session pack products are configured',
      status: 'checking',
    },
    {
      id: 'supabase_url',
      label: 'Supabase URL',
      description: 'Database URL is configured',
      status: 'checking',
    },
    {
      id: 'supabase_service_key',
      label: 'Supabase Service Role Key',
      description: 'Service role key for webhooks is configured',
      status: 'checking',
    },
    {
      id: 'app_url',
      label: 'App URL',
      description: 'Public app URL is set for redirects',
      status: 'checking',
    },
    {
      id: 'session_types',
      label: 'Session Types',
      description: 'At least one active session type exists',
      status: 'checking',
    },
    {
      id: 'availability',
      label: 'Availability Templates',
      description: 'Weekly availability schedule is configured',
      status: 'checking',
    },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runChecks();
  }, []);

  async function runChecks() {
    setLoading(true);
    const updatedChecks = [...checks];

    // Check environment status from API
    try {
      const res = await fetch('/api/admin/go-live-status');
      if (res.ok) {
        const data = await res.json();

        // Stripe Keys
        const stripeKeysCheck = updatedChecks.find(c => c.id === 'stripe_keys');
        if (stripeKeysCheck) {
          if (!data.stripeKeySet) {
            stripeKeysCheck.status = 'fail';
            stripeKeysCheck.details = 'STRIPE_SECRET_KEY is not set';
          } else if (data.stripeKeyIsTest) {
            stripeKeysCheck.status = 'warning';
            stripeKeysCheck.details = 'Using test mode keys (sk_test_...)';
          } else {
            stripeKeysCheck.status = 'pass';
            stripeKeysCheck.details = 'Live keys configured';
          }
        }

        // Stripe Webhook
        const webhookCheck = updatedChecks.find(c => c.id === 'stripe_webhook');
        if (webhookCheck) {
          webhookCheck.status = data.webhookSecretSet ? 'pass' : 'fail';
          webhookCheck.details = data.webhookSecretSet
            ? 'Webhook secret configured'
            : 'STRIPE_WEBHOOK_SECRET is not set';
        }

        // Stripe Products
        const productsCheck = updatedChecks.find(c => c.id === 'stripe_products');
        if (productsCheck) {
          const subCount = Object.keys(STRIPE_PRODUCTS.subscriptions).length;
          const packCount = Object.keys(STRIPE_PRODUCTS.oneTime).length;
          productsCheck.status = 'pass';
          productsCheck.details = `${subCount} subscription tiers, ${packCount} session packs`;
        }

        // Supabase URL
        const supabaseUrlCheck = updatedChecks.find(c => c.id === 'supabase_url');
        if (supabaseUrlCheck) {
          supabaseUrlCheck.status = data.supabaseUrlSet ? 'pass' : 'fail';
          supabaseUrlCheck.details = data.supabaseUrlSet ? 'URL configured' : 'NEXT_PUBLIC_SUPABASE_URL is not set';
        }

        // Supabase Service Key
        const serviceKeyCheck = updatedChecks.find(c => c.id === 'supabase_service_key');
        if (serviceKeyCheck) {
          serviceKeyCheck.status = data.serviceRoleKeySet ? 'pass' : 'fail';
          serviceKeyCheck.details = data.serviceRoleKeySet
            ? 'Service role key configured'
            : 'SUPABASE_SERVICE_ROLE_KEY is not set';
        }

        // App URL
        const appUrlCheck = updatedChecks.find(c => c.id === 'app_url');
        if (appUrlCheck) {
          if (!data.appUrlSet) {
            appUrlCheck.status = 'fail';
            appUrlCheck.details = 'NEXT_PUBLIC_APP_URL is not set';
          } else if (data.appUrl?.includes('localhost')) {
            appUrlCheck.status = 'warning';
            appUrlCheck.details = `Currently: ${data.appUrl} (localhost)`;
          } else {
            appUrlCheck.status = 'pass';
            appUrlCheck.details = data.appUrl;
          }
        }

        // Session Types
        const sessionTypesCheck = updatedChecks.find(c => c.id === 'session_types');
        if (sessionTypesCheck) {
          sessionTypesCheck.status = data.sessionTypesCount > 0 ? 'pass' : 'fail';
          sessionTypesCheck.details = `${data.sessionTypesCount} active session type(s)`;
        }

        // Availability
        const availabilityCheck = updatedChecks.find(c => c.id === 'availability');
        if (availabilityCheck) {
          availabilityCheck.status = data.availabilityCount > 0 ? 'pass' : 'warning';
          availabilityCheck.details = data.availabilityCount > 0
            ? `${data.availabilityCount} availability template(s)`
            : 'No availability templates configured';
        }
      }
    } catch (error) {
      console.error('Failed to fetch go-live status:', error);
      // Mark all as checking failed
      updatedChecks.forEach(check => {
        if (check.status === 'checking') {
          check.status = 'fail';
          check.details = 'Failed to check status';
        }
      });
    }

    setChecks(updatedChecks);
    setLoading(false);
  }

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'checking':
        return (
          <div className="w-5 h-5 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'pass':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'fail':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
    }
  };

  const getStatusBg = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500/10 border-green-500/30';
      case 'fail':
        return 'bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-charcoal-800/50 border-charcoal-700';
    }
  };

  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const isReady = failCount === 0 && !loading;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
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
          <h1 className="text-2xl font-bold text-white">Go-Live Checklist</h1>
          <p className="text-neutral-400 mt-1">Verify your configuration before launching</p>
        </div>
      </div>

      {/* Summary */}
      <div className={`p-6 rounded-xl border ${isReady ? 'bg-green-500/10 border-green-500/30' : 'bg-charcoal-900 border-charcoal-800'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {loading ? 'Checking configuration...' : isReady ? 'Ready to Go Live!' : 'Action Required'}
            </h2>
            <p className="text-neutral-400 text-sm mt-1">
              {passCount} passed, {failCount} failed, {warningCount} warning(s)
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={runChecks} disabled={loading}>
            <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`p-4 rounded-xl border ${getStatusBg(check.status)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(check.status)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium">{check.label}</h3>
                <p className="text-neutral-400 text-sm">{check.description}</p>
                {check.details && (
                  <p className={`text-sm mt-1 ${
                    check.status === 'pass' ? 'text-green-400' :
                    check.status === 'fail' ? 'text-red-400' :
                    check.status === 'warning' ? 'text-yellow-400' :
                    'text-neutral-500'
                  }`}>
                    {check.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <h3 className="text-white font-medium mb-3">Before Going Live</h3>
        <ul className="space-y-2 text-sm text-neutral-400">
          <li className="flex items-start gap-2">
            <span className="text-accent-500">1.</span>
            Switch Stripe API keys from test mode to live mode in your environment variables
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-500">2.</span>
            Update the webhook endpoint URL in your Stripe dashboard to point to your production domain
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-500">3.</span>
            Set up Stripe Billing Portal configuration to allow customers to manage subscriptions
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-500">4.</span>
            Test a complete booking flow with a real payment to verify everything works
          </li>
        </ul>
      </div>
    </div>
  );
}
