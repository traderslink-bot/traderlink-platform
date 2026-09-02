import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AnalyticsConsent } from "./analytics-consent";
import { MuiProviders } from "./mui-provider";
import { PwaServiceWorkerBootstrap } from "./pwa/pwa-service-worker-bootstrap";
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
  applicationName: "TraderLink Platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TraderLink Platform",
  },
  metadataBase: new URL("https://traderslink.pro"),
  manifest: "/manifest.webmanifest",
  title: {
    default: "TradersLink",
    template: "%s",
  },
  description:
    "TradersLink is a beta suite of trading tools with a small cap scanner, AI press release and SEC filing summaries, Discord alerts, generated chart levels, and Trader Intelligence coming soon.",
};

export const viewport: Viewport = {
  themeColor: "#011e56",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaServiceWorkerBootstrap />
        <MuiProviders>
          {children}
          <AnalyticsConsent />
        </MuiProviders>
      </body>
    </html>
  );
}
