import { db } from "@/lib/db";
import { ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, dbError } from "@/lib/admin/ops";
import { visitUpdate } from "@/lib/validation/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { id } = await params;
  const parsed = await parseBody(req, visitUpdate, 1000);
  if ("res" in parsed) return parsed.res;
  try {
    const row = await db.siteVisit.update({ where: { id }, data: parsed.data });
    await audit(g.session, "status", "visit", id, parsed.data);
    return ok({ visit: row });
  } catch (e) {
    return dbError(e, "Visit");
  }
}
