import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SWRegister } from "@/components/sw-register";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0A0876" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0876" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Beta Tenant — Rental Homes in Nigeria",
    template: "%s | Beta Tenant",
  },
  description:
    "Find verified rental apartments, flats, and houses across Nigeria. Browse self-contains, 1–4 bedroom flats for rent in Lagos, Abuja, Port Harcourt, Uyo and more. Verified agents, real reviews.",
  keywords: [
    "rent apartment Nigeria", "flats for rent Lagos", "houses to let Abuja",
    "self contain for rent", "apartment hunting Nigeria", "verified rental agents Nigeria",
    "2 bedroom flat Lagos", "house for rent Port Harcourt", "flat to let Uyo",
    "Beta Tenant", "rental marketplace Nigeria", "verified property agents",
  ],
  metadataBase: new URL("https://betatenant.com"),
  alternates: { canonical: "https://betatenant.com" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Beta Tenant",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Beta Tenant — Rental Homes in Nigeria",
    description: "Find verified rental apartments, flats and houses across Nigeria. Real reviews, verified agents, transparent pricing.",
    type: "website",
    locale: "en_NG",
    url: "https://betatenant.com",
    siteName: "Beta Tenant",
    images: [{ url: "https://betatenant.com/icons/icon-512.png", width: 512, height: 512, alt: "Beta Tenant" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beta Tenant — Rental Homes in Nigeria",
    description: "Find verified rental apartments and houses across Nigeria. Vetted agents, real reviews.",
    images: ["https://betatenant.com/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Beta Tenant",
    "format-detection": "telephone=no",
    "msapplication-TileColor": "#0A0876",
    "msapplication-tap-highlight": "no",
    "color-scheme": "light",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Font: preconnect first, then load non-blocking with fallback display */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700&display=fallback"
          rel="stylesheet"
        />
        {/* iOS PWA status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col">
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": ["Organization", "LocalBusiness"],
                "@id": "https://betatenant.com/#organization",
                "name": "Beta Tenant",
                "alternateName": "Beta Tenant",
                "url": "https://betatenant.com",
                "logo": "https://betatenant.com/icons/icon-512.png",
                "description": "Nigeria's trusted rental marketplace connecting tenants with verified agents and landlords across Lagos, Abuja, Port Harcourt, Uyo and all 36 states.",
                "foundingDate": "2023",
                "areaServed": ["Nigeria", "Lagos", "Abuja", "Port Harcourt", "Uyo", "Ibadan", "Enugu", "Benin City", "Warri"],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+2348101026653",
                  "contactType": "customer support",
                  "availableLanguage": ["English", "Yoruba", "Igbo", "Hausa"],
                  "areaServed": "NG",
                },
                "sameAs": [
                  "https://wa.me/2348101026653",
                ],
                "knowsAbout": [
                  "Property rental Nigeria",
                  "Apartment listings Lagos",
                  "Verified real estate agents Nigeria",
                  "Self contain for rent Nigeria",
                  "House to let Nigeria",
                ],
              },
              {
                "@type": "WebSite",
                "@id": "https://betatenant.com/#website",
                "url": "https://betatenant.com",
                "name": "Beta Tenant",
                "description": "Find verified rental homes in Nigeria",
                "publisher": { "@id": "https://betatenant.com/#organization" },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://betatenant.com/properties?state={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          })}}
        />
        <Providers>
          {children}
        </Providers>
        <SWRegister />
      </body>
    </html>
  );
}
