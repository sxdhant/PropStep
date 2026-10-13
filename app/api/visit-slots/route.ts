import { db } from "@/lib/db";
import { hasDb } from "@/lib/data";
import { fail, ok } from "@/lib/http";
import { isSunday, todayIST } from "@/lib/validation/common";
import { SLOT_CAPACITY, SLOTS } from "@/lib/validation/forms";

/** GET /api/visit-slots?date=YYYY-MM-DD: how many places are left in each time slot that day. */
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return fail(422, "date must be YYYY-MM-DD");
  if (date <= todayIST() || isSunday(date)) return ok({ date, slots: SLOTS.map((slot) => ({ slot, remaining: 0 })) });

  const counts = new Map<string, number>();
  if (hasDb()) {
    const rows = await db.siteVisit.groupBy({
      by: ["slot"],
      where: { date: new Date(`${date}T00:00:00Z`), status: { in: ["PENDING", "CONFIRMED"] } },
      _count: { _all: true },
    });
    rows.forEach((r) => counts.set(r.slot, r._count._all));
  }
  return ok({ date, slots: SLOTS.map((slot) => ({ slot, remaining: Math.max(0, SLOT_CAPACITY - (counts.get(slot) ?? 0)) })) });
}
