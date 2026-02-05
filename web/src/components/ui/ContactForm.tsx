'use client';

import { useState, FormEvent } from 'react';
import { cn } from '@m3noover/shared';
import { Button } from '@m3noover/ui';

interface ContactFormProps {
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  program: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
  submit?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    program: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrors({ submit: result.error || 'Failed to send message' });
        return;
      }
      setIsSubmitted(true);
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = cn(
    'w-full px-4 py-3 rounded-lg bg-charcoal-800 border border-charcoal-600',
    'text-white placeholder:text-neutral-500',
    'focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500',
    'transition-colors'
  );

  const labelClasses = 'block text-sm font-medium text-neutral-300 mb-2';
  const errorClasses = 'mt-1 text-sm text-red-400';

  if (isSubmitted) {
    return (
      <div className={cn('p-8 rounded-2xl bg-charcoal-800 text-center', className)}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
        <p className="text-neutral-400">We'll get back to you as soon as possible.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-5', className)}
      data-testid="contact-form"
    >
      {/* Name */}
      <div>
        <label htmlFor="name" className={labelClasses}>
          Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={cn(inputClasses, errors.name && 'border-red-400')}
          placeholder="Your name"
        />
        {errors.name && <p className={errorClasses}>{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClasses}>
          Email *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={cn(inputClasses, errors.email && 'border-red-400')}
          placeholder="your@email.com"
        />
        {errors.email && <p className={errorClasses}>{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className={labelClasses}>
          Phone <span className="text-neutral-500">(optional)</span>
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className={inputClasses}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Program Interest */}
      <div>
        <label htmlFor="program" className={labelClasses}>
          Program Interest <span className="text-neutral-500">(optional)</span>
        </label>
        <select
          id="program"
          value={formData.program}
          onChange={(e) => setFormData({ ...formData, program: e.target.value })}
          className={inputClasses}
        >
          <option value="">Select a program</option>
          <option value="youth">Youth & Student Athletes</option>
          <option value="group">Small Group Training</option>
          <option value="personal">1-on-1 Personal Training</option>
          <option value="camps">Seasonal Camps & Clinics</option>
          <option value="other">Other / Not Sure</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className={labelClasses}>
          Message *
        </label>
        <textarea
          id="message"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className={cn(inputClasses, 'resize-none', errors.message && 'border-red-400')}
          placeholder="Tell us about your goals..."
        />
        {errors.message && <p className={errorClasses}>{errors.message}</p>}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {errors.submit}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isSubmitting}
        data-testid="contact-form-submit"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
