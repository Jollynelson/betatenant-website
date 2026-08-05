import Link from "next/link";

const sections = [
  {
    title: "1. Information We Collect",
    content:
      "We collect information you provide directly, such as your name, email address, phone number, and payment details when you register or use our services. We also collect usage data automatically, including IP addresses, browser type, pages viewed, and interactions with listings. Device identifiers and location data may also be collected when you use our mobile features.",
  },
  {
    title: "2. How We Use Your Information",
    content:
      "We use your information to provide, maintain, and improve the Beta Tenant platform, including processing transactions and sending service-related communications. We also use data to personalize your experience, show relevant property recommendations, and ensure platform security. We may send you promotional messages where you have consented to receive them.",
  },
  {
    title: "3. Information Sharing",
    content:
      "We do not sell your personal data to third parties. We may share information with agents or landlords when you initiate contact through our platform, and with service providers who assist us in operating Beta Tenant. We may disclose information when required by law or to protect the rights and safety of our users.",
  },
  {
    title: "4. Data Security",
    content:
      "We implement industry-standard security measures, including encryption in transit and at rest, to protect your personal information. While we take reasonable precautions, no security system is impenetrable and we cannot guarantee the absolute security of your data. You should keep your account credentials confidential and notify us of any suspected breach.",
  },
  {
    title: "5. Cookies",
    content:
      "We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand user behavior. You can control cookie preferences through your browser settings, though disabling certain cookies may affect platform functionality. Our cookie policy provides more detail on the types of cookies we use.",
  },
  {
    title: "6. Your Rights",
    content:
      "You have the right to access, correct, or delete your personal data at any time by visiting your account settings or contacting us. You may also withdraw consent for marketing communications without affecting the lawfulness of prior processing. Requests will be processed within 30 days in accordance with applicable data protection law.",
  },
  {
    title: "7. Contact Us",
    content:
      "If you have questions or concerns about this Privacy Policy or how we handle your data, please contact our Data Protection team at privacy@betatenant.com. You may also write to us at our registered address. We are committed to resolving any privacy concerns promptly and transparently.",
  },
];

export default function PrivacyPoliciesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-5 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-bt-primary uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-[-0.02em] mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-neutral-500">Last updated: January 2025</p>
          <p className="mt-4 text-[15px] text-neutral-600 leading-relaxed">
            At Beta Tenant, your privacy matters. This Policy explains how we collect, use, and protect your personal information when you use our platform.
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
          <Link href="/terms-and-conditions" className="text-bt-primary hover:underline font-medium">
            Terms &amp; Conditions
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
