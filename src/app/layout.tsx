import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { RootClientLayout } from "@/components/RootClientLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elevate Spaces",
  description: "AI Virtual Staging & Photographer Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <RootClientLayout>{children}</RootClientLayout>
        </ReduxProvider>
      </body>
    </html>
  );
}
