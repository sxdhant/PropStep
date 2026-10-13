import { db } from "@/lib/db";
import { hasDb } from "@/lib/data";

/** GET /api/newsletter/confirm?token=…: marks the address confirmed, then sends the visitor home. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  let status = "invalid";
  if (hasDb() && /^[a-f0-9]{48}$/.test(token)) {
    const r = await db.subscriber.updateMany({ where: { token }, data: { confirmedAt: new Date(), unsubscribedAt: null } });
    if (r.count) status = "confirmed";
  }
  return Response.redirect(new URL(`/?newsletter=${status}`, url.origin), 303);
}
