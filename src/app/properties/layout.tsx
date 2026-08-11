import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apartments & Houses for Rent in Nigeria | BetaTenant",
  description: "Browse verified flats, self-contains, mini flats and houses for rent across Nigeria. Filter by location, price and type. Lagos, Abuja, Port Harcourt, Uyo and all states.",
  keywords: ["flats for rent Nigeria", "houses to let Nigeria", "self contain for rent", "apartment Lagos", "flat Abuja", "house Port Harcourt"],
  openGraph: {
    title: "Apartments & Houses for Rent in Nigeria | BetaTenant",
    description: "Browse verified flats, self-contains and houses for rent across Nigeria.",
    url: "https://betatenant.com/properties",
  },
  alternates: { canonical: "https://betatenant.com/properties" },
};

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
