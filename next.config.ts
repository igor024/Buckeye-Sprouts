import type { NextConfig } from "next";

const isExport = process.env.STATIC_EXPORT === "true" || process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "hackohio2026";
const basePath = process.env.BASE_PATH || (isExport && process.env.GITHUB_ACTIONS ? `/${repoName}` : "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(isExport
    ? {
        output: "export",
        basePath: basePath || undefined,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
