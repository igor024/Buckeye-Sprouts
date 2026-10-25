import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const iconsDir = path.join(publicDir, "icons");
await fs.mkdir(iconsDir, { recursive: true });

// Use the supplied artwork unchanged; remove transparent margins and fit icon canvases.
const artwork = await sharp(path.join(publicDir, "brand/logo-source.png")).trim().png().toBuffer();
async function icon(size, { maskable = false, opaque = false } = {}) {
  const background = opaque || maskable ? "#faf9f5" : { r: 0, g: 0, b: 0, alpha: 0 };
  const inset = Math.round(size * (maskable ? 0.13 : 0.06));
  const badge = await sharp(artwork).resize(size - inset * 2, size - inset * 2, { fit: "contain", background }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } }).composite([{ input: badge, left: inset, top: inset }]).png().toBuffer();
}
const logo = await icon(512);
await fs.writeFile(path.join(publicDir, "brand/logo.png"), logo);
for (const size of [192, 512]) {
  await fs.writeFile(path.join(iconsDir, `icon-${size}.png`), await icon(size));
  await fs.writeFile(path.join(iconsDir, `icon-maskable-${size}.png`), await icon(size, { maskable: true }));
}
const apple = await icon(180, { opaque: true });
await fs.writeFile(path.join(iconsDir, "apple-touch-icon.png"), apple);
await fs.writeFile(path.join(publicDir, "apple-touch-icon.png"), apple);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><image width="512" height="512" href="data:image/png;base64,${logo.toString("base64")}"/></svg>\n`;
await fs.writeFile(path.join(iconsDir, "icon.svg"), svg);
await fs.writeFile(path.join(publicDir, "favicon.svg"), svg);

// ICO directory with an embedded PNG, rather than PNG bytes mislabeled as .ico.
const favicon = await icon(48);
const directory = Buffer.alloc(22);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(1, 4);
directory[6] = 48;
directory[7] = 48;
directory.writeUInt16LE(1, 10);
directory.writeUInt16LE(32, 12);
directory.writeUInt32LE(favicon.length, 14);
directory.writeUInt32LE(22, 18);
const ico = Buffer.concat([directory, favicon]);
await fs.writeFile(path.join(iconsDir, "favicon.ico"), ico);
await fs.writeFile(path.join(publicDir, "favicon.ico"), ico);
console.log("Generated app logo, browser favicon, Apple touch icons, and install icons from the supplied artwork.");
