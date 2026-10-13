import { db } from "@/lib/db";
import { hasDb } from "@/lib/data";
import { clientIp, fail, hashIp, ok, parseBody, rateLimited, sameOrigin } from "@/lib/http";
import { alertTeam, forwardToWebhook } from "@/lib/notify";
import { enquirySchema } from "@/lib/validation/forms";

/**
 * POST /api/enquiry: contact, listing and locality enquiry forms.
 * The lead is saved before the visitor sees "success". Without a database it is forwarded to
 * ENQUIRY_WEBHOOK_URL instead; with neither, production returns 503 rather than silently dropping it.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Blocked cross-site request");
  const ip = clientIp(req);
  if (rateLimited(`enquiry:${ip}`, 6, 10 * 60_000)) return fail(429, "Too many requests. Please try again in a few minutes.");

  const parsed = await parseBody(req, enquirySchema.extend({ company_website: enquirySchema.shape.subject }));
  if ("res" in parsed) return parsed.res;
  const { company_website, idempotencyKey, ...d } = parsed.data;
  if (company_website) return ok(); // honeypot: real visitors never fill it, so pretend success

  if (hasDb()) {
    try {
      if (idempotencyKey) {
        const dup = await db.lead.findUnique({ where: { idempotency: idempotencyKey }, select: { id: true } });
        if (dup) return ok({ duplicate: true });
      }
      await db.lead.create({
        data: {
          form: d.form || "enquiry",
          name: d.name,
          phone: d.phone,
          email: d.email,
          enquiryType: d.enquiry,
          subject: d.subject,
          message: d.message,
          page: d.page,
          consentAt: new Date(),
          ipHash: hashIp(ip),
          idempotency: idempotencyKey,
        },
      });
    } catch (err) {
      console.error("[enquiry] save failed:", err);
      return fail(500, "Could not save your enquiry");
    }
    void forwardToWebhook({ ...d, type: "enquiry" });
    void alertTeam(`New enquiry: ${d.name}`, { Name: d.name, Phone: d.phone, Email: d.email, Type: d.enquiry, About: d.subject, Message: d.message });
    return ok();
  }

  const delivered = await forwardToWebhook({ ...d, type: "enquiry" });
  if (delivered) return ok({ delivered: true });
  if (process.env.NODE_ENV !== "production") {
    console.info("[enquiry] no database or webhook configured; lead not stored:", d);
    return ok({ delivered: false });
  }
  return fail(503, "We can't take enquiries right now. Please call us.");
}
