import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/http";
import { csvResponse } from "@/lib/admin/csv";

/** GET /api/admin/subscribers/export: confirmed, still-subscribed addresses as CSV */
export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const rows = await db.subscriber.findMany({ where: { confirmedAt: { not: null }, unsubscribedAt: null }, orderBy: { createdAt: "asc" } });
  return csvResponse("propstep-subscribers.csv", ["Email", "Subscribed"], rows.map((s) => [s.email, s.confirmedAt?.toISOString()]));
}
