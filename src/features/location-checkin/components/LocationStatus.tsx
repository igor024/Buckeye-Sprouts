"use client";

import { useState } from "react";
import {
  Compass,
  Image as ImageIcon,
  LocateFixed,
  LockKeyhole,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { CheckInReceipt, SessionDetail } from "@/types/contracts";
import { CheckInScanner } from "./CheckInScanner";
import { GeofenceMonitor } from "./GeofenceMonitor";

interface LocationStatusProps {
  detail?: SessionDetail;
  checkIn?: CheckInReceipt | null;
}

export function LocationStatus({ detail, checkIn: initialCheckIn }: LocationStatusProps) {
  const [currentReceipt, setCurrentReceipt] = useState<CheckInReceipt | null>(
    initialCheckIn || null
  );

  const session = detail?.session;
  const location = detail?.location;
  const isLocked = detail?.access === "locked";
  const isHost = detail?.access === "host";

  return (
    <section className="panel" aria-labelledby="location-title">
      {/* Panel Heading */}
      <div className="panel-heading flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-red-800" />
          <h2 id="location-title" className="font-semibold text-base">
            Your spot on campus
          </h2>
        </div>
        {currentReceipt && (
          <span className="tag bg-emerald-100 text-emerald-800 font-semibold inline-flex items-center gap-1 text-[10px]">
            <ShieldCheck size={11} className="text-emerald-700" />
            <span>Table Verified</span>
          </span>
        )}
      </div>

      {/* Styled Campus Map Graphic */}
      <div className="map-placeholder mt-4">
        <div className="map-road map-road-one" />
        <div className="map-road map-road-two" />
        <span className="map-pin">
          <MapPin size={23} />
        </span>
        <span className="map-caption">OHIO STATE · COLUMBUS</span>
      </div>

      {/* Library Venue & Table Anchor Details */}
      <div className="mt-4 space-y-1">
        <h3 className="font-semibold text-sm text-stone-900">
          {session?.libraryName || "Thompson Library"}
        </h3>

        {!isLocked && location ? (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-700" />
              <span>
                Table Anchor: <strong className="font-mono text-red-900">{location.tableId}</strong>
              </span>
            </p>
            <p className="text-xs text-stone-600">
              {session?.floor || "Floor 3 - Quiet Stacks"} {session?.zone ? `· ${session.zone}` : ""}
            </p>
          </div>
        ) : (
          <p className="text-xs text-stone-500 leading-relaxed">
            Exact table anchor (<span className="blur-xs select-none font-mono">TH-304-B</span>) stays private until the host approves your seat.
          </p>
        )}
      </div>

      {/* Surroundings Photo Preview (When unlocked) */}
      {!isLocked && location?.surroundingsPhotoUrl && (
        <div className="mt-3 p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs">
          <div className="flex items-center gap-2 text-stone-700 mb-1.5 font-medium">
            <ImageIcon size={14} className="text-red-800" />
            <span>Surroundings Landmark Photo</span>
          </div>
          <img
            src={location.surroundingsPhotoUrl}
            alt="Table surroundings and crowd landmarks"
            className="w-full h-32 object-cover rounded-lg border border-stone-200"
          />
        </div>
      )}

      {/* Device Check-In Scanner (Table QR & BuckID 1D Barcode) */}
      {session && (
        <div className="mt-4 pt-4 border-t border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
              <QrCode size={14} className="text-red-800" />
              <span>Physical Presence Check-In</span>
            </span>
          </div>

          <CheckInScanner
            sessionId={session.id}
            libraryName={session.libraryName}
            existingCheckIn={currentReceipt}
            onCheckInSuccess={(receipt) => setCurrentReceipt(receipt)}
            onCheckOutSuccess={() => setCurrentReceipt(null)}
          />
        </div>
      )}

      {/* Geofence Departure Monitoring & Automated Checkout */}
      {session && (
        <div className="mt-4">
          <GeofenceMonitor
            sessionId={session.id}
            libraryName={session.libraryName}
            isHost={isHost}
            sessionStatus={session.status}
            onSessionClosed={() => setCurrentReceipt(null)}
          />
        </div>
      )}
    </section>
  );
}
