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
    "Nigeria's most trusted property rental marketplace. Find verified rental apartments with transparent pricing and vetted agents.",
  keywords: [
    "rent apartment Nigeria",
    "Lagos rental",
    "apartment hunting",
    "verified agents",
    "Beta Tenant",
  ],
  openGraph: {
    title: "Beta Tenant — Find Your Perfect Rental Home in Nigeria",
    description:
      "Nigeria's most trusted property rental marketplace. Find verified rental apartments with transparent pricing.",
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
    <html lang="en" className={`${inter.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1 pt-[72px] lg:pt-[78px] pb-16 lg:pb-0">
          {children}
        </main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
