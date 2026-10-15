import { unstable_cache } from "next/cache";
import { canonicalType, resolveBadges, type BadgeDef } from "./budgets";
import { cache } from "react";
import { db } from "./db";
import * as fallback from "./content";
import type { Listing, Locality, Site } from "./types";

/**
 * Async data layer. Reads Neon through Prisma, cached with tags so admin edits can revalidate instantly.
 * DATABASE_URL is required; the content/ files are only the seed for `import-content`. Only static config (SITE_URL, cities, zones) comes from them.
 */
export const hasDb = () => !!process.env.DATABASE_URL;
export const SITE_URL = fallback.SITE_URL;
export const SEARCH_CITIES = fallback.SEARCH_CITIES;
export const ZONES = fallback.ZONES;

export const TAGS = { listings: "listings", localities: "localities", site: "site", areas: "areas" } as const;
const cached = <T>(fn: () => Promise<T>, key: string, tag: string) => unstable_cache(fn, [key], { tags: [tag], revalidate: 3600 });

/* ---------- row -> domain mappers ---------- */
type ListingRow = Awaited<ReturnType<typeof queryListings>>[number];
/** Price per sq ft for the card: the cheapest home's own rate when the price list has one, else price / smallest size */
function perSqft(r: ListingRow): number | undefined {
  if (r.pricePerSqft) return r.pricePerSqft; // the rate set in the admin wins
  const units = (r.unitTypes as { area: number; price: number; psf?: number }[] | null) ?? [];
  const cheapest = units.length ? units.reduce((a, b) => (b.price < a.price ? b : a)) : undefined;
  if (cheapest) return cheapest.psf ?? (cheapest.area ? Math.round(cheapest.price / cheapest.area) : undefined);
  const area = r.areaMin ?? r.area;
  return Number(r.price) && area ? Math.round(Number(r.price) / area) : undefined;
}

export const toListing = (r: ListingRow, badgeDefs?: BadgeDef[]): Listing => ({
  slug: r.slug,
  title: r.title,
  intent: r.intent as "buy" | "rent",
  type: canonicalType(r.type),
  developer: r.developer ?? undefined,
  developer_logo: r.developerLogo ?? undefined,
  project: r.project ?? undefined,
  configs: (r.configs as number[] | null) ?? undefined,
  units: r.units ?? undefined,
  total_area: r.totalArea ?? undefined,
  towers: r.towers ?? undefined,
  structure: r.structure ?? undefined,
  hot_selling: r.hotSelling,
  handpicked: r.handpicked,
  area_min: r.areaMin ?? undefined,
  area_max: r.areaMax ?? undefined,
  bhk: r.bhk,
  city: r.city,
  locality: r.locality,
  locality_slug: r.localityRef?.slug ?? "",
  price: Number(r.price),
  price_label: r.priceLabel || "Price on request",
  area: r.area,
  baths: r.baths,
  floor: r.floor ?? "",
  age: r.age ?? "",
  possession: r.possession ?? "",
  floorplan: r.floorplan ?? undefined,
  unit_types: ((r.unitTypes as { label?: string; bhk: number; area: number; price: number; psf?: number; floorplan?: string }[] | null) ?? undefined)?.map((u) => ({ ...u, label: u.label || `${u.bhk} BHK ${r.type}` })),
  price_psf: perSqft(r),
  map_url: r.mapUrl ?? undefined,
  map_embed: r.mapEmbed ?? undefined,
  amenities: (r.amenities as Listing["amenities"]) ?? undefined,
  connectivity: (r.connectivity as Listing["connectivity"]) ?? undefined,
  connecting_road: r.connectingRoad ?? undefined,
  rera: r.rera ?? undefined,
  badge: r.badge ?? undefined,
  badges: resolveBadges(r.badge, badgeDefs),
  images: r.images as Listing["images"],
  summary: r.summary,
  description: r.description,
  features: r.features as string[],
  notes: (r.notes as string[] | null) ?? undefined,
  advisor: r.advisor.key,
  posted: r.postedAt.toISOString().slice(0, 10),
});

const queryListings = () =>
  db.listing.findMany({
    where: { status: "PUBLISHED", intent: "buy" },
    include: { advisor: true, localityRef: { select: { slug: true } } },
    orderBy: [{ postedAt: "desc" }, { slug: "asc" }],
  });

