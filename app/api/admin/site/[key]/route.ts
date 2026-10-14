import { db } from "@/lib/db";
import { fail, ok, parseBody, requireAdmin } from "@/lib/http";
import { audit, bust } from "@/lib/admin/ops";
import { getSite } from "@/lib/data";
import { DEFAULT_MARQUEE, DEFAULT_PILLARS } from "@/lib/pillars";
import { isSettingKey, SETTINGS } from "@/lib/validation/admin";

type Ctx = { params: Promise<{ key: string }> };

/** GET /api/admin/site/[key]: the current value of one settings block (falls back to the bundled content) */
export async function GET(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { key } = await params;
  if (!isSettingKey(key)) return fail(404, "Unknown setting");
  const row = await db.siteSetting.findUnique({ where: { key } });
  return ok({ key, value: row ? row.value : key === "pillars" ? DEFAULT_PILLARS : key === "marquee" ? DEFAULT_MARQUEE : ((await getSite()) as unknown as Record<string, unknown>)[key] });
}

export async function PUT(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const { key } = await params;
  if (!isSettingKey(key)) return fail(404, "Unknown setting");
  const parsed = await parseBody(req, SETTINGS[key]);
  if ("res" in parsed) return parsed.res;
  const value = JSON.parse(JSON.stringify(parsed.data));
  await db.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await audit(g.session, "update", "site-setting", key);
  bust("site");
  return ok({ key, value });
}
