"use client";

import { useEffect, useState } from "react";
import Select from "./Select";
import { Alert, api, fmtDate, Pager, Pill, useLoad } from "./ui";

type Lead = {
  id: string; form: string; name: string; phone: string; email: string | null; enquiryType: string | null; subject: string | null; message: string | null;
  status: "NEW" | "CONTACTED" | "CLOSED"; createdAt: string; page: string | null;
  listing: { slug: string; title: string } | null; visit: { date: string; slot: string; mode: string; status: string } | null;
};
const LEAD_TONE = { NEW: "blue", CONTACTED: "amber", CLOSED: "green" } as const;

export function Leads() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setTerm(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, loading, error, reload } = useLoad<{ items: Lead[]; page: number; pages: number; total: number }>(`/api/admin/leads?page=${page}&status=${status}&q=${encodeURIComponent(term)}`);

  async function setLead(id: string, s: string) {
    const r = await api(`/api/admin/leads/${id}`, { method: "PATCH", body: { status: s } });
    if (!r.ok) setMsg(r.data.error ?? "Could not update");
    else reload();
  }
  async function remove(l: Lead) {
    if (!confirm(`Delete the lead from ${l.name}? This can't be undone.`)) return;
    const r = await api(`/api/admin/leads/${l.id}`, { method: "DELETE" });
    if (!r.ok) setMsg(r.data.error ?? "Could not delete");
    else reload();
  }
  return (
    <>
      <div className="admin-head">
        <h1>Leads {data ? <small className="admin-sub">({data.total})</small> : null}</h1>
        <a className="a-btn" href="/api/admin/leads/export">Export CSV</a>
      </div>
      {msg || error ? <Alert>{msg || error}</Alert> : null}
      <div className="a-row" style={{ maxWidth: 520 }}>
        <input placeholder="Search name, phone or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search leads" />
        <Select label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[["", "All statuses"], ["NEW", "New"], ["CONTACTED", "Contacted"], ["CLOSED", "Closed"]]} />
      </div>
      <div className="a-table-wrap">
        <table className="a-table">
          <thead><tr><th>Received</th><th>Who</th><th>About</th><th>Status</th><th /></tr></thead>
          <tbody>
            {data?.items.map((l) => (
              <tr key={l.id}>
                <td>{fmtDate(l.createdAt)}</td>
                <td>
                  <b>{l.name}</b><br />
                  <a href={`tel:${l.phone}`}>{l.phone}</a>
                  {l.email ? <><br /><a href={`mailto:${l.email}`}>{l.email}</a></> : null}
                </td>
                <td style={{ maxWidth: 340 }}>
                  <Pill>{l.form === "site-visit" ? "Site visit" : l.enquiryType ?? l.form}</Pill>{" "}
                  {l.subject ?? l.listing?.title ?? ""}
                  {l.visit ? <><br /><small>{l.visit.date.slice(0, 10)} · {l.visit.slot} · {l.visit.mode}</small></> : null}
                  {l.message ? <><br /><small className="admin-sub">{l.message}</small></> : null}
                </td>
                <td>
                  <Select compact label="Lead status" value={l.status} onChange={(v) => setLead(l.id, v)} options={[["NEW", "New"], ["CONTACTED", "Contacted"], ["CLOSED", "Closed"]]} />
                </td>
                <td className="num"><button className="a-btn sm danger" onClick={() => remove(l)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <div className="a-empty">Loading…</div> : data?.items.length === 0 ? <div className="a-empty">No leads yet.</div> : null}
      </div>
      {data ? <Pager page={data.page} pages={data.pages} onPage={setPage} /> : null}
    </>
  );
}

type Visit = { id: string; date: string; slot: string; mode: string; status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"; lead: { name: string; phone: string; email: string | null }; listing: { slug: string; title: string } | null };
const VISIT_TONE = { PENDING: "amber", CONFIRMED: "blue", COMPLETED: "green", CANCELLED: "red" } as const;

export function Visits() {
  const [upcoming, setUpcoming] = useState(true);
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState("");
  const { data, loading, error, reload } = useLoad<{ items: Visit[] }>(`/api/admin/visits?status=${status}${upcoming ? "&upcoming=1" : ""}`);
  async function setVisit(id: string, s: string) {
    const r = await api(`/api/admin/visits/${id}`, { method: "PATCH", body: { status: s } });
    if (!r.ok) setMsg(r.data.error ?? "Could not update");
    else reload();
  }
  return (
    <>
      <div className="admin-head"><h1>Site visits</h1></div>
      {msg || error ? <Alert>{msg || error}</Alert> : null}
      <div className="a-row" style={{ maxWidth: 520 }}>
        <label className="a-check"><input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} /> Upcoming only</label>
        <Select label="Status" value={status} onChange={setStatus} options={[["", "Any status"], ["PENDING", "Pending"], ["CONFIRMED", "Confirmed"], ["COMPLETED", "Completed"], ["CANCELLED", "Cancelled"]]} />
      </div>
      <div className="a-table-wrap">
        <table className="a-table">
          <thead><tr><th>When</th><th>Visitor</th><th>Property</th><th>Mode</th><th>Status</th></tr></thead>
          <tbody>
            {data?.items.map((v) => (
              <tr key={v.id}>
                <td><b>{v.date.slice(0, 10)}</b><br />{v.slot}</td>
                <td>{v.lead.name}<br /><a href={`tel:${v.lead.phone}`}>{v.lead.phone}</a></td>
                <td>{v.listing?.title ?? "Not sure yet"}</td>
                <td>{v.mode}</td>
                <td>
                  <Select compact label="Visit status" value={v.status} onChange={(x) => setVisit(v.id, x)} options={[["PENDING", "Pending"], ["CONFIRMED", "Confirmed"], ["COMPLETED", "Completed"], ["CANCELLED", "Cancelled"]]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <div className="a-empty">Loading…</div> : data?.items.length === 0 ? <div className="a-empty">No visits.</div> : null}
      </div>
    </>
  );
}

type Sub = { id: string; email: string; confirmedAt: string | null; unsubscribedAt: string | null; createdAt: string };
export function Subscribers() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useLoad<{ items: Sub[]; page: number; pages: number; total: number }>(`/api/admin/subscribers?page=${page}`);
  return (
    <>
      <div className="admin-head">
        <h1>Subscribers {data ? <small className="admin-sub">({data.total})</small> : null}</h1>
        <a className="a-btn" href="/api/admin/subscribers/export">Export confirmed (CSV)</a>
      </div>
      {error ? <Alert>{error}</Alert> : null}
      <div className="a-table-wrap">
        <table className="a-table">
          <thead><tr><th>Email</th><th>Signed up</th><th>Status</th></tr></thead>
          <tbody>
            {data?.items.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td>{fmtDate(s.createdAt)}</td>
                <td>{s.unsubscribedAt ? <Pill tone="red">Unsubscribed</Pill> : s.confirmedAt ? <Pill tone="green">Confirmed</Pill> : <Pill tone="amber">Awaiting confirmation</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <div className="a-empty">Loading…</div> : data?.items.length === 0 ? <div className="a-empty">No subscribers yet.</div> : null}
      </div>
      {data ? <Pager page={data.page} pages={data.pages} onPage={setPage} /> : null}
    </>
  );
}
