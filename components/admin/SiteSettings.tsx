"use client";

import { useEffect, useState } from "react";
import IconSelect from "./IconSelect";
import Select from "./Select";
import { Alert, api, Field, uploadImage, useLoad } from "./ui";

const BLOCKS: [string, string, string][] = [
  ["contact", "Contact & identity", "name,legal_name,description,since,phone,phone_href,whatsapp,email,hours,agent_rera"],
  ["hq", "Head office", "hq"],
  ["social", "Social links", "social"],
  ["pillars", "What we do (home page)", "pillars"],
  ["stats", "Home page stats", "stats,marquee"],
  ["badges", "Badges", "badges"],
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

/* ---------- forms for the blocks that hold lists or groups of fields ---------- */
type Kind = "text" | "textarea" | "number" | "icon" | "lines" | "image" | "select";
/** path: where the server reports this field's errors, when that differs from its key (e.g. "links.0.label") */
type FieldDef = { key: string; label: string; kind?: Kind; hint?: string; placeholder?: string; wide?: boolean; optional?: boolean; path?: string; options?: [string, string][] };
/** to / from: convert between the stored item and the flat fields shown (used where an item holds a small nested list) */
type Form = { type: "object" | "list"; fields: FieldDef[]; itemName?: string; intro?: string; max?: number; title?: string; /** the items are plain text lines: this is the field they are edited in */ scalar?: string; to?: (row: Row) => Row; from?: (draft: Row) => Row };

const FORMS: Record<string, Form> = {
  hq: {
    type: "object",
    intro: "Shown in the footer and on the contact page.",
    fields: [
      { key: "line1", label: "Address line 1" },
      { key: "line2", label: "Address line 2" },
      { key: "street", label: "Street" },
      { key: "postcode", label: "Postcode", hint: "6 digits" },
      { key: "map_query", label: "Map search text", hint: "What Google Maps searches for, e.g. “Propstep, Indiranagar, Bengaluru”", wide: true },
      { key: "maps", label: "Google Maps link", hint: "A link starting with https://", wide: true },
    ],
  },
  social: {
    type: "object",
    intro: "Full links starting with https://",
    fields: [
      { key: "instagram", label: "Instagram link", wide: true },
      { key: "linkedin", label: "LinkedIn link", wide: true },
      { key: "youtube", label: "YouTube link", wide: true },
    ],
  },
  pillars: {
    type: "list", itemName: "Card", max: 6,
    intro: "The “What we do” cards on the home page, in this order. Each card can have up to three buttons.",
    fields: [
      { key: "title", label: "Title", hint: "e.g. Discover" },
      { key: "sub", label: "Small heading", hint: "e.g. Verified listings" },
      { key: "text", label: "Description", kind: "textarea", wide: true },
      { key: "tags", label: "Tags", kind: "lines", wide: true, hint: "One per line, e.g. Apartments" },
      { key: "image", label: "Photo", kind: "image", hint: "Upload, or paste a link" },
      { key: "alt", label: "Photo description", hint: "For accessibility, e.g. Modern villa with a pool" },
      ...[1, 2, 3].flatMap((n) => [
        { key: `link${n}_label`, label: `Button ${n}: text`, optional: true, path: `links.${n - 1}.label`, hint: n === 1 ? "Leave a button's text empty to hide it" : undefined },
        { key: `link${n}_href`, label: `Button ${n}: link`, optional: true, path: `links.${n - 1}.href`, hint: n === 1 ? "A page like /properties/ or /services/#sell" : undefined },
        { key: `link${n}_look`, label: `Button ${n}: colour`, kind: "select" as const, optional: true, path: `links.${n - 1}.look`, options: [["", "Automatic"], ["accent", "Orange"], ["light", "White"]] as [string, string][] },
      ]),
    ],
    to: (row) => {
      const links = (row.links as { label: string; href: string; look?: string }[]) ?? [];
      const out: Row = { ...row };
      [1, 2, 3].forEach((n) => {
        const l = links[n - 1];
        out[`link${n}_label`] = l?.label ?? "";
        out[`link${n}_href`] = l?.href ?? "";
        out[`link${n}_look`] = l?.look ?? "";
      });
      return out;
    },
    from: (d) => {
      const links = [1, 2, 3]
        .filter((n) => String(d[`link${n}_label`] ?? "").trim() || String(d[`link${n}_href`] ?? "").trim())
        .map((n) => ({ label: String(d[`link${n}_label`] ?? "").trim(), href: String(d[`link${n}_href`] ?? "").trim(), ...(d[`link${n}_look`] ? { look: d[`link${n}_look`] } : {}) }));
      const out: Row = { ...d, links };
      [1, 2, 3].forEach((n) => ["label", "href", "look"].forEach((k) => delete out[`link${n}_${k}`]));
      return out;
    },
  },
  badges: {
    type: "list", itemName: "Badge", max: 20,
    intro: "The tags you can put on a property (shown over its photo and above its heading). Add your own, rename or remove them here. If you rename or remove a badge, properties that still use the old name show it as plain text until you pick the new one.",
    fields: [
      { key: "name", label: "Badge text", hint: "Short, e.g. Verified or Launching soon" },
      { key: "icon", label: "Icon", kind: "icon", optional: true },
      { key: "tone", label: "Colour", kind: "select", options: [["accent", "Orange (highlight)"], ["blue", "Blue (trust)"], ["plain", "Neutral (glass)"]] },
    ],
  },
  marquee: {
    type: "list", itemName: "Line", max: 20, scalar: "text",
    title: "Scrolling highlights",
    intro: "The line of short highlights that scrolls under the numbers. They repeat in a loop, in this order.",
    fields: [{ key: "text", label: "Highlight", wide: true, placeholder: "e.g. Every listing visited in person" }],
  },
  stats: {
    type: "list", itemName: "Stat", max: 8,
    title: "Numbers",
    intro: "The big numbers on the home page, in this order.",
    fields: [
      { key: "value", label: "Number", kind: "number", hint: "e.g. 4.8 or 1200" },
      { key: "decimals", label: "Decimal places", kind: "number", optional: true, hint: "0 to 3. Leave empty for none" },
      { key: "suffix", label: "After the number", hint: "e.g. +, %, ★ (can be empty)", optional: true },
      { key: "label", label: "Label", hint: "e.g. Verified listings" },
      { key: "note", label: "Small note under it", optional: true, wide: true },
    ],
  },
  cities: {
    type: "list", itemName: "City", max: 20,
    fields: [
      { key: "name", label: "City name" },
      { key: "slug", label: "Page address", hint: "Lowercase letters, numbers and hyphens, e.g. bengaluru" },
      { key: "role", label: "Role", hint: "e.g. Headquarters" },
      { key: "desks", label: "Team", hint: "e.g. 24 advisors" },
      { key: "landmark", label: "Landmark in the photo" },
      { key: "image", label: "Photo", kind: "image", hint: "Upload, or paste a link" },
    ],
  },
  offices: {
    type: "list", itemName: "Office", max: 20,
    fields: [
      { key: "city", label: "City" },
      { key: "label", label: "Office name", hint: "e.g. Head office" },
      { key: "address", label: "Address", kind: "textarea", wide: true },
      { key: "phone", label: "Phone" },
    ],
  },
  leadership: {
    type: "list", itemName: "Person", max: 30,
    fields: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "bio", label: "About them", kind: "textarea", wide: true },
      { key: "linkedin", label: "LinkedIn link", hint: "Starting with https://" },
      { key: "photo", label: "Photo", kind: "image", optional: true, hint: "Upload, or paste a link" },
    ],
  },
  values: {
    type: "list", itemName: "Value", max: 12,
    fields: [
      { key: "icon", label: "Icon", kind: "icon" },
      { key: "title", label: "Title" },
      { key: "text", label: "Description", kind: "textarea", wide: true },
    ],
  },
  milestones: {
    type: "list", itemName: "Milestone", max: 20,
    fields: [
      { key: "year", label: "Year" },
      { key: "title", label: "Title" },
      { key: "text", label: "Description", kind: "textarea", wide: true },
    ],
  },
  services: {
    type: "list", itemName: "Service", max: 20,
    fields: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Page address", hint: "Lowercase letters, numbers and hyphens, e.g. sell" },
      { key: "icon", label: "Icon", kind: "icon" },
      { key: "image", label: "Photo", kind: "image", hint: "Upload, or paste a link" },
      { key: "short", label: "Short description", kind: "textarea", wide: true },
      { key: "points", label: "Bullet points", kind: "lines", wide: true, hint: "One per line" },
    ],
  },
  process: {
    type: "list", itemName: "Step", max: 10,
    intro: "The numbered steps of “How we work”, in this order.",
    fields: [
      { key: "title", label: "Title" },
      { key: "text", label: "Description", kind: "textarea", wide: true },
    ],
  },
};

