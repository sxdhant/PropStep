import { db } from "@/lib/db";
import { ok, requireAdmin } from "@/lib/http";
import { plain } from "@/lib/admin/ops";

/** Admin only: GET /api/admin/audit?page — who changed what */
export async function GET(req: Request) {
  const g = await requireAdmin(req, ["ADMIN"]);
  if ("res" in g) return g.res;
  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") ?? 1) || 1);
  const [total, items] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50, include: { user: { select: { email: true } } } }),
  ]);
  return ok(plain({ total, page, pages: Math.max(1, Math.ceil(total / 50)), items }));
}
