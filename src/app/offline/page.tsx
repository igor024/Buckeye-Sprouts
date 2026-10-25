import Link from "next/link";
import { ArrowLeft, BookOpen, CloudOff, RefreshCw, ShieldCheck, WifiOff } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline Vault · Buckeye Sprouts",
  description: "Offline study tools and cached sessions for Ohio State students.",
};

export default function OfflinePage() {
  return (
    <main id="main" className="site-width pt-9 sm:pt-12 pb-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-red-800 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Buckeye Sprouts Dashboard
          </Link>
        </div>

        <div className="panel border-amber-200 bg-amber-50/40 p-8 sm:p-10 mb-8 rounded-2xl">
          <div className="flex items-center gap-3 text-amber-800 mb-3">
            <span className="p-2.5 rounded-xl bg-amber-100 text-amber-800 inline-flex">
              <WifiOff size={22} />
            </span>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700">
                PWA Offline Mode
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 mt-0.5">
                Deep in the library stacks?
              </h1>
            </div>
          </div>

          <p className="text-sm text-stone-600 leading-relaxed mt-4">
            Wi-Fi drops happen frequently in Thompson Library&apos;s quiet stacks and the 18th Avenue basement.
            Buckeye Sprouts is installed as a Progressive Web App, so your recent sessions and offline tools stay accessible right here.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-stone-700 font-semibold text-xs mb-1">
                <ShieldCheck size={16} className="text-red-800" /> Offline BuckID Pass
              </div>
              <p className="text-[11px] text-stone-500 leading-normal">
                Barcode access cache for library turnstiles and table verify.
              </p>
              <div className="mt-3 p-2.5 bg-stone-50 rounded border border-stone-200 text-center">
                <div className="text-[9px] font-mono text-stone-400 tracking-widest uppercase mb-1">
                  Offline Library ID Pass
                </div>
                <div className="h-8 bg-stone-800 rounded-xs flex items-center justify-around px-2 text-white font-mono text-[9px] tracking-wider select-none">
                  || | ||| | || |||| | ||| || ||
                </div>
                <div className="text-[10px] font-mono text-stone-600 mt-1">
                  OSU-STUDENT-PASS
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-stone-700 font-semibold text-xs mb-1">
                <BookOpen size={16} className="text-red-800" /> Local Scratchpad
              </div>
              <p className="text-[11px] text-stone-500 leading-normal">
                Keep writing study notes. Edits persist locally in your browser storage.
              </p>
              <div className="mt-3">
                <textarea
                  className="w-full h-16 text-xs p-2 rounded border border-stone-200 bg-stone-50/50 font-mono text-stone-700 resize-none focus:outline-none focus:border-red-800"
                  placeholder="Type offline notes here... (persisted locally)"
                  defaultValue="* Offline notes from Thompson Floor 3 *&#10;- Reviewed CSE 2221 recursion contract"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="button-primary px-5 py-2.5 text-xs font-semibold"
            >
              <RefreshCw size={14} /> Retry Connection
            </Link>
            <span className="text-xs text-stone-500 flex items-center gap-1.5">
              <CloudOff size={13} /> Buckeye Sprouts will automatically sync when you reconnect to eduroam
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-stone-200 bg-white">
          <h2 className="text-sm font-semibold text-stone-800 mb-2">
            Why is Buckeye Sprouts available offline?
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Buckeye Sprouts uses standard Service Worker caching, Web App Manifest declarations, and local state buffers to ensure zero disruption during study sessions across all 15 Ohio State University libraries.
          </p>
        </div>
      </div>
    </main>
  );
}
