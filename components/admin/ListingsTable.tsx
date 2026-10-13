"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Select from "./Select";
import { api, fmtDate, Pager, Pill, Problems, useLoad } from "./ui";

type Row = { id: string; slug: string; title: string; locality: string; priceLabel: string; status: "DRAFT" | "PUBLISHED"; updatedAt: string };

export default function ListingsTable() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const [msg, setMsg] = useState<{ error?: string; problems?: string[]; ok?: string }>({});

  useEffect(() => {
    setStatus(new URLSearchParams(window.location.search).get("status") ?? "");
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, reload } = useLoad<{ items: Row[]; page: number; pages: number; total: number }>(
    `/api/admin/listings?page=${page}&status=${status}&q=${encodeURIComponent(term)}`,
  );

  async function remove(r: Row) {
    if (!confirm(`Delete "${r.title}"? This removes it from the website.`)) return;
    const res = await api(`/api/admin/listings/${r.id}`, { method: "DELETE" });
    if (!res.ok) setMsg({ error: res.data.error });
    else reload();
  }

  async function importCsv(file: File, publish: boolean) {
    setMsg({});
    const csv = await file.text();
    const check = await api("/api/admin/listings/import", { method: "POST", body: { csv, mode: "check", publish } });
    if (!check.ok) return setMsg({ error: check.data.error, problems: check.data.problems });
    if (!confirm(`The sheet is valid (${check.data.rows} rows). Import it${publish ? " and publish" : " as drafts"}? Existing listings with the same slug will be updated.`)) return;
    const done = await api("/api/admin/listings/import", { method: "POST", body: { csv, mode: "apply", publish } });
    if (!done.ok) return setMsg({ error: done.data.error, problems: done.data.problems });
    setMsg({ ok: `Imported: ${done.data.created} new, ${done.data.updated} updated.` });
    reload();
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Listings</h1>
        </div>
        <div>
          <a className="a-btn" href="/api/admin/listings/export">
            Export CSV
          </a>
          <label className="a-btn" style={{ cursor: "pointer" }}>
            Import CSV (drafts)
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0], false).finally(() => (e.target.value = ""))} />
          </label>
          <label className="a-btn" style={{ cursor: "pointer" }}>
            Import &amp; publish
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0], true).finally(() => (e.target.value = ""))} />
          </label>
          <Link className="a-btn primary" href="/admin/listings/new/">
            New listing
          </Link>
        </div>
      </div>
      <Problems error={msg.error} problems={msg.problems} />
      {msg.ok ? <div className="a-alert ok">{msg.ok}</div> : null}
      <div className="a-row" style={{ maxWidth: 520 }}>
        <input placeholder="Search title, locality or slug" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search listings" />
        <Select label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[["", "All listings"], ["PUBLISHED", "Published"], ["DRAFT", "Draft"]]} />
      </div>
      {error ? <Problems error={error} /> : null}
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Locality</th>
              <th>Price</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/listings/${r.id}/`}>{r.title}</Link>
                  <br />
                  <small className="admin-sub">{r.slug}</small>
                </td>
                <td>{r.locality}</td>
                <td>{r.priceLabel}</td>
                <td>
                  <Pill tone={r.status === "PUBLISHED" ? "green" : "amber"}>{r.status === "PUBLISHED" ? "Published" : "Draft"}</Pill>
                </td>
                <td>{fmtDate(r.updatedAt)}</td>
                <td className="num">
                  {r.status === "PUBLISHED" ? (
                    <a className="a-btn sm" href={`/properties/${r.slug}/`} target="_blank" rel="noopener">
                      View
                    </a>
                  ) : null}{" "}
                  <button className="a-btn sm danger" onClick={() => remove(r)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data?.items.length === 0 ? <div className="a-empty">No listings found.</div> : null}
        {loading ? <div className="a-empty">Loading…</div> : null}
      </div>
      {data ? <Pager page={data.page} pages={data.pages} onPage={setPage} /> : null}
    </>
  );
}
