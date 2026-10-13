import fs from "node:fs";
import path from "node:path";
import siteJson from "@/content/site.json";
import { buildListings, CSV_PATH } from "./listings-csv.mjs";
import listingsJson from "@/content/listings.json";
import localitiesJson from "@/content/localities.json";
import areasJson from "@/content/areas.json";
import type { Listing, Locality, Site } from "./types";

export const site = siteJson as unknown as Site;
/**
 * Listings come from the spreadsheet content/listings.csv (one row per property, see lib/listings-csv.mjs).
 * A mistake in the sheet fails the build/dev server with the row number; without a sheet, listings.json is used.
 * Edits to the sheet show up after the dev server restarts or on the next build.
 */
function loadListings(): Listing[] {
  const file = path.join(/*turbopackIgnore: true*/ process.cwd(), CSV_PATH);
  if (!fs.existsSync(file)) return listingsJson as unknown as Listing[];
  const { listings, errors, warnings } = buildListings(fs.readFileSync(file, "utf8"));
  warnings.forEach((w) => console.warn(`[listings] ${w}`));
  if (errors.length) throw new Error(`${CSV_PATH} has ${errors.length} problem(s):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  return listings as Listing[];
}
// Propstep lists homes for sale only: rental listings in the sheet are kept but not published
export const listings = loadListings().filter((l) => l.intent === "buy");
export const localities = localitiesJson as unknown as Locality[];

/** Public site URL for canonical links and the sitemap. Override with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || site.url).replace(/\/$/, "");

export const getListing = (slug: string) => listings.find((l) => l.slug === slug);
export const getLocality = (slug: string) => localities.find((l) => l.slug === slug);

/** Cities the property search covers (the first is the default) */
export const SEARCH_CITIES = ["Bengaluru"];
/** Bengaluru's localities for search (content/areas.json), each with its zone */
const BENGALURU_AREAS = areasJson as { name: string; zone: string }[];
/** A city's localities for search: those with listings, plus (Bengaluru) the search list, A–Z */
export const areasIn = (city: string) =>
  [...new Set([...listings.filter((l) => l.city === city).map((l) => l.locality), ...(city === "Bengaluru" ? BENGALURU_AREAS.map((a) => a.name) : [])])].sort(
    (a, b) => a.localeCompare(b),
  );

/** The property search's zones of Bengaluru */
export const ZONES = ["Central", "North", "East", "South", "West"];
/** The search zones a locality falls in, from its zone in the search list or its guide ("South-East" is in both South and East) */
export const zonesOf = (locality: string) => {
  const zone = BENGALURU_AREAS.find((a) => a.name === locality)?.zone ?? localities.find((l) => l.name === locality)?.zone ?? "";
  return ZONES.filter((z) => zone.includes(z));
};
