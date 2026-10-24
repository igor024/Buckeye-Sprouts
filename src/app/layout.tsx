import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaManager } from "./components/PwaManager";
import { AuthProvider } from "@/features/auth-profiles/context/AuthContext";
import { AuthModal } from "@/features/auth-profiles/components/AuthModal";

export const viewport: Viewport = {
  themeColor: "#d5eab9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Buckeye Sprouts · Study together",
  description: "Find your study group at Ohio State with Buckeye Sprouts.",
  applicationName: "Buckeye Sprouts",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Buckeye Sprouts",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#d5eab9" />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <AuthProvider>
          <PwaManager />
          <AuthModal />
          {children}
          <footer className="site-width flex flex-wrap items-center justify-between gap-3 py-7 text-xs text-stone-500 border-t border-stone-200 mt-12">
            <span>Made for little breakthroughs. Built for Buckeyes.</span>
            <span>Hackathon scaffold · PWA enabled · synthetic data · feature controls coming soon</span>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}


