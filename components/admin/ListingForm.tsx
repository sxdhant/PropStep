"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { badgeList, DEFAULT_BADGES, type BadgeDef, PROPERTY_TYPES } from "@/lib/budgets";
import IconSelect from "./IconSelect";
import MultiSelect from "./MultiSelect";
import Select from "./Select";
import { inrShort } from "@/lib/format";
import { Alert, api, Field, Problems, uploadImage, useLoad } from "./ui";

type Img = { id: string; alt: string };
type PlaceRow = { icon: string; place: string; time: string };
type AmenityRow = { icon: string; label: string };
/** manual: the price was typed by hand, so the rate no longer recalculates it */
type UnitRow = { label: string; area: string; price: string; manual: boolean; floorplan: string };
const blankUnit: UnitRow = { label: "", area: "", price: "", manual: false, floorplan: "" };
type State = {
  slug: string; title: string; type: string; developer: string; project: string; advisorKey: string;
  city: string; locality: string; localitySlug: string; status: "DRAFT" | "PUBLISHED";
  hotSelling: boolean; handpicked: boolean;
  pricePerSqft: string; priceTouched: boolean; labelTouched: boolean; mapUrl: string;
  price: string; priceLabel: string; units: string; totalArea: string; towers: string; structure: string; areaMin: string; areaMax: string; configs: string;
  possession: string; rera: string; badges: string[]; connectingRoad: string; floorplan: string; postedAt: string;
  summary: string; description: string; notes: string[]; features: string[]; images: Img[];
  unitRows: UnitRow[]; amenityRows: AmenityRow[]; placeRows: PlaceRow[];
};

const blank: State = {
  slug: "", title: "", type: "Apartment", developer: "", project: "", advisorKey: "", city: "Bengaluru", locality: "", localitySlug: "", status: "DRAFT",
  hotSelling: false, handpicked: false,
  pricePerSqft: "", priceTouched: false, labelTouched: false, mapUrl: "",
  price: "", priceLabel: "", units: "", totalArea: "", towers: "", structure: "", areaMin: "", areaMax: "", configs: "",
  possession: "", rera: "", badges: [], connectingRoad: "", floorplan: "", postedAt: "",
  summary: "", description: "", notes: [], features: [], images: [], unitRows: [], amenityRows: [], placeRows: [],
};

const MAX_PHOTOS = 10;
const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
const n = (v: string) => (v.trim() === "" ? NaN : Number(v));

/**
 * Keeps the price fields in step: the price is the rate x the smallest size, each price-list row is the rate x its size,
 * and "Price shown as" follows the price (₹1.53 Cr). Anything typed by hand is left alone until its box is emptied.
 */
function recalc(p: State): State {
  const rate = n(p.pricePerSqft);
  const out = { ...p };
  if (rate > 0) {
    const a = n(p.areaMin);
    if (!p.priceTouched && a > 0) out.price = String(Math.round(a * rate));
    out.unitRows = p.unitRows.map((r) => (!r.manual && n(r.area) > 0 ? { ...r, price: String(Math.round(n(r.area) * rate)) } : r));
  }
  if (!p.labelTouched) out.priceLabel = n(out.price) > 0 ? inrShort(n(out.price)) : "";
  return out;
}
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);


