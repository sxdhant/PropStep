import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the same URLs as the static build: /properties/whitefield-4bhk-villa-banyan-grove/
  trailingSlash: true,
  poweredByHeader: false,
  // Opening the dev site through an ngrok tunnel: the dev server refuses scripts requested from other origins unless they are listed here
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.app", "*.ngrok.dev", "*.ngrok.io"],
  // The contact and about pages moved to /contact-us/ and /about-us/: old links and bookmarks keep working (query and #hash included)
  // The Projects pages were removed: their links land on Properties (temporary, so they can come back)
  async redirects() {
    return [
      { source: "/contact", destination: "/contact-us/", permanent: true },
      { source: "/about", destination: "/about-us/", permanent: true },
      { source: "/projects/:path*", destination: "/properties/", permanent: false },
    ];
  },
  images: {
    // Photos are served from the Unsplash CDN, which resizes and converts to AVIF/WebP itself.
    loader: "custom",
    loaderFile: "./image-loader.ts",
    deviceSizes: [480, 768, 1080, 1440, 1920, 2200],
    imageSizes: [96, 160, 240, 320],
  },
};

export default nextConfig;
