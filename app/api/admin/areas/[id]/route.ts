import { db } from "@/lib/db";
import { ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust, dbError } from "@/lib/admin/ops";
import { areaInput } from "@/lib/validation/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { id } = await params;
  const parsed = await parseBody(req, areaInput, 4000);
  if ("res" in parsed) return parsed.res;
  try {
    const row = await db.area.update({ where: { id }, data: parsed.data });
    await audit(g.session, "update", "area", id, parsed.data);
    bust("areas");
    return ok({ area: row });
  } catch (e) {
    return dbError(e, "Area");
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { id } = await params;
  try {
    await db.area.delete({ where: { id } });
    await audit(g.session, "delete", "area", id);
    bust("areas");
    return ok();
  } catch (e) {
    return dbError(e, "Area");
  }
}
