import { z } from "zod";
import { db } from "@/lib/db";
import { ICON_NAMES } from "@/components/Icon";
import { buildListings } from "@/lib/listings-csv.mjs";
import { fail, ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust } from "@/lib/admin/ops";
import { listingData } from "@/lib/admin/listings";
import { listingInput } from "@/lib/validation/admin";
import type { Listing } from "@/lib/types";

const body = z.object({
  csv: z.string().min(1).max(2_000_000),
  /** "check" validates only; "apply" saves */
  mode: z.enum(["check", "apply"]).default("check"),
  /** imported rows go live straight away, otherwise they're saved as drafts */
  publish: z.boolean().default(false),
});

/**
 * POST /api/admin/listings/import: the same sheet format as content/listings.csv (see lib/listings-csv.mjs).
 * Rows are matched by slug: existing listings are updated, new ones created. Nothing is saved if any row has a problem.
 */
export async function POST(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const parsed = await parseBody(req, body, 2_100_000);
  if ("res" in parsed) return parsed.res;
  const { csv, mode, publish } = parsed.data;

  const [advisors, localities] = await Promise.all([db.advisor.findMany({ select: { key: true } }), db.locality.findMany({ select: { name: true, slug: true } })]);
  const built = buildListings(csv, process.cwd(), { advisors: advisors.map((a) => a.key), localities, icons: ICON_NAMES });
  const errors = [...built.errors];
  const rows = built.listings as Listing[];

  // Second pass: the same rules the admin form applies
  const inputs = rows.map((l, i) => {
    const r = listingInput.safeParse({
      slug: l.slug, title: l.title, intent: l.intent, type: l.type, developer: l.developer, project: l.project, bhk: l.bhk, baths: l.baths, area: l.area,
      city: l.city, locality: l.locality, localitySlug: l.locality_slug, price: l.price, priceLabel: l.price_label,
      possession: l.possession, rera: l.rera, badge: l.badge, advisorKey: l.advisor, postedAt: l.posted, units: l.units, configs: l.configs,
      areaMin: l.area_min ?? l.area, areaMax: l.area_max, unitTypes: l.unit_types, floorplan: l.floorplan, connectingRoad: l.connecting_road,
      summary: l.summary, description: l.description, features: l.features, amenities: l.amenities, connectivity: l.connectivity,
      images: l.images, status: publish ? "PUBLISHED" : "DRAFT",
    });
    if (!r.success) errors.push(`Row ${i + 2} (${l.title}): ${r.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`);
    return r.success ? r.data : null;
  });

  if (errors.length) return fail(422, `${errors.length} problem(s) in the sheet. Nothing was saved.`, { problems: errors.slice(0, 100), warnings: built.warnings });
  if (mode === "check") return ok({ rows: rows.length, warnings: built.warnings });

  let created = 0;
  let updated = 0;
  for (const input of inputs) {
    const mapped = await listingData(input!);
    if ("error" in mapped) return fail(422, `${input!.slug}: ${mapped.error}`);
    const exists = await db.listing.findUnique({ where: { slug: input!.slug }, select: { id: true } });
    if (exists) {
      await db.listing.update({ where: { id: exists.id }, data: mapped.data });
      updated++;
    } else {
      await db.listing.create({ data: mapped.data });
      created++;
    }
  }
  await audit(g.session, "import", "listing", undefined, { created, updated, publish });
  bust("listings");
  return ok({ created, updated, warnings: built.warnings });
}
