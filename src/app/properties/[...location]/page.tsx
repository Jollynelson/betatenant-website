import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Map URL slugs to display names and state filter values
const LOCATION_MAP: Record<string, { name: string; state: string; lga?: string; desc: string; priceRange: string }> = {
  "lagos":            { name: "Lagos",            state: "Lagos",         desc: "Nigeria's commercial capital",  priceRange: "₦400k–₦5M/yr" },
  "abuja":            { name: "Abuja",             state: "Abuja (FCT)",   desc: "Nigeria's federal capital",     priceRange: "₦500k–₦4M/yr" },
  "port-harcourt":    { name: "Port Harcourt",     state: "Rivers",        desc: "oil city in Rivers State",      priceRange: "₦350k–₦3M/yr" },
  "uyo":              { name: "Uyo",               state: "Akwa Ibom",     lga: "Uyo",   desc: "Akwa Ibom State capital", priceRange: "₦200k–₦1.5M/yr" },
  "akwa-ibom":        { name: "Akwa Ibom",         state: "Akwa Ibom",     desc: "South-south Nigeria",           priceRange: "₦180k–₦1.5M/yr" },
  "ibadan":           { name: "Ibadan",            state: "Oyo",           lga: "Ibadan", desc: "Oyo State capital",      priceRange: "₦150k–₦1.2M/yr" },
  "enugu":            { name: "Enugu",             state: "Enugu",         lga: "Enugu", desc: "Coal City, Southeast Nigeria", priceRange: "₦150k–₦1.5M/yr" },
  "benin-city":       { name: "Benin City",        state: "Edo",           lga: "Benin City", desc: "Edo State capital",   priceRange: "₦200k–₦1.5M/yr" },
  "warri":            { name: "Warri",             state: "Delta",         lga: "Warri", desc: "Delta State oil city",     priceRange: "₦200k–₦1.8M/yr" },
  // Lagos sub-areas
  "lagos/lekki":          { name: "Lekki",         state: "Lagos", lga: "Lekki",          desc: "upscale Lagos Island area",    priceRange: "₦800k–₦5M/yr" },
  "lagos/victoria-island": { name: "Victoria Island", state: "Lagos", lga: "Victoria Island", desc: "Lagos business district",  priceRange: "₦1.5M–₦8M/yr" },
  "lagos/ikeja":          { name: "Ikeja",         state: "Lagos", lga: "Ikeja",          desc: "Lagos State capital",          priceRange: "₦600k–₦3M/yr" },
  "lagos/yaba":           { name: "Yaba",          state: "Lagos", lga: "Yaba",           desc: "tech hub, Lagos Mainland",     priceRange: "₦400k–₦2M/yr" },
  "lagos/surulere":       { name: "Surulere",      state: "Lagos", lga: "Surulere",       desc: "mid-range Lagos Mainland",     priceRange: "₦350k–₦1.8M/yr" },
  "lagos/ajah":           { name: "Ajah",          state: "Lagos", lga: "Ajah",           desc: "growing Lagos Island suburb",  priceRange: "₦500k–₦3M/yr" },
  // Abuja sub-areas
  "abuja/maitama":        { name: "Maitama",       state: "Abuja (FCT)", lga: "Maitama", desc: "upscale Abuja district",      priceRange: "₦1.5M–₦6M/yr" },
  "abuja/wuse":           { name: "Wuse",          state: "Abuja (FCT)", lga: "Wuse",    desc: "central Abuja business area", priceRange: "₦800k–₦4M/yr" },
  "abuja/gwarinpa":       { name: "Gwarinpa",      state: "Abuja (FCT)", lga: "Gwarinpa", desc: "large Abuja residential estate", priceRange: "₦500k–₦2.5M/yr" },
};

