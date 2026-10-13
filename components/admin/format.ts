/** Plain helpers with no "use client": safe to call from server pages and client components alike */
export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: iso.length > 10 ? "short" : undefined, timeZone: "Asia/Kolkata" }) : "");
