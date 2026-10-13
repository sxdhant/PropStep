import { csvSafe } from "@/lib/validation/common";

const cell = (v: unknown) => {
  const s = csvSafe(v == null ? "" : String(v));
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV download response. Cells that spreadsheets would run as formulas are neutralised first. */
export function csvResponse(filename: string, header: string[], rows: unknown[][]) {
  const body = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" },
  });
}
