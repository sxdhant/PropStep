"use client";

import { useState } from "react";
import { Alert, api, useLoad } from "./ui";

type Col = { key: string; label: string; type?: "text" | "number"; placeholder?: string };
type Row = Record<string, string | number> & { id?: string };

/** A table with an "add" row and inline editing, for small lists (search areas, advisors) */
export default function InlineCrud({ title, intro, endpoint, cols, defaults, showListingCount }: { title: string; intro: string; endpoint: string; cols: Col[]; defaults?: Row; showListingCount?: boolean }) {
  const { data, loading, error, reload } = useLoad<{ items: Row[] }>(endpoint);
  const [draft, setDraft] = useState<Row>(defaults ?? {});
  const [editing, setEditing] = useState<Row | null>(null);
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});

  const extra = showListingCount ? (r: Row) => `${(r as unknown as { _count?: { listings: number } })._count?.listings ?? 0} listings` : undefined;
  const payload = (r: Row) => Object.fromEntries(cols.map((c) => [c.key, c.type === "number" ? (r[c.key] === "" || r[c.key] == null ? undefined : Number(r[c.key])) : r[c.key] ?? ""]));

  async function add() {
    const r = await api(endpoint, { method: "POST", body: payload(draft) });
    if (!r.ok) return setMsg({ error: r.data.error });
    setDraft(defaults ?? {});
    setMsg({ ok: "Added." });
    reload();
  }
  async function save() {
    const r = await api(`${endpoint}/${editing!.id}`, { method: "PATCH", body: payload(editing!) });
    if (!r.ok) return setMsg({ error: r.data.error });
    setEditing(null);
    setMsg({ ok: "Saved." });
    reload();
  }
  async function remove(row: Row) {
    if (!confirm("Delete this entry?")) return;
    const r = await api(`${endpoint}/${row.id}`, { method: "DELETE" });
    if (!r.ok) return setMsg({ error: r.data.error });
    setMsg({ ok: "Deleted." });
    reload();
  }

  const cell = (r: Row, c: Col, set: (v: string) => void) => (
    <input aria-label={c.label} type={c.type ?? "text"} value={String(r[c.key] ?? "")} placeholder={c.placeholder ?? c.label} onChange={(e) => set(e.target.value)} />
  );

  return (
    <>
      <h1>{title}</h1>
      <p className="admin-sub">{intro}</p>
      {msg.error ? <Alert>{msg.error}</Alert> : null}
      {msg.ok ? <Alert kind="ok">{msg.ok}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      <div className="a-card">
        <h2>Add new</h2>
        <div className="a-row">
          {cols.map((c) => <div key={c.key}>{cell(draft, c, (v) => setDraft((d) => ({ ...d, [c.key]: v })))}</div>)}
          <button className="a-btn primary" onClick={add}>Add</button>
        </div>
      </div>
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              {cols.map((c) => <th key={c.key}>{c.label}</th>)}
              {extra ? <th /> : null}
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((r) => {
              const isEdit = editing?.id === r.id;
              return (
                <tr key={r.id}>
                  {cols.map((c) => <td key={c.key}>{isEdit ? cell(editing!, c, (v) => setEditing((x) => ({ ...x!, [c.key]: v }))) : String(r[c.key] ?? "")}</td>)}
                  {extra ? <td>{extra(r)}</td> : null}
                  <td className="num">
                    {isEdit ? (
                      <>
                        <button className="a-btn sm primary" onClick={save}>Save</button> <button className="a-btn sm" onClick={() => setEditing(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="a-btn sm" onClick={() => setEditing(r)}>Edit</button> <button className="a-btn sm danger" onClick={() => remove(r)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading ? <div className="a-empty">Loading…</div> : null}
      </div>
    </>
  );
}
