import type { Metadata } from "next";
import Script from "next/script";
import AgentPortfolioPage from "./client";

const API  = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.betatenant.com";
const SITE = "https://betatenant.com";

export function generateStaticParams() {
  return [{ shareId: "placeholder" }];
}

async function fetchProfile(shareId: string) {
  try {
    const res = await fetch(`${API}/v1/landlordandagent/share/shareid/${shareId}`, { next: { revalidate: 3600 } });
    const data = await res.json();
    return data?.result ?? null;
  } catch { return null; }
}

async function fetchReviews(userId: string) {
  try {
    const res = await fetch(`${API}/v1/landlordandagent/review/${userId}`, { next: { revalidate: 3600 } });
    const data = await res.json();
    return (data?.reviews ?? data?.result ?? []) as any[];
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  if (shareId === "placeholder") return { title: "Agent Portfolio — Beta Tenant" };

  const profile = await fetchProfile(shareId);
  if (!profile) return { title: "Agent Portfolio — Beta Tenant" };

  const name = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  const role = profile.role === "landlord" ? "Landlord" : "Rental Agent";
  const loc  = profile.agentBasedLocation ? ` in ${profile.agentBasedLocation}` : "";
  const desc = profile.about?.slice(0, 155)
    ?? `${name} is a verified ${role.toLowerCase()}${loc} on Beta Tenant. View listings, read tenant reviews and contact directly.`;
  const ogImage = `${API}/v1/og/${shareId}`;

  return {
    title: `${name} — Verified ${role}${loc} | Beta Tenant`,
    description: desc,
    keywords: [
      `${name} agent`, `${name} landlord`, `verified agent${loc}`,
      `rental agent${loc}`, `property agent${loc}`,
    ],
    openGraph: {
      title: `${name} — Verified ${role}${loc} | Beta Tenant`,
      description: desc,
      type: "profile",
      url: `${SITE}/agents/portfolio/${shareId}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${name} on Beta Tenant` }],
    },
    twitter: { card: "summary_large_image", title: `${name} — ${role} | Beta Tenant`, description: desc, images: [ogImage] },
    alternates: { canonical: `${SITE}/agents/portfolio/${shareId}` },
  };
}

export default async function Page({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  // Build JSON-LD with AggregateRating + BreadcrumbList
  let schema: object[] = [];

  if (shareId !== "placeholder") {
    const profile = await fetchProfile(shareId);
    if (profile) {
      const reviews = await fetchReviews(profile._id);
      const name = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
      const role = profile.role === "landlord" ? "Landlord" : "Rental Agent";
      const loc  = profile.agentBasedLocation ?? "";
      const avgRating = reviews.length
        ? (reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
        : null;

      // Person / RealEstateAgent schema with AggregateRating
      const agentSchema: any = {
        "@context": "https://schema.org",
        "@type": ["Person", "RealEstateAgent"],
        "@id": `${SITE}/agents/portfolio/${shareId}`,
        "name": name,
        "jobTitle": role,
        "worksFor": { "@id": `${SITE}/#organization` },
        "url": `${SITE}/agents/portfolio/${shareId}`,
        "image": profile.profilePic ?? undefined,
        ...(loc && { "workLocation": { "@type": "Place", "name": loc, "address": { "@type": "PostalAddress", "addressCountry": "NG", "addressRegion": loc } } }),
        ...(profile.agentStats?.activeListings && { "numberOfEmployees": { "@type": "QuantitativeValue", "value": profile.agentStats.activeListings } }),
      };

      // Only add AggregateRating if there are real reviews (Google penalises fake/empty ratings)
      if (reviews.length >= 1 && avgRating) {
        agentSchema.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": avgRating,
          "reviewCount": reviews.length,
          "bestRating": "5",
          "worstRating": "1",
        };
        // Add individual Review items (up to 5 most recent)
        agentSchema.review = reviews.slice(0, 5).map((r: any) => ({
          "@type": "Review",
          "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": "5" },
          "author": { "@type": "Person", "name": `${r.firstName ?? "Tenant"} ${r.lastName ?? ""}`.trim() },
          "reviewBody": r.message || r.comment || "",
          "datePublished": r.createdAt?.slice(0, 10) ?? "",
        }));
      }

      schema.push(agentSchema);

      // BreadcrumbList
      schema.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home",   "item": SITE },
          { "@type": "ListItem", "position": 2, "name": "Agents", "item": `${SITE}/agents` },
          { "@type": "ListItem", "position": 3, "name": name,     "item": `${SITE}/agents/portfolio/${shareId}` },
        ],
      });
    }
  }

  return (
    <>
      {schema.map((s, i) => (
        <Script key={i} id={`agent-schema-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <AgentPortfolioPage params={params} />
    </>
  );
}
