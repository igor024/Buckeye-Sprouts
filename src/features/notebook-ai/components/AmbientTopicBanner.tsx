"use client";

import { useState } from "react";
import { Compass, Users, ArrowUpRight, X, Sparkles } from "lucide-react";

interface AmbientTopicBannerProps {
  libraryName?: string;
  floorLevel?: string;
  currentTopic?: string;
}

export function AmbientTopicBanner({
  libraryName = "Thompson Library",
  floorLevel = "Floor 3",
  currentTopic = "Recursion",
}: AmbientTopicBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-3 mb-4 flex items-start justify-between gap-3 text-xs text-blue-950 shadow-2xs transition-all">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          <Compass size={15} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] text-blue-900 tracking-wide uppercase">
              Ambient Study Matching
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200/70 text-blue-900 font-mono">
              Floor Proximity
            </span>
          </div>

          <p className="text-[11px] text-blue-800/90 mt-0.5 leading-relaxed">
            {isSimulated ? (
              <>
                <strong>Table THO-3-W08</strong> (18 meters away) just added notes on <em>XMLTree & Recurrence Trees</em>. 1 open seat.
              </>
            ) : (
              <>
                Another Buckeye group at <strong>{libraryName} {floorLevel} (Table THO-3-W08)</strong> is also studying <strong>{currentTopic}</strong>!
              </>
            )}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsSimulated(!isSimulated)}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 hover:text-blue-900 cursor-pointer underline"
            >
              <Sparkles size={11} /> {isSimulated ? "Reset Ambient Sensor" : "Simulate Floor Discovery"}
            </button>
            <span className="text-[10px] text-blue-400">·</span>
            <span className="text-[10px] text-blue-600 font-medium">92% topic synergy</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="p-1 rounded text-blue-400 hover:text-blue-700 cursor-pointer"
        aria-label="Dismiss ambient banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
