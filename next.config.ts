import type { NextConfig } from "next";

const isExport = process.env.STATIC_EXPORT === "true" || process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "hackohio2026";
const basePath = process.env.BASE_PATH || (isExport && process.env.GITHUB_ACTIONS ? `/${repoName}` : "");

const isDevelopment = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(isDevelopment ? {
    async rewrites() {
      // Replace even an already-installed production worker during local development.
      return { beforeFiles: [{ source: "/sw.js", destination: "/sw-dev.js" }] };
    },
  } : {}),
  ...(isExport
    ? {
        output: "export",
        basePath: basePath || undefined,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
