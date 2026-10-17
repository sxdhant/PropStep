import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { fail, ok, requireAdmin } from "@/lib/http";
import { audit, bust, dbError, plain } from "@/lib/admin/ops";
import { findDuplicate, listingData, listingOut, getListingRow, readListing } from "@/lib/admin/listings";

/** GET /api/admin/listings?q&status&page: a table-friendly list (drafts included) */
export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const q = new URL(req.url).searchParams;
  const status = q.get("status");
  const term = q.get("q")?.trim();
  const page = Math.max(1, Number(q.get("page") ?? 1) || 1);
  const where = {
    ...(status === "DRAFT" ? { status: "DRAFT" as const } : status === "PUBLISHED" ? { status: "PUBLISHED" as const } : {}),
    ...(term ? { OR: [{ title: { contains: term, mode: "insensitive" as const } }, { locality: { contains: term, mode: "insensitive" as const } }, { slug: { contains: term } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.listing.count({ where }),
    db.listing.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * 25, take: 25, select: { id: true, slug: true, title: true, locality: true, price: true, priceLabel: true, status: true, updatedAt: true } }),
  ]);
  return ok(plain({ total, page, pages: Math.max(1, Math.ceil(total / 25)), items: rows }));
}

export async function POST(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const parsed = await readListing(req, null);
  if ("res" in parsed) return parsed.res;
  const draft = parsed.data.status === "DRAFT";
  const mapped = await listingData(parsed.data, { draft });
  if ("error" in mapped) return fail(422, mapped.error, { errors: { [mapped.field]: mapped.error } });
  const warnings = { ...parsed.warnings, ...mapped.warnings };
  // The same property can't be listed twice: a live listing is refused, a draft is saved with the field marked
  const dup = await findDuplicate(parsed.data);
  if (dup) {
    if (!draft) return fail(409, dup.message, { errors: { [dup.field]: dup.message } });
    warnings[dup.field] = dup.message;
  }
  try {
    let row;
    try {
      row = await db.listing.create({ data: mapped.data });
    } catch (e) {
      if (!draft || (e as { code?: string })?.code !== "P2002") throw e;
      // A draft is still saved when its page address is taken: it gets a temporary address until this one is changed
      warnings.slug = "Another listing already uses this page address. Change it before publishing.";
      row = await db.listing.create({ data: { ...mapped.data, slug: `draft-${randomBytes(4).toString("hex")}` } });
    }
    await audit(g.session, "create", "listing", row.id, { slug: row.slug });
    bust("listings");
    return ok({ listing: plain(listingOut((await getListingRow(row.id))!)), fieldWarnings: warnings }, { status: 201 });
  } catch (e) {
    return dbError(e, "A listing with that slug");
  }
}
