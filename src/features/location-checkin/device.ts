"use client";

import type { Coordinates, Unsubscribe } from "@/types/contracts";
import {
  DEPARTURE_THRESHOLD_METERS,
  haversineDistance,
  HYSTERESIS_CYCLES_REQUIRED,
  isOutsideDepartureBoundary,
  resolveLibraryGeofence,
} from "./haversine";

export interface GeofenceTelemetry {
  distanceMeters: number;
  isOutside: boolean;
  consecutiveCycles: number;
  currentCoord: Coordinates | null;
  accuracy: number | null;
  status: "idle" | "requesting" | "watching" | "permission_denied" | "unavailable";
  departureTriggered: boolean;
  lastUpdated: string;
}

export type GeofenceTelemetryCallback = (telemetry: GeofenceTelemetry) => void;

/**
 * Browser-only client helper that attaches to `navigator.geolocation.watchPosition`
 * and applies the Haversine formula + 2-cycle hysteresis filter.
 */
export function watchHostGeofenceClient(
  libraryName: string,
  onExit: () => void,
  onTelemetry?: GeofenceTelemetryCallback
): Unsubscribe {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    onTelemetry?.({
      distanceMeters: 0,
      isOutside: false,
      consecutiveCycles: 0,
      currentCoord: null,
      accuracy: null,
      status: "unavailable",
      departureTriggered: false,
      lastUpdated: new Date().toLocaleTimeString(),
    });
    return () => {};
  }

  const libraryGeofence = resolveLibraryGeofence(libraryName);
  let consecutiveCycles = 0;
  let departureTriggered = false;

  onTelemetry?.({
    distanceMeters: 0,
    isOutside: false,
    consecutiveCycles: 0,
    currentCoord: null,
    accuracy: null,
    status: "requesting",
    departureTriggered: false,
    lastUpdated: new Date().toLocaleTimeString(),
  });

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const currentCoord: Coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const distance = haversineDistance(currentCoord, libraryGeofence.center);
      const isOutside = isOutsideDepartureBoundary(distance, DEPARTURE_THRESHOLD_METERS);

      if (isOutside) {
        consecutiveCycles += 1;
      } else {
        consecutiveCycles = 0; // Hysteresis reset upon re-entering boundary
      }

      const shouldTriggerExit =
        isOutside && consecutiveCycles >= HYSTERESIS_CYCLES_REQUIRED && !departureTriggered;

      if (shouldTriggerExit) {
        departureTriggered = true;
        onExit();
      }

      onTelemetry?.({
        distanceMeters: distance,
        isOutside,
        consecutiveCycles,
        currentCoord,
        accuracy: Math.round(position.coords.accuracy),
        status: "watching",
        departureTriggered,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    },
    (error) => {
      console.warn("[GeofenceClient] Geolocation watch error:", error.message);
      onTelemetry?.({
        distanceMeters: 0,
        isOutside: false,
        consecutiveCycles: 0,
        currentCoord: null,
        accuracy: null,
        status: error.code === error.PERMISSION_DENIED ? "permission_denied" : "unavailable",
        departureTriggered: false,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

/**
 * Checks if the Web NFC API is supported on the current device (e.g. Chrome on Android).
 */
export function isWebNfcSupported(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

/**
 * Reads a Web NFC tag serial number if supported.
 */
export async function readWebNfcSerial(): Promise<{ serialNumber: string } | null> {
  if (!isWebNfcSupported()) return null;

  try {
    const NDEFReaderClass = (window as unknown as { NDEFReader: new () => { scan: () => Promise<void>; addEventListener: (event: string, handler: (e: { serialNumber?: string }) => void) => void } }).NDEFReader;
    const reader = new NDEFReaderClass();
    await reader.scan();
    return new Promise((resolve) => {
      reader.addEventListener("reading", (event: { serialNumber?: string }) => {
        resolve({ serialNumber: event.serialNumber || "NFC-TAG-UNKNOWN" });
      });
    });
  } catch (err) {
    console.warn("[NFC] Scan error or permission denied:", err);
    return null;
  }
}
