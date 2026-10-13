import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/http";
import { csvResponse } from "@/lib/admin/csv";

/** GET /api/admin/leads/export: every lead as CSV */
export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const rows = await db.lead.findMany({ orderBy: { createdAt: "desc" }, include: { listing: { select: { title: true } }, visit: true } });
  return csvResponse(
    "propstep-leads.csv",
    ["Received", "Form", "Status", "Name", "Phone", "Email", "Type", "About", "Message", "Listing", "Visit date", "Slot", "Mode", "Page"],
    rows.map((l) => [
      l.createdAt.toISOString(), l.form, l.status, l.name, l.phone, l.email, l.enquiryType, l.subject, l.message, l.listing?.title,
      l.visit?.date.toISOString().slice(0, 10), l.visit?.slot, l.visit?.mode, l.page,
    ]),
  );
}
