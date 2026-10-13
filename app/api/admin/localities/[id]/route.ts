import { db } from "@/lib/db";
import { fail, ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust, dbError } from "@/lib/admin/ops";
import { localityInput } from "@/lib/validation/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const row = await db.locality.findUnique({ where: { id: (await params).id } });
  return row ? ok({ locality: row }) : fail(404, "Locality not found");
}

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { id } = await params;
  const parsed = await parseBody(req, localityInput);
  if ("res" in parsed) return parsed.res;
  const { image, ...d } = parsed.data;
  try {
    const row = await db.locality.update({ where: { id }, data: { ...d, imageId: image.id, imageAlt: image.alt } });
    await audit(g.session, "update", "locality", id, { slug: row.slug });
    bust("localities", "listings", "areas");
    return ok({ locality: row });
  } catch (e) {
    return dbError(e, "Locality");
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { id } = await params;
  if (await db.listing.count({ where: { localityId: id } })) return fail(409, "Some listings still point at this locality. Move or unlink them first.");
  try {
    await db.locality.delete({ where: { id } });
    await audit(g.session, "delete", "locality", id);
    bust("localities", "areas");
    return ok();
  } catch (e) {
    return dbError(e, "Locality");
  }
}