type Row = Record<string, unknown>;

/** stored value -> what the form fields edit (everything as text) */
function toDraft(input: Row, fields: FieldDef[], conv?: (row: Row) => Row): Row {
  const row = conv ? conv(input) : input;
  const out: Row = { ...row };
  for (const f of fields) {
    const v = row[f.key];
    out[f.key] = f.kind === "lines" ? (Array.isArray(v) ? v.join("\n") : "") : v == null ? "" : String(v);
  }
  return out;
}

/** form text -> the shape the server validates; empty optional fields are dropped */
function fromDraft(input: Row, fields: FieldDef[], conv?: (row: Row) => Row): Row {
  const row = input;
  const out: Row = { ...row };
  for (const f of fields) {
    const v = String(row[f.key] ?? "");
    if (f.kind === "lines") out[f.key] = v.split("\n").map((s) => s.trim()).filter(Boolean);
    else if (f.kind === "number") {
      if (v.trim() === "") delete out[f.key];
      else out[f.key] = Number(v);
    } else if (f.optional && v === "") {
      if (f.key === "suffix" || f.key === "note") out[f.key] = "";
      else delete out[f.key];
    } else out[f.key] = v;
  }
  return conv ? conv(out) : out;
}

function FieldInput({ f, id, value, onChange, invalid }: { f: FieldDef; id: string; value: string; onChange: (v: string) => void; invalid: boolean }) {
  const [up, setUp] = useState("");
  if (f.kind === "select") return <Select label={f.label} value={value} onChange={onChange} options={f.options ?? []} />;
  if (f.kind === "icon") return <IconSelect label={f.label} value={value} onChange={onChange} invalid={invalid} />;
  if (f.kind === "textarea" || f.kind === "lines") return <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} style={{ minHeight: f.kind === "lines" ? 110 : 80 }} />;
  if (f.kind === "image")
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <input id={id} value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
        <label className="a-btn sm" style={{ cursor: "pointer", justifySelf: "start" }}>
          {up || "Upload a photo"}
          <input
            type="file" accept="image/jpeg,image/png,image/webp" hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setUp("Uploading…");
              const r = await uploadImage(file).catch(() => ({ url: undefined, error: "network error" }));
              setUp(r.error ? `Failed: ${r.error}` : "");
              if (r.url) onChange(r.url);
            }}
          />
        </label>
      </div>
    );
  return <input id={id} type={f.kind === "number" ? "number" : "text"} step={f.kind === "number" ? "any" : undefined} value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
}

