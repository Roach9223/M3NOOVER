import type { Metadata } from 'next';
import { Hero, Section, Container } from '@/components/ui';
import { contactInfo } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Service | M3NOOVER',
  description: 'Terms of service for M3NOOVER athletic training. Review our policies on training, payments, cancellations, and liability.',
};

export default function TermsPage() {
  return (
    <>
      <Hero
        title="Terms of Service"
        subtitle="Please read these terms carefully before using our services"
      />

      <Section variant="dark" padding="lg">
        <Container size="md">
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-neutral-400 text-sm mb-8">
              Last updated: February 2026
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Service Description</h2>
            <p className="text-neutral-300 mb-6">
              M3NOOVER provides athletic training services for youth and adult athletes, including personal training,
              small group training, and seasonal camps. Training sessions are conducted at Self Made Training Facility
              in Murrieta, CA, or at designated locations as agreed upon.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Registration and Eligibility</h2>
            <p className="text-neutral-300 mb-4">
              By registering for M3NOOVER services, you confirm that:
            </p>
            <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
              <li>You are at least 18 years old, or you have parental/guardian consent</li>
              <li>All information provided during registration is accurate and complete</li>
              <li>For minor athletes, you are the parent or legal guardian authorized to enroll them</li>
              <li>The athlete is physically capable of participating in athletic training activities</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Payment Terms</h2>
            <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
              <li>Payment is required before or at the time of service for all training sessions</li>
              <li>Monthly packages are billed at the beginning of each billing cycle</li>
              <li>All payments are processed securely through Stripe</li>
              <li>Prices are subject to change with 30 days&apos; notice</li>
              <li>Refunds are handled on a case-by-case basis at our discretion</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Cancellation Policy</h2>
            <div className="bg-charcoal-800 rounded-xl p-6 mb-6">
              <p className="text-white font-semibold mb-4">24-Hour Cancellation Policy</p>
              <ul className="list-disc pl-6 text-neutral-300 space-y-2">
                <li>Sessions must be cancelled at least <strong>24 hours in advance</strong> to avoid being charged</li>
                <li>Late cancellations (less than 24 hours) will be charged the full session fee</li>
                <li>No-shows will be charged the full session fee</li>
                <li>Rescheduling within 24 hours is subject to availability and may incur fees</li>
              </ul>
            </div>
            <p className="text-neutral-300 mb-6">
              We understand emergencies happen. Please communicate with us as soon as possible,
              and we will work with you on a case-by-case basis.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Assumption of Risk and Liability Waiver</h2>
            <div className="bg-charcoal-800 rounded-xl p-6 mb-6">
              <p className="text-neutral-300 mb-4">
                By participating in M3NOOVER training services, you acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 text-neutral-300 space-y-2">
                <li>Athletic training involves inherent risks of injury</li>
                <li>You (or your minor athlete) are physically fit to participate in training activities</li>
                <li>You have disclosed any relevant medical conditions or physical limitations</li>
                <li>You assume full responsibility for any risks, injuries, or damages that may occur during training</li>
                <li>You release M3NOOVER, Coach Chuck, and Self Made Training Facility from liability for any injuries
                    sustained during training, except in cases of gross negligence or willful misconduct</li>
              </ul>
            </div>
            <p className="text-neutral-300 mb-6">
              We strongly recommend consulting with a physician before beginning any athletic training program.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Code of Conduct</h2>
            <p className="text-neutral-300 mb-4">
              All athletes and parents/guardians are expected to:
            </p>
            <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
              <li>Arrive on time and prepared for training sessions</li>
              <li>Treat coaches, staff, and fellow athletes with respect</li>
              <li>Follow all safety instructions and facility rules</li>
              <li>Communicate openly about any concerns, injuries, or limitations</li>
              <li>Support a positive and encouraging training environment</li>
            </ul>
            <p className="text-neutral-300 mb-6">
              M3NOOVER reserves the right to refuse or terminate service to anyone who violates this code of conduct.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Photography and Media</h2>
            <p className="text-neutral-300 mb-6">
              Training sessions may be photographed or recorded for promotional purposes.
              If you do not wish to be included in promotional materials, please notify us in writing.
              We will make reasonable efforts to accommodate your request.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Intellectual Property</h2>
            <p className="text-neutral-300 mb-6">
              All training programs, materials, and content provided by M3NOOVER are proprietary
              and may not be reproduced, distributed, or used for commercial purposes without written permission.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Termination</h2>
            <p className="text-neutral-300 mb-6">
              Either party may terminate services at any time with written notice.
              For monthly packages, termination takes effect at the end of the current billing cycle.
              Outstanding balances must be paid in full upon termination.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">10. Governing Law</h2>
            <p className="text-neutral-300 mb-6">
              These terms are governed by the laws of the State of California.
              Any disputes shall be resolved in the courts of Riverside County, California.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">11. Changes to Terms</h2>
            <p className="text-neutral-300 mb-6">
              We reserve the right to modify these terms at any time. Material changes will be communicated
              via email or through our platform. Continued use of our services constitutes acceptance of updated terms.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">12. Contact</h2>
            <p className="text-neutral-300 mb-4">
              Questions about these terms? Contact us:
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
