import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/articles";
import { getListings, getLocalities, SITE_URL } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, localities] = await Promise.all([getListings(), getLocalities()]);
  const now = new Date();
  // Pages with a real, tracked update date use it as lastmod; pages without one (static pages, the
  // index listings) fall back to the build time rather than falsely claiming a specific edit date.
  const entries: { path: string; lastModified: Date }[] = [
    { path: "/", lastModified: now },
    { path: "/properties/", lastModified: now },
    ...listings.map((l) => ({ path: `/properties/${l.slug}/`, lastModified: new Date(l.updated_at) })),
    { path: "/localities/", lastModified: now },
    ...localities.map((l) => ({ path: `/localities/${l.slug}/`, lastModified: new Date(l.updated_at) })),
    { path: "/services/", lastModified: now },
    { path: "/news/", lastModified: now },
    ...ARTICLES.map((a) => ({ path: `/news/${a.slug}/`, lastModified: new Date(a.date) })),
    { path: "/about-us/", lastModified: now },
    { path: "/contact-us/", lastModified: now },
    { path: "/privacy/", lastModified: now },
  ];
  return entries.map(({ path: p, lastModified }) => ({ url: `${SITE_URL}${p}`, lastModified }));
}
