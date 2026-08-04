import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beta Tenant — Find Your Perfect Rental Home in Nigeria",
  description:
    "Nigeria's most trusted property rental marketplace. Find verified apartments, short-lets, and rental homes with transparent pricing and vetted agents.",
  keywords: [
    "rent apartment Nigeria",
    "Lagos rental",
    "short-let Nigeria",
    "apartment hunting",
    "verified agents",
    "Beta Tenant",
  ],
  openGraph: {
    title: "Beta Tenant — Find Your Perfect Rental Home in Nigeria",
    description:
      "Nigeria's most trusted property rental marketplace. Find verified apartments, short-lets, and rental homes.",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
