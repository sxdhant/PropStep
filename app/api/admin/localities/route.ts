import { db } from "@/lib/db";
import { ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust, dbError } from "@/lib/admin/ops";
import { localityInput } from "@/lib/validation/admin";

export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  return ok({ items: await db.locality.findMany({ orderBy: { name: "asc" } }) });
}

export async function POST(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const parsed = await parseBody(req, localityInput);
  if ("res" in parsed) return parsed.res;
  const { image, ...d } = parsed.data;
  try {
    const row = await db.locality.create({ data: { ...d, imageId: image.id, imageAlt: image.alt } });
    await audit(g.session, "create", "locality", row.id, { slug: row.slug });
    bust("localities", "listings", "areas");
    return ok({ locality: row }, { status: 201 });
  } catch (e) {
    return dbError(e, "A locality with that slug");
  }
}
