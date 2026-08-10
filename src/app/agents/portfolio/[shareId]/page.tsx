import type { Metadata } from "next";
import AgentPortfolioPage from "./client";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.betatenant.com";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://new.betatenant.com";

export function generateStaticParams() {
  return [{ shareId: "placeholder" }];
}

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  if (shareId === "placeholder") return { title: "Agent Portfolio — BetaTenant" };

  try {
    const res = await fetch(`${API}/v1/landlordandagent/share/shareid/${shareId}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const profile = data?.result;
    if (!profile) return { title: "Agent Portfolio — BetaTenant" };

    const name = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
    const role = profile.role === "landlord" ? "Landlord" : "Rental Agent";
    const desc = profile.about
      ? profile.about.slice(0, 155)
      : `View ${name}'s property listings on BetaTenant — Nigeria's trusted rental marketplace.`;
    const ogImage = `${API}/v1/og/${shareId}`;

    return {
      title: `${name} — ${role} | BetaTenant`,
      description: desc,
      openGraph: {
        title: `${name} — ${role} | BetaTenant`,
        description: desc,
        type: "profile",
        url: `${SITE}/agents/portfolio/${shareId}`,
        images: [{ url: ogImage, width: 1200, height: 630, alt: `${name} on BetaTenant` }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} — ${role} | BetaTenant`,
        description: desc,
        images: [ogImage],
      },
    };
  } catch {
    return { title: "Agent Portfolio — BetaTenant" };
  }
}

export default function Page({ params }: { params: Promise<{ shareId: string }> }) {
  return <AgentPortfolioPage params={params} />;
}
