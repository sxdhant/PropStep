import { db } from "@/lib/db";
import { ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust } from "@/lib/admin/ops";
import { faqsInput } from "@/lib/validation/admin";

export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const rows = await db.faq.findMany({ orderBy: { sort: "asc" } });
  return ok({ items: rows.map((f) => ({ q: f.question, a: f.answer })) });
}

/** PUT replaces the whole ordered list */
export async function PUT(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const parsed = await parseBody(req, faqsInput);
  if ("res" in parsed) return parsed.res;
  await db.$transaction([db.faq.deleteMany(), db.faq.createMany({ data: parsed.data.map((f, sort) => ({ question: f.q, answer: f.a, sort })) })]);
  await audit(g.session, "replace", "faqs", undefined, { count: parsed.data.length });
  bust("site");
  return ok({ items: parsed.data });
}
