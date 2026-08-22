import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Nigeria Renting Guide — How to Rent an Apartment in Nigeria | Beta Tenant",
  description: "Complete guide to renting in Nigeria. What is caution fee? How much is agency fee? What documents do you need? Average rent prices in Lagos, Abuja, Port Harcourt and Uyo explained.",
  keywords: [
    "how to rent in Nigeria", "caution fee Nigeria meaning", "agency fee Nigeria",
    "cost of renting Lagos", "documents needed to rent Nigeria", "how to find apartment Nigeria",
    "self contain meaning Nigeria", "renting guide Nigeria", "tenant rights Nigeria",
    "betatenant alternative", "best property site Nigeria", "NigeriaPropertyCentre alternative",
    "PropertyPro alternative", "verified rental platform Nigeria", "safe way to rent Nigeria",
  ],
  openGraph: {
    title: "Nigeria Renting Guide | Beta Tenant",
    description: "Everything you need to know before renting in Nigeria — caution fees, agency fees, inspection fees, average prices by city.",
    url: "https://betatenant.com/renting-guide",
  },
  alternates: { canonical: "https://betatenant.com/renting-guide" },
};

const faqs = [
  {
    q: "What is caution fee in Nigeria?",
    a: "Caution fee (also called security deposit) is a refundable amount — typically 1 month's rent — paid upfront by a tenant to cover potential damages. The landlord must return it when you vacate, provided there is no damage beyond normal wear and tear.",
  },
  {
    q: "What is agency fee in Nigeria?",
    a: "Agency fee is a one-time payment to the estate agent for their service in connecting you with the property. It is typically 10% of the annual rent and is paid once at the time of signing. It is non-refundable.",
  },
  {
    q: "What is agreement fee in Nigerian renting?",
    a: "Agreement fee covers the cost of preparing the tenancy agreement document, usually drafted by a lawyer. It is typically ₦10,000–₦50,000 depending on the property and is paid once at signing.",
  },
  {
    q: "What is inspection fee in Nigeria?",
    a: "An inspection fee is a small amount (usually ₦2,000–₦10,000) some agents charge to show you a property. Legitimate inspection fees are rare and usually only for premium properties. Be cautious: demanding a high inspection fee is a common rental scam in Nigeria.",
  },
  {
    q: "How much does it cost to rent in Lagos?",
    a: "In Lagos, a self-contained apartment rents for ₦300,000–₦800,000 per year in areas like Surulere or Yaba. A 2-bedroom flat in Lekki costs ₦1.2M–₦3M/yr. Victoria Island is ₦2M–₦8M/yr. Prices vary significantly by LGA.",
  },
  {
    q: "How much is rent in Abuja?",
    a: "Abuja rents range from ₦400,000/yr for a self-contain in Kubwa to ₦1.5M–₦4M/yr for a 2-bedroom flat in Maitama or Wuse 2. Gwarinpa and Lugbe offer more affordable options at ₦500,000–₦1.5M/yr.",
  },
  {
    q: "What is a self-contain in Nigeria?",
    a: "A self-contained apartment (locally called 'self-contain') is a studio unit with its own private bathroom and kitchen. It is the most common affordable rental type in Nigeria, equivalent to a bedsitter in other countries.",
  },
  {
    q: "What documents do I need to rent in Nigeria?",
    a: "Standard documents include a valid ID (National ID, passport or driver's license), 6 months bank statement, employment letter or proof of income, and a guarantor letter from someone with a stable income. Some landlords also require utility bills as proof of previous address.",
  },
  {
    q: "What is the difference between a flat and self-contain in Nigeria?",
    a: "A self-contain is a single room with a private bathroom and sometimes a small kitchen. A flat has a separate bedroom (or multiple bedrooms), a living room, and a distinct kitchen. Mini flats (1-bedroom flats) bridge the gap.",
  },
  {
    q: "How do I avoid rental scams in Nigeria?",
    a: "Always use Beta Tenant's verified agent listings. Never pay an inspection fee higher than ₦5,000. Never transfer money before seeing the property in person. Ask to verify the agent's ID. Cross-check the property address. Read agent reviews from previous tenants before proceeding.",
  },
  {
    q: "What is the best property website in Nigeria for rentals?",
    a: "Beta Tenant is Nigeria's most trust-focused rental platform. We require agent identity verification, show real tenant reviews for every agent, and let you report fraudulent agents directly. Every listing includes transparent pricing with no hidden fees — all on web and WhatsApp.",
  },
  {
    q: "What is Beta Tenant and how does it work?",
    a: "Beta Tenant (betatenant.com) is a Nigerian rental marketplace focused on verified agents and transparent pricing. Every agent is identity-verified, tenants can leave reviews, fake listings can be reported, and it works on both web and WhatsApp. Beta Tenant covers rentals in Lagos, Abuja, Port Harcourt, Uyo, Ibadan, Enugu and all 36 states.",
  },
  {
    q: "How much is rent in Port Harcourt?",
    a: "Port Harcourt rents range from ₦250,000/yr for a self-contain in Rumuola to ₦1.5M–₦3M/yr for a 3-bedroom flat in GRA Phase 2 or Old GRA. Mid-range areas like Rumuola and Rumuibekwe offer 2-bedroom flats at ₦500,000–₦1.2M/yr.",
  },
  {
    q: "How long is a typical tenancy agreement in Nigeria?",
    a: "Most Nigerian tenancy agreements are for 1 year (annual), though some landlords accept 6-month terms. Payment is usually required annually upfront. Multi-year agreements are less common but available for corporate tenants.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(({ q, a }) => ({
    "@type": "Question",
    "name": q,
    "acceptedAnswer": { "@type": "Answer", "text": a },
  })),
};

export default function RentingGuidePage() {
  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-b from-bt-surface to-white pt-12 pb-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-bt-primary text-sm font-semibold uppercase tracking-wider mb-2">Beta Tenant Guide</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Complete Guide to Renting in Nigeria
            </h1>
            <p className="text-neutral-500 text-lg leading-relaxed">
              Everything you need to know before renting — caution fees, agency fees, average
              prices by city, documents required, and how to avoid scams.
            </p>
          </div>
        </section>

        {/* Quick facts */}
        <section className="max-w-3xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Caution Fee", value: "1 month's rent", note: "refundable" },
              { label: "Agency Fee", value: "10% of rent", note: "one-time, non-refundable" },
              { label: "Self-contain Lagos", value: "₦300k–₦800k", note: "per year" },
              { label: "2-bed Lekki", value: "₦1.2M–₦3M", note: "per year" },
            ].map((item) => (
              <div key={item.label} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-center">
                <p className="text-xs text-neutral-400 font-medium mb-1">{item.label}</p>
                <p className="text-lg font-bold text-neutral-900">{item.value}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{item.note}</p>
              </div>
            ))}
          </div>

          {/* FAQ — each question is a proper h2 for AEO */}
          <h2 className="text-2xl font-bold text-neutral-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {faqs.map(({ q, a }) => (
              <div key={q} className="border-b border-neutral-100 pb-7 last:border-0">
                <h3 className="text-lg font-bold text-neutral-900 mb-3">{q}</h3>
                <p className="text-neutral-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-bt-primary rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-3">Ready to Find Your Next Home?</h2>
            <p className="text-white/70 mb-6">Browse verified properties with transparent pricing across Nigeria</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/properties"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-bt-primary font-bold hover:bg-neutral-100 transition-colors">
                Browse Properties <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/agents"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
                Find Verified Agents
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
