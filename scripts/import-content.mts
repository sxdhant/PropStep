/**
 * One-off: copy content/*.json and content/listings.csv into the database. Safe to re-run (upserts).
 *   npx tsx scripts/import-content.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { db } from "../lib/db";
import { buildListings, CSV_PATH } from "../lib/listings-csv.mjs";
import type { Listing, Locality, Site } from "../lib/types";

const ROOT = process.cwd();
const read = <T>(f: string) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", f), "utf8")) as T;

const site = read<Site>("site.json");
const localities = read<Locality[]>("localities.json");
const areas = read<{ name: string; zone: string }[]>("areas.json");

// Advisors
const advisorIds = new Map<string, string>();
for (const [key, a] of Object.entries(site.advisors)) {
  const row = await db.advisor.upsert({
    where: { key },
    create: { key, name: a.name, role: a.role, languages: a.languages, years: a.years },
    update: { name: a.name, role: a.role, languages: a.languages, years: a.years },
  });
  advisorIds.set(key, row.id);
}

// Localities
const localityIds = new Map<string, string>();
for (const l of localities) {
  const data = {
    name: l.name, zone: l.zone, tagline: l.tagline, imageId: l.image.id, imageAlt: l.image.alt,
    priceSqft: l.price_sqft, priceMid: l.price_mid, rent2bhk: l.rent_2bhk, yield: l.yield, growth: l.growth,
    metro: l.metro, metroShort: l.metro_short, trend: l.trend, overview: l.overview, bestFor: l.best_for,
    pros: l.pros, cons: l.cons, schools: l.schools, hospitals: l.hospitals, work: l.work,
  };
  const row = await db.locality.upsert({ where: { slug: l.slug }, create: { slug: l.slug, ...data }, update: data });
  localityIds.set(l.slug, row.id);
}

// Search areas
for (const a of areas) {
  await db.area.upsert({
    where: { city_name: { city: "Bengaluru", name: a.name } },
    create: { name: a.name, zone: a.zone },
    update: { zone: a.zone },
  });
}

// Listings (validated by the same rules the CSV pipeline already enforces)
const csv = path.join(ROOT, CSV_PATH);
const built = buildListings(fs.readFileSync(csv, "utf8"), ROOT);
const errors: string[] = built.errors;
const listings = built.listings as Listing[];
if (errors.length) throw new Error(`listings.csv has problems:\n${errors.join("\n")}`);
for (const l of listings) {
  const advisorId = advisorIds.get(l.advisor);
  if (!advisorId) throw new Error(`Unknown advisor "${l.advisor}" on ${l.slug}`);
  const data = {
    title: l.title, intent: l.intent, type: l.type, developer: l.developer, project: l.project,
    bhk: l.bhk, baths: l.baths, area: l.area, city: l.city, locality: l.locality,
    localityId: localityIds.get(l.locality_slug) ?? null,
    price: BigInt(l.price), priceLabel: l.price_label, floor: l.floor, age: l.age, possession: l.possession,
    rera: l.rera, badge: l.badge, advisorId, postedAt: new Date(l.posted), units: l.units,
    configs: l.configs, areaMin: l.area_min, areaMax: l.area_max, unitTypes: l.unit_types,
    floorplan: l.floorplan, connectingRoad: l.connecting_road, summary: l.summary, description: l.description,
    features: l.features, amenities: l.amenities, connectivity: l.connectivity, images: l.images,
    status: "PUBLISHED" as const,
  };
  await db.listing.upsert({ where: { slug: l.slug }, create: { slug: l.slug, ...data }, update: data });
}

// Site settings: everything in site.json except the entities that have their own tables
const { advisors: _a, testimonials, faqs, ...settings } = site;
for (const [key, value] of Object.entries(settings)) {
  await db.siteSetting.upsert({ where: { key }, create: { key, value: value as never }, update: { value: value as never } });
}
await db.testimonial.deleteMany();
await db.testimonial.createMany({ data: testimonials.map((t, sort) => ({ ...t, sort })) });
await db.faq.deleteMany();
await db.faq.createMany({ data: faqs.map((f, sort) => ({ question: f.q, answer: f.a, sort })) });

console.log(`Imported ${advisorIds.size} advisors, ${localities.length} localities, ${areas.length} areas, ${listings.length} listings.`);
await db.$disconnect();
