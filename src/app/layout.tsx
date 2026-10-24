import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, CloudOff, GraduationCap, LayoutGrid, MapPin } from "lucide-react";
import "./globals.css";
import { PwaManager } from "./components/PwaManager";

export const viewport: Viewport = {
  themeColor: "#ba0c2f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "BuckeyeStudy · Better together",
  description: "Find your study group at Ohio State. A BuckeyeStudy hackathon scaffold.",
  applicationName: "BuckeyeStudy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BuckeyeStudy",
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
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ba0c2f" />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <PwaManager />
        <header className="site-header">
          <div className="site-width flex flex-wrap items-center justify-between gap-4 py-5">
            <Link href="/" className="flex items-center gap-3" aria-label="BuckeyeStudy home"><span className="brand-mark"><GraduationCap size={24} /></span><span className="text-xl font-bold tracking-tight">Buckeye<span className="text-red-800">Study</span></span></Link>
            <nav aria-label="Main navigation" className="flex items-center gap-5 sm:gap-7 text-sm font-medium">
              <Link href="/" className="nav-link"><LayoutGrid size={16} />Discover</Link>
              <Link href="/session/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" className="nav-link"><BookOpen size={16} />My session</Link>
              <Link href="/offline" className="nav-link text-stone-500 hover:text-red-800"><CloudOff size={15} />Offline vault</Link>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-stone-500"><MapPin size={14} />Columbus campus</span>
            </nav>
            <span className="demo-badge">Local demo <ArrowUpRight size={12} /></span>
          </div>
        </header>
        {children}
        <footer className="site-width flex flex-wrap items-center justify-between gap-3 py-7 text-xs text-stone-500 border-t border-stone-200 mt-12"><span>Made for little breakthroughs. Built for Buckeyes.</span><span>Hackathon scaffold · PWA enabled · synthetic data · feature controls coming soon</span></footer>
      </body>
    </html>
  );
}

