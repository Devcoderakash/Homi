import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Manrope } from "next/font/google";
import { LanguageProvider } from "@/components/language";
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

export const metadata: Metadata = {
  title: "homi. — Ghar ka kaam, aasaan",
  description: "Send a simple household repair request in your own language. Connect directly with local plumbers, electricians, carpenters and other workers in India. No signup needed to request help.",
  icons: {
    icon: "/images/logo-icon.svg",
    shortcut: "/images/logo-icon.svg",
    apple: "/images/logo-icon.svg",
  },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${manrope.variable}`}>
      <body><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
