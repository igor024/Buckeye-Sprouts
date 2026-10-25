# Buckeye Sprouts — Physical Table QR Code Architecture & Generation Guide

This guide describes the physical table QR anchors, live in-app camera scanner, routing into the main page's Join / My group tab, and printing QR codes for campus deployment.

---

## 1. System Overview & The Physical-to-Digital Bridge

Each physical library table has a deterministic QR anchor. Students can scan it with their phone's camera or with **Join > Scan QR Code** inside Buckeye Sprouts:

```text
Physical table QR sticker / live camera scanner
  -> /table/150b-1 (or /qr/150b-1)
  -> /?tab=join&table=150b-1
  -> Main page, Join tab, exact table selected
     -> Occupied: join automatically if a seat and any required invitation are available
     -> Empty: create a group with the table already locked in
```

Scanning selects a table and joins an eligible existing group without an extra confirmation. Full tables and missing invitations show an explanation instead. Successful joins use the existing check-in workflow, with a local fallback if the database is unavailable. The tab changes to **My group** while in a group and returns to **Join** after leaving.

---

## 2. URL Scheme Specification

Printed QR codes continue to use these URLs; existing stickers do not need to be regenerated:

| Environment | Primary URL | Shorthand Alias |
| :--- | :--- | :--- |
| **Production** | `https://<your-domain>/table/<tableId>` | `https://<your-domain>/qr/<tableId>` |
| **Local Development** | `http://localhost:3000/table/<tableId>` | `http://localhost:3000/qr/<tableId>` |

Both routes normalize registered table IDs case-insensitively and redirect to the main page. For example, `/qr/150B-1` and `/table/150b-1` both open `/?tab=join&table=150b-1`. Unknown table IDs show the site's not-found page.

The in-app scanner accepts these URL formats and legacy JSON such as `{"libraryName":"Thompson Library","tableId":"150b-1"}`. It extracts the registered table ID and stays on the current website, even when a sticker was generated for another deployment hostname. Unrecognized codes show an inline error and leave the scanner running.

---

## 3. How the User Experience Works

### A. Live Camera Scanner

1. Open the **Join** tab and click **Scan QR Code**.
2. Allow camera access. A live preview opens, preferring the rear camera on phones.
3. Point the camera at a table sticker. Once decoded, the camera stops and the main page joins that table's eligible group or opens its creation form.

Camera scanning requires **HTTPS or localhost**; a phone opening an ordinary HTTP LAN address cannot use the browser camera. Permission denial, unsupported browsers, and missing cameras show a useful error and a **Retry camera** button. Closing the dialog or changing tabs releases the camera, including when permission is still being requested. GPS permission is not required for QR scanning.

### B. Table Selection and Group Actions

- **Occupied table:** join automatically when eligible. A full table or missing invitation shows the group details and restriction. A rejected join shows an error with **Retry join**, without repeatedly submitting the request.
- **Empty table:** open the existing three-step creation form with the scanned table fixed. Students choose their group name, course, and invite-only setting before creating it.
- The table link parameters are removed after opening the dialog, so closing it does not immediately reopen it. Scanning another code opens the new table through the same flow.
- Group availability follows the current database-backed map data and its existing offline behavior.

### C. Judge-Friendly Simulation

The camera dialog also includes a **Demo table** selector and **Simulate Table QR Scan** button. The simulator uses the same routes and table-selection flow without needing a physical sticker or working camera. BuckID reader behavior is unchanged.

---

## 4. Instructions for Generating Table QR Codes

### Method 1: Using the Built-In Batch Generator (Recommended)

The repository includes a Node.js generation script that processes all 72 Thompson Library tables in one command:

```bash
# 1. Run generator with default local dev URL (http://localhost:3000)
node scripts/generate-table-qrs.mjs

# 2. Or run with your production domain
node scripts/generate-table-qrs.mjs --base-url=https://buckeyesprouts.osu.edu
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
