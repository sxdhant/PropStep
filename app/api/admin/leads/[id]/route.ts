import { db } from "@/lib/db";
import { ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, dbError } from "@/lib/admin/ops";
import { leadUpdate } from "@/lib/validation/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { id } = await params;
  const parsed = await parseBody(req, leadUpdate, 1000);
  if ("res" in parsed) return parsed.res;
  try {
    const row = await db.lead.update({ where: { id }, data: parsed.data });
    await audit(g.session, "status", "lead", id, parsed.data);
    return ok({ lead: row });
  } catch (e) {
    return dbError(e, "Lead");
  }
}

/** Deleting a lead (and its visit) is Admin only */
export async function DELETE(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req, ["ADMIN"]);
  if ("res" in g) return g.res;
  const { id } = await params;
  try {
    await db.$transaction([db.siteVisit.deleteMany({ where: { leadId: id } }), db.lead.delete({ where: { id } })]);
    await audit(g.session, "delete", "lead", id);
    return ok();
  } catch (e) {
    return dbError(e, "Lead");
  }
}