/** A form (for a group of fields) or a list of cards (for repeated items), saved as one settings block */
function FormSetting({ k }: { k: string }) {
  const form = FORMS[k];
  const { data, loading, error } = useLoad<{ value: unknown }>(`/api/admin/site/${k}`);
  const [rows, setRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const list = form.type === "list" ? (Array.isArray(data.value) ? (data.value as Row[]) : []) : [(data.value as Row) ?? {}];
    setRows(list.map((r) => toDraft(form.scalar ? ({ [form.scalar]: r } as unknown as Row) : r, form.fields, form.to)));
  }, [data, form]);

  const edit = (i: number, key: string, v: string) => setRows((p) => p.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  const move = (i: number, d: number) => setRows((p) => { const a = [...p]; [a[i + d], a[i]] = [a[i], a[i + d]]; return a; });
  // the server reports list problems as "0.title" and group problems as "line1"
  const err = (i: number, f: FieldDef) => errors[form.scalar ? String(i) : form.type === "list" ? `${i}.${f.path ?? f.key}` : f.path ?? f.key];

  async function save() {
    setMsg({});
    setBusy(true);
    const body = form.scalar ? rows.map((r) => String(r[form.scalar!] ?? "").trim()).filter(Boolean) : form.type === "list" ? rows.map((r) => fromDraft(r, form.fields, form.from)) : fromDraft(rows[0], form.fields, form.from);
    const r = await api(`/api/admin/site/${k}`, { method: "PUT", body });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      setMsg({ error: Object.keys(r.data.errors ?? {}).length ? "Some fields need attention. They are marked in red." : r.data.error });
      requestAnimationFrame(() => document.querySelector(".a-field.has-error")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    setErrors({});
    setMsg({ ok: "Saved. The website is updated." });
  }

  if (loading) return <p className="admin-sub">Loading…</p>;
  if (error) return <Alert>{error}</Alert>;

  const fields = (i: number) => (
    <div className="a-grid">
      {form.fields.map((f) => (
        <Field key={f.key} label={f.label} name={`s-${k}-${i}-${f.key}`} error={err(i, f)} hint={f.hint} wide={f.wide}>
          <FieldInput f={f} id={`s-${k}-${i}-${f.key}`} value={String(rows[i]?.[f.key] ?? "")} onChange={(v) => edit(i, f.key, v)} invalid={!!err(i, f)} />
        </Field>
      ))}
    </div>
  );

  return (
    <div style={{ marginBottom: 16 }}>
      {form.title ? <h3 style={{ margin: "8px 0 4px" }}>{form.title}</h3> : null}
      {form.intro ? <p className="admin-sub">{form.intro}</p> : null}
      {form.type === "object" ? (
        rows[0] ? fields(0) : null
      ) : (
        <div className="list-items">
          {rows.map((r, i) => (
            <div className="list-item" key={i}>
              <div className="list-item__head">
                <strong>{form.itemName} {i + 1}{String(r.title || r.name || r.label || r.city || r.year || "") ? ` · ${String(r.title || r.name || r.label || r.city || r.year)}` : ""}</strong>
                <span>
                  <button type="button" className="a-btn sm" disabled={i === 0} aria-label="Move up" onClick={() => move(i, -1)}>↑</button>{" "}
                  <button type="button" className="a-btn sm" disabled={i === rows.length - 1} aria-label="Move down" onClick={() => move(i, 1)}>↓</button>{" "}
                  <button type="button" className="a-btn sm danger" onClick={() => setRows((p) => p.filter((_, j) => j !== i))}>Remove</button>
                </span>
              </div>
              {fields(i)}
            </div>
          ))}
          {!rows.length ? <p className="admin-sub">Nothing here yet.</p> : null}
          <button type="button" className="a-btn" disabled={rows.length >= (form.max ?? 50)} onClick={() => setRows((p) => [...p, toDraft({}, form.fields, form.to)])}>+ Add {form.itemName?.toLowerCase()}</button>
        </div>
      )}
      {msg.error ? <p style={{ marginTop: 12 }}><span className="err" style={{ color: "var(--c-error)", fontWeight: 600 }}>{msg.error}</span></p> : null}
      {msg.ok ? <p style={{ marginTop: 12 }}><span className="hint" style={{ color: "var(--a-ok)" }}>{msg.ok}</span></p> : null}
      <p style={{ marginTop: 12 }}><button className="a-btn primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save changes"}</button></p>
    </div>
  );
}

