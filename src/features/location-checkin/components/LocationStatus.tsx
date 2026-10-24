import { Image, LocateFixed, LockKeyhole, MapPin, ScanLine } from "lucide-react";
import type { CheckInReceipt, SessionDetail } from "@/types/contracts";

export function LocationStatus({ detail, checkIn }: { detail?: SessionDetail; checkIn?: CheckInReceipt | null }) {
  return (
    <section className="panel" aria-labelledby="location-title">
      <div className="panel-heading"><MapPin size={18} /><h2 id="location-title">Your spot on campus</h2></div>
      <div className="map-placeholder mt-5"><div className="map-road map-road-one" /><div className="map-road map-road-two" /><span className="map-pin"><MapPin size={23} /></span><span className="map-caption">OHIO STATE · COLUMBUS</span></div>
      <h3 className="font-semibold text-sm mt-4">{detail?.session.libraryName || "Meet at the library"}</h3>
      <p className="muted mt-2">{detail?.location ? `Table ${detail.location.tableId} · ${detail.session.floor}` : "Your exact table stays private until the host approves you."}</p>
      {detail?.location && <div className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 p-3 mt-4 text-xs text-stone-500"><Image size={16} aria-hidden="true" />Surroundings photo preview · coming soon</div>}
      <div className="notice mt-4">{detail?.location ? <LocateFixed size={17} className="shrink-0" /> : <LockKeyhole size={17} className="shrink-0" />}<p>{checkIn ? "Demo check-in on file. GPS monitoring is not running." : "QR, BuckID, and location check-in are coming soon."}</p></div>
      <button className="button-secondary mt-4 w-full" disabled><ScanLine size={16} />Scan to check in</button>
      <p className="stub-note">Device permissions and automatic checkout are not active.</p>
    </section>
  );
}
