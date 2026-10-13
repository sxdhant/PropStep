import { getListings, getLocality } from "@/lib/data";
import { fail, ok } from "@/lib/http";

export const revalidate = 300;

/** GET /api/localities/[slug]: the guide plus the listings in that locality */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const loc = await getLocality((await params).slug);
  if (!loc) return fail(404, "Locality not found");
  return ok({ locality: loc, listings: (await getListings()).filter((l) => l.locality_slug === loc.slug) });
}
