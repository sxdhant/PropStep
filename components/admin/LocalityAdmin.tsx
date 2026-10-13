"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Select from "./Select";
import { Alert, api, Field, Pill, Problems, uploadImage, useLoad } from "./ui";

type Loc = { id: string; slug: string; name: string; zone: string; status: "DRAFT" | "PUBLISHED"; priceSqft: string };

export function LocalityList() {
  const { data, loading, error, reload } = useLoad<{ items: Loc[] }>("/api/admin/localities");
  const [msg, setMsg] = useState("");
  async function remove(l: Loc) {
    if (!confirm(`Delete the ${l.name} guide?`)) return;
    const r = await api(`/api/admin/localities/${l.id}`, { method: "DELETE" });
    if (!r.ok) setMsg(r.data.error ?? "Could not delete");
    else reload();
  }
  return (
    <>
      <div className="admin-head">
        <h1>Localities</h1>
        <Link className="a-btn primary" href="/admin/localities/new/">
          New locality
        </Link>
      </div>
      {msg ? <Alert>{msg}</Alert> : null}
      <Problems error={error} />
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Zone</th>
              <th>₹ / sq ft</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link href={`/admin/localities/${l.id}/`}>{l.name}</Link>
                </td>
                <td>{l.zone}</td>
                <td>{l.priceSqft}</td>
                <td>
                  <Pill tone={l.status === "PUBLISHED" ? "green" : "amber"}>{l.status === "PUBLISHED" ? "Published" : "Draft"}</Pill>
                </td>
                <td className="num">
                  <button className="a-btn sm danger" onClick={() => remove(l)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <div className="a-empty">Loading…</div> : null}
      </div>
    </>
  );
}

const LISTS = ["overview", "bestFor", "pros", "cons", "schools", "hospitals", "work"] as const;
const LIST_LABEL: Record<(typeof LISTS)[number], string> = {
  overview: "Overview paragraphs", bestFor: "Best for", pros: "Pros", cons: "Cons", schools: "Schools", hospitals: "Hospitals", work: "Work hubs",
};
type State = Record<"slug" | "name" | "zone" | "tagline" | "imageId" | "imageAlt" | "priceSqft" | "priceMid" | "rent2bhk" | "yield" | "growth" | "metro" | "metroShort" | "trend", string> &
  Record<(typeof LISTS)[number], string> & { status: "DRAFT" | "PUBLISHED" };
const blank: State = {
  slug: "", name: "", zone: "", tagline: "", imageId: "", imageAlt: "", priceSqft: "", priceMid: "", rent2bhk: "", yield: "", growth: "", metro: "", metroShort: "", trend: "",
  overview: "", bestFor: "", pros: "", cons: "", schools: "", hospitals: "", work: "", status: "PUBLISHED",
};

