'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@m3noover/ui';

interface AthleteInfo {
  name: string;
  dateOfBirth: string;
  sports: string[];
  school: string;
}

interface PackageOption {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  sessions_per_week?: number;
}

interface ClientOnboardingWizardProps {
  packages: PackageOption[];
}

type Step = 'parent' | 'athletes' | 'package' | 'confirmation';

export function ClientOnboardingWizard({ packages }: ClientOnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('parent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parent info
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [sendInvite, setSendInvite] = useState(true);

  // Athletes info
  const [athletes, setAthletes] = useState<AthleteInfo[]>([
    { name: '', dateOfBirth: '', sports: [], school: '' },
  ]);

  // Package info
  const [isSubscription, setIsSubscription] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string>('');

  const steps: Step[] = ['parent', 'athletes', 'package', 'confirmation'];
  const currentStepIndex = steps.indexOf(currentStep);

  const sportOptions = [
    'Football',
    'Basketball',
    'Baseball',
    'Soccer',
    'Track & Field',
    'Volleyball',
    'Tennis',
    'Swimming',
    'Wrestling',
    'Lacrosse',
    'Golf',
    'Other',
  ];

  const canProceedFromParent = parentName.trim() && parentEmail.trim();
  const canProceedFromAthletes = athletes.every((a) => a.name.trim());
  const canProceedFromPackage = !isSubscription || selectedPackage;

  const handleAddAthlete = () => {
    setAthletes([...athletes, { name: '', dateOfBirth: '', sports: [], school: '' }]);
  };

  const handleRemoveAthlete = (index: number) => {
    if (athletes.length > 1) {
      setAthletes(athletes.filter((_, i) => i !== index));
    }
  };

  const handleAthleteChange = (index: number, field: keyof AthleteInfo, value: string | string[]) => {
    const updated = [...athletes];
    updated[index] = { ...updated[index], [field]: value };
    setAthletes(updated);
  };

  const handleSportToggle = (index: number, sport: string) => {
    const athlete = athletes[index];
    const newSports = athlete.sports.includes(sport)
      ? athlete.sports.filter((s) => s !== sport)
      : [...athlete.sports, sport];
    handleAthleteChange(index, 'sports', newSports);
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: {
            name: parentName.trim(),
            email: parentEmail.trim(),
            phone: parentPhone.trim() || null,
          },
          athletes: athletes.map((a) => ({
            name: a.name.trim(),
            date_of_birth: a.dateOfBirth || null,
            sports: a.sports,
            school: a.school.trim() || null,
          })),
          subscription: isSubscription
            ? { package_id: selectedPackage }
            : null,
          send_invite: sendInvite,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create client');
      }

      router.push('/admin/clients');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackage);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex-1 ${index < steps.length - 1 ? 'mr-2' : ''}`}
            >
              <div
                className={`h-2 rounded-full ${
                  index <= currentStepIndex ? 'bg-accent-500' : 'bg-charcoal-700'
                }`}
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-neutral-400 text-center">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Parent Info */}
      {currentStep === 'parent' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Parent Information</h2>
            <p className="text-neutral-400 mt-1">
              Enter the parent or guardian&apos;s contact information.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="w-5 h-5 rounded border-charcoal-600 bg-charcoal-800 text-accent-500 focus:ring-accent-500"
              />
              <span className="text-neutral-300">
                Send welcome email with portal invite
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={!canProceedFromParent}
              variant="primary"
            >
              Next: Athletes
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Athletes */}
      {currentStep === 'athletes' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Athlete Information</h2>
            <p className="text-neutral-400 mt-1">
              Add the athletes who will be training.
            </p>
          </div>

          <div className="space-y-6">
            {athletes.map((athlete, index) => (
              <div
                key={index}
                className="p-4 bg-charcoal-800/50 border border-charcoal-700 rounded-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">
                    Athlete {athletes.length > 1 ? index + 1 : ''}
                  </h3>
                  {athletes.length > 1 && (
                    <button
                      onClick={() => handleRemoveAthlete(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={athlete.name}
                    onChange={(e) => handleAthleteChange(index, 'name', e.target.value)}
                    placeholder="Jake Smith"
                    className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={athlete.dateOfBirth}
                      onChange={(e) => handleAthleteChange(index, 'dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      School
                    </label>
                    <input
                      type="text"
                      value={athlete.school}
                      onChange={(e) => handleAthleteChange(index, 'school', e.target.value)}
                      placeholder="Great Oak High School"
                      className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Sports
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sportOptions.map((sport) => (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => handleSportToggle(index, sport)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          athlete.sports.includes(sport)
                            ? 'bg-accent-500 text-white'
                            : 'bg-charcoal-700 text-neutral-300 hover:bg-charcoal-600'
                        }`}
                      >
                        {sport}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddAthlete}
              className="w-full py-3 border-2 border-dashed border-charcoal-600 rounded-lg text-neutral-400 hover:text-white hover:border-charcoal-500 transition-colors"
            >
              + Add Another Athlete (Sibling)
            </button>
          </div>

          <div className="flex justify-between">
            <Button onClick={handleBack} variant="outline">
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceedFromAthletes}
              variant="primary"
            >
              Next: Package
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Package */}
      {currentStep === 'package' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Training Package</h2>
            <p className="text-neutral-400 mt-1">
              Select how this client will be billed.
            </p>
          </div>

          {/* Subscription vs Drop-in toggle */}
          <div className="flex rounded-lg overflow-hidden border border-charcoal-700">
            <button
              onClick={() => setIsSubscription(true)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                isSubscription
                  ? 'bg-accent-500 text-white'
                  : 'bg-charcoal-800 text-neutral-400 hover:text-white'
              }`}
            >
              Monthly Subscription
            </button>
            <button
              onClick={() => setIsSubscription(false)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                !isSubscription
                  ? 'bg-accent-500 text-white'
                  : 'bg-charcoal-800 text-neutral-400 hover:text-white'
              }`}
            >
              Drop-in / Pay Per Session
            </button>
          </div>

          {isSubscription && (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                    selectedPackage === pkg.id
                      ? 'border-accent-500 bg-accent-500/10'
                      : 'border-charcoal-700 bg-charcoal-800/50 hover:border-charcoal-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{pkg.name}</p>
                      <p className="text-sm text-neutral-400 mt-1">
                        {pkg.description}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-white">
                      ${(pkg.price_cents / 100).toFixed(0)}
                      <span className="text-sm font-normal text-neutral-400">/mo</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isSubscription && (
            <div className="p-4 bg-charcoal-800/50 border border-charcoal-700 rounded-xl">
              <p className="text-neutral-300">
                This client will be billed per session. You can create invoices
                manually after each training session.
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <Button onClick={handleBack} variant="outline">
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceedFromPackage}
              variant="primary"
            >
              Next: Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {currentStep === 'confirmation' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Review & Confirm</h2>
            <p className="text-neutral-400 mt-1">
              Please review the information before creating the client.
            </p>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="p-4 bg-charcoal-800/50 border border-charcoal-700 rounded-xl">
              <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Parent
              </h3>
              <p className="text-white font-medium">{parentName}</p>
              <p className="text-neutral-400">{parentEmail}</p>
              {parentPhone && <p className="text-neutral-400">{parentPhone}</p>}
              {sendInvite && (
                <p className="text-xs text-accent-400 mt-2">
                  Will receive welcome email
                </p>
              )}
            </div>

            <div className="p-4 bg-charcoal-800/50 border border-charcoal-700 rounded-xl">
              <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Athletes ({athletes.length})
              </h3>
              <div className="space-y-2">
                {athletes.map((athlete, i) => (
                  <div key={i}>
                    <p className="text-white font-medium">{athlete.name}</p>
                    {athlete.sports.length > 0 && (
                      <p className="text-sm text-neutral-400">
                        {athlete.sports.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-charcoal-800/50 border border-charcoal-700 rounded-xl">
              <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Billing
              </h3>
              {isSubscription && selectedPkg ? (
                <div>
                  <p className="text-white font-medium">{selectedPkg.name}</p>
                  <p className="text-neutral-400">
                    ${(selectedPkg.price_cents / 100).toFixed(0)}/month
                  </p>
                </div>
              ) : (
                <p className="text-white">Drop-in / Pay per session</p>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <Button onClick={handleBack} variant="outline" disabled={isSubmitting}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
