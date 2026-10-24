# BuckeyeStudy — Physical Table QR Code Architecture & Generation Guide

This guide describes how the physical table QR code anchoring system works in **BuckeyeStudy**, how it automatically routes students into study groups, prompts sign-in, enables 1-click group creation when tables are empty, and how to print/generate QR code anchors for campus deployment.

---

## 1. System Overview & The Physical-to-Digital Bridge

Instead of forcing students to open a browser, search through a crowded list, or reserve empty rooms hours in advance, BuckeyeStudy anchors each physical library table with a deterministic QR code:

```
[ Physical Table QR Sticker ]
            │ (Phone Camera Scan)
            ▼
   https://<domain>/table/150b-1  (Skips Main Screen)
            │
            ├─► User NOT signed in?
            │     └─► Prompt Ohio State Sign-In (or 1-Click Demo Login)
            │
            ▼ (Authenticated)
   Does an active study group exist at this table?
            │
            ├─► YES (e.g. Table 150b-1 is busy):
            │     └─► Auto-redirect directly into `/session/[id]`!
            │
            └─► NO (e.g. Table 150a-1 is open):
                  └─► Prompt Study Group Creation with location PRE-FILLED!
                        • Library: Thompson Library
                        • Table ID: 150a-1 (Auto-Anchored)
                        • Floor: Floor 1
                        • Room/Area: Room 150A (Table 1)
```

---

## 2. URL Scheme Specification

Every physical QR code sticker must be encoded with a URL following this pattern:

| Environment | Primary URL | Shorthand Alias |
| :--- | :--- | :--- |
| **Production** | `https://<your-domain>/table/<tableId>` | `https://<your-domain>/qr/<tableId>` |
| **Local Development** | `http://localhost:3000/table/<tableId>` | `http://localhost:3000/qr/<tableId>` |

### Examples:
- Table 1 in Room 150B: `https://buckeyestudy.osu.edu/table/150b-1`
- Table 4 in Room 110: `https://buckeyestudy.osu.edu/table/110-4`
- Table 12 in Room 140: `https://buckeyestudy.osu.edu/table/140-12`

> **Note:** The route automatically parses and sanitizes IDs (case-insensitive) and resolves aliases (e.g. `/qr/150b-1` redirects seamlessly to `/table/150b-1`).

---

## 3. How the User Experience Works

### A. Instant Routing (Skips the Main Screen)
When a student scans the QR code at the table, their mobile camera immediately opens `/table/[tableId]`. The app does not load the general dashboard or study session directory.

### B. Authentication Gate
- If the user is unauthenticated:
  - Displays the table header badge: `THOMPSON LIBRARY • TABLE 150B-1`.
  - Prompts: **"Sign in to Join Table 150b-1"**.
  - Supports standard Ohio State student login / registration.
  - Features an **Instant 1-Click Demo Login** bar (`Alex Morgan` / `Jordan Lee`) so hackathon judges and evaluators can verify the entire workflow in seconds without creating credentials.
  - Once signed in, the session seamlessly proceeds without redirecting away from the table.

### C. Automatic Group Routing vs. Pre-Filled Creation
- **Occupied Table (Active Group Found):**
  - Displays the active course code (e.g., `CSE 2221`), topic title, host name, and seat count.
  - Automatically routes the student into `/session/[sessionId]` within 2 seconds.
- **Open / Empty Table (No Active Group):**
  - Shows: **"Table 150a-1 is Available • Ready to Host"**.
  - Displays the creation form with all location data **automatically locked and pre-filled**:
    - **Venue:** `Thompson Library`
    - **Table ID:** `150a-1`
    - **Floor:** `Floor 1`
    - **Zone:** `Room 150A (Table 1)`
  - The student simply taps their course code (`CSE 2221`, `MATH 1151`, etc.), sets available seats, and clicks **"Launch Study Group at Table 150a-1"**.
  - On submission, the table is locked in the database and the student is immediately routed to their new live session!

---

## 4. Instructions for Generating Table QR Codes

### Method 1: Using the Built-In Batch Generator (Recommended)

The repository includes a Node.js generation script that processes all 72 Thompson Library tables in one command:

```bash
# 1. Run generator with default local dev URL (http://localhost:3000)
node scripts/generate-table-qrs.mjs

# 2. Or run with your production domain
node scripts/generate-table-qrs.mjs --base-url=https://buckeyestudy.osu.edu
```

