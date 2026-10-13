import { ZONES } from "./data";
import type { Listing } from "./types";

export type SearchParams = {
  city?: string;
  zone?: string;
  locality?: string;
  type?: string;
  bhk?: string;
  budget?: string;
  sort?: string;
};

/** The same filters the Properties page applies in the browser, for the public API */
export function filterListings(all: Listing[], p: SearchParams, zonesOf: (locality: string) => string[]) {
  const [min, max] = p.budget ? p.budget.split("-") : [];
  return all.filter(
    (l) =>
      (!p.city || l.city === p.city) &&
      (!p.zone || zonesOf(l.locality).includes(p.zone)) &&
      (!p.locality || l.locality === p.locality) &&
      (!p.type || l.type === p.type) &&
      (!p.bhk || (p.bhk === "4" ? l.bhk >= 4 : String(l.bhk) === p.bhk)) &&
      (!min || l.price >= Number(min)) &&
      (!max || l.price < Number(max)),
  );
}

export function sortListings(list: Listing[], sort?: string) {
  const s = [...list];
  if (sort === "price-asc") s.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") s.sort((a, b) => b.price - a.price);
  else if (sort === "area") s.sort((a, b) => b.area - a.area);
  else if (sort === "newest") s.sort((a, b) => b.posted.localeCompare(a.posted));
  return s;
}

export const facetZones = (list: Listing[], zonesOf: (locality: string) => string[]) =>
  Object.fromEntries(ZONES.map((z) => [z, list.filter((l) => zonesOf(l.locality).includes(z)).length]));
