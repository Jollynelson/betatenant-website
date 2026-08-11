import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.betatenant.com";

async function resolveSlug(slug: string) {
  try {
    const res = await fetch(`${API}/v1/landlordandagent/share/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ successful: boolean; shareId: string; slug: string }>;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await resolveSlug(slug);
  if (!data?.successful) return { title: "Beta Tenant — Agent Portfolio" };

  // Fetch profile for OG image
  try {
    const profileRes = await fetch(`${API}/v1/landlordandagent/share/shareid/${data.shareId}`, { next: { revalidate: 60 } });
    const profileData = await profileRes.json();
    const profile = profileData?.result;
    const name = profile ? `${profile.firstName} ${profile.lastName}` : slug;
    const ogImageUrl = `${API}/v1/og/${data.shareId}`;

    return {
      title: `${name} — Beta Tenant Agent`,
      description: profile?.about || `View ${name}'s property listings on Beta Tenant`,
      openGraph: {
        title: `${name} — Beta Tenant Agent`,
        description: profile?.about || `View ${name}'s property listings on Beta Tenant`,
        type: "profile",
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${name} on Beta Tenant` }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} — Beta Tenant Agent`,
        images: [ogImageUrl],
      },
    };
  } catch {
    return { title: "Beta Tenant — Agent Portfolio" };
  }
}

export async function generateStaticParams() {
  return [{ slug: "placeholder" }];
}

export default async function SlugRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await resolveSlug(slug);
  if (!data?.successful || !data.shareId) notFound();
  redirect(`/agents/portfolio/${data.shareId}`);
}
