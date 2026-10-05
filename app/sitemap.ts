import type { MetadataRoute } from "next";
import { listings, localities, SITE_URL } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    "/",
    "/properties/",
    ...listings.map((l) => `/properties/${l.slug}/`),
    "/localities/",
    ...localities.map((l) => `/localities/${l.slug}/`),
    "/services/",
    "/about-us/",
    "/contact-us/",
    "/privacy/",
  ];
  return paths.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now }));
}
