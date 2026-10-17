import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { fail } from "@/lib/http";
import { fieldErrors } from "@/lib/validation/common";
import { listingInput, type ListingInput } from "@/lib/validation/admin";
import { resolveMap } from "./map";
import { plain } from "./ops";

type Row = NonNullable<Awaited<ReturnType<typeof getListingRow>>>;
export const getListingRow = (id: string) => db.listing.findUnique({ where: { id }, include: { advisor: true, localityRef: true } });

/** Row -> the shape the admin form edits (and the API returns) */
export function listingOut(r: Row) {
  return {
    id: r.id, slug: r.slug, title: r.title, intent: r.intent, type: r.type, developer: r.developer ?? "", developerLogo: r.developerLogo ?? "", project: r.project ?? "",
    bhk: r.bhk, area: r.area, city: r.city, locality: r.locality, localitySlug: r.localityRef?.slug ?? "",
    price: Number(r.price), priceLabel: r.priceLabel, possession: r.possession ?? "",
    rera: r.rera ?? "", badge: r.badge ?? "", advisorKey: r.advisor.key, postedAt: r.postedAt.toISOString().slice(0, 10),
    units: r.units ?? undefined, pricePerSqft: r.pricePerSqft ?? undefined, mapUrl: r.mapUrl ?? "", totalArea: r.totalArea ?? "", towers: r.towers ?? undefined, structure: r.structure ?? "", hotSelling: r.hotSelling, handpicked: r.handpicked, configs: (r.configs as number[] | null) ?? [], areaMin: r.areaMin ?? undefined, areaMax: r.areaMax ?? undefined,
    unitTypes: (r.unitTypes as unknown[] | null) ?? [], floorplan: r.floorplan ?? "", connectingRoad: r.connectingRoad ?? "",
    summary: r.summary, description: r.description, features: r.features as string[], notes: (r.notes as string[] | null) ?? [], amenities: (r.amenities as unknown[] | null) ?? [],
    connectivity: (r.connectivity as unknown[] | null) ?? [], images: r.images as unknown[], status: r.status, updatedAt: r.updatedAt.toISOString(),
  };
}

const MAX_BODY = 200_000;

/**
 * Read and validate a listing from a request.
 * A listing being published must be complete and valid, or it is rejected with the problem fields.
 * A draft is saved whatever is filled in: a field that is invalid is left out (the stored value stays) and reported in
 * `warnings`, keyed by field, so the form can mark it. `prev` is the stored listing when editing.
 */
export async function readListing(req: Request, prev: Row | null): Promise<{ data: ListingInput; warnings: Record<string, string> } | { res: Response }> {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return { res: fail(413, "Request too large") };
  let raw: Record<string, unknown>;
  try {
    const t = await req.text();
    if (t.length > MAX_BODY) return { res: fail(413, "Request too large") };
    raw = JSON.parse(t);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("not an object");
  } catch {
    return { res: fail(400, "Invalid request") };
  }

  if (raw.status === "PUBLISHED") {
    const r = listingInput.safeParse(raw);
    if (r.success) return { data: r.data, warnings: {} };
    const errors = fieldErrors(r.error);
    return { res: fail(422, Object.values(errors)[0] ?? "Invalid data", { errors }) };
  }

  // What stands in for a field that is invalid or empty but required by the database
  const base: Record<string, unknown> = prev
    ? plain(listingOut(prev))
    : { title: "Untitled draft", slug: `draft-${randomBytes(4).toString("hex")}`, type: "Apartment", city: "Bengaluru", images: [], features: [], advisorKey: (await db.advisor.findFirst({ select: { key: true } }))?.key };
  if (!base.advisorKey) return { res: fail(422, "Add an advisor first (Advisors page)", { errors: { advisorKey: "Add an advisor first (Advisors page)" } }) };

  const body: Record<string, unknown> = { ...raw, status: "DRAFT" };
  if (!String(body.title ?? "").trim()) body.title = "Untitled draft";
  for (const k of ["slug", "type", "city", "advisorKey"]) if (!String(body[k] ?? "").trim()) body[k] = base[k];

  const warnings: Record<string, string> = {};
  for (let pass = 0; pass < 12; pass++) {
    const r = listingInput.safeParse(body);
    if (r.success) return { data: r.data, warnings };
    const drop = new Map<string, Set<number>>();
    const whole = new Set<string>();
    for (const issue of r.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (!key) continue;
      warnings[issue.path.join(".")] ||= issue.message;
      const at = issue.path[1];
      // One bad photo / row only costs that photo / row, not the whole list
      if (typeof at === "number" && Array.isArray(body[key])) drop.set(key, (drop.get(key) ?? new Set()).add(at));
      else whole.add(key);
    }
    if (!drop.size && !whole.size) break;
    for (const [k, at] of drop) if (!whole.has(k)) body[k] = (body[k] as unknown[]).filter((_, i) => !at.has(i));
    for (const k of whole) body[k] = base[k] === 0 ? undefined : base[k];
  }
  return { res: fail(422, Object.values(warnings)[0] ?? "Invalid data", { errors: warnings }) };
}

