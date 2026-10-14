import { db } from "@/lib/db";
import type { ListingInput } from "@/lib/validation/admin";

type Row = NonNullable<Awaited<ReturnType<typeof getListingRow>>>;
export const getListingRow = (id: string) => db.listing.findUnique({ where: { id }, include: { advisor: true, localityRef: true } });

/** Row -> the shape the admin form edits (and the API returns) */
export function listingOut(r: Row) {
  return {
    id: r.id, slug: r.slug, title: r.title, intent: r.intent, type: r.type, developer: r.developer ?? "", project: r.project ?? "",
    bhk: r.bhk, area: r.area, city: r.city, locality: r.locality, localitySlug: r.localityRef?.slug ?? "",
    price: Number(r.price), priceLabel: r.priceLabel, possession: r.possession ?? "",
    rera: r.rera ?? "", badge: r.badge ?? "", advisorKey: r.advisor.key, postedAt: r.postedAt.toISOString().slice(0, 10),
    units: r.units ?? undefined, totalArea: r.totalArea ?? "", towers: r.towers ?? undefined, structure: r.structure ?? "", hotSelling: r.hotSelling, handpicked: r.handpicked, configs: (r.configs as number[] | null) ?? [], areaMin: r.areaMin ?? undefined, areaMax: r.areaMax ?? undefined,
    unitTypes: (r.unitTypes as unknown[] | null) ?? [], floorplan: r.floorplan ?? "", connectingRoad: r.connectingRoad ?? "",
    summary: r.summary, description: r.description, features: r.features as string[], amenities: (r.amenities as unknown[] | null) ?? [],
    connectivity: (r.connectivity as unknown[] | null) ?? [], images: r.images as unknown[], status: r.status, updatedAt: r.updatedAt.toISOString(),
  };
}

/** Validated input -> database columns. Returns an error message when the advisor or locality doesn't exist. */
export async function listingData(i: ListingInput): Promise<{ data: Parameters<typeof db.listing.create>[0]["data"] } | { error: string; field: string }> {
  const advisor = await db.advisor.findUnique({ where: { key: i.advisorKey }, select: { id: true } });
  if (!advisor) return { error: "Choose an existing advisor", field: "advisorKey" };
  let localityId: string | null = null;
  if (i.localitySlug) {
    const loc = await db.locality.findUnique({ where: { slug: i.localitySlug }, select: { id: true } });
    if (!loc) return { error: "Choose an existing locality guide, or leave it empty", field: "localitySlug" };
    localityId = loc.id;
  }
  return {
    data: {
      slug: i.slug, title: i.title, intent: i.intent, type: i.type, developer: i.developer ?? null, project: i.project ?? null,
      bhk: i.bhk, baths: i.baths, area: i.area, city: i.city, locality: i.locality, localityId,
      price: BigInt(i.price), priceLabel: i.priceLabel, possession: i.possession ?? null,
      rera: i.rera ?? null, badge: i.badge ?? null, advisorId: advisor.id, postedAt: i.postedAt ? new Date(i.postedAt) : new Date(),
      units: i.units ?? null, totalArea: i.totalArea ?? null, towers: i.towers ?? null, structure: i.structure ?? null, hotSelling: i.hotSelling, handpicked: i.handpicked, configs: i.configs ?? undefined, areaMin: i.areaMin ?? null, areaMax: i.areaMax ?? null,
      unitTypes: i.unitTypes ?? undefined, floorplan: i.floorplan ?? null, connectingRoad: i.connectingRoad ?? null,
      summary: i.summary, description: i.description, features: i.features, amenities: i.amenities ?? undefined,
      connectivity: i.connectivity ?? undefined, images: i.images, status: i.status,
    },
  };
}
