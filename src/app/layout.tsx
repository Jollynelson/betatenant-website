import type { Metadata, Viewport } from "next";
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
  title: "Beta Tenant — Find Your Perfect Rental Home in Nigeria",
  description:
    "Nigeria's most trusted property rental marketplace. Find verified rental apartments with transparent pricing and vetted agents.",
  keywords: ["rent apartment Nigeria", "Lagos rental", "apartment hunting", "verified agents", "Beta Tenant"],
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
    title: "Beta Tenant — Find Your Perfect Rental Home in Nigeria",
    description: "Nigeria's most trusted property rental marketplace.",
    type: "website",
    locale: "en_NG",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Beta Tenant",
    "format-detection": "telephone=no",
    "msapplication-TileColor": "#0A0876",
    "msapplication-tap-highlight": "no",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700&display=swap" rel="stylesheet" />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
      >
        <Providers>
          {children}
        </Providers>
        <SWRegister />
      </body>
    </html>
  );
}
