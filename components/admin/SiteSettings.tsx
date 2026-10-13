"use client";

import { useEffect, useState } from "react";
import { Alert, api, useLoad } from "./ui";

const BLOCKS: [string, string, string][] = [
  ["contact", "Contact & identity", "name,legal_name,description,since,phone,phone_href,whatsapp,email,hours,agent_rera"],
  ["hq", "Head office", "hq"],
  ["social", "Social links", "social"],
  ["stats", "Home page stats", "stats"],
  ["cities", "Cities", "cities"],
  ["offices", "Offices", "offices"],
  ["leadership", "Leadership", "leadership"],
  ["values", "Values", "values"],
  ["milestones", "Milestones", "milestones"],
  ["services", "Services", "services"],
  ["process", "How we work", "process"],
];

const LABELS: Record<string, string> = {
  name: "Brand name", legal_name: "Legal name", description: "Site description", since: "Founded (year)", phone: "Phone (as shown)", phone_href: "Phone link (+91…)",
  whatsapp: "WhatsApp number (digits)", email: "Email", hours: "Opening hours", agent_rera: "RERA agent registration",
};

/** One settings key: flat text fields get inputs, lists/objects get a JSON editor. Saves are validated by the server. */
function Setting({ k }: { k: string }) {
  const { data, loading, error } = useLoad<{ value: unknown }>(`/api/admin/site/${k}`);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const flat = typeof data?.value === "string" || typeof data?.value === "number";

  useEffect(() => {
    if (data) setText(typeof data.value === "string" || typeof data.value === "number" ? String(data.value) : JSON.stringify(data.value, null, 2));
  }, [data]);

  async function save() {
    setMsg({});
    let body: unknown = text;
    if (!flat) {
      try {
        body = JSON.parse(text);
      } catch {
        return setMsg({ error: "This isn't valid JSON. Check commas, quotes and brackets." });
      }
    } else if (k === "since") body = Number(text);
    const r = await api(`/api/admin/site/${k}`, { method: "PUT", body });
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setMsg({ error: r.data.error });
    }
    setErrors({});
    setMsg({ ok: "Saved. The website is updated." });
  }

  if (loading) return <p className="admin-sub">Loading…</p>;
  if (error) return <Alert>{error}</Alert>;
  const errList = Object.entries(errors).map(([p, m]) => `${p}: ${m}`);
  return (
    <div className="a-field" style={{ marginBottom: 16 }}>
      <label htmlFor={`s-${k}`}>{LABELS[k] ?? k}</label>
      {flat && k !== "description" ? (
        <input id={`s-${k}`} value={text} onChange={(e) => setText(e.target.value)} />
      ) : (
        <textarea id={`s-${k}`} className={flat ? "" : "code"} style={{ minHeight: flat ? 70 : 280 }} value={text} onChange={(e) => setText(e.target.value)} />
      )}
      {msg.error ? <span className="err">{msg.error}</span> : null}
      {errList.map((m) => <span key={m} className="err">{m}</span>)}
      {msg.ok ? <span className="hint" style={{ color: "var(--a-ok)" }}>{msg.ok}</span> : null}
      <div><button className="a-btn primary sm" onClick={save}>Save {LABELS[k]?.toLowerCase() ?? k}</button></div>
    </div>
  );
}

export default function SiteSettings() {
  const [tab, setTab] = useState(BLOCKS[0][0]);
  const block = BLOCKS.find((b) => b[0] === tab)!;
  return (
    <>
      <h1>Site settings</h1>
      <p className="admin-sub">Contact details, address and the content blocks shown across the site. Every save is checked before it goes live.</p>
      <div className="a-tabs" role="group" aria-label="Setting groups">
        {BLOCKS.map(([k, label]) => (
          <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      <div className="a-card">
        {block[2].split(",").map((k) => <Setting key={`${tab}-${k}`} k={k} />)}
      </div>
    </>
  );
}