export function generateStaticParams() {
  return Object.keys(LOCATION_MAP).map((slug) => ({ location: slug.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ location: string[] }> }): Promise<Metadata> {
  const { location: segments } = await params;
  const slug = segments.join("/");
  const loc = LOCATION_MAP[slug];
  if (!loc) return { title: "Properties for Rent | BetaTenant" };

  const title = `${loc.name.includes("Island") || loc.name.length < 8 ? "" : ""}Flats & Houses for Rent in ${loc.name} | BetaTenant`;
  const desc = `Find verified apartments, self-contains, and houses for rent in ${loc.name} — ${loc.desc}. Prices from ${loc.priceRange}. Verified agents, real reviews.`;

  return {
    title,
    description: desc,
    keywords: [
      `flats for rent ${loc.name}`, `houses to let ${loc.name}`,
      `self contain ${loc.name}`, `apartment ${loc.name}`,
      `rent ${loc.name}`, `2 bedroom flat ${loc.name}`,
    ],
    openGraph: { title, description: desc, url: `https://betatenant.com/properties/${slug}` },
    alternates: { canonical: `https://betatenant.com/properties/${slug}` },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ location: string[] }> }) {
  const { location: segments } = await params;
  const slug = segments.join("/");
  const loc = LOCATION_MAP[slug];

  if (!loc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">Location not found</h1>
          <Link href="/properties" className="text-bt-primary font-semibold">Browse all properties →</Link>
        </div>
      </div>
    );
  }

  const searchUrl = `/properties?state=${encodeURIComponent(loc.state)}${loc.lga ? `&lga=${encodeURIComponent(loc.lga)}` : ""}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-bt-primary to-[#12127a] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-bt-primary-light/80 text-sm font-medium uppercase tracking-wider mb-3">BetaTenant</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Flats &amp; Houses for Rent in {loc.name}
          </h1>
          <p className="text-white/70 text-lg mb-8">
            Verified rental properties in {loc.name}, {loc.desc}. Prices typically range {loc.priceRange}.
          </p>
          <Link
            href={searchUrl}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-bt-primary font-bold text-lg hover:bg-neutral-100 transition-colors"
          >
            Browse {loc.name} Listings <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Content — location guide for SEO + AEO */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Renting in {loc.name}: What You Need to Know
        </h2>
        <p className="text-neutral-600 leading-relaxed mb-6">
          {loc.name} is one of Nigeria&apos;s most active rental markets. Whether you&apos;re looking for a
          self-contained apartment, a mini flat, or a 2–3 bedroom flat, BetaTenant lists verified
          properties from vetted agents and landlords across {loc.name}.
        </p>

        <h3 className="text-lg font-bold text-neutral-900 mb-2">Average Rent Prices in {loc.name}</h3>
        <p className="text-neutral-600 mb-6">
          Rental prices in {loc.name} typically range from {loc.priceRange} per year depending on
          location, property type and furnishing. Self-contained apartments are the most affordable
          entry point, while 3-bedroom flats in prime areas command the highest rents.
        </p>

        <h3 className="text-lg font-bold text-neutral-900 mb-2">Finding Verified Agents in {loc.name}</h3>
        <p className="text-neutral-600 mb-6">
          BetaTenant lists only verified agents operating in {loc.name}. Every agent has a public
          profile with tenant reviews, ratings, and response times — so you can choose with confidence
          before making contact. You can also report suspicious agents directly through the platform.
        </p>

        <h3 className="text-lg font-bold text-neutral-900 mb-2">Common Property Types in {loc.name}</h3>
        <ul className="list-disc list-inside text-neutral-600 space-y-1 mb-8">
          <li><strong>Self-contained:</strong> Studio with private bathroom and kitchen</li>
          <li><strong>Mini flat (1 bedroom):</strong> Separate bedroom, living room, kitchen, bathroom</li>
          <li><strong>2 bedroom flat:</strong> Two bedrooms, living area, kitchen</li>
          <li><strong>3 bedroom flat:</strong> Full family flat, often in estates</li>
        </ul>

        <div className="flex gap-4 flex-wrap">
          <Link href={searchUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold hover:bg-bt-primary-light transition-colors">
            Browse {loc.name} Properties <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/renting-guide"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors">
            Nigeria Renting Guide
          </Link>
        </div>
      </section>
    </div>
  );
}
