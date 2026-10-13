import { getListing, getListings } from "@/lib/data";
import { fail, ok } from "@/lib/http";

export const revalidate = 300;

/** GET /api/listings/[slug]: one listing plus related ones (same developer, else same locality) */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const l = await getListing((await params).slug);
  if (!l) return fail(404, "Listing not found");
  const others = (await getListings()).filter((x) => x.slug !== l.slug);
  const related = [...others.filter((x) => l.developer && x.developer === l.developer), ...others.filter((x) => x.locality === l.locality)];
  return ok({ listing: l, related: [...new Map(related.map((r) => [r.slug, r])).values()].slice(0, 8) });
}
