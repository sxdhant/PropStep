import { db } from "@/lib/db";
import { fail, ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust, dbError } from "@/lib/admin/ops";
import { advisorInput } from "@/lib/validation/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { id } = await params;
  const parsed = await parseBody(req, advisorInput, 4000);
  if ("res" in parsed) return parsed.res;
  try {
    const row = await db.advisor.update({ where: { id }, data: parsed.data });
    await audit(g.session, "update", "advisor", id, { key: row.key });
    bust("site", "listings");
    return ok({ advisor: row });
  } catch (e) {
    return dbError(e, "Advisor");
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { id } = await params;
  const n = await db.listing.count({ where: { advisorId: id } });
  if (n) return fail(409, `${n} listing${n === 1 ? " is" : "s are"} assigned to this advisor. Reassign them first.`);
  try {
    await db.advisor.delete({ where: { id } });
    await audit(g.session, "delete", "advisor", id);
    bust("site");
    return ok();
  } catch (e) {
    return dbError(e, "Advisor");
  }
}
