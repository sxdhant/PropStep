"use client";

import { useEffect, useState } from "react";
import { Alert, api, Field, useLoad } from "./ui";

type Item = Record<string, string>;
type FieldDef = { key: string; label: string; area?: boolean };

/** An ordered list that can be added to, edited, reordered and removed, saved in one go (testimonials, FAQs) */
export default function ListEditor({ title, intro, endpoint, fields, noun }: { title: string; intro: string; endpoint: string; fields: FieldDef[]; noun: string }) {
  const { data, loading, error } = useLoad<{ items: Item[] }>(endpoint);
  const [items, setItems] = useState<Item[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});

  useEffect(() => {
    if (data) setItems(data.items);
  }, [data]);

  const move = (i: number, d: number) =>
    setItems((a) => {
      const b = [...a];
      [b[i], b[i + d]] = [b[i + d], b[i]];
      return b;
    });

  async function save() {
    setMsg({});
    const r = await api(endpoint, { method: "PUT", body: items });
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setMsg({ error: r.data.error });
    }
    setErrors({});
    setMsg({ ok: "Saved. The website is updated." });
  }

  return (
    <>
      <div className="admin-head">
        <h1>{title}</h1>
        <div>
          <button className="a-btn" onClick={() => setItems((a) => [...a, Object.fromEntries(fields.map((f) => [f.key, ""]))])}>Add {noun}</button>
          <button className="a-btn primary" onClick={save}>Save all</button>
        </div>
      </div>
      <p className="admin-sub">{intro}</p>
      {error ? <Alert>{error}</Alert> : null}
      {msg.error ? <Alert>{msg.error}</Alert> : null}
      {msg.ok ? <Alert kind="ok">{msg.ok}</Alert> : null}
      {loading ? <p className="admin-sub">Loading…</p> : null}
      {items.map((it, i) => (
        <section className="a-card" key={i}>
          <div className="a-grid" style={{ gridTemplateColumns: "1fr" }}>
            {fields.map((f) => (
              <Field key={f.key} label={f.label} name={`${f.key}-${i}`} error={errors[`${i}.${f.key}`]}>
                {f.area ? (
                  <textarea id={`${f.key}-${i}`} value={it[f.key]} onChange={(e) => setItems((a) => a.map((x, j) => (j === i ? { ...x, [f.key]: e.target.value } : x)))} />
                ) : (
                  <input id={`${f.key}-${i}`} value={it[f.key]} onChange={(e) => setItems((a) => a.map((x, j) => (j === i ? { ...x, [f.key]: e.target.value } : x)))} />
                )}
              </Field>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button className="a-btn sm" disabled={i === 0} onClick={() => move(i, -1)}>Move up</button>
            <button className="a-btn sm" disabled={i === items.length - 1} onClick={() => move(i, 1)}>Move down</button>
            <button className="a-btn sm danger" onClick={() => setItems((a) => a.filter((_, j) => j !== i))}>Remove</button>
          </div>
        </section>
      ))}
    </>
  );
}
