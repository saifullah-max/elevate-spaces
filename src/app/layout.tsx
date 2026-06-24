import 'react-toastify/dist/ReactToastify.css';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { RootClientLayout } from "@/components/RootClientLayout";
import { MainWrapper } from "@/components/MainWrapper";
import { ClientNavbar } from "../components/ClientNavbar";
import { PWAInstall } from "@/components/PWAInstall";
import { PageviewTracker } from "@/components/PageviewTracker";
import { AppToastContainer } from "@/components/AppToastContainer";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://elevate-spaces.com";

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
        url: "/icon-512.jpg",
        width: 512,
        height: 512,
        alt: "Elevate Spaces AI",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elevate Spaces AI - AI Virtual Staging",
    description: "Transform your spaces with AI-powered virtual staging.",
    images: ["/icon-512.jpg"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
          </RootClientLayout>
        </ReduxProvider>
      </body>
    </html>
  );
}
