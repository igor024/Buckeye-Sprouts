import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Buckeye Sprouts",
    short_name: "Buckeye Sprouts",
    description: "Real-time Ohio State library study sessions, seat finder, BuckID check-in, and collaborative study notebook.",
    start_url: "./",
    id: "./",
    scope: "./",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#d5eab9",
    theme_color: "#d5eab9",
    categories: ["education", "productivity", "utilities"],
    icons: [
      {
        src: "icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    shortcuts: [
      {
        name: "Discover Sessions",
        short_name: "Discover",
        description: "Browse open study groups across OSU campus libraries",
        url: "./#feed",
        icons: [{ src: "icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Active Study Session",
        short_name: "My Session",
        description: "Jump to your active study group notebook and location",
        url: "./session/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        icons: [{ src: "icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Offline Vault",
        short_name: "Offline",
        description: "Access cached sessions and offline BuckID pass",
        url: "./offline",
        icons: [{ src: "icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}


