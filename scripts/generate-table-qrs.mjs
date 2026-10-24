#!/usr/bin/env node

/**
 * BuckeyeStudy / Buckeye Sprouts Table QR Code Generator
 * 
 * Generates ready-to-print physical QR anchors for all 72 Thompson Library tables.
 * 
 * Usage:
 *   node scripts/generate-table-qrs.mjs [--base-url=https://your-domain.com]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Parse CLI arguments
const args = process.argv.slice(2);
let baseUrl = "http://localhost:3000";

for (const arg of args) {
  if (arg.startsWith("--base-url=")) {
    baseUrl = arg.split("=")[1].replace(/\/+$/, "");
  }
}

// 2. Read room_ids.csv
const csvPath = path.join(rootDir, "data", "room_ids.csv");
if (!fs.existsSync(csvPath)) {
  console.error("Error: data/room_ids.csv not found.");
  process.exit(1);
}

const lines = fs.readFileSync(csvPath, "utf8").split(/\r?\n/);
const tableIds = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.toLowerCase() === "id") continue;
  const id = trimmed.split(",")[0].trim();
  if (id && !tableIds.includes(id)) {
    tableIds.push(id);
  }
}

console.log(`Loaded ${tableIds.length} tables from data/room_ids.csv.`);

// 3. Ensure output directory exists
const outDir = path.join(rootDir, "public", "qr-codes");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 4. Generate JSON manifest
const manifest = tableIds.map((id) => {
  const match = id.match(/^(\d+)([a-zA-Z]?)-(\d+)$/);
  const room = match ? `Room ${match[1]}${match[2] ? match[2].toUpperCase() : ""}` : "Room";
  const table = match ? `Table ${match[3]}` : id;
  const targetUrl = `${baseUrl}/table/${encodeURIComponent(id)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(targetUrl)}`;

  return {
    tableId: id,
    library: "Thompson Library",
    floor: "Floor 1",
    room,
    table,
    targetUrl,
    qrImageUrl,
  };
});

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

// 5. Generate high-resolution printable HTML cards
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Thompson Library • Physical Table QR Code Anchors</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #f4f3ef;
      color: #282724;
      padding: 24px;
    }
    .header {
      max-width: 1200px;
      margin: 0 auto 24px auto;
      background: white;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #e2ded5;
    }
    .header h1 {
      font-size: 24px;
      color: #ba0c2f;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header p {
      color: #57534e;
      font-size: 14px;
      margin-top: 6px;
    }
    .print-button {
      margin-top: 14px;
      background: #ba0c2f;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: white;
      border: 2px solid #ba0c2f;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      page-break-inside: avoid;
      position: relative;
    }
    .badge-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .tag {
      background: #fdf2f2;
      color: #ba0c2f;
      border: 1px solid #fed7d7;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .floor-tag {
      background: #f5f5f4;
      color: #57534e;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
    }
    .table-id {
      font-size: 26px;
      font-weight: 800;
      color: #1c1917;
      letter-spacing: -0.02em;
    }
    .room-name {
      font-size: 13px;
      color: #78716c;
      margin-top: 2px;
      margin-bottom: 14px;
      font-weight: 500;
    }
    .qr-frame {
      background: #ffffff;
      border: 2px solid #e7e5e4;
      border-radius: 12px;
      padding: 10px;
      display: inline-block;
      margin-bottom: 12px;
    }
    .qr-frame img {
      display: block;
      width: 180px;
      height: 180px;
    }
    .instructions {
      font-size: 11px;
      color: #44403c;
      font-weight: 600;
      line-height: 1.4;
    }
    .subtext {
      font-size: 9px;
      color: #a8a29e;
      margin-top: 6px;
      word-break: break-all;
    }
    @media print {
      body { background: white; padding: 0; }
      .header, .print-button { display: none; }
      .grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        max-width: 100%;
      }
      .card {
        box-shadow: none;
        border: 2px dashed #ba0c2f;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>BuckeyeStudy • Thompson Library QR Anchors</h1>
    <p>Contains all <strong>${tableIds.length} tables</strong>. Base URL: <code>${baseUrl}</code></p>
    <p>Each card is pre-configured to route directly to the active study session, or prompt instant creation if the table is open.</p>
    <button class="print-button" onclick="window.print()">🖨️ Print All Cards / Save as PDF</button>
  </div>

  <div class="grid">
    ${manifest
      .map(
        (m) => `
    <div class="card">
      <div class="badge-bar">
        <span class="tag">Thompson Library</span>
        <span class="floor-tag">${m.floor}</span>
      </div>
      <div class="table-id">Table ${m.tableId}</div>
      <div class="room-name">${m.room} • ${m.table}</div>
      <div class="qr-frame">
        <img src="${m.qrImageUrl}" alt="QR code for Table ${m.tableId}" loading="lazy" />
      </div>
      <div class="instructions">
        Scan with your phone camera to join the group or start a study session here.
      </div>
      <div class="subtext">${m.targetUrl}</div>
    </div>`
      )
      .join("\n")}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "printable-cards.html"), htmlContent);

console.log("Successfully generated:");
console.log(`  - Manifest: public/qr-codes/manifest.json`);
console.log(`  - Printable Cards: public/qr-codes/printable-cards.html`);
console.log("\nOpen public/qr-codes/printable-cards.html in your browser to view or print the cards!");