export default function ListingForm({ id }: { id?: string }) {
  const router = useRouter();
  const [f, setF] = useState<State>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [top, setTop] = useState<{ error?: string; ok?: string }>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [slugTouched, setSlugTouched] = useState(!!id);

  const existing = useLoad<{ listing: Record<string, unknown> }>(id ? `/api/admin/listings/${id}` : null);
  const advisors = useLoad<{ items: { key: string; name: string }[] }>("/api/admin/advisors");
  const localities = useLoad<{ items: { slug: string; name: string }[] }>("/api/admin/localities");
  const badgeSetting = useLoad<{ value: BadgeDef[] }>("/api/admin/site/badges");
  const badgeDefs = Array.isArray(badgeSetting.data?.value) ? badgeSetting.data.value : DEFAULT_BADGES;

  useEffect(() => {
    const l = existing.data?.listing;
    if (!l) return;
    const s = (k: string) => String(l[k] ?? "");
    setF({
      slug: s("slug"), title: s("title"), type: s("type"), developer: s("developer"), project: s("project"), advisorKey: s("advisorKey"),
      city: s("city"), locality: s("locality"), localitySlug: s("localitySlug"), status: l.status as State["status"],
      hotSelling: l.hotSelling === true, handpicked: l.handpicked === true,
      pricePerSqft: s("pricePerSqft"), mapUrl: s("mapUrl"),
      priceTouched: !(Number(l.pricePerSqft) > 0 && Number(l.price) === Math.round(Number(s("areaMin") || s("area")) * Number(l.pricePerSqft))),
      labelTouched: !!l.priceLabel && Number(l.price) > 0 && l.priceLabel !== inrShort(Number(l.price)),
      price: Number(l.price) ? s("price") : "", priceLabel: s("priceLabel"), units: s("units"), totalArea: s("totalArea"), towers: s("towers"), structure: s("structure"), areaMin: s("areaMin") || s("area"),
      areaMax: s("areaMax"), configs: (((l.configs as number[]) ?? []).length ? (l.configs as number[]) : Number(l.bhk) ? [Number(l.bhk)] : []).join(", "),
      possession: s("possession"), rera: s("rera"), badges: badgeList(s("badge")), connectingRoad: s("connectingRoad"),
      floorplan: s("floorplan"), postedAt: s("postedAt"), summary: s("summary"), description: s("description"),
      notes: (l.notes as string[]) ?? [], features: (l.features as string[]) ?? [], images: (l.images as Img[]) ?? [],
      unitRows: ((l.unitTypes as { label?: string; bhk: number; area: number; price: number; psf?: number; floorplan?: string }[]) ?? []).map((u) => ({
        label: u.label || `${u.bhk} BHK ${s("type")}`.trim(), area: String(u.area), price: String(u.price), floorplan: u.floorplan ?? "",
        manual: !(Number(l.pricePerSqft) > 0 && u.price === Math.round(u.area * Number(l.pricePerSqft))),
      })),
      amenityRows: ((l.amenities as AmenityRow[]) ?? []).map((a) => ({ icon: a.icon, label: a.label })),
      placeRows: ((l.connectivity as PlaceRow[]) ?? []).map((c) => ({ icon: c.icon, place: c.place, time: c.time })),
    });
  }, [existing.data]);

  // Bring the first field with a problem into view
  useEffect(() => {
    if (Object.keys(errors).length) document.querySelector(".a-field.has-error")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [errors]);

  const set = <K extends keyof State>(k: K, v: State[K]) => setF((p) => ({ ...p, [k]: v }));
  const bind = (k: keyof State) => ({
    id: k,
    name: k,
    value: f[k] as string,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never),
  });
  /** the error for a field, including errors on its parts (e.g. "configs.1" belongs to the "configs" field) */
  const err = (k: string) => errors[k] ?? Object.entries(errors).find(([e]) => e.startsWith(`${k}.`))?.[1];
  /** errors under a nested path, e.g. "unitTypes.0.price" -> shown below the JSON box */
  const nested = (prefix: string) =>
    Object.entries(errors)
      .filter(([k]) => k.startsWith(`${prefix}.`) || k === prefix)
      .map(([k, v]) => `${k.replace(/\.(\d+)/g, (_, n) => ` #${Number(n) + 1}`)}: ${v}`)
      .join(" · ");

  async function upload(e: ChangeEvent<HTMLInputElement>, to: "gallery" | "floorplan") {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const failed: string[] = [];
    setPhotoErrors([]);
    const room = to === "gallery" ? MAX_PHOTOS - f.images.length : files.length;
    if (files.length > room) failed.push(`Only ${Math.max(room, 0)} more photo${room === 1 ? "" : "s"} can be added (the limit is ${MAX_PHOTOS}). The rest were skipped.`);
    for (const [i, file] of files.slice(0, Math.max(room, 0)).entries()) {
      setUploading(`Uploading ${i + 1} of ${Math.min(files.length, Math.max(room, 0))}…`);
      const r = await uploadImage(file).catch(() => ({ url: undefined, error: "network error" }));
      if (r.error) {
        failed.push(`${file.name}: ${r.error}`);
        continue; // one bad file doesn't stop the rest
      }
      if (to === "floorplan") set("floorplan", r.url!);
      else setF((p) => ({ ...p, images: [...p.images, { id: r.url!, alt: `${p.title || "Property"} - photo ${p.images.length + 1}` }] }));
    }
    setUploading("");
    setPhotoErrors(failed);
  }

  /** Upload the floor plan of one price-list row */
  async function uploadUnitPlan(e: ChangeEvent<HTMLInputElement>, i: number) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoErrors([]);
    setUploading(`Uploading floor plan for row ${i + 1}…`);
    const r = await uploadImage(file).catch(() => ({ url: undefined, error: "network error" }));
    setUploading("");
    if (r.error) return setPhotoErrors([`${file.name}: ${r.error}`]);
    setF((p) => ({ ...p, unitRows: p.unitRows.map((x, j) => (j === i ? { ...x, floorplan: r.url! } : x)) }));
  }

  async function submit(e: FormEvent, status?: State["status"]) {
    e.preventDefault();
    setTop({});
    const bad: Record<string, string> = {};
    // Price list rows: skip empty ones, ask for every column in the rest
    const rows = f.unitRows.filter((r) => r.label.trim() || r.area.trim() || r.price.trim());
    rows.forEach((r, i) => {
      if (!r.label.trim()) bad[`unitTypes.${i}.label`] = "Describe the unit type, e.g. 3 BHK Apartment";
      if (!(Number(r.area) >= 1)) bad[`unitTypes.${i}.area`] = r.area.trim() ? "Enter a number" : "Fill this in, or remove the row";
      if (!r.price.trim()) bad[`unitTypes.${i}.price`] = "Enter the price, or set the price per sq ft in Configuration";
      else if (!(Number(r.price) >= 1)) bad[`unitTypes.${i}.price`] = "Enter a number";
    });
    const unitTypes = rows.length
      ? rows.map((r) => ({
          label: r.label.trim(),
          area: Number(r.area),
          price: Number(r.price),
          ...(r.floorplan ? { floorplan: r.floorplan } : {}),
        }))
      : undefined;
    const amenityList = f.amenityRows.filter((r) => r.icon || r.label.trim());
    amenityList.forEach((r, i) => {
      if (!r.icon) bad[`amenities.${i}.icon`] = "Choose an icon";
      if (!r.label.trim()) bad[`amenities.${i}.label`] = "Write the amenity name";
    });
    const amenities = amenityList.length ? amenityList.map((r) => ({ icon: r.icon, label: r.label.trim() })) : undefined;
    const placeList = f.placeRows.filter((r) => r.icon || r.place.trim() || r.time.trim());
    placeList.forEach((r, i) => {
      if (!r.icon) bad[`connectivity.${i}.icon`] = "Choose an icon";
      if (!r.place.trim()) bad[`connectivity.${i}.place`] = "Write the place name";
      if (!r.time.trim()) bad[`connectivity.${i}.time`] = "Add the travel time";
    });
    const connectivity = placeList.length ? placeList.map((r) => ({ icon: r.icon, place: r.place.trim(), time: r.time.trim() })) : undefined;
    if (Object.keys(bad).length) return setErrors(bad);

    const body = {
      slug: f.slug, title: f.title, type: f.type, intent: "buy", developer: f.developer, project: f.project, advisorKey: f.advisorKey,
      city: f.city, locality: f.locality, localitySlug: f.localitySlug, status: status ?? f.status,
      hotSelling: f.hotSelling, handpicked: f.handpicked,
      pricePerSqft: num(f.pricePerSqft) ? Math.round(Number(f.pricePerSqft)) : undefined, mapUrl: f.mapUrl.trim() || undefined,
      price: num(f.price), priceLabel: f.priceLabel, units: num(f.units), totalArea: f.totalArea, towers: num(f.towers), structure: f.structure,
      areaMin: num(f.areaMin), areaMax: num(f.areaMax),
      configs: f.configs.trim() ? (f.configs.match(/\d+/g) ?? []).map(Number) : undefined,
      possession: f.possession, rera: f.rera, badge: f.badges.join(", "), connectingRoad: f.connectingRoad, floorplan: f.floorplan,
      postedAt: f.postedAt || undefined, summary: f.summary, description: f.description,
      features: f.features, notes: f.notes.map((s) => s.trim()).filter(Boolean), images: f.images, unitTypes, amenities, connectivity,
    };
    setBusy(true);
    const r = await api<{ listing: { id: string } }>(id ? `/api/admin/listings/${id}` : "/api/admin/listings", { method: id ? "PATCH" : "POST", body });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.data.errors ?? {});
      return setTop({ error: Object.keys(r.data.errors ?? {}).length ? "Some fields need attention. They are marked in red below." : r.data.error ?? "Could not save" });
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
        <h2>1. Top of the page</h2>
        <p className="sec-where">The title area at the top of the property page, and how the listing appears on cards and in search results.</p>
        <div className="a-grid">
          <Field label="Listing title *" name="title" error={err("title")} wide hint="Used in the browser tab, search results and enquiries">
            <input {...bind("title")} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} placeholder="3 BHK apartment, Cedar Court" />
          </Field>
          <Field label="Page address (URL) *" name="slug" error={err("slug")} hint="The end of the page link. Lowercase letters, numbers and hyphens.">
            <input {...bind("slug")} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
          </Field>
          <Field label="Badges (tags above the heading)" name="badge" error={err("badge")} hint="Choose any that apply">
            <MultiSelect label="Badges" value={f.badges} onChange={(v) => set("badges", v)} options={badgeDefs.map((b) => b.name)} icons={Object.fromEntries(badgeDefs.flatMap((b) => (b.icon ? [[b.name, b.icon]] : [])))} placeholder="None" />
          </Field>
          <Field label="Developer (small text above the heading)" name="developer" error={err("developer")}><input {...bind("developer")} /></Field>
          <Field label="Project name (large heading)" name="project" error={err("project")} hint="Falls back to the title if empty"><input {...bind("project")} /></Field>
          <Field label="Property type *" name="type" error={err("type")}>
            <Select label="Type" value={f.type} onChange={(v) => set("type", v)} options={[...PROPERTY_TYPES, ...(f.type && !PROPERTY_TYPES.includes(f.type) ? [f.type] : [])].map((t) => [t, t] as [string, string])} />
          </Field>
          <Field label="City (shown under the heading) *" name="city" error={err("city")}><input {...bind("city")} /></Field>
          <Field label="Locality (shown under the heading) *" name="locality" error={err("locality")}><input {...bind("locality")} list="locs" /><datalist id="locs">{localities.data?.items.map((l) => <option key={l.slug} value={l.name} />)}</datalist></Field>
          <Field label="Short summary (also shown on cards) *" name="summary" error={err("summary")} wide hint="One or two lines"><textarea {...bind("summary")} style={{ minHeight: 60 }} /></Field>
          <Field label="Full description *" name="description" error={err("description")} wide hint="Shown after the summary in the intro paragraph"><textarea {...bind("description")} style={{ minHeight: 140 }} /></Field>
        </div>
      </section>

      <section className="a-card">
        <h2>2. Photo gallery</h2>
        <p className="sec-where">Shown at the top of the property page, under the title. The first photo is also the cover on property cards.</p>
        {err("images") ? <p className="a-field"><span className="err">{err("images")}</span></p> : null}
        <div className="photo-slots">
          {Array.from({ length: MAX_PHOTOS }, (_, i) => {
            const im = f.images[i];
            if (!im) {
              return (
                <label className="photo-slot photo-slot--empty" key={`empty-${i}`} aria-label="Add photos">
                  <span className="photo-slot__plus" aria-hidden="true">+</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e, "gallery")} />
                </label>
              );
            }
            const move = (d: number) => setF((p) => { const a = [...p.images]; [a[i + d], a[i]] = [a[i], a[i + d]]; return { ...p, images: a }; });
            return (
              <div className="photo-slot" key={im.id + i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={/^(\/|https?:)/.test(im.id) ? im.id : `https://images.unsplash.com/photo-${im.id}?auto=format&fit=crop&w=300&h=300&q=60`} alt={im.alt} />
                {i === 0 ? <span className="photo-slot__cover">Cover</span> : null}
                <button type="button" className="photo-slot__x" aria-label={`Remove photo ${i + 1}`} onClick={() => setF((p) => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}>×</button>
                <div className="photo-slot__bar">
                  <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => move(-1)}>←</button>
                  <button type="button" aria-label="Edit description" title={im.alt} onClick={() => { const v = prompt("Describe this photo (for accessibility and search engines)", im.alt); if (v?.trim()) setF((p) => ({ ...p, images: p.images.map((x, j) => (j === i ? { ...x, alt: v.trim() } : x)) })); }}>✎</button>
                  <button type="button" aria-label="Move later" disabled={i === f.images.length - 1} onClick={() => move(1)}>→</button>
                </div>
                {err(`images.${i}.alt`) ? <span className="photo-slot__err">{err(`images.${i}.alt`)}</span> : null}
              </div>
            );
          })}
        </div>
        {uploading ? <p className="admin-sub" role="status">{uploading}</p> : null}
        {photoErrors.length ? <Alert>{photoErrors.map((m) => <div key={m}>{m}</div>)}</Alert> : null}
        <p style={{ marginTop: 12 }}>
          <button type="button" className="a-btn sm" disabled={f.images.length >= MAX_PHOTOS} onClick={() => { const u = prompt("Paste an https image link"); if (u) setF((p) => ({ ...p, images: [...p.images, { id: u.trim(), alt: `${p.title || "Property"} - photo ${p.images.length + 1}` }] })); }}>
            Add a photo from a link
          </button>
        </p>
        <p className="admin-sub">{f.images.length} of {MAX_PHOTOS} photos. Tap a + block to add (you can pick several at once). The first photo is the cover. JPEG, PNG or WebP, up to 8 MB each.</p>
      </section>

      <section className="a-card">
        <h2>3. Configuration</h2>
        <p className="sec-where">The row of icon tiles under the heading "Configuration" on the property page. Everything here is optional: any field left empty is simply not shown.</p>
        <div className="a-grid">
          <Field label="Bedrooms (BHK options)" name="configs" error={err("configs")} hint="Comma separated, e.g. 2, 3. Shown as “2 & 3 BHK”"><input {...bind("configs")} /></Field>
          <Field label="Size: smallest (sq ft)" name="areaMin" error={err("areaMin")}><input {...bind("areaMin")} onChange={(e) => setF((p) => recalc({ ...p, areaMin: e.target.value }))} type="number" min={1} /></Field>
          <Field label="Size: largest (sq ft)" name="areaMax" error={err("areaMax")} hint="Leave empty if there is one size"><input {...bind("areaMax")} type="number" min={1} /></Field>
          <Field label="Number of units" name="units" error={err("units")}><input {...bind("units")} type="number" min={1} /></Field>
          <Field label="Total area" name="totalArea" error={err("totalArea")} hint="Of the whole project, with the unit, e.g. 4.5 acres"><input {...bind("totalArea")} placeholder="4.5 acres" /></Field>
          <Field label="Number of towers" name="towers" error={err("towers")}><input {...bind("towers")} type="number" min={1} /></Field>
          <Field label="Structure" name="structure" error={err("structure")} hint="e.g. 2B + G + 14 floors, RCC framed"><input {...bind("structure")} placeholder="2B + G + 14" /></Field>
          <Field label="Price per sq ft (₹)" name="pricePerSqft" error={err("pricePerSqft")} hint="Optional. With this, the price below and every price in the price list are worked out from the size. Also shown on the property card.">
            <input {...bind("pricePerSqft")} onChange={(e) => setF((p) => recalc({ ...p, pricePerSqft: e.target.value }))} type="number" min={1} placeholder="11350" />
          </Field>
          <Field label="Price (₹)" name="price" error={err("price")} hint="Starting price in full rupees, e.g. 15300000. Worked out as price per sq ft × smallest size, but you can type over it. Used on cards and in the EMI calculator. Empty it to calculate again.">
            <input {...bind("price")} onChange={(e) => setF((p) => recalc({ ...p, price: e.target.value, priceTouched: e.target.value.trim() !== "" }))} type="number" min={1} />
          </Field>
          <Field label="Price shown as" name="priceLabel" error={err("priceLabel")} hint="How the price reads on the site, e.g. ₹1.53 Cr. Filled in from the price, but you can type over it. Empty it to fill in again.">
            <input {...bind("priceLabel")} onChange={(e) => setF((p) => recalc({ ...p, priceLabel: e.target.value, labelTouched: e.target.value.trim() !== "" }))} />
          </Field>
          <Field label="Possession" name="possession" error={err("possession")} hint="Also shown as “Status” in About the project"><input {...bind("possession")} placeholder="Ready to move" /></Field>
        </div>
      </section>

      <section className="a-card">
        <h2>4. Worth knowing</h2>
        <p className="sec-where">Shown under the Configuration tiles on the property page, headed "Worth knowing". Use it for disclaimers, terms or a call to action. Leave it empty to hide the section.</p>
        <div className="unit-rows">
          {f.notes.map((t, i) => (
            <div className="unit-rows__row" key={i} style={{ gridTemplateColumns: "1fr auto" }}>
              <div className={`a-field${err(`notes.${i}`) ? " has-error" : ""}`}>
                <textarea aria-label={`Note ${i + 1}`} value={t} maxLength={600} style={{ minHeight: 64 }} placeholder="e.g. All specifications, dimensions, pricing and launch details are indicative and subject to change at the time of official launch." onChange={(e) => setF((p) => ({ ...p, notes: p.notes.map((x, j) => (j === i ? e.target.value : x)) }))} />
                {err(`notes.${i}`) ? <span className="err">{err(`notes.${i}`)}</span> : null}
              </div>
              <button type="button" className="a-btn sm danger" onClick={() => setF((p) => ({ ...p, notes: p.notes.filter((_, j) => j !== i) }))}>Remove</button>
            </div>
          ))}
          {!f.notes.length ? <p className="admin-sub" style={{ margin: "0 0 10px" }}>No notes yet.</p> : null}
          <button type="button" className="a-btn" disabled={f.notes.length >= 20} onClick={() => setF((p) => ({ ...p, notes: [...p.notes, ""] }))}>+ Add a note</button>
          <p className="admin-sub" style={{ margin: "10px 0 0" }}>One note per box, up to 20. Examples: “Limited residences available. Connect now for early access and preferred options.” or “Prices exclude registration and GST.”</p>
        </div>
      </section>

      <section className="a-card">
        <h2>5. About the project</h2>
        <p className="sec-where">The table headed "About the project". Project name, developer, location and status in that table come from the fields above.</p>
        <div className="a-grid">
          <Field label="Connecting road" name="connectingRoad" error={err("connectingRoad")} hint="Also used in the Location section text"><input {...bind("connectingRoad")} /></Field>
          <Field label="RERA number(s)" name="rera" error={err("rera")}><input {...bind("rera")} /></Field>
        </div>
      </section>

      <section className="a-card">
        <h2>6. Price list</h2>
        <p className="sec-where">The table headed "Price list" (and the unit choices in the floor plans). One row per home size.</p>
        <div className="unit-rows price-rows">
          <div className="unit-rows__head" aria-hidden="true">
            <span>Unit type</span><span>Size (sq ft)</span><span>Price (₹)</span><span />
          </div>
          {f.unitRows.map((r, i) => {
            const set = (patch: Partial<UnitRow>) => setF((p) => recalc({ ...p, unitRows: p.unitRows.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
            const cells: [keyof UnitRow, string, string, (v: string) => void, boolean][] = [
              ["label", "Unit type", "3 BHK Apartment", (v) => set({ label: v }), false],
              ["area", "Size in sq ft", "1850", (v) => set({ area: v }), true],
              // typing a price keeps it; emptying the box lets it follow the price per sq ft again
              ["price", "Price in rupees", "Calculated from the size", (v) => set({ price: v, manual: v.trim() !== "" }), true],
            ];
            return (
              <div className="unit-rows__row" key={i}>
                {cells.map(([c, label, ph, on, numeric]) => {
                  const e = errors[`unitTypes.${i}.${c}`];
                  return (
                    <label key={c} className={`a-field${e ? " has-error" : ""}`}>
                      <span className="unit-rows__label">{label}</span>
                      <input type={numeric ? "number" : "text"} min={numeric ? 1 : undefined} maxLength={numeric ? undefined : 80} value={String(r[c])} placeholder={ph} aria-label={`Row ${i + 1}: ${label}`} onChange={(ev) => on(ev.target.value)} />
                      {e ? <span className="err">{e}</span> : null}
                    </label>
                  );
                })}
                <button type="button" className="a-btn sm danger" onClick={() => setF((p) => ({ ...p, unitRows: p.unitRows.filter((_, j) => j !== i) }))}>Remove</button>
              </div>
            );
          })}
          {!f.unitRows.length ? <p className="admin-sub" style={{ margin: "0 0 10px" }}>No rows yet. Without a price list, the page shows the single price from Configuration.</p> : null}
          <button type="button" className="a-btn" onClick={() => setF((p) => ({ ...p, unitRows: [...p.unitRows, { ...blankUnit }] }))}>+ Add a row</button>
          <p className="admin-sub" style={{ margin: "10px 0 0" }}>One row per home size. Describe the unit type in your own words, e.g. “3 BHK Apartment” or “4 BHK Villa with study”. Set the Price per sq ft in Configuration above and each price here is worked out from its size. You can type over any price; empty the box to calculate it again.</p>
        </div>
      </section>

      <section className="a-card">
        <h2>7. Floor plans</h2>
        <p className="sec-where">The section headed "floor plans". Visitors pick a home size and see its plan. Add one plan for each row of the price list above; it appears when a price list exists.</p>
        {uploading ? <p className="admin-sub" role="status">{uploading}</p> : null}
        {photoErrors.length ? <Alert>{photoErrors.map((m) => <div key={m}>{m}</div>)}</Alert> : null}
        {f.unitRows.length ? (
          <div className="fp-rows">
            {f.unitRows.map((r, i) => (
              <div className="fp-row" key={i}>
                <div className="fp-row__thumb">
                  {r.floorplan ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.floorplan} alt="" />
                  ) : (
                    <span>No plan yet</span>
                  )}
                </div>
                <div className="fp-row__body">
                  <strong>{r.label || "Unit type not set"} · {r.area ? `${r.area} sq ft` : "size not set"}</strong>
                  <input aria-label={`Floor plan link for row ${i + 1}`} placeholder="Paste a link or path, or upload a file" value={r.floorplan} onChange={(ev) => setF((p) => ({ ...p, unitRows: p.unitRows.map((x, j) => (j === i ? { ...x, floorplan: ev.target.value } : x)) }))} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <label className="a-btn sm" style={{ cursor: "pointer" }}>
                      {r.floorplan ? "Replace plan" : "Upload plan"}
                      <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => uploadUnitPlan(e, i)} />
                    </label>
                    {r.floorplan ? <button type="button" className="a-btn sm danger" onClick={() => setF((p) => ({ ...p, unitRows: p.unitRows.map((x, j) => (j === i ? { ...x, floorplan: "" } : x)) }))}>Remove plan</button> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-sub">Add rows to the price list above first, then each home size gets a slot for its floor plan here.</p>
        )}
        <div className="a-grid" style={{ marginTop: 12 }}>
          <Field label="Default floor plan (optional)" name="floorplan" error={err("floorplan")} hint="Used for any home size above that has no plan of its own. Upload, or paste a link / path">
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
        <h2>8. Amenities</h2>
        <p className="sec-where">The icon grid headed "Amenities". Icon names must exist on the site (e.g. waves, dumbbell, train).</p>
        <div className="unit-rows amen-rows">
          <div className="unit-rows__head" aria-hidden="true"><span>Icon</span><span>Amenity</span><span /></div>
          {f.amenityRows.map((r, i) => {
            const ei = errors[`amenities.${i}.icon`], el = errors[`amenities.${i}.label`];
            return (
              <div className="unit-rows__row" key={i}>
                <div className={`a-field${ei ? " has-error" : ""}`}>
                  <IconSelect label={`Row ${i + 1}: icon`} value={r.icon} invalid={!!ei} onChange={(v) => setF((p) => ({ ...p, amenityRows: p.amenityRows.map((x, j) => (j === i ? { ...x, icon: v } : x)) }))} />
                  {ei ? <span className="err">{ei}</span> : null}
                </div>
                <div className={`a-field${el ? " has-error" : ""}`}>
                  <input value={r.label} maxLength={80} placeholder="e.g. Swimming pool" aria-label={`Row ${i + 1}: amenity name`} onChange={(ev) => setF((p) => ({ ...p, amenityRows: p.amenityRows.map((x, j) => (j === i ? { ...x, label: ev.target.value } : x)) }))} />
                  {el ? <span className="err">{el}</span> : null}
                </div>
                <button type="button" className="a-btn sm danger" onClick={() => setF((p) => ({ ...p, amenityRows: p.amenityRows.filter((_, j) => j !== i) }))}>Remove</button>
              </div>
            );
          })}
          {!f.amenityRows.length ? <p className="admin-sub" style={{ margin: "0 0 10px" }}>No amenities yet.</p> : null}
          <button type="button" className="a-btn" onClick={() => setF((p) => ({ ...p, amenityRows: [...p.amenityRows, { icon: "", label: "" }] }))}>+ Add an amenity</button>
        </div>
      </section>

      <section className="a-card">
        <h2>9. Location and connectivity</h2>
        <p className="sec-where">The map and the "Nearest places" list. The map is built from the project name, locality and city.</p>
        <div className="a-grid">
          <Field label="Project location (Google Maps link)" name="mapUrl" error={err("mapUrl")} wide hint="Open the project in Google Maps, press Share, then Copy link, and paste it here. The map on the property page will point to this exact spot.">
            <input {...bind("mapUrl")} placeholder="https://maps.app.goo.gl/..." />
          </Field>
          <Field label="Locality guide (button under the map)" name="localitySlug" error={err("localitySlug")} hint="Adds a link to that locality's guide page">
            <Select label="Locality guide" search="Search localities" value={f.localitySlug} onChange={(v) => set("localitySlug", v)} options={[["", "None"], ...(localities.data?.items.map((l) => [l.slug, l.name] as [string, string]) ?? [])]} />
          </Field>
        </div>
        <h3 style={{ margin: "18px 0 8px", fontSize: "0.95rem" }}>Nearest places</h3>
        <div className="unit-rows place-rows">
          <div className="unit-rows__head" aria-hidden="true"><span>Icon</span><span>Place</span><span>Travel time</span><span /></div>
          {f.placeRows.map((r, i) => {
            const set1 = (patch: Partial<PlaceRow>) => setF((p) => ({ ...p, placeRows: p.placeRows.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
            const ei = errors[`connectivity.${i}.icon`], ep = errors[`connectivity.${i}.place`], et = errors[`connectivity.${i}.time`];
            return (
              <div className="unit-rows__row" key={i}>
                <div className={`a-field${ei ? " has-error" : ""}`}>
                  <IconSelect label={`Row ${i + 1}: icon`} value={r.icon} invalid={!!ei} onChange={(v) => set1({ icon: v })} />
                  {ei ? <span className="err">{ei}</span> : null}
                </div>
                <div className={`a-field${ep ? " has-error" : ""}`}>
                  <input value={r.place} maxLength={100} placeholder="e.g. Namma Metro (Purple Line)" aria-label={`Row ${i + 1}: place`} onChange={(ev) => set1({ place: ev.target.value })} />
                  {ep ? <span className="err">{ep}</span> : null}
                </div>
                <div className={`a-field${et ? " has-error" : ""}`}>
                  <input value={r.time} maxLength={40} placeholder="e.g. 6 min" aria-label={`Row ${i + 1}: travel time`} onChange={(ev) => set1({ time: ev.target.value })} />
                  {et ? <span className="err">{et}</span> : null}
                </div>
                <button type="button" className="a-btn sm danger" onClick={() => setF((p) => ({ ...p, placeRows: p.placeRows.filter((_, j) => j !== i) }))}>Remove</button>
              </div>
            );
          })}
          {!f.placeRows.length ? <p className="admin-sub" style={{ margin: "0 0 10px" }}>No places yet.</p> : null}
          <button type="button" className="a-btn" onClick={() => setF((p) => ({ ...p, placeRows: [...p.placeRows, { icon: "", place: "", time: "" }] }))}>+ Add a place</button>
        </div>
      </section>

      <section className="a-card">
        <h2>10. Enquiry panel (right side of the page)</h2>
        <p className="sec-where">The advisor card next to the enquiry form. The EMI calculator uses the price from Configuration.</p>
        <div className="a-grid">
          <Field label="Advisor *" name="advisorKey" error={err("advisorKey")}>
            <Select label="Advisor" value={f.advisorKey} onChange={(v) => set("advisorKey", v)} options={[["", "Choose an advisor"], ...(advisors.data?.items.map((a) => [a.key, a.name] as [string, string]) ?? [])]} />
          </Field>
        </div>
      </section>

      <section className="a-card">
        <h2>11. Home page and sorting</h2>
        <p className="sec-where">Not part of the property page itself. Controls where this listing appears on the home page.</p>
        <div className="a-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 12 }}>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <input type="checkbox" checked={f.hotSelling} onChange={(e) => set("hotSelling", e.target.checked)} />
            <span><b>Show in “Hot selling properties”</b><br /><span className="hint">The home page row near the top. If no listing is ticked, the 6 newest are shown instead.</span></span>
          </label>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <input type="checkbox" checked={f.handpicked} onChange={(e) => set("handpicked", e.target.checked)} />
            <span><b>Show in “Handpicked by our advisors”</b><br /><span className="hint">The home page row further down. If no listing is ticked, all Bengaluru listings are shown instead.</span></span>
          </label>
        </div>
        <div className="a-grid">
          <Field label="Posted on" name="postedAt" error={err("postedAt")} hint="Used for “Newest” sorting. Defaults to today"><input {...bind("postedAt")} type="date" /></Field>
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
