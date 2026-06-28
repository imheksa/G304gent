import type { NextConfig } from "next";

// Deployed on Vercel (Next.js native). No static export / basePath — the app
// is served from the domain root.
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
