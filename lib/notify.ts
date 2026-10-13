/**
 * Best-effort notifications. A failure here is logged but never loses a lead: the database row is the record.
 *   ENQUIRY_WEBHOOK_URL  forward every lead as JSON (Zapier/Make, CRM, Slack workflow)
 *   RESEND_API_KEY + MAIL_FROM  send emails (newsletter confirmation, team alerts to NOTIFY_EMAIL)
 */
export async function forwardToWebhook(payload: Record<string, unknown>) {
  const hook = process.env.ENQUIRY_WEBHOOK_URL;
  if (!hook) return false;
  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, receivedAt: new Date().toISOString(), source: "propstep-website" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return true;
  } catch (err) {
    console.error("[notify] webhook failed:", err);
    return false;
  }
}

export const mailEnabled = () => !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM;

export async function sendMail(to: string, subject: string, html: string) {
  if (!mailEnabled()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}`);
    return true;
  } catch (err) {
    console.error("[notify] mail failed:", err);
    return false;
  }
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Alert the team about a new lead (email, if configured) */
export async function alertTeam(title: string, fields: Record<string, string | undefined>) {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return;
  const rows = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0"><b>${escapeHtml(k)}</b></td><td>${escapeHtml(v!)}</td></tr>`)
    .join("");
  await sendMail(to, title, `<table>${rows}</table>`);
}
