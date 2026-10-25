"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseTableQrPayload } from "@/lib/table-qr";
import { THOMPSON_EAST_ENTRANCE_TABLES } from "@/types/contracts";
import { runQrCamera } from "../qr-camera";
import "./table-qr-camera.css";

function cameraErrorMessage(error: unknown): string {
  const message = String(error);
  if (/NotAllowed|Permission|denied/i.test(message)) {
    return "Camera permission was denied. Allow camera access in your browser settings, then retry.";
  }
  if (/NotFound|DevicesNotFound|no camera/i.test(message)) {
    return "No camera was found. Connect a camera and retry, or use the simulator below.";
  }
  return "Could not start the camera. Close other apps using it and retry, or use the simulator below.";
}

export function TableQrCamera() {
  const router = useRouter();
  const id = `table-qr-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const viewport = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Requesting camera access…");
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [simulationTable, setSimulationTable] = useState(THOMPSON_EAST_ENTRANCE_TABLES[0].id);
  const [simulating, setSimulating] = useState(false);
  const readerRef = useRef<ReturnType<typeof runQrCamera> | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    setError(null);
    setInvalid(false);
    setStatus("Requesting camera access…");
    if (!window.isSecureContext) {
      setError("Camera scanning requires HTTPS or localhost. Open the secure site, or use the simulator below.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot access a camera. Try a browser with camera support, or use the simulator below.");
      return;
    }

    const container = viewport.current;
    const reader = runQrCamera(async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } = await import("html5-qrcode");
      let scanner: InstanceType<typeof Html5Qrcode> | null = null;
      return {
        async start(onDecode) {
          scanner = new Html5Qrcode(id, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          });
          await scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: (width, height) => {
              // A permission prompt can finish after the dialog is detached.
              const size = Math.max(50, Math.min(220, Math.floor(Math.min(width, height) * 0.75)));
              return { width: size, height: size };
            } },
            onDecode,
            () => {},
          );
          // The library resolves before playback. Finish playback startup before
          // releasing a stream granted after the dialog has already closed.
          const video = container?.querySelector("video");
          if (video) await video.play();
        },
        async stop() {
          try {
            const state = scanner?.getState();
            if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
              await scanner?.stop();
            }
          } finally {
            // Also release tracks if decoding startup or the library's DOM cleanup fails.
            container?.querySelectorAll("video").forEach((video) => {
              const stream = video.srcObject;
              if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
            });
          }
        },
        clear() { scanner?.clear(); },
      };
    }, {
      parse: parseTableQrPayload,
      onReady: () => setStatus("Point your camera at a table QR code."),
      onInvalid: () => setInvalid(true),
      onError: (cause) => { setError(cameraErrorMessage(cause)); setStatus(""); },
      onScan: (tableId) => {
        setStatus("Table found. Opening your group…");
        router.push(`/table/${encodeURIComponent(tableId)}`);
      },
    });
    readerRef.current = reader;
    return () => {
      readerRef.current = null;
      void reader.stop().catch(() => {});
    };
  }, [attempt, id, router]);

  return <div className="table-qr-camera">
    <div ref={viewport} id={id} className="table-qr-viewport" aria-label="Live table QR camera preview" />
    {!error && <p role="status">{status}</p>}
    {invalid && !error && <p role="status" className="table-qr-error">That code is not a registered Thompson table. Scan a table QR sticker to continue.</p>}
    {error && <>
      <p role="alert" className="table-qr-error">{error}</p>
      <button type="button" className="reader-secondary" onClick={() => setAttempt((value) => value + 1)}>Retry camera</button>
    </>}
    <div className="table-qr-simulator" aria-label="QR demo simulator">
      <label>Demo table
        <select value={simulationTable} onChange={(event) => setSimulationTable(event.target.value)}>
          {THOMPSON_EAST_ENTRANCE_TABLES.map((table) => <option key={table.id} value={table.id}>{table.label}</option>)}
        </select>
      </label>
      <button type="button" className="reader-primary" disabled={simulating} onClick={async () => {
        setSimulating(true);
        try {
          await readerRef.current?.stop();
          if (mounted.current) router.push(`/table/${encodeURIComponent(simulationTable)}`);
        } catch (cause) {
          if (mounted.current) { setError(cameraErrorMessage(cause)); setSimulating(false); }
        }
      }}>Simulate Table QR Scan</button>
    </div>
  </div>;
}
