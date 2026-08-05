import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using the Beta Tenant platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services. Your continued use of the platform constitutes your acceptance of any updates to these terms.",
  },
  {
    title: "2. Use of Platform",
    content:
      "Beta Tenant provides a marketplace for property listings and agent discovery in Nigeria. You agree to use the platform only for lawful purposes and in a manner that does not infringe the rights of others. You are solely responsible for all activities conducted through your account.",
  },
  {
    title: "3. User Accounts",
    content:
      "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. Please notify us immediately of any unauthorized use.",
  },
  {
    title: "4. Property Listings",
    content:
      "Landlords and agents who post listings are responsible for the accuracy of all information provided. Beta Tenant does not guarantee the availability, condition, or accuracy of any listing. We reserve the right to remove listings that violate our policies.",
  },
  {
    title: "5. Payments & Fees",
    content:
      "Any payments processed through Beta Tenant are subject to our payment terms and the fees disclosed at checkout. We use industry-standard encryption to protect payment information. Refund eligibility is determined on a case-by-case basis in accordance with our refund policy.",
  },
  {
    title: "6. Privacy",
    content:
      "Your use of the platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. We collect and process personal data as described in our Privacy Policy. Please review it carefully to understand our practices.",
  },
  {
    title: "7. Prohibited Activities",
    content:
      "You may not use the platform to post fraudulent listings, harass other users, engage in unauthorized data collection, or attempt to circumvent security measures. Violations may result in immediate account suspension and, where applicable, legal action.",
  },
  {
    title: "8. Limitation of Liability",
    content:
      "Beta Tenant shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount you paid us in the six months preceding the claim. We do not guarantee uninterrupted or error-free service.",
  },
  {
    title: "9. Changes to Terms",
    content:
      "We reserve the right to modify these Terms at any time. We will notify registered users of material changes via email or an in-app notice. Continued use of the platform after changes take effect constitutes your acceptance of the revised Terms.",
  },
  {
    title: "10. Contact",
    content:
      "If you have questions about these Terms, please contact us at support@betatenant.com. Our team is available Monday to Friday, 9 AM to 6 PM WAT. We aim to respond to all inquiries within 2 business days.",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-5 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-bt-primary uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-[-0.02em] mb-3">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-neutral-500">Last updated: January 2025</p>
          <p className="mt-4 text-[15px] text-neutral-600 leading-relaxed">
            Please read these Terms and Conditions carefully before using Beta Tenant. These terms govern your access to and use of our platform.
          </p>
        </div>

        <hr className="border-neutral-100 mb-10" />

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-bold text-neutral-900 mb-2">{section.title}</h2>
              <p className="text-[15px] text-neutral-600 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <hr className="border-neutral-100 mt-12 mb-8" />

        <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
          <Link href="/privacy-policies" className="text-bt-primary hover:underline font-medium">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/" className="hover:text-neutral-800 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
