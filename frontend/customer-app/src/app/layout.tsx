import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Manrope } from "next/font/google";
import { LanguageProvider } from "@/components/language";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";
import "./workspace.css";
import "leaflet/dist/leaflet.css";
import "./location.css";
import "./service-features.css";
import "./reports.css";
import "./mobile-home.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#123b30",
};

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://homi-kappa.vercel.app")
).replace(/\/+$/, "");

const socialBannerUrl = `${siteUrl}/images/homi-promo-banner.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "homi. — Ghar ka kaam, aasaan",
  description:
    "Send a simple household repair request in your own language. Connect directly with local plumbers, electricians, carpenters and other workers in India. No signup needed to request help.",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "homi.",
    locale: "en_IN",
    title: "Homi — Your Neighbourhood, Your Help",
    description:
      "Ghar ka kaam? Find help near you. Trusted local professionals for Plumbing, Electrical, Carpentry, Painting and Home Repairs.",
    images: [
      {
        url: socialBannerUrl,
        secureUrl: socialBannerUrl,
        width: 1002,
        height: 658,
        type: "image/jpeg",
        alt: "Homi — Your Neighbourhood, Your Help. Ghar ka kaam? Find help near you.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Homi — Your Neighbourhood, Your Help",
    description:
      "Ghar ka kaam? Find help near you. Trusted local professionals for every home repair and service.",
    images: [socialBannerUrl],
  },
  icons: {
    icon: "/images/logo-icon.svg",
    shortcut: "/images/logo-icon.svg",
    apple: "/images/logo-icon.svg",
  },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${manrope.variable}`}>
      <body>
        <LanguageProvider>
          {children}
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
