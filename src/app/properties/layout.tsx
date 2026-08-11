import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flats & Houses to Rent in Nigeria | Verified Agents | Beta Tenant",
  description: "Browse verified flats, self-contains, mini flats and houses to let across Nigeria. Self con Lagos, flat Abuja, house Port Harcourt, flat Uyo. Verified agents, real reviews.",
  keywords: [
    "flats for rent Nigeria", "houses to let Nigeria", "self contain for rent Nigeria",
    "self con Lagos", "self contain Lagos", "flat for rent Lagos", "house for rent Abuja",
    "flat Abuja", "self contain Abuja", "house Port Harcourt", "flat Uyo",
    "mini flat Lagos", "2 bedroom flat Lagos", "2 bedroom flat Abuja",
    "apartments for rent Nigeria", "house to let Lagos", "flat to let Nigeria",
    "shortlet Lagos", "shortlet Abuja", "verified rental agents Nigeria",
    "cheap flats Lagos", "affordable flat Abuja",
  ],
  openGraph: {
    title: "Apartments & Houses for Rent in Nigeria | Beta Tenant",
    description: "Browse verified flats, self-contains and houses for rent across Nigeria.",
    url: "https://betatenant.com/properties",
  },
  alternates: { canonical: "https://betatenant.com/properties" },
};

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
