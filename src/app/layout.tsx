import 'react-toastify/dist/ReactToastify.css';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { RootClientLayout } from "@/components/RootClientLayout";
import { MainWrapper } from "@/components/MainWrapper";
import { ClientNavbar } from "../components/ClientNavbar";
import { PWAInstall } from "@/components/PWAInstall";
import { AppToastContainer } from "@/components/AppToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Elevate Spaces",
    template: "%s | Elevate Spaces"
  },
  description: "Transform your spaces with AI-powered virtual staging. Upload images, get instant professional staging suggestions.",
  keywords: ["virtual staging", "AI staging", "interior design", "home staging", "photographercopyright"],
  authors: [{ name: "Elevate Spaces" }],
  creator: "Elevate Spaces",
  publisher: "Elevate Spaces",
  robots: "index, follow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Elevate Spaces",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://elevate-spaces.com",
    siteName: "Elevate Spaces",
    title: "Elevate Spaces - AI Virtual Staging",
    description: "Transform your spaces with AI-powered virtual staging",
    images: [
      {
        url: "https://elevate-spaces.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Elevate Spaces - AI Virtual Staging",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elevate Spaces",
    description: "Transform your spaces with AI-powered virtual staging",
    images: ["https://elevate-spaces.com/twitter-image.png"],
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
        <meta name="apple-mobile-web-app-title" content="Elevate Spaces" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Elevate Spaces" />
        <meta name="twitter:description" content="Transform your spaces with AI-powered virtual staging" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%236366f1'/><path d='M50 20 L80 40 L80 70 L50 90 L20 70 L20 40 Z M50 35 L70 48 L70 62 L50 75 L30 62 L30 48 Z' fill='%23ffffff'/></svg>" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="mask-icon" href="/icon-maskable-192.png" color="#6366f1" />
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
            </MainWrapper>
          </RootClientLayout>
        </ReduxProvider>
      </body>
    </html>
  );
}
