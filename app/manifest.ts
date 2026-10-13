import type { MetadataRoute } from "next";
import { getSite } from "@/lib/data";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSite();
  return {
    name: site.name,
    short_name: site.name,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1b3f7a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
