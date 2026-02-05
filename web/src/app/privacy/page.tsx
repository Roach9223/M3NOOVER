import type { Metadata } from 'next';
import { Hero, Section, Container } from '@/components/ui';
import { contactInfo } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy | M3NOOVER',
  description: 'Privacy policy for M3NOOVER athletic training services. Learn how we collect, use, and protect your information.',
};

export default function PrivacyPage() {
  return (
    <>
      <Hero
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your information"
      />

      <Section variant="dark" padding="lg">
        <Container size="md">
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-neutral-400 text-sm mb-8">
              Last updated: February 2026
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-neutral-300 mb-4">
              When you use M3NOOVER services, we may collect the following information:
            </p>
            <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
              <li><strong>Contact Information:</strong> Name, email address, phone number, and mailing address</li>
              <li><strong>Athlete Information:</strong> Athlete name, age, sport, school, and relevant health information you provide</li>
              <li><strong>Payment Information:</strong> Billing address and payment details (processed securely through Stripe)</li>
              <li><strong>Account Information:</strong> Login credentials and account preferences</li>
              <li><strong>Training Records:</strong> Session attendance, progress notes, and program participation</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-neutral-300 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
              <li>Provide athletic training services and manage your account</li>
              <li>Process payments and send invoices</li>
              <li>Communicate about sessions, schedule changes, and your athlete&apos;s progress</li>
              <li>Customize training programs based on athlete needs and goals</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Third-Party Services</h2>
            <p className="text-neutral-300 mb-4">
              We use trusted third-party services to operate our platform:
            </p>
            <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
              <li><strong>Stripe:</strong> For secure payment processing. Stripe&apos;s privacy policy applies to payment data.</li>
              <li><strong>Supabase:</strong> For secure data storage and authentication.</li>
              <li><strong>Vercel:</strong> For website hosting.</li>
            </ul>
            <p className="text-neutral-300 mb-6">
              We do not sell your personal information to third parties.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Data Security</h2>
            <p className="text-neutral-300 mb-6">
              We implement industry-standard security measures to protect your information, including encryption,
              secure authentication, and access controls. However, no method of transmission over the internet
              is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Your Rights (California Residents)</h2>
            <p className="text-neutral-300 mb-4">
              Under the California Consumer Privacy Act (CCPA), California residents have the right to:
            </p>
            <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
              <li>Know what personal information we collect and how it is used</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of the sale of personal information (we do not sell your data)</li>
              <li>Non-discrimination for exercising your privacy rights</li>
            </ul>
            <p className="text-neutral-300 mb-6">
              To exercise these rights, contact us using the information below.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Data Retention</h2>
            <p className="text-neutral-300 mb-6">
              We retain your information for as long as your account is active or as needed to provide services.
              We may retain certain information as required by law or for legitimate business purposes.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Children&apos;s Privacy</h2>
            <p className="text-neutral-300 mb-6">
              Our services involve training minors. We collect information about minor athletes only with
              parental or guardian consent. Parents and guardians may review, update, or request deletion
              of their child&apos;s information by contacting us.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Changes to This Policy</h2>
            <p className="text-neutral-300 mb-6">
              We may update this privacy policy from time to time. We will notify you of any material changes
              by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Contact Us</h2>
            <p className="text-neutral-300 mb-4">
              If you have questions about this privacy policy or wish to exercise your privacy rights, contact us at:
            </p>
            <div className="bg-charcoal-800 rounded-xl p-6 text-neutral-300">
              <p className="mb-2"><strong>M3NOOVER</strong></p>
              <p className="mb-2">
                <a href={`mailto:${contactInfo.email}`} className="text-accent-400 hover:underline">
                  {contactInfo.email}
                </a>
              </p>
              <p className="mb-2">
                <a href={`tel:${contactInfo.phone.tel}`} className="text-accent-400 hover:underline">
                  {contactInfo.phone.display}
                </a>
              </p>
              <p>
                {contactInfo.location.address.street}<br />
                {contactInfo.location.address.city}, {contactInfo.location.address.state} {contactInfo.location.address.zip}
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
