import { db } from "@/lib/db";
import { ok, requireAdmin } from "@/lib/http";
import { plain } from "@/lib/admin/ops";

/** GET /api/admin/leads?status&q&page */
export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const q = new URL(req.url).searchParams;
  const status = q.get("status");
  const term = q.get("q")?.trim();
  const page = Math.max(1, Number(q.get("page") ?? 1) || 1);
  const where = {
    ...(status === "NEW" || status === "CONTACTED" || status === "CLOSED" ? { status: status as "NEW" } : {}),
    ...(term
      ? { OR: [{ name: { contains: term, mode: "insensitive" as const } }, { phone: { contains: term } }, { email: { contains: term, mode: "insensitive" as const } }] }
      : {}),
  };
  const [total, items] = await Promise.all([
    db.lead.count({ where }),
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
      include: { listing: { select: { slug: true, title: true } }, visit: { select: { date: true, slot: true, mode: true, status: true } } },
    }),
  ]);
  return ok(plain({ total, page, pages: Math.max(1, Math.ceil(total / 25)), items }));
}
