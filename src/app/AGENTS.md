# App UI style guide

Use this guide for app routes and shared app chrome under `src/app/`. Preserve the Buckeye Sprouts campus-study purpose and keep feature behavior, privacy boundaries, and mock fallbacks intact.

## Visual direction

- Take inspiration from Apple Find My's calm, map-first mobile composition: a full-bleed campus map, restrained labels, location markers, and a softly elevated sheet anchored over the map. The latest user-approved surfaces are solid grid paper, as recorded in the root `AGENTS.md`.
- Translate the visual language into Buckeye Sprouts' own identity. Use warm campus greens, pale river blue, soft ivory, charcoal text, and Buckeye scarlet only as a small accent. Do not reproduce Apple's logo, exact map tiles, text, or proprietary interface assets.
- Make the campus map the visual canvas. Keep controls compact and legible, with rounded capsules, subtle borders, and soft shadows. Use generous spacing and clear text hierarchy.
- Use solid grid-paper sheets with a visible grabber, simple rows, circular avatars, muted location details and fine dividers. Use squiggle dividers beneath tab/note titles; do not restore frosted glass or backdrop blur.
- Keep the map visible around the sheets through placement and sizing. Group Search, bottom navigation and dialogs follow the same paper surface direction. Sheets and bottom navigation share `--map-panel-width`, with a safe-area-aware 12px gap above navigation. Portal dialogs outside transformed sheets and constrain them above navigation.
- Use a compact, icon-led bottom navigation on mobile. Keep tap targets comfortable and provide visible selected, hover, focus, and disabled states.
- Favor a natural, polished interface over generic marketing hero panels, heavy card grids, dense badges, or large blocks of decorative copy.

## Integrated campus and library map

- Keep the campus and Thompson Library in one continuous map experience. Render Thompson's indoor plan as a positioned layer on the same pannable and zoomable campus map surface, with nearby campus visible. Auto-zoom to Thompson when Groups opens. Do not move the plan into the sheet or add a separate full-screen campus/inside map switch.
- Use the provided local SVG for Thompson's Level 1 plan. Keep map zoom at or above 1.0 and at or below the 3.6 absolute maximum from `CAMPUS_MAP_ZOOM_LIMITS`. Apply a viewport-aware cap while the library plan is open so at least 50% of its area remains visible. Clamp pan so the illustrated map always covers the viewport.
- Render the campus and floor-plan vectors through an SVG `viewBox` camera rather than scaling a rasterized CSS layer. Project the floor plan and map markers using the same `xMidYMid slice` artwork transform. Keep group and room controls in an unscaled overlay so text and icons remain crisp at every zoom level.
- Draw the campus with local low-poly vector artwork: simplified building blocks, soft parks, a few main roads, and only useful landmark labels. Keep visual quiet and legible at phone size. Avoid dense street grids, raster tile backgrounds, unnecessary labels, and decorative map lines.
- Put Thompson Library in a clearly discoverable landmark marker. Make its local East Entrance plan, room search, room markers, and room list reachable from that marker. When Group Search is active, keep the course search and all matching group rows in the draggable sheet; a downward sheet drag hides it below the bottom bar, clicking the selected Groups tab toggles it closed, and an upward drag from the bar expands it. After its hide animation, the sheet must be invisible and non-interactive.
- Keep the map location control icon-only with a fixed 15 × 15 CSS-pixel visual size and a transparent touch hit area; give it an accessible name that describes its current action.
- Keep the campus pan, pinch zoom, double-tap zoom, recenter, location disclosure, and demo-location control usable on touch screens. Keep location on-device and describe the illustration as approximate; never imply cartographic scale or precise indoor routing.
- Prefer code-native SVG/vector artwork and local floor-plan assets. The visual map must load without an API key, external map library, or tile service and should remain useful offline.

## Responsive and accessible behavior

- Design mobile first. Keep the map recognizable behind the drawer; make long lists scroll within the sheet without covering navigation.
- On larger screens, retain the map-first composition and give the sheet a readable maximum width rather than stretching every row edge to edge.
- Use semantic landmarks and headings, descriptive accessible names for icon-only controls, keyboard-visible focus rings, and sufficient contrast over paper and map backgrounds.
- Respect `prefers-reduced-motion` and safe-area insets on notched devices.
- Never rely on color alone to convey live, selected, or available states.

## Implementation notes

- Prefer local CSS and lightweight vector/CSS map artwork over external map tiles or remote photos for scaffold screens.
- Keep map positions illustrative unless connected to an authorized map provider. Do not expose exact tables, private session coordinates, or private photos in public discovery UI.
- Reuse the existing feature components and shared contracts when composing app routes; keep feature behavior inside its owning feature folder.
- Keep the map mounted when switching tabs. The unjoined Group state has only a standalone reader action, with no sliding sheet; the joined state reuses the draggable current-group sheet. See the root `AGENTS.md` implementation handoff for state ownership, simulated reader behavior and verification notes.

## Indoor map behavior

- Keep the map experience fixed to the viewport on the root route; the document itself must not scroll. Permit vertical scrolling only inside the map's information sheet.
- Treat floor-plan artwork as a local asset and cache it in the service worker so the PWA can show the plan offline.
- Support touch-first pan, pinch zoom, double-tap zoom, explicit zoom buttons, and a recenter action. Keep the sheet independently draggable and avoid stealing gestures from sheet controls or text fields.
- In a group roster, place the host first within the same scroll container as members. Do not make the host row sticky or pin it outside the scroll frame.
- Use one named, verified floor at a time. Do not imply that unprovided floors, room availability, routing, or live location data are known.
