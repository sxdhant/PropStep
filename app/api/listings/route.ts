import { getListings, zoneResolver } from "@/lib/data";
import { fail, ok } from "@/lib/http";
import { facetZones, filterListings, sortListings } from "@/lib/search";

export const revalidate = 300;

/** GET /api/listings?city&zone&locality&type&bhk&budget&sort&page&limit */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const page = Number(q.get("page") ?? 1);
  const limit = Number(q.get("limit") ?? 12);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) return fail(422, "page must be ≥ 1 and limit 1–50");
  if (q.get("budget") && !/^\d*-\d*$/.test(q.get("budget")!)) return fail(422, "budget must look like 10000000-20000000");

  const [all, zonesOf] = await Promise.all([getListings(), zoneResolver()]);
  const params = Object.fromEntries(["city", "zone", "locality", "type", "bhk", "budget", "sort"].map((k) => [k, q.get(k) ?? undefined]));
  const matched = sortListings(filterListings(all, params, zonesOf), params.sort);
  return ok({
    total: matched.length,
    page,
    pages: Math.max(1, Math.ceil(matched.length / limit)),
    zones: facetZones(matched, zonesOf),
    items: matched.slice((page - 1) * limit, page * limit),
  });
}
