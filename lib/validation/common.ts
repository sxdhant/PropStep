import { z } from "zod";

/** Strip control characters (keeps \n and \t) so pasted junk can't reach the database or exports. */
export const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

/** Today's date in India (YYYY-MM-DD): visit dates are judged in IST whatever the server's clock zone */
export const todayIST = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const isSunday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay() === 0;

/**
 * Normalise a phone number to E.164. Indian mobiles (with or without +91/91/0) become +91XXXXXXXXXX;
 * other countries must start with "+" and have 8-15 digits (NRIs). Returns null when invalid.
 */
export function normalizePhone(raw: string): string | null {
  const t = raw.replace(/[\s\-().]/g, "");
  const indian = /^(?:\+?91|0)?([6-9]\d{9})$/.exec(t);
  if (indian) return `+91${indian[1]}`;
  if (/^\+[1-9]\d{7,14}$/.test(t)) return t;
  return null;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Prefix cells that spreadsheets treat as formulas, for CSV / Sheets exports */
export const csvSafe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

/* ---------- reusable zod pieces ---------- */
export const reqText = (label: string, max: number) =>
  z
    .string({ message: `${label} is required` })
    .transform(clean)
    .pipe(z.string().min(1, `${label} is required`).max(max, `${label} is too long`));
export const optText = (max: number) =>
  z
    .string()
    .nullish()
    .transform((v) => (v ? clean(v) : undefined))
    .pipe(z.string().max(max).optional());
export const optEmail = z
  .string()
  .nullish()
  .transform((v) => (v ? clean(v) : undefined))
  .pipe(z.string().regex(EMAIL_RE, "Enter a valid email address").max(254).optional());
export const phone = z
  .string({ message: "Phone number is required" })
  .transform((v, ctx) => {
    const p = normalizePhone(v);
    if (!p) ctx.addIssue({ code: "custom", message: "Enter a valid mobile number. Use +country code for numbers outside India." });
    return p ?? "";
  });
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only")
  .max(120);
/** Photos: an https URL, an uploaded media path, a /public path or an Unsplash id */
export const photoRef = z
  .string()
  .max(500)
  .regex(/^(https:\/\/|\/api\/media\/|\/[A-Za-z0-9_\-./]+$|\d{10,}-[a-f0-9]{12})/, "Photo must be an uploaded image, an https link or an Unsplash id");
export const photo = z.object({ id: photoRef, alt: reqText("Photo description", 200) });

/** Flatten zod issues into { field: message } for forms */
export function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join(".") || "_";
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
