"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { PROPERTY_TYPES } from "@/lib/budgets";
import Select from "./Select";
import { Alert, api, Field, Problems, uploadImage, useLoad } from "./ui";

type Img = { id: string; alt: string };
type State = {
  slug: string; title: string; type: string; developer: string; project: string; advisorKey: string;
  city: string; locality: string; localitySlug: string; status: "DRAFT" | "PUBLISHED";
  bhk: string; baths: string; area: string; price: string; priceLabel: string; units: string; areaMin: string; areaMax: string; configs: string;
  floor: string; age: string; possession: string; rera: string; badge: string; connectingRoad: string; floorplan: string; postedAt: string;
  summary: string; description: string; features: string; images: Img[];
  unitTypes: string; amenities: string; connectivity: string;
};

const blank: State = {
  slug: "", title: "", type: "Apartment", developer: "", project: "", advisorKey: "", city: "Bengaluru", locality: "", localitySlug: "", status: "DRAFT",
  bhk: "", baths: "", area: "", price: "", priceLabel: "", units: "", areaMin: "", areaMax: "", configs: "",
  floor: "", age: "", possession: "", rera: "", badge: "", connectingRoad: "", floorplan: "", postedAt: "",
  summary: "", description: "", features: "", images: [], unitTypes: "", amenities: "", connectivity: "",
};

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
const pretty = (v: unknown) => (Array.isArray(v) && v.length ? JSON.stringify(v, null, 2) : "");

const EXAMPLES = {
  unitTypes: '[{ "bhk": 2, "area": 1180, "price": 15300000 }, { "bhk": 3, "area": 1850, "price": 21000000 }]',
  amenities: '[{ "icon": "waves", "label": "Swimming pool" }]',
  connectivity: '[{ "icon": "train", "place": "Namma Metro (Purple Line)", "time": "6 min" }]',
};

