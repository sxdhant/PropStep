import { db } from "@/lib/db";
import { COLUMNS, listingToCells } from "@/lib/listings-csv.mjs";
import { requireAdmin } from "@/lib/http";
import { csvResponse } from "@/lib/admin/csv";
import { toListing } from "@/lib/data";

/** GET /api/admin/listings/export: every listing (drafts too) in the content/listings.csv format */
export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if ("res" in g) return g.res;
  const rows = await db.listing.findMany({ orderBy: { slug: "asc" }, include: { advisor: true, localityRef: { select: { slug: true } } } });
  return csvResponse("propstep-listings.csv", COLUMNS, rows.map((r) => listingToCells(toListing(r))));
}
