import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Verified Property Agents in Nigeria | BetaTenant",
  description: "Search verified real estate agents and landlords across Nigeria. Read real tenant reviews, check agent ratings, report fake agents. Covering Lagos, Abuja, Port Harcourt, Uyo and more.",
  keywords: ["verified agents Nigeria", "property agents Lagos", "real estate agents Abuja", "report fake agent Nigeria", "landlord reviews Nigeria"],
  openGraph: {
    title: "Find Verified Property Agents in Nigeria | BetaTenant",
    description: "Search verified real estate agents across Nigeria with real tenant reviews.",
    url: "https://betatenant.com/agents",
  },
  alternates: { canonical: "https://betatenant.com/agents" },
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
