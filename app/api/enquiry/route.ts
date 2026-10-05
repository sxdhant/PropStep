/**
 * POST /api/enquiry — receives every form on the site (site visits, enquiries, newsletter).
 *
 * Set ENQUIRY_WEBHOOK_URL to forward leads as JSON to your CRM, Zapier/Make, a Google Sheet
 * integration or a Slack workflow. Without it (e.g. in development) leads are logged to the
 * server console and the visitor still sees the success message.
 */
const FIELDS = ["form", "page", "name", "phone", "email", "enquiry", "subject", "property", "date", "time", "mode", "message", "consent"] as const;
const PHONE = /^(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots don't retry.
  if (body.company_website) return Response.json({ ok: true });

  const lead: Record<string, string> = {};
  for (const k of FIELDS) {
    const v = body[k];
    if (typeof v === "string" && v.trim()) lead[k] = v.trim().slice(0, 2000);
  }

  if (lead.form === "newsletter") {
    if (!lead.email || !EMAIL.test(lead.email)) return Response.json({ ok: false, error: "A valid email is required" }, { status: 422 });
  } else {
    if (!lead.name || !lead.phone || !PHONE.test(lead.phone.replace(/\s+/g, " "))) {
      return Response.json({ ok: false, error: "Name and a valid Indian mobile number are required" }, { status: 422 });
    }
    if (lead.consent !== "yes") return Response.json({ ok: false, error: "Consent is required" }, { status: 422 });
  }

  const payload = { ...lead, receivedAt: new Date().toISOString(), source: "propstep-website" };
  const hook = process.env.ENQUIRY_WEBHOOK_URL;

  if (!hook) {
    console.info("[enquiry] ENQUIRY_WEBHOOK_URL is not set — lead not forwarded:", payload);
    return Response.json({ ok: true, delivered: false });
  }

  try {
    const res = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return Response.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[enquiry] forwarding failed:", err);
    return Response.json({ ok: false, error: "Could not deliver enquiry" }, { status: 502 });
  }
}
