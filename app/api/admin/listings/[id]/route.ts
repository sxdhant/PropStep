import { db } from "@/lib/db";
import { fail, ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust, dbError, plain } from "@/lib/admin/ops";
import { getListingRow, listingData, listingOut } from "@/lib/admin/listings";
import { listingInput } from "@/lib/validation/admin";

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
  const parsed = await parseBody(req, listingInput);
  if ("res" in parsed) return parsed.res;
  const mapped = await listingData(parsed.data);
  if ("error" in mapped) return fail(422, mapped.error, { errors: { [mapped.field]: mapped.error } });
  try {
    await db.listing.update({ where: { id }, data: mapped.data });
    await audit(g.session, "update", "listing", id, { slug: parsed.data.slug, status: parsed.data.status });
    bust("listings");
    return ok({ listing: plain(listingOut((await getListingRow(id))!)) });
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
