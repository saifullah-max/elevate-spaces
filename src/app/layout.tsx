import 'react-toastify/dist/ReactToastify.css';
import type { Metadata } from "next";
import { Inter, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { RootClientLayout } from "@/components/RootClientLayout";
import { MainWrapper } from "@/components/MainWrapper";
import { ClientNavbar } from "../components/ClientNavbar";
import { PWAInstall } from "@/components/PWAInstall";
import { PageviewTracker } from "@/components/PageviewTracker";
import { AppToastContainer } from "@/components/AppToastContainer";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import BonusBanner from "@/components/BonusBanner";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.elevatespacesai.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Elevate Spaces AI - AI Virtual Staging",
    template: "%s | Elevate Spaces AI"
  },
  description: "Transform your spaces with AI-powered virtual staging. Upload images, get instant professional staging suggestions.",
  keywords: ["virtual staging", "AI staging", "interior design", "home staging", "real estate photography"],
  authors: [{ name: "Elevate Spaces AI" }],
  creator: "Elevate Spaces AI",
  publisher: "Elevate Spaces AI",
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.jpg", sizes: "192x192", type: "image/jpeg" },
      { url: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
    apple: [
      { url: "/icon-192.jpg", sizes: "192x192", type: "image/jpeg" },
    ],
    shortcut: "/icon-192.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Elevate Spaces AI",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Elevate Spaces AI",
    title: "Elevate Spaces AI - AI Virtual Staging",
    description: "Transform your spaces with AI-powered virtual staging. Upload images, get instant professional staging suggestions.",
    images: [
      {
        url: "/og-before-after.jpg",
        width: 1200,
        height: 630,
        alt: "Empty room transformed into a staged, market-ready living room by Elevate Spaces AI",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elevate Spaces AI - AI Virtual Staging",
    description: "Transform your spaces with AI-powered virtual staging.",
    images: ["/og-before-after.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#6366f1" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#4f46e5" media="(prefers-color-scheme: dark)" />
        <meta name="description" content="Transform your spaces with AI-powered virtual staging. Upload images, get instant professional staging suggestions." />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Elevate Spaces AI" />
        <link rel="mask-icon" href="/icon-maskable-192.png" color="#6366f1" />
        <AnalyticsScripts />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} font-sans antialiased`}
      >
        <ReduxProvider>
          <RootClientLayout>
            <ClientNavbar />
            <MainWrapper>
              {children}
              <AppToastContainer />
              <PWAInstall />
              <PageviewTracker />
            </MainWrapper>
            <BonusBanner />
          </RootClientLayout>
        </ReduxProvider>
        <script src="//code.tidio.co/trht4vitzty4fc77wnvpa8ctjr6t3tyw.js" async></script>
      </body>
    </html>
  );
}
