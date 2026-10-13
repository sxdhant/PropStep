import { db } from "@/lib/db";
import { ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust, dbError } from "@/lib/admin/ops";
import { advisorInput } from "@/lib/validation/admin";

export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  return ok({ items: await db.advisor.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { listings: true } } } }) });
}

export async function POST(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const parsed = await parseBody(req, advisorInput, 4000);
  if ("res" in parsed) return parsed.res;
  try {
    const row = await db.advisor.create({ data: parsed.data });
    await audit(g.session, "create", "advisor", row.id, { key: row.key });
    bust("site", "listings");
    return ok({ advisor: row }, { status: 201 });
  } catch (e) {
    return dbError(e, "An advisor with that key");
  }
}
