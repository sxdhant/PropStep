import { db } from "@/lib/db";
import { ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust, dbError } from "@/lib/admin/ops";
import { areaInput } from "@/lib/validation/admin";

export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  return ok({ items: await db.area.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] }) });
}

export async function POST(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const parsed = await parseBody(req, areaInput, 4000);
  if ("res" in parsed) return parsed.res;
  try {
    const row = await db.area.create({ data: parsed.data });
    await audit(g.session, "create", "area", row.id, parsed.data);
    bust("areas");
    return ok({ area: row }, { status: 201 });
  } catch (e) {
    return dbError(e, "That area");
  }
}
