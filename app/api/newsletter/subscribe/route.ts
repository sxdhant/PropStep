import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hasDb, SITE_URL } from "@/lib/data";
import { clientIp, fail, ok, parseBody, rateLimited, sameOrigin } from "@/lib/http";
import { forwardToWebhook, mailEnabled, sendMail } from "@/lib/notify";
import { optText } from "@/lib/validation/common";
import { newsletterSchema } from "@/lib/validation/forms";

/**
 * POST /api/newsletter/subscribe: double opt-in. We email a confirmation link; the address only counts once clicked.
 * Without email configured (RESEND_API_KEY + MAIL_FROM) the address is stored as confirmed so signups aren't lost.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Blocked cross-site request");
  if (rateLimited(`news:${clientIp(req)}`, 5, 10 * 60_000)) return fail(429, "Too many requests. Please try again shortly.");

  const parsed = await parseBody(req, newsletterSchema.extend({ company_website: optText(100) }), 4000);
  if ("res" in parsed) return parsed.res;
  const { email, company_website } = parsed.data;
  if (company_website) return ok();

  if (!hasDb()) {
    const delivered = await forwardToWebhook({ email, type: "newsletter" });
    if (delivered || process.env.NODE_ENV !== "production") return ok({ delivered });
    return fail(503, "We can't take signups right now.");
  }

  try {
    const existing = await db.subscriber.findUnique({ where: { email } });
    if (existing?.confirmedAt && !existing.unsubscribedAt) return ok(); // already subscribed: say nothing different
    const token = existing?.token ?? randomBytes(24).toString("hex");
    const direct = !mailEnabled();
    await db.subscriber.upsert({
      where: { email },
      create: { email, token, confirmedAt: direct ? new Date() : null },
      update: { unsubscribedAt: null, confirmedAt: direct ? new Date() : null },
    });
    if (!direct) {
      const link = `${SITE_URL}/api/newsletter/confirm?token=${token}`;
      await sendMail(email, "Confirm your Propstep subscription", `<p>Tap to confirm you'd like Propstep's monthly market notes:</p><p><a href="${link}">Confirm subscription</a></p><p>If you didn't ask for this, ignore this email.</p>`);
    }
    return ok({ pending: !direct });
  } catch (err) {
    console.error("[newsletter] subscribe failed:", err);
    return fail(500, "Could not subscribe you just now");
  }
}