/** One plain text setting (name, phone, email…): a single box, saved on its own */
function Setting({ k }: { k: string }) {
  const { data, loading, error } = useLoad<{ value: unknown }>(`/api/admin/site/${k}`);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});

  useEffect(() => {
    if (data) setText(String(data.value ?? ""));
  }, [data]);

  async function save() {
    setMsg({});
    const r = await api(`/api/admin/site/${k}`, { method: "PUT", body: k === "since" ? Number(text) : text });
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setMsg({ error: r.data.error });
    }
    setErrors({});
    setMsg({ ok: "Saved. The website is updated." });
  }

  if (loading) return <p className="admin-sub">Loading…</p>;
  if (error) return <Alert>{error}</Alert>;
  const errList = Object.values(errors);
  return (
    <div className={`a-field${msg.error || errList.length ? " has-error" : ""}`} style={{ marginBottom: 16 }}>
      <label htmlFor={`s-${k}`}>{LABELS[k] ?? k}</label>
      {k === "description" ? (
        <textarea id={`s-${k}`} style={{ minHeight: 70 }} value={text} onChange={(e) => setText(e.target.value)} />
      ) : (
        <input id={`s-${k}`} value={text} onChange={(e) => setText(e.target.value)} />
      )}
      {msg.error ? <span className="err">{msg.error}</span> : null}
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
        {block[2].split(",").map((k) => (FORMS[k] ? <FormSetting key={`${tab}-${k}`} k={k} /> : <Setting key={`${tab}-${k}`} k={k} />))}
      </div>
    </>
  );
}