export default function ListingForm({ id }: { id?: string }) {
  const router = useRouter();
  const [f, setF] = useState<State>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [top, setTop] = useState<{ error?: string; ok?: string }>({});
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!id);

  const existing = useLoad<{ listing: Record<string, unknown> }>(id ? `/api/admin/listings/${id}` : null);
  const advisors = useLoad<{ items: { key: string; name: string }[] }>("/api/admin/advisors");
  const localities = useLoad<{ items: { slug: string; name: string }[] }>("/api/admin/localities");

  useEffect(() => {
    const l = existing.data?.listing;
    if (!l) return;
    const s = (k: string) => String(l[k] ?? "");
    setF({
      slug: s("slug"), title: s("title"), type: s("type"), developer: s("developer"), project: s("project"), advisorKey: s("advisorKey"),
      city: s("city"), locality: s("locality"), localitySlug: s("localitySlug"), status: l.status as State["status"],
      bhk: s("bhk"), baths: s("baths"), area: s("area"), price: s("price"), priceLabel: s("priceLabel"), units: s("units"), areaMin: s("areaMin"),
      areaMax: s("areaMax"), configs: ((l.configs as number[]) ?? []).join(", "),
      floor: s("floor"), age: s("age"), possession: s("possession"), rera: s("rera"), badge: s("badge"), connectingRoad: s("connectingRoad"),
      floorplan: s("floorplan"), postedAt: s("postedAt"), summary: s("summary"), description: s("description"),
      features: ((l.features as string[]) ?? []).join("\n"), images: (l.images as Img[]) ?? [],
      unitTypes: pretty(l.unitTypes), amenities: pretty(l.amenities), connectivity: pretty(l.connectivity),
    });
  }, [existing.data]);

  const set = <K extends keyof State>(k: K, v: State[K]) => setF((p) => ({ ...p, [k]: v }));
  const bind = (k: keyof State) => ({
    id: k,
    name: k,
    value: f[k] as string,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never),
  });
  const err = (k: string) => errors[k];
  /** errors under a nested path, e.g. "unitTypes.0.price" -> shown below the JSON box */
  const nested = (prefix: string) =>
    Object.entries(errors)
      .filter(([k]) => k.startsWith(`${prefix}.`) || k === prefix)
      .map(([k, v]) => `${k.replace(/\.(\d+)/g, (_, n) => ` #${Number(n) + 1}`)}: ${v}`)
      .join(" · ");

  async function upload(e: ChangeEvent<HTMLInputElement>, to: "gallery" | "floorplan") {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      const r = await uploadImage(file);
      if (r.error) return setTop({ error: `${file.name}: ${r.error}` });
      if (to === "floorplan") set("floorplan", r.url!);
      else setF((p) => ({ ...p, images: [...p.images, { id: r.url!, alt: `${p.title || "Property"} - photo ${p.images.length + 1}` }] }));
    }
  }

  async function submit(e: FormEvent, status?: State["status"]) {
    e.preventDefault();
    setTop({});
    const bad: Record<string, string> = {};
    const json = (k: "unitTypes" | "amenities" | "connectivity") => {
      if (!f[k].trim()) return undefined;
      try {
        const v = JSON.parse(f[k]);
        if (!Array.isArray(v)) throw new Error();
        return v;
      } catch {
        bad[k] = "This isn't valid JSON. Check commas and quotes, or clear the box.";
      }
    };
    const unitTypes = json("unitTypes"), amenities = json("amenities"), connectivity = json("connectivity");
    if (Object.keys(bad).length) return setErrors(bad);

    const body = {
      slug: f.slug, title: f.title, type: f.type, intent: "buy", developer: f.developer, project: f.project, advisorKey: f.advisorKey,
      city: f.city, locality: f.locality, localitySlug: f.localitySlug, status: status ?? f.status,
      bhk: num(f.bhk), baths: num(f.baths), area: num(f.area), price: num(f.price), priceLabel: f.priceLabel, units: num(f.units),
      areaMin: num(f.areaMin), areaMax: num(f.areaMax),
      configs: f.configs.trim() ? f.configs.split(/[,\s]+/).filter(Boolean).map(Number) : undefined,
      floor: f.floor, age: f.age, possession: f.possession, rera: f.rera, badge: f.badge, connectingRoad: f.connectingRoad, floorplan: f.floorplan,
      postedAt: f.postedAt || undefined, summary: f.summary, description: f.description,
      features: f.features.split("\n").map((s) => s.trim()).filter(Boolean), images: f.images, unitTypes, amenities, connectivity,
    };
    setBusy(true);
    const r = await api<{ listing: { id: string } }>(id ? `/api/admin/listings/${id}` : "/api/admin/listings", { method: id ? "PATCH" : "POST", body });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setTop({ error: r.data.error ?? "Could not save" });
    }
    setErrors({});
    if (!id) return router.replace(`/admin/listings/${r.data.listing.id}/`);
    set("status", body.status);
    setTop({ ok: body.status === "PUBLISHED" ? "Saved. This listing is live on the website." : "Saved as draft." });
  }

  if (id && existing.loading) return <p className="admin-sub">Loading…</p>;
  if (id && existing.error) return <Problems error={existing.error} />;

  return (
    <form onSubmit={(e) => submit(e)} noValidate>
      <div className="admin-head">
        <h1>{id ? "Edit listing" : "New listing"}</h1>
        <div>
          <a className="a-btn" href="/admin/listings/">
            ← All listings
          </a>
          {id && f.status === "PUBLISHED" ? (
            <a className="a-btn" href={`/properties/${f.slug}/`} target="_blank" rel="noopener">
              View on website ↗
            </a>
          ) : null}
        </div>
      </div>
      {top.error ? <Alert>{top.error}</Alert> : null}
      {top.ok ? <Alert kind="ok">{top.ok}</Alert> : null}

      <section className="a-card">
        <h2>Basics</h2>
        <div className="a-grid">
          <Field label="Title *" name="title" error={err("title")} wide>
            <input {...bind("title")} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} placeholder="3 BHK apartment, Cedar Court" />
          </Field>
          <Field label="URL slug *" name="slug" error={err("slug")} hint="Used in the page address. Lowercase letters, numbers and hyphens.">
            <input {...bind("slug")} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
          </Field>
          <Field label="Type *" name="type" error={err("type")}>
            <input {...bind("type")} list="types" />
            <datalist id="types">{PROPERTY_TYPES.map((t) => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Advisor *" name="advisorKey" error={err("advisorKey")}>
            <Select label="Advisor" value={f.advisorKey} onChange={(v) => set("advisorKey", v)} options={[["", "Choose an advisor"], ...(advisors.data?.items.map((a) => [a.key, a.name] as [string, string]) ?? [])]} />
          </Field>
          <Field label="Developer" name="developer" error={err("developer")}><input {...bind("developer")} /></Field>
          <Field label="Project name" name="project" error={err("project")}><input {...bind("project")} /></Field>
          <Field label="Badge" name="badge" error={err("badge")} hint="e.g. Verified, New launch"><input {...bind("badge")} /></Field>
        </div>
      </section>

      <section className="a-card">
        <h2>Location</h2>
        <div className="a-grid">
          <Field label="City *" name="city" error={err("city")}><input {...bind("city")} /></Field>
          <Field label="Locality *" name="locality" error={err("locality")}><input {...bind("locality")} list="locs" /><datalist id="locs">{localities.data?.items.map((l) => <option key={l.slug} value={l.name} />)}</datalist></Field>
          <Field label="Locality guide" name="localitySlug" error={err("localitySlug")} hint="Links the listing to a locality page">
            <Select label="Locality guide" search="Search localities" value={f.localitySlug} onChange={(v) => set("localitySlug", v)} options={[["", "None"], ...(localities.data?.items.map((l) => [l.slug, l.name] as [string, string]) ?? [])]} />
          </Field>
          <Field label="Connecting road" name="connectingRoad" error={err("connectingRoad")}><input {...bind("connectingRoad")} /></Field>
        </div>
      </section>

      <section className="a-card">
        <h2>Size &amp; price</h2>
        <div className="a-grid">
          <Field label="Bedrooms (BHK) *" name="bhk" error={err("bhk")}><input {...bind("bhk")} type="number" min={0} /></Field>
          <Field label="Bathrooms *" name="baths" error={err("baths")}><input {...bind("baths")} type="number" min={0} /></Field>
          <Field label="Area (sq ft) *" name="area" error={err("area")}><input {...bind("area")} type="number" min={1} /></Field>
          <Field label="Price (₹)" name="price" error={err("price")} hint="Full rupees, e.g. 15300000. Leave empty to use the lowest unit-type price."><input {...bind("price")} type="number" min={1} /></Field>
          <Field label="Price label" name="priceLabel" error={err("priceLabel")} hint="Optional, e.g. ₹1.53 Cr (made for you if empty)"><input {...bind("priceLabel")} /></Field>
          <Field label="Number of units" name="units" error={err("units")}><input {...bind("units")} type="number" min={1} /></Field>
          <Field label="Smallest size (sq ft)" name="areaMin" error={err("areaMin")}><input {...bind("areaMin")} type="number" min={1} /></Field>
          <Field label="Largest size (sq ft)" name="areaMax" error={err("areaMax")}><input {...bind("areaMax")} type="number" min={1} /></Field>
          <Field label="BHK options" name="configs" error={err("configs")} hint="Comma separated, e.g. 2, 3"><input {...bind("configs")} /></Field>
        </div>
      </section>

      <section className="a-card">
        <h2>Details</h2>
        <div className="a-grid">
          <Field label="Floor" name="floor" error={err("floor")}><input {...bind("floor")} placeholder="7th of 14" /></Field>
          <Field label="Age" name="age" error={err("age")}><input {...bind("age")} placeholder="6 years" /></Field>
          <Field label="Possession" name="possession" error={err("possession")}><input {...bind("possession")} placeholder="Ready to move" /></Field>
          <Field label="RERA number(s)" name="rera" error={err("rera")}><input {...bind("rera")} /></Field>
          <Field label="Posted on" name="postedAt" error={err("postedAt")} hint="Defaults to today"><input {...bind("postedAt")} type="date" /></Field>
        </div>
      </section>

      <section className="a-card">
        <h2>Description</h2>
        <div className="a-grid">
          <Field label="Summary *" name="summary" error={err("summary")} wide hint="One or two lines shown on cards"><textarea {...bind("summary")} style={{ minHeight: 60 }} /></Field>
          <Field label="Description *" name="description" error={err("description")} wide><textarea {...bind("description")} style={{ minHeight: 140 }} /></Field>
          <Field label="Highlights" name="features" error={nested("features")} wide hint="One per line"><textarea {...bind("features")} /></Field>
        </div>
      </section>

      <section className="a-card">
        <h2>Photos</h2>
        {err("images") ? <p className="a-field"><span className="err">{err("images")}</span></p> : null}
        <div className="a-thumbs">
          {f.images.map((im, i) => (
            <div className="a-thumb" key={im.id + i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={/^(\/|https?:)/.test(im.id) ? im.id : `https://images.unsplash.com/photo-${im.id}?auto=format&fit=crop&w=300&h=200&q=60`} alt="" />
              <input aria-label={`Photo ${i + 1} description`} value={im.alt} onChange={(e) => setF((p) => ({ ...p, images: p.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)) }))} />
              {err(`images.${i}.alt`) ? <span className="err" style={{ color: "var(--a-danger)", fontSize: 12 }}>{err(`images.${i}.alt`)}</span> : null}
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="a-btn sm" disabled={i === 0} onClick={() => setF((p) => { const a = [...p.images]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return { ...p, images: a }; })}>←</button>
                <button type="button" className="a-btn sm" disabled={i === f.images.length - 1} onClick={() => setF((p) => { const a = [...p.images]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; return { ...p, images: a }; })}>→</button>
                <button type="button" className="a-btn sm danger" onClick={() => setF((p) => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 12 }}>
          <label className="a-btn" style={{ cursor: "pointer" }}>
            Upload photos
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e, "gallery")} />
          </label>{" "}
          <button type="button" className="a-btn" onClick={() => { const u = prompt("Paste an https image link"); if (u) setF((p) => ({ ...p, images: [...p.images, { id: u.trim(), alt: `${p.title || "Property"} - photo ${p.images.length + 1}` }] })); }}>
            Add from link
          </button>
        </p>
        <p className="admin-sub">The first photo is the cover. JPEG, PNG or WebP, up to 8 MB each.</p>
        <div className="a-grid" style={{ marginTop: 12 }}>
          <Field label="Floor plan image" name="floorplan" error={err("floorplan")} hint="Upload, or paste a link / path">
            <input {...bind("floorplan")} />
          </Field>
          <Field label=" " name="fpup">
            <label className="a-btn" style={{ cursor: "pointer", justifySelf: "start" }}>
              Upload floor plan
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e, "floorplan")} />
            </label>
          </Field>
        </div>
      </section>

      <section className="a-card">
        <h2>Advanced lists</h2>
        <p className="admin-sub">Optional. Each box takes a JSON list: copy the example and edit it. Icon names must exist on the site (e.g. waves, dumbbell, train).</p>
        <div className="a-grid" style={{ gridTemplateColumns: "1fr" }}>
          <Field label="Unit types (sizes and starting prices)" name="unitTypes" error={err("unitTypes") || nested("unitTypes")} hint={`Example: ${EXAMPLES.unitTypes}`}><textarea {...bind("unitTypes")} className="code" /></Field>
          <Field label="Amenities" name="amenities" error={err("amenities") || nested("amenities")} hint={`Example: ${EXAMPLES.amenities}`}><textarea {...bind("amenities")} className="code" /></Field>
          <Field label="Connectivity" name="connectivity" error={err("connectivity") || nested("connectivity")} hint={`Example: ${EXAMPLES.connectivity}`}><textarea {...bind("connectivity")} className="code" /></Field>
        </div>
      </section>

      <div className="a-sticky">
        <button type="button" className="a-btn primary" disabled={busy} onClick={(e) => submit(e, "PUBLISHED")}>
          {busy ? "Saving…" : f.status === "PUBLISHED" ? "Save & keep live" : "Publish"}
        </button>
        <button type="button" className="a-btn" disabled={busy} onClick={(e) => submit(e, "DRAFT")}>
          {f.status === "PUBLISHED" ? "Unpublish (save as draft)" : "Save draft"}
        </button>
        <span className="admin-sub" style={{ margin: 0 }}>
          Status: {f.status === "PUBLISHED" ? "Live" : "Draft"}
        </span>
      </div>
    </form>
  );
}
