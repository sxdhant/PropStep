import { areasIn, SEARCH_CITIES, zoneResolver, ZONES } from "@/lib/data";
import { fail, ok } from "@/lib/http";

export const revalidate = 300;

/** GET /api/areas?city=Bengaluru: search localities with the zones each falls in, plus the zone list */
export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get("city") ?? SEARCH_CITIES[0];
  if (!SEARCH_CITIES.includes(city)) return fail(404, "City not covered");
  const [names, zonesOf] = await Promise.all([areasIn(city), zoneResolver()]);
  return ok({ city, zones: ZONES, areas: names.map((name) => ({ name, zones: zonesOf(name) })) });
}