#### Generated Outputs:
1. **Interactive Printable Cards:**
   - Saved to: [`public/qr-codes/printable-cards.html`](file:///c:/Users/harry/Documents/Github/hackohio2026/public/qr-codes/printable-cards.html)
   - Open this file in Google Chrome, Edge, or Safari.
   - Click the **"🖨️ Print All Cards / Save as PDF"** button.
   - Built-in `@media print` CSS formats each card cleanly with Ohio State Scarlet borders, table IDs, room descriptions, and high-contrast QR codes.
2. **Machine-Readable Manifest:**
   - Saved to: `public/qr-codes/manifest.json`
   - Contains table metadata, target URLs, and direct image links for custom automation.

---

### Method 2: Manual / External QR Code Generators

If generating stickers via Canva, Avery Label Maker, or university print shop software:

1. **Target Content:** Set the QR payload to standard URL format:
   ```text
   https://<your-domain>/table/<tableId>
   ```
2. **Format Settings:**
   - **Error Correction Level:** `Medium (M)` or `High (Q)` (ensures readability even if the sticker gets scratched or worn).
   - **Quiet Zone (Margin):** At least 4 modules of white space around the QR matrix.
   - **Colors:** Deep Scarlet (`#BA0C2F`) or Black (`#000000`) on pure White (`#FFFFFF`).

---

## 5. Physical Deployment & Printing Specifications

| Specification | Recommendation | Reason |
| :--- | :--- | :--- |
| **Material** | Matte Vinyl or Polycarbonate Sticker | Eliminates harsh fluorescent glare from library ceiling lights. |
| **Dimensions** | 2.5 in × 2.5 in (6.35 cm × 6.35 cm) | Easily readable by smartphone cameras from a normal sitting distance (12–18 inches). |
| **Placement** | Center-right corner of table | Does not interfere with laptops or open textbooks; clearly visible upon arrival. |
| **Alternative** | Double-sided Acrylic Table Tents | Ideal for temporary setups or exam weeks without adhering stickers to wood surfaces. |

---

## 6. Thompson Library Room & Table ID Reference

The following table IDs are registered in `data/room_ids.csv` and synced to the database:

| Room / Zone | Floor | Table IDs Included | Count |
| :--- | :--- | :--- | :--- |
| **Room 150B** | Floor 1 | `150b-1`, `150b-2` | 2 |
| **Room 150A** | Floor 1 | `150a-1`, `150a-2`, `150a-3`, `150a-4`, `150a-5`, `150a-6` | 6 |
| **Room 110** | Floor 1 | `110-1`, `110-2`, `110-3`, `110-4` | 4 |
| **Room 140** | Floor 1 | `140-1` through `140-16` | 16 |
| **Room 145** | Floor 1 | `145-1` through `145-16` | 16 |
| **Room 165** | Floor 1 | `165-1` through `165-10` | 10 |
| **Room 160** | Floor 1 | `160-1` through `160-10` | 10 |
| **Room 105** | Floor 1 | `105-1` through `105-8` | 8 |
| **Total** | | | **72 Tables** |

---

## 7. API Reference

### Table Lookup Endpoint:
```http
GET /api/tables/:tableId?library=Thompson%20Library
```

#### Sample Response (Occupied Table):
```json
{
  "tableId": "150b-1",
  "location": {
    "tableId": "150b-1",
    "libraryName": "Thompson Library",
    "floor": "Floor 1",
    "zone": "Room 150B (Table 1)",
    "coordinates": { "lat": 40.0001, "lng": -83.0146 },
    "isValid": true
  },
  "hasActiveSession": true,
  "sessionId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "hostName": "Alex Morgan",
  "session": {
    "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "title": "Let's untangle recursion",
    "courseCode": "CSE 2221",
    "availableSeats": 3,
    "totalSeats": 5,
    "status": "active"
  }
}
```

#### Sample Response (Open Table):
```json
{
  "tableId": "150a-1",
  "location": {
    "tableId": "150a-1",
    "libraryName": "Thompson Library",
    "floor": "Floor 1",
    "zone": "Room 150A (Table 1)",
    "coordinates": { "lat": 40.0001, "lng": -83.0146 },
    "isValid": true
  },
  "hasActiveSession": false,
  "sessionId": null,
  "hostName": null,
  "session": null
}
```
