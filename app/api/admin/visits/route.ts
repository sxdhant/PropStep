import { db } from "@/lib/db";
import { ok, requireAdmin } from "@/lib/http";
import { plain } from "@/lib/admin/ops";

/** GET /api/admin/visits?status&upcoming=1 */
export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const q = new URL(req.url).searchParams;
  const status = q.get("status");
  const items = await db.siteVisit.findMany({
    where: {
      ...(status === "PENDING" || status === "CONFIRMED" || status === "COMPLETED" || status === "CANCELLED" ? { status: status as "PENDING" } : {}),
      ...(q.get("upcoming") ? { date: { gte: new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z") } } : {}),
    },
    orderBy: [{ date: "asc" }, { slot: "asc" }],
    take: 200,
    include: { lead: { select: { name: true, phone: true, email: true } }, listing: { select: { slug: true, title: true } } },
  });
  return ok(plain({ items }));
}
