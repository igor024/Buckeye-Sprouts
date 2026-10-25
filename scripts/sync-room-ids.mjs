#!/usr/bin/env node

/**
 * Buckeye Sprouts Startup Room IDs Synchronizer
 * 
 * Reads table/room IDs from data/room_ids.csv and synchronizes them to:
 * 1. public.library_geofences (column room_ids on Thompson Library entry)
 * 2. public.room_ids (table containing each individual room entry)
 * 3. public.app_metadata (key 'room_ids' entry with JSON array)
 * 
 * Runs automatically on startup (npm run dev, npm run start, or Next.js instrumentation).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Manually load .env.local if environment variables are not already present
function loadEnv() {
  const envPath = path.join(rootDir, ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnv();

// 2. Parse room_ids.csv
export function getRoomIdsFromCsv() {
  const possiblePaths = [
    path.join(rootDir, "data", "room_ids.csv"),
    path.join(rootDir, "public", "data", "room_ids.csv"),
  ];

  let csvPath = possiblePaths.find((p) => fs.existsSync(p));
  if (!csvPath) {
    console.warn("[RoomSync] No room_ids.csv found at data/room_ids.csv");
    return [];
  }

  const fileContent = fs.readFileSync(csvPath, "utf8");
  const lines = fileContent.split(/\r?\n/);
  const ids = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // Skip CSV header
    if (line.toLowerCase() === "id" || line.toLowerCase() === "room_id" || line.toLowerCase() === "table_id") {
      continue;
    }
    // Take the first column if comma-separated
    const id = line.split(",")[0].trim();
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  }

  return ids;
}

export async function syncRoomIdsToDatabase() {
  const ids = getRoomIdsFromCsv();
  if (ids.length === 0) {
    console.warn("[RoomSync] 0 IDs found in room_ids.csv. Skipping database sync.");
    return { synced: 0 };
  }

  const connString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;

  if (!connString) {
    console.log(`[RoomSync] No database connection string found in environment. ${ids.length} room IDs available locally.`);
    return { synced: ids.length, offline: true };
  }

  // Remove conflicting sslmode query parameter if present so rejectUnauthorized: false takes precedence cleanly
  const cleanConnString = connString.replace(/[?&]sslmode=[^&]+/g, "");
  const client = new pg.Client({
    connectionString: cleanConnString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    // 1. Ensure table public.room_ids exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.room_ids (
        id text PRIMARY KEY,
        library_name text NOT NULL DEFAULT 'Thompson Library',
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 2. Ensure column room_ids exists on public.library_geofences
    await client.query(`
      ALTER TABLE public.library_geofences
      ADD COLUMN IF NOT EXISTS room_ids text[] DEFAULT '{}';
    `);

    // 3. Ensure table public.app_metadata exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.app_metadata (
        key text PRIMARY KEY,
        value jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 4. Update the library_geofences entry for Thompson Library
    await client.query(
      `
      UPDATE public.library_geofences
      SET room_ids = $1
      WHERE library_name = 'Thompson Library';
    `,
      [ids]
    );

    // 5. Upsert each room_id into public.room_ids
    for (const id of ids) {
      await client.query(
        `
        INSERT INTO public.room_ids (id, library_name)
        VALUES ($1, 'Thompson Library')
        ON CONFLICT (id) DO NOTHING;
      `,
        [id]
      );
    }

    // 6. Update app_metadata for 'room_ids'
    await client.query(
      `
      INSERT INTO public.app_metadata (key, value, updated_at)
      VALUES ('room_ids', $1::jsonb, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
    `,
      [JSON.stringify(ids)]
    );

    console.log(`[RoomSync] Successfully synced ${ids.length} room IDs to database:`);
    console.log(`  - public.library_geofences (entry 'Thompson Library' -> room_ids: ${ids.length} items)`);
    console.log(`  - public.room_ids (${ids.length} rows inserted/verified)`);
    console.log(`  - public.app_metadata (entry 'room_ids' updated)`);

    return { synced: ids.length, success: true };
  } catch (err) {
    console.warn("[RoomSync] Database sync warning (non-fatal):", err instanceof Error ? err.message : err);
    return { synced: ids.length, error: err };
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

// Direct execution from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncRoomIdsToDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[RoomSync] Fatal error:", err);
      process.exit(0); // Exit 0 to avoid breaking dev/build pipelines
    });
}
