import { db } from "@/lib/db";
import { hasDb } from "@/lib/data";

/** GET /api/newsletter/unsubscribe?token=…: one-click unsubscribe, then back to the home page. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  let status = "invalid";
  if (hasDb() && /^[a-f0-9]{48}$/.test(token)) {
    const r = await db.subscriber.updateMany({ where: { token }, data: { unsubscribedAt: new Date() } });
    if (r.count) status = "unsubscribed";
  }
  return Response.redirect(new URL(`/?newsletter=${status}`, url.origin), 303);
}
