import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, GraduationCap, LayoutGrid, MapPin } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuckeyeStudy · Better together",
  description: "Find your study group at Ohio State. A BuckeyeStudy hackathon scaffold.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <div className="site-width flex flex-wrap items-center justify-between gap-4 py-5">
            <Link href="/" className="flex items-center gap-3" aria-label="BuckeyeStudy home"><span className="brand-mark"><GraduationCap size={24} /></span><span className="text-xl font-bold tracking-tight">Buckeye<span className="text-red-800">Study</span></span></Link>
            <nav aria-label="Main navigation" className="flex items-center gap-5 sm:gap-7 text-sm font-medium">
              <Link href="/" className="nav-link"><LayoutGrid size={16} />Discover</Link>
              <Link href="/session/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" className="nav-link"><BookOpen size={16} />My session</Link>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-stone-500"><MapPin size={14} />Columbus campus</span>
            </nav>
            <span className="demo-badge">Local demo <ArrowUpRight size={12} /></span>
          </div>
        </header>
        {children}
        <footer className="site-width flex flex-wrap items-center justify-between gap-3 py-7 text-xs text-stone-500 border-t border-stone-200 mt-12"><span>Made for little breakthroughs. Built for Buckeyes.</span><span>Hackathon scaffold · synthetic data · feature controls coming soon</span></footer>
      </body>
    </html>
  );
}
