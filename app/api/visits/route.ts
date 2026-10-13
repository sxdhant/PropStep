import { db } from "@/lib/db";
import { hasDb } from "@/lib/data";
import { clientIp, fail, hashIp, ok, parseBody, rateLimited, sameOrigin } from "@/lib/http";
import { alertTeam, forwardToWebhook } from "@/lib/notify";
import { optText } from "@/lib/validation/common";
import { SLOT_CAPACITY, visitSchema } from "@/lib/validation/forms";

/** POST /api/visits: book a site visit. Validates date/slot/mode, checks capacity, saves a lead + visit. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Blocked cross-site request");
  const ip = clientIp(req);
  if (rateLimited(`visit:${ip}`, 5, 10 * 60_000)) return fail(429, "Too many requests. Please try again in a few minutes.");

  const parsed = await parseBody(req, visitSchema.safeExtend({ company_website: optText(100) }));
  if ("res" in parsed) return parsed.res;
  const { company_website, idempotencyKey, ...d } = parsed.data;
  if (company_website) return ok();

  if (!hasDb()) {
    const delivered = await forwardToWebhook({ ...d, type: "visit" });
    if (delivered || process.env.NODE_ENV !== "production") return ok({ delivered });
    return fail(503, "We can't take bookings right now. Please call us.");
  }

  try {
    if (idempotencyKey) {
      const dup = await db.lead.findUnique({ where: { idempotency: idempotencyKey }, select: { id: true } });
      if (dup) return ok({ duplicate: true });
    }
    const listing = d.property ? await db.listing.findFirst({ where: { slug: d.property, status: "PUBLISHED" }, select: { id: true, title: true } }) : null;
    if (d.property && !listing) return fail(422, "That property is no longer listed", { errors: { property: "Choose a listed property" } });

    const taken = await db.siteVisit.count({ where: { date: new Date(`${d.date}T00:00:00Z`), slot: d.time, status: { in: ["PENDING", "CONFIRMED"] } } });
    if (taken >= SLOT_CAPACITY) return fail(409, "That slot is fully booked. Please pick another time.", { errors: { time: "That slot is fully booked" } });

    await db.lead.create({
      data: {
        form: "site-visit",
        name: d.name,
        phone: d.phone,
        email: d.email,
        enquiryType: "visit",
        subject: listing?.title,
        page: d.page,
        listingId: listing?.id,
        consentAt: new Date(),
        ipHash: hashIp(ip),
        idempotency: idempotencyKey,
        visit: { create: { listingId: listing?.id, date: new Date(`${d.date}T00:00:00Z`), slot: d.time, mode: d.mode } },
      },
    });
  } catch (err) {
    console.error("[visits] save failed:", err);
    return fail(500, "Could not save your booking");
  }
  void forwardToWebhook({ ...d, type: "visit" });
  void alertTeam(`Site visit request: ${d.name}`, { Name: d.name, Phone: d.phone, Email: d.email, Property: d.property, Date: d.date, Slot: d.time, Mode: d.mode });
  return ok();
}
