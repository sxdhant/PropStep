import { db } from "@/lib/db";
import { ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust } from "@/lib/admin/ops";
import { testimonialsInput } from "@/lib/validation/admin";

export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const rows = await db.testimonial.findMany({ orderBy: { sort: "asc" } });
  return ok({ items: rows.map(({ quote, name, meta }) => ({ quote, name, meta })) });
}

/** PUT replaces the whole ordered list */
export async function PUT(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const parsed = await parseBody(req, testimonialsInput);
  if ("res" in parsed) return parsed.res;
  await db.$transaction([db.testimonial.deleteMany(), db.testimonial.createMany({ data: parsed.data.map((t, sort) => ({ ...t, sort })) })]);
  await audit(g.session, "replace", "testimonials", undefined, { count: parsed.data.length });
  bust("site");
  return ok({ items: parsed.data });
}