export function LocalityForm({ id }: { id?: string }) {
  const router = useRouter();
  const [f, setF] = useState<State>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [top, setTop] = useState<{ error?: string; ok?: string }>({});
  const [busy, setBusy] = useState(false);
  const existing = useLoad<{ locality: Record<string, unknown> }>(id ? `/api/admin/localities/${id}` : null);

  useEffect(() => {
    const l = existing.data?.locality;
    if (!l) return;
    const s = (k: string) => String(l[k] ?? "");
    const next = { ...blank, status: l.status as State["status"] } as State;
    (["slug", "name", "zone", "tagline", "imageId", "imageAlt", "priceSqft", "priceMid", "rent2bhk", "yield", "growth", "metro", "metroShort"] as const).forEach((k) => (next[k] = s(k)));
    next.trend = ((l.trend as number[]) ?? []).join(", ");
    LISTS.forEach((k) => (next[k] = ((l[k] as string[]) ?? []).join("\n")));
    setF(next);
  }, [existing.data]);

  const bind = (k: keyof State) => ({ id: k, name: k, value: f[k], onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value })) });
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTop({});
    const body = {
      slug: f.slug, name: f.name, zone: f.zone, tagline: f.tagline, image: { id: f.imageId, alt: f.imageAlt }, priceSqft: f.priceSqft,
      priceMid: f.priceMid.trim() ? Number(f.priceMid) : undefined, rent2bhk: f.rent2bhk, yield: f.yield, growth: f.growth, metro: f.metro, metroShort: f.metroShort,
      trend: f.trend.split(/[,\s]+/).filter(Boolean).map(Number), status: f.status,
      ...Object.fromEntries(LISTS.map((k) => [k, lines(f[k])])),
    };
    setBusy(true);
    const r = await api<{ locality: { id: string } }>(id ? `/api/admin/localities/${id}` : "/api/admin/localities", { method: id ? "PATCH" : "POST", body });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setTop({ error: r.data.error ?? "Could not save" });
    }
    setErrors({});
    if (!id) return router.replace(`/admin/localities/${r.data.locality.id}/`);
    setTop({ ok: "Saved." });
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const r = await uploadImage(file);
    if (r.error) setTop({ error: r.error });
    else setF((p) => ({ ...p, imageId: r.url! }));
  }

  if (id && existing.loading) return <p className="admin-sub">Loading…</p>;
  if (id && existing.error) return <Problems error={existing.error} />;
  const e = (k: string) => errors[k] ?? errors[`image.${k}`];
  return (
    <form onSubmit={submit} noValidate>
      <div className="admin-head">
        <h1>{id ? `Edit ${f.name || "locality"}` : "New locality"}</h1>
        <a className="a-btn" href="/admin/localities/">← All localities</a>
      </div>
      {top.error ? <Alert>{top.error}</Alert> : null}
      {top.ok ? <Alert kind="ok">{top.ok}</Alert> : null}
      <section className="a-card">
        <div className="a-grid">
          <Field label="Name *" name="name" error={e("name")}><input {...bind("name")} /></Field>
          <Field label="URL slug *" name="slug" error={e("slug")}><input {...bind("slug")} /></Field>
          <Field label="Zone *" name="zone" error={e("zone")} hint="e.g. East Bengaluru, South-East"><input {...bind("zone")} /></Field>
          <Field label="Status" name="status"><Select label="Status" value={f.status} onChange={(v) => setF((p) => ({ ...p, status: v as State["status"] }))} options={[["PUBLISHED", "Published"], ["DRAFT", "Draft"]]} /></Field>
          <Field label="Tagline *" name="tagline" error={e("tagline")} wide><input {...bind("tagline")} /></Field>
          <Field label="Cover photo *" name="imageId" error={e("id")} hint="Unsplash id, https link or upload"><input {...bind("imageId")} /></Field>
          <Field label="Photo description *" name="imageAlt" error={e("alt")}><input {...bind("imageAlt")} /></Field>
          <Field label=" " name="up"><label className="a-btn" style={{ cursor: "pointer", justifySelf: "start" }}>Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} /></label></Field>
        </div>
      </section>
      <section className="a-card">
        <h2>Market numbers</h2>
        <div className="a-grid">
          <Field label="Price range per sq ft *" name="priceSqft" error={e("priceSqft")} hint="₹9,800 – ₹13,200"><input {...bind("priceSqft")} /></Field>
          <Field label="Average price per sq ft (number) *" name="priceMid" error={e("priceMid")}><input {...bind("priceMid")} type="number" min={1} /></Field>
          <Field label="2 BHK rent range *" name="rent2bhk" error={e("rent2bhk")}><input {...bind("rent2bhk")} /></Field>
          <Field label="Rental yield *" name="yield" error={e("yield")} hint="3.3%"><input {...bind("yield")} /></Field>
          <Field label="5-year change *" name="growth" error={e("growth")} hint="+62%"><input {...bind("growth")} /></Field>
          <Field label="Price trend *" name="trend" error={e("trend")} hint="Comma separated yearly averages, oldest first"><input {...bind("trend")} /></Field>
          <Field label="Metro (full) *" name="metro" error={e("metro")} wide><input {...bind("metro")} /></Field>
          <Field label="Metro (short) *" name="metroShort" error={e("metroShort")}><input {...bind("metroShort")} /></Field>
        </div>
      </section>
      <section className="a-card">
        <h2>Guide content</h2>
        <p className="admin-sub">One item per line.</p>
        <div className="a-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {LISTS.map((k) => (
            <Field key={k} label={LIST_LABEL[k]} name={k} error={Object.entries(errors).find(([x]) => x.startsWith(k))?.[1]} wide={k === "overview"}>
              <textarea {...bind(k)} />
            </Field>
          ))}
        </div>
      </section>
      <div className="a-sticky">
        <button className="a-btn primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}