type LocalityRow = Awaited<ReturnType<typeof db.locality.findMany>>[number];
const toLocality = (r: LocalityRow): Locality => ({
  slug: r.slug,
  name: r.name,
  zone: r.zone,
  tagline: r.tagline,
  image: { id: r.imageId, alt: r.imageAlt },
  price_sqft: r.priceSqft,
  price_mid: r.priceMid,
  rent_2bhk: r.rent2bhk,
  yield: r.yield,
  growth: r.growth,
  metro: r.metro,
  metro_short: r.metroShort,
  trend: r.trend as number[],
  overview: r.overview as string[],
  best_for: r.bestFor as string[],
  pros: r.pros as string[],
  cons: r.cons as string[],
  schools: r.schools as string[],
  hospitals: r.hospitals as string[],
  work: r.work as string[],
});

/* ---------- loaders ---------- */
const loadListings = cached(
  async () => {
    const [rows, setting] = await Promise.all([queryListings(), db.siteSetting.findUnique({ where: { key: "badges" } })]);
    const defs = Array.isArray(setting?.value) ? (setting.value as BadgeDef[]) : undefined;
    return rows.map((r) => toListing(r, defs));
  },
  "listings",
  TAGS.listings,
);
const loadLocalities = cached(
  async () => (await db.locality.findMany({ where: { status: "PUBLISHED" }, orderBy: { name: "asc" } })).map(toLocality),
  "localities",
  TAGS.localities,
);
const loadAreas = cached(
  async () => (await db.area.findMany({ orderBy: { name: "asc" } })).map((a) => ({ name: a.name, zone: a.zone })),
  "areas",
  TAGS.areas,
);
const loadSite = cached(
  async (): Promise<Site> => {
    const [settings, advisors, testimonials, faqs] = await Promise.all([
      db.siteSetting.findMany(),
      db.advisor.findMany(),
      db.testimonial.findMany({ orderBy: { sort: "asc" } }),
      db.faq.findMany({ orderBy: { sort: "asc" } }),
    ]);
    const base = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return {
      ...base,
      advisors: Object.fromEntries(advisors.map((a) => [a.key, { name: a.name, role: a.role, languages: a.languages, years: a.years, phone: a.phone ?? undefined }])),
      testimonials: testimonials.map((t) => ({ quote: t.quote, name: t.name, meta: t.meta })),
      faqs: faqs.map((f) => ({ q: f.question, a: f.answer })),
    } as Site;
  },
  "site",
  TAGS.site,
);

/** The database is the only source: without DATABASE_URL, fail loudly instead of serving stale bundled content. */
async function fromDb<T>(load: () => Promise<T>): Promise<T> {
  if (!hasDb()) throw new Error("DATABASE_URL is not set. Set it and run `npm run db:import` to load the content.");
  return load();
}

// React cache() dedupes repeat calls within one render
export const getSite = cache(() => fromDb(loadSite));
export const getListings = cache(() => fromDb(loadListings));
export const getLocalities = cache(() => fromDb(loadLocalities));
const getAreas = cache(() => fromDb(loadAreas));

export const getListing = async (slug: string) => (await getListings()).find((l) => l.slug === slug);
export const getLocality = async (slug: string) => (await getLocalities()).find((l) => l.slug === slug);

/** A city's localities for search: those with listings, plus (Bengaluru) the search list, A–Z */
export async function areasIn(city: string) {
  const [listings, areas] = await Promise.all([getListings(), getAreas()]);
  return [...new Set([...listings.filter((l) => l.city === city).map((l) => l.locality), ...(city === "Bengaluru" ? areas.map((a) => a.name) : [])])].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** The search zones a locality falls in ("South-East" is in both South and East) */
export async function zonesOf(locality: string) {
  const [areas, localities] = await Promise.all([getAreas(), getLocalities()]);
  const zone = areas.find((a) => a.name === locality)?.zone ?? localities.find((l) => l.name === locality)?.zone ?? "";
  return ZONES.filter((z) => zone.includes(z));
}
/** Sync version when the caller already holds the data (avoids awaiting in loops) */
export const zoneResolver = async () => {
  const [areas, localities] = await Promise.all([getAreas(), getLocalities()]);
  return (locality: string) => {
    const zone = areas.find((a) => a.name === locality)?.zone ?? localities.find((l) => l.name === locality)?.zone ?? "";
    return ZONES.filter((z) => zone.includes(z));
  };
};

/** The site-visit form's choices: [slug, label] for every published listing */
export async function getVisitOptions() {
  return (await getListings()).map((l) => [l.slug, `${l.title} — ${l.locality}`] as [string, string]);
}
export async function getPhoneProps() {
  const s = await getSite();
  return { href: s.phone_href, label: s.phone };
}
