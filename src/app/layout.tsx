import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/providers";
import { SWRegister } from "@/components/sw-register";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: "#0A0876",
};

export const metadata: Metadata = {
  title: "Beta Tenant — Find Your Perfect Rental Home in Nigeria",
  description:
    "Nigeria's most trusted property rental marketplace. Find verified rental apartments with transparent pricing and vetted agents.",
  keywords: ["rent apartment Nigeria", "Lagos rental", "apartment hunting", "verified agents", "Beta Tenant"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Beta Tenant",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Beta Tenant — Find Your Perfect Rental Home in Nigeria",
    description: "Nigeria's most trusted property rental marketplace.",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1 pt-[72px] lg:pt-[78px] pb-16 lg:pb-0">
            {children}
          </main>
          {/* Footer hidden on mobile — bottom nav replaces it */}
          <div className="hidden lg:block">
            <Footer />
          </div>
          <MobileNav />
          <SWRegister />
        </Providers>
      </body>
    </html>
  );
}
