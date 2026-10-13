import { db } from "@/lib/db";
import { fail, ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust, dbError, plain } from "@/lib/admin/ops";
import { listingData, listingOut, getListingRow } from "@/lib/admin/listings";
import { listingInput } from "@/lib/validation/admin";

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
  const parsed = await parseBody(req, listingInput);
  if ("res" in parsed) return parsed.res;
  const mapped = await listingData(parsed.data);
  if ("error" in mapped) return fail(422, mapped.error, { errors: { [mapped.field]: mapped.error } });
  try {
    const row = await db.listing.create({ data: mapped.data });
    await audit(g.session, "create", "listing", row.id, { slug: row.slug });
    bust("listings");
    return ok({ listing: plain(listingOut((await getListingRow(row.id))!)) }, { status: 201 });
  } catch (e) {
    return dbError(e, "A listing with that slug");
  }
}
