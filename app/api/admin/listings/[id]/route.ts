import { db } from "@/lib/db";
import { fail, ok, requireAdmin } from "@/lib/http";
import { audit, bust, dbError, plain } from "@/lib/admin/ops";
import { getListingRow, listingData, listingOut, readListing } from "@/lib/admin/listings";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const row = await getListingRow((await params).id);
  return row ? ok({ listing: plain(listingOut(row)) }) : fail(404, "Listing not found");
}

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { id } = await params;
  const prev = await getListingRow(id);
  if (!prev) return fail(404, "Listing not found");
  const parsed = await readListing(req, prev);
  if ("res" in parsed) return parsed.res;
  const draft = parsed.data.status === "DRAFT";
  const mapped = await listingData(parsed.data, { draft, prev });
  if ("error" in mapped) return fail(422, mapped.error, { errors: { [mapped.field]: mapped.error } });
  const warnings = { ...parsed.warnings, ...mapped.warnings };
  try {
    try {
      await db.listing.update({ where: { id }, data: mapped.data });
    } catch (e) {
      if (!draft || (e as { code?: string })?.code !== "P2002") throw e;
      // A draft is still saved when its page address is taken: it keeps its old address
      warnings.slug = "Another listing already uses this page address. Change it before publishing.";
      await db.listing.update({ where: { id }, data: { ...mapped.data, slug: prev.slug } });
    }
    await audit(g.session, "update", "listing", id, { slug: parsed.data.slug, status: parsed.data.status });
    bust("listings");
    return ok({ listing: plain(listingOut((await getListingRow(id))!)), fieldWarnings: warnings });
  } catch (e) {
    return dbError(e, "Listing");
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { id } = await params;
  try {
    // Leads and visits keep their history: detach them from the listing first
    await db.$transaction([db.lead.updateMany({ where: { listingId: id }, data: { listingId: null } }), db.siteVisit.updateMany({ where: { listingId: id }, data: { listingId: null } }), db.listing.delete({ where: { id } })]);
    await audit(g.session, "delete", "listing", id);
    bust("listings");
    return ok();
  } catch (e) {
    return dbError(e, "Listing");
  }
}
