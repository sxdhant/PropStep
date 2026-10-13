import Link from "next/link";
import { db } from "@/lib/db";
import { Pill } from "@/components/admin/ui";
import { fmtDate } from "@/components/admin/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const [newLeads, drafts, published, upcoming, subscribers, recent, visits] = await Promise.all([
    db.lead.count({ where: { status: "NEW" } }),
    db.listing.count({ where: { status: "DRAFT" } }),
    db.listing.count({ where: { status: "PUBLISHED" } }),
    db.siteVisit.count({ where: { date: { gte: today }, status: { in: ["PENDING", "CONFIRMED"] } } }),
    db.subscriber.count({ where: { confirmedAt: { not: null }, unsubscribedAt: null } }),
    db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.siteVisit.findMany({ where: { date: { gte: today }, status: { in: ["PENDING", "CONFIRMED"] } }, orderBy: [{ date: "asc" }, { slot: "asc" }], take: 6, include: { lead: { select: { name: true, phone: true } }, listing: { select: { title: true } } } }),
  ]);
  const stats: [number, string, string][] = [
    [newLeads, "New leads", "/admin/leads/"],
    [upcoming, "Upcoming visits", "/admin/visits/"],
    [published, "Live listings", "/admin/listings/?status=PUBLISHED"],
    [drafts, "Draft listings", "/admin/listings/?status=DRAFT"],
    [subscribers, "Subscribers", "/admin/subscribers/"],
  ];
  return (
    <>
      <h1>Dashboard</h1>
      <p className="admin-sub">What needs attention today.</p>
      <div className="a-stats">
        {stats.map(([n, label, href]) => (
          <Link key={label} href={href} className="a-stat" style={{ textDecoration: "none", color: "inherit" }}>
            <b>{n}</b>
            <span>{label}</span>
          </Link>
        ))}
      </div>
      <div className="a-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <section className="a-card">
          <h2>Latest leads</h2>
          {recent.length === 0 ? <p className="admin-sub">No leads yet.</p> : null}
          {recent.map((l) => (
            <p key={l.id} style={{ margin: "0 0 10px" }}>
              <b>{l.name}</b> · {l.phone} {l.status === "NEW" ? <Pill tone="blue">New</Pill> : null}
              <br />
              <span className="admin-sub" style={{ margin: 0 }}>
                {l.enquiryType ?? l.form} · {fmtDate(l.createdAt.toISOString())}
              </span>
            </p>
          ))}
        </section>
        <section className="a-card">
          <h2>Upcoming site visits</h2>
          {visits.length === 0 ? <p className="admin-sub">Nothing booked.</p> : null}
          {visits.map((v) => (
            <p key={v.id} style={{ margin: "0 0 10px" }}>
              <b>{v.date.toISOString().slice(0, 10)}</b> · {v.slot} · {v.mode}
              <br />
              <span className="admin-sub" style={{ margin: 0 }}>
                {v.lead.name} ({v.lead.phone}) {v.listing ? `· ${v.listing.title}` : ""}
              </span>
            </p>
          ))}
        </section>
      </div>
    </>
  );
}
