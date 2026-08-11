import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About BetaTenant — Nigeria's Trusted Rental Marketplace",
  description: "BetaTenant was built to end rental scams in Nigeria. We verify agents, publish real tenant reviews, and make finding a home safe and transparent across Lagos, Abuja, Port Harcourt and 37 states.",
  openGraph: {
    title: "About BetaTenant — Nigeria's Trusted Rental Marketplace",
    description: "Built to end rental scams in Nigeria. Verified agents, real reviews, transparent pricing.",
    url: "https://betatenant.com/about",
  },
  alternates: { canonical: "https://betatenant.com/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
