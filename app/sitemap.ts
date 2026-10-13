import type { MetadataRoute } from "next";
import { getListings, getLocalities, SITE_URL } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, localities] = await Promise.all([getListings(), getLocalities()]);
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