/**
 * Validated input -> database columns. Returns an error message when the advisor or locality doesn't exist.
 * With `draft`, a bad advisor, locality or map link doesn't stop the save: the stored value (`prev`) is kept and the
 * problem comes back in `warnings`.
 */
export async function listingData(
  i: ListingInput,
  opts: { draft?: boolean; prev?: Row | null } = {},
): Promise<{ data: Parameters<typeof db.listing.create>[0]["data"]; warnings?: Record<string, string> } | { error: string; field: string }> {
  const { draft, prev } = opts;
  const warnings: Record<string, string> = {};
  let advisor = await db.advisor.findUnique({ where: { key: i.advisorKey }, select: { id: true } });
  if (!advisor && draft) {
    warnings.advisorKey = "Choose an existing advisor";
    advisor = prev ? { id: prev.advisorId } : await db.advisor.findFirst({ select: { id: true } });
  }
  if (!advisor) return { error: "Choose an existing advisor", field: "advisorKey" };
  let localityId: string | null = null;
  if (i.localitySlug) {
    const loc = await db.locality.findUnique({ where: { slug: i.localitySlug }, select: { id: true } });
    if (loc) localityId = loc.id;
    else if (draft) {
      warnings.localitySlug = "Choose an existing locality guide, or leave it empty";
      localityId = prev?.localityId ?? null;
    } else return { error: "Choose an existing locality guide, or leave it empty", field: "localitySlug" };
  }
  let map: { url: string; embed: string } | null = null;
  if (i.mapUrl) {
    if (prev?.mapUrl === i.mapUrl && prev.mapEmbed) map = { url: prev.mapUrl, embed: prev.mapEmbed }; // unchanged: no need to look it up again
    else {
      const m = await resolveMap(i.mapUrl);
      if (!("error" in m)) map = m;
      else if (draft) {
        warnings.mapUrl = m.error;
        if (prev?.mapUrl && prev.mapEmbed) map = { url: prev.mapUrl, embed: prev.mapEmbed };
      } else return { error: m.error, field: "mapUrl" };
    }
  }
  return {
    warnings,
    data: {
      slug: i.slug, title: i.title, intent: i.intent, type: i.type, developer: i.developer ?? null, developerLogo: i.developerLogo ?? null, project: i.project ?? null,
      bhk: i.bhk, baths: i.baths, area: i.area, city: i.city, locality: i.locality, localityId,
      price: BigInt(i.price), priceLabel: i.priceLabel, possession: i.possession ?? null,
      rera: i.rera ?? null, badge: i.badge ?? null, advisorId: advisor.id, postedAt: i.postedAt ? new Date(i.postedAt) : new Date(),
      units: i.units ?? null, pricePerSqft: i.pricePerSqft ?? null, mapUrl: map?.url ?? null, mapEmbed: map?.embed ?? null, totalArea: i.totalArea ?? null, towers: i.towers ?? null, structure: i.structure ?? null, hotSelling: i.hotSelling, handpicked: i.handpicked, configs: i.configs ?? undefined, areaMin: i.areaMin ?? null, areaMax: i.areaMax ?? null,
      unitTypes: i.unitTypes ?? undefined, floorplan: i.floorplan ?? null, connectingRoad: i.connectingRoad ?? null,
      summary: i.summary, description: i.description, features: i.features, notes: i.notes ?? undefined, amenities: i.amenities ?? undefined,
      connectivity: i.connectivity ?? undefined, images: i.images, status: i.status,
    },
  };
}
