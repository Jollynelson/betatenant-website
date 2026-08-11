import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How BetaTenant Works — Find, Verify & Rent in Nigeria",
  description: "Learn how to find a verified rental in Nigeria using BetaTenant. Browse listings, check agent reviews, pay securely and move in. Works on WhatsApp too.",
  openGraph: {
    title: "How BetaTenant Works — Find, Verify & Rent in Nigeria",
    url: "https://betatenant.com/how-it-works",
  },
  alternates: { canonical: "https://betatenant.com/how-it-works" },
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
