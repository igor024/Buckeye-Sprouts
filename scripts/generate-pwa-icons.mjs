import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const iconsDir = path.join(root, "public", "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, isMaskable = false) {
  // Generate RGBA buffer
  const stride = width * 4;
  const rawData = Buffer.alloc(height * (stride + 1));

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.44;
  const cornerRadius = width * 0.22;

  // Colors
  // Scarlet: #ba0c2f => 186, 12, 47
  // Light Scarlet: #d11238 => 209, 18, 56
  // Ohio Gray: #666666 => 102, 102, 102
  // White: #ffffff => 255, 255, 255
  // Warm off-white: #faf8f5 => 250, 248, 245
  // Gold accent: #e5a823 => 229, 168, 35

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter byte 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 0, g = 0, b = 0, a = 0;

      if (isMaskable) {
        // Full bleed background for maskable
        // Radial subtle gradient from scarlet to deep scarlet
        const t = Math.min(dist / (width * 0.7), 1);
        r = Math.round(186 * (1 - t * 0.25));
        g = Math.round(12 * (1 - t * 0.25));
        b = Math.round(47 * (1 - t * 0.25));
        a = 255;
      } else {
        // Rounded square / squircle with smooth edge
        // Calculate rounded rectangle distance
        const ax = Math.abs(dx);
        const ay = Math.abs(dy);
        const rectW = width * 0.44;
        const rectH = height * 0.44;
        const cr = cornerRadius;

        let inside = false;
        let edgeDist = 0;

        if (ax <= rectW - cr && ay <= rectH) {
          inside = true;
          edgeDist = rectH - ay;
        } else if (ay <= rectH - cr && ax <= rectW) {
          inside = true;
          edgeDist = rectW - ax;
        } else if (ax > rectW - cr && ay > rectH - cr) {
          const cornerDx = ax - (rectW - cr);
          const cornerDy = ay - (rectH - cr);
          const cornerDist = Math.sqrt(cornerDx * cornerDx + cornerDy * cornerDy);
          if (cornerDist <= cr) {
            inside = true;
            edgeDist = cr - cornerDist;
          }
        }

        if (inside) {
          const alphaFade = Math.min(Math.max(edgeDist, 0), 1.5) / 1.5;
          const t = Math.min(dist / (width * 0.6), 1);
          r = Math.round(186 * (1 - t * 0.2));
          g = Math.round(12 * (1 - t * 0.2));
          b = Math.round(47 * (1 - t * 0.2));
          a = Math.round(255 * alphaFade);
        }
      }

      // Draw inside badge: Graduation cap and book icon
      // Normalized coordinates from -1 to 1 relative to icon center
      const nx = dx / (width * 0.35);
      const ny = dy / (height * 0.35);

      // 1. Graduation Cap Top Diamond:
      // Diamond vertices: (0, -0.65), (0.75, -0.38), (0, -0.12), (-0.75, -0.38)
      // Check if point is inside diamond: |nx / 0.75| + |(ny + 0.38) / 0.26| <= 1
      const diamondVal = Math.abs(nx / 0.78) + Math.abs((ny + 0.36) / 0.24);
      if (diamondVal <= 1.0) {
        r = 255;
        g = 255;
        b = 255;
        a = 255;
      }

      // 2. Cap Base / skullcap:
      // Arc between x in [-0.42, 0.42], y between [-0.34, -0.16]
      if (Math.abs(nx) <= 0.42 && ny >= -0.34 && ny <= -0.16) {
        // Curve downward
        const curveBottom = -0.16 - (0.42 * 0.42 - nx * nx) * 0.3;
        if (ny <= curveBottom) {
          r = 240;
          g = 240;
          b = 240;
          a = 255;
        }
      }

      // 3. Tassel string and dot:
      // Tassel runs from (0, -0.36) to (-0.58, -0.05)
      const tasselDist = Math.abs(nx * 0.45 - (ny + 0.36) * (-0.7));
      if (tasselDist < 0.05 && nx <= 0.02 && nx >= -0.62 && ny >= -0.38 && ny <= -0.05) {
        r = 242;
        g = 196;
        b = 78; // Gold tassel
        a = 255;
      }
      // Tassel dot/drop
      const tdx = nx - (-0.60);
      const tdy = ny - (-0.05);
      if (Math.sqrt(tdx * tdx + tdy * tdy) < 0.08) {
        r = 242;
        g = 196;
        b = 78;
        a = 255;
      }

      // 4. Open Book at bottom:
      // Book spans ny from 0.05 to 0.58, nx from -0.68 to 0.68
      // Left page: nx in [-0.64, -0.06], Right page: nx in [0.06, 0.64]
      // Spine gap in [-0.06, 0.06]
      if (ny >= 0.06 && ny <= 0.54) {
        // Left page
        if (nx >= -0.66 && nx <= -0.05) {
          const pageBottom = 0.50 - Math.sin((nx + 0.35) * 4) * 0.06;
          const pageTop = 0.12 - Math.sin((nx + 0.35) * 4) * 0.06;
          if (ny >= pageTop && ny <= pageBottom) {
            r = 255;
            g = 255;
            b = 255;
            a = 255;
            // Book page lines (subtle gray)
            if (Math.abs(ny - 0.22) < 0.02 || Math.abs(ny - 0.32) < 0.02 || Math.abs(ny - 0.40) < 0.02) {
              if (nx >= -0.58 && nx <= -0.13) {
                r = 210;
                g = 210;
                b = 215;
              }
            }
          }
        }
        // Right page
        if (nx >= 0.05 && nx <= 0.66) {
          const pageBottom = 0.50 - Math.sin((-nx + 0.35) * 4) * 0.06;
          const pageTop = 0.12 - Math.sin((-nx + 0.35) * 4) * 0.06;
          if (ny >= pageTop && ny <= pageBottom) {
            r = 255;
            g = 255;
            b = 255;
            a = 255;
            // Book page lines (subtle gray)
            if (Math.abs(ny - 0.22) < 0.02 || Math.abs(ny - 0.32) < 0.02 || Math.abs(ny - 0.40) < 0.02) {
              if (nx >= 0.13 && nx <= 0.58) {
                r = 210;
                g = 210;
                b = 215;
              }
            }
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Deflate
  const compressed = zlib.deflateSync(rawData);

  // PNG header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: deflate
  ihdr[11] = 0; // Filter: none
  ihdr[12] = 0; // Interlace: none

  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ba0c2f" />
      <stop offset="100%" stop-color="#8c0720" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.25" />
    </filter>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  
  <g filter="url(#shadow)" fill="#ffffff" transform="translate(256, 256)">
    <!-- Graduation Cap Mortarboard -->
    <polygon points="0,-140 160,-75 0,-10 -160,-75" />
    <!-- Skull Cap Base -->
    <path d="M-90,-60 L-90,-10 C-90,30 90,30 90,-10 L90,-60 Z" />
    <!-- Tassel Button & String -->
    <circle cx="0" cy="-75" r="8" fill="#ffd100" />
    <path d="M0,-75 Q -80,-55 -115,-10" stroke="#ffd100" stroke-width="6" fill="none" stroke-linecap="round" />
    <circle cx="-115" cy="-10" r="10" fill="#ffd100" />

    <!-- Open Book -->
    <!-- Left Page -->
    <path d="M-15,40 C-60,30 -120,35 -145,50 L-145,150 C-120,135 -60,130 -15,140 Z" fill="#ffffff" />
    <line x1="-125" y1="75" x2="-35" y2="68" stroke="#ba0c2f" stroke-width="4" stroke-linecap="round" opacity="0.4" />
    <line x1="-125" y1="95" x2="-35" y2="88" stroke="#ba0c2f" stroke-width="4" stroke-linecap="round" opacity="0.4" />
    <line x1="-125" y1="115" x2="-55" y2="108" stroke="#ba0c2f" stroke-width="4" stroke-linecap="round" opacity="0.4" />

    <!-- Right Page -->
    <path d="M15,40 C60,30 120,35 145,50 L145,150 C120,135 60,130 15,140 Z" fill="#ffffff" />
    <line x1="35" y1="68" x2="125" y2="75" stroke="#ba0c2f" stroke-width="4" stroke-linecap="round" opacity="0.4" />
    <line x1="35" y1="88" x2="125" y2="95" stroke="#ba0c2f" stroke-width="4" stroke-linecap="round" opacity="0.4" />
    <line x1="35" y1="108" x2="105" y2="115" stroke="#ba0c2f" stroke-width="4" stroke-linecap="round" opacity="0.4" />
  </g>
</svg>
`;

fs.writeFileSync(path.join(iconsDir, "icon.svg"), svgContent.trim());
console.log("Wrote icon.svg");

// Write favicon.svg
fs.writeFileSync(path.join(root, "public", "favicon.svg"), svgContent.trim());

// Generate PNG sizes
const sizes = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-192.png", size: 192, maskable: true },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
  { file: "favicon.ico", size: 48, maskable: false },
];

for (const { file, size, maskable } of sizes) {
  const buf = createPng(size, size, maskable);
  fs.writeFileSync(path.join(iconsDir, file), buf);
  if (file === "apple-touch-icon.png" || file === "favicon.ico") {
    fs.writeFileSync(path.join(root, "public", file), buf);
  }
  console.log(`Generated ${file} (${size}x${size}, maskable: ${maskable})`);
}
