#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
// Reuse the startup script's .env.local loading without executing its room sync.
import "./sync-room-ids.mjs";

export async function ensureEthanGroup(client) {
  await client.query("BEGIN");
  try {
    await client.query(readFileSync(new URL("./ensure-ethan-group.sql", import.meta.url), "utf8"));
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function syncEthanGroup() {
  if (process.env.BUCKEYESPROUTS_DEMO_MODE === "true") {
    console.log("[EthanGroup] Mock demo mode; database reset skipped.");
    return;
  }
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("Set POSTGRES_URL_NON_POOLING or POSTGRES_URL to reset table 110-1 at startup.");
    }
    console.log("[EthanGroup] No database configured; using offline demo mode.");
    return;
  }
  const connectionUrl = new URL(connectionString);
  const useSsl = connectionUrl.searchParams.get("sslmode") !== "disable"
    && !["localhost", "127.0.0.1", "::1", "[::1]"].includes(connectionUrl.hostname);
  connectionUrl.searchParams.delete("sslmode");
  const client = new pg.Client({
    connectionString: connectionUrl.toString(),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
  });
  try {
    await client.connect();
    await ensureEthanGroup(client);
    console.log("[EthanGroup] Table 110-1 now has Ethan Dong as its host and only member.");
  } finally {
    await client.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncEthanGroup().catch((error) => {
    // Do not print connection strings or SQL values from database error objects.
    console.error("[EthanGroup] Startup reset failed:",
      error instanceof Error && error.message.trim()
        ? error.message
        : "Could not reach the database. Check the PostgreSQL connection and network access.");
    process.exitCode = 1;
  });
}
