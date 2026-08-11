import type { Metadata } from "next";
import Script from "next/script";
import PropertyDetailPage from "./client";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.betatenant.com";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (id === "placeholder") return { title: "Property for Rent | Beta Tenant" };

  try {
    const res = await fetch(`${API}/v1/user/property/${id}`, { next: { revalidate: 3600 } });
    const data = await res.json();
    const p = data?.property;
    if (!p) return { title: "Property for Rent | Beta Tenant" };

    const type = p.apartmentType?.includes("self") ? "Self Contained" :
                 p.apartmentType?.includes("mini") ? "Mini Flat" :
                 p.roomCount ? `${p.roomCount} Bedroom Flat` : "Apartment";
    const location = `${p.propertyLGA || ""}${p.propertyState ? `, ${p.propertyState}` : ""}`.trim();
    const price = p.listingFee ? `₦${Number(p.listingFee).toLocaleString()}/yr` : "";
    const title = `${type} for Rent in ${location}${price ? ` — ${price}` : ""} | Beta Tenant`;
    const desc = p.houseDescription?.slice(0, 155) ||
      `${type} for rent in ${location}. ${p.roomCount ? `${p.roomCount} bedroom${p.roomCount > 1 ? "s" : ""}.` : ""} ${price}. Verified listing on Beta Tenant.`;
    const image = p.photoURLs?.[0] || "https://betatenant.com/icons/icon-512.png";

    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        type: "website",
        url: `https://betatenant.com/property/${id}`,
        images: [{ url: image, width: 1200, height: 630, alt: title }],
      },
      twitter: { card: "summary_large_image", title, description: desc, images: [image] },
      alternates: { canonical: `https://betatenant.com/property/${id}` },
    };
  } catch {
    return { title: "Property for Rent | Beta Tenant" };
  }
}

async function getPropertyData(id: string) {
  if (id === "placeholder") return null;
  try {
    const res = await fetch(`${API}/v1/user/property/${id}`, { next: { revalidate: 3600 } });
    const data = await res.json();
    return data?.property ?? null;
  } catch { return null; }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPropertyData(id);

  const schema = p ? {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `https://betatenant.com/property/${id}`,
    "name": p.houseName || `${p.roomCount ?? 1} Bedroom in ${p.propertyLGA}`,
    "description": p.houseDescription || "",
    "url": `https://betatenant.com/property/${id}`,
    "image": p.photoURLs?.[0] || "",
    "offers": {
      "@type": "Offer",
      "price": p.listingFee,
      "priceCurrency": "NGN",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": p.listingFee,
        "priceCurrency": "NGN",
        "unitText": "per year",
      },
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": p.streetAddress || "",
      "addressLocality": p.propertyLGA || "",
      "addressRegion": p.propertyState || "",
      "addressCountry": "NG",
    },
    "numberOfRooms": p.roomCount || 1,
    "numberOfBathroomsTotal": p.bathroomCount || 1,
    "floorSize": p.propertySize ? {
      "@type": "QuantitativeValue",
      "value": p.propertySize,
      "unitCode": "MTK",
    } : undefined,
    "amenityFeature": (p.amenities || []).slice(0, 10).map((a: any) => ({
      "@type": "LocationFeatureSpecification",
      "name": typeof a === "string" ? a : a.name,
      "value": true,
    })),
    "publisher": { "@id": "https://betatenant.com/#organization" },
  } : null;

  return (
    <>
      {schema && (
        <Script
          id="property-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <PropertyDetailPage params={params} />
    </>
  );
}
