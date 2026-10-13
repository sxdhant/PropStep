/**
 * Reads the listings spreadsheet (content/listings.csv) and turns each row into a Listing.
 * Used by lib/content.ts (the site reads the sheet directly) and scripts/listings.mjs (check / export).
 * Server-side only (reads files). Paths are relative to the project root (the current working directory).
 *
 * List-style cells are packed into one cell with " | " between items:
 *   features      Corner unit | Two balconies | Power backup
 *   amenities     waves:Swimming pool | dumbbell:Gym            (icon:label, icon names are in components/Icon.tsx)
 *   connectivity  train:Namma Metro station:15 min | plane:Airport:60 min   (icon:place:time)
 *   unit_types    2:1180:15300000 | 3:1850:21000000             (bhk:area:price[:floorplan path])
 *   images        01.jpg | 02.jpg      or  <unsplash id>::alt text | ...
 *
 * Blank cells are fine for anything optional. Derived when blank: slug, price_label, locality_slug, configs,
 * area_min / area_max, price (cheapest unit type), posted (today), floorplan (public/floorplans/<slug>.*).
 * images: if the cell is empty, every photo in public/properties/<slug>/ is used (sorted by file name).
 * An entry can be a file name in that folder, a /public path, an https URL or an Unsplash id.
 */
import fs from "node:fs";
import path from "node:path";

export const COLUMNS = [
  "slug", "title", "intent", "type", "developer", "project", "bhk", "baths", "area", "city", "locality",
  "price", "price_label", "floor", "age", "possession", "rera", "badge", "advisor", "posted", "units",
  "configs", "area_min", "area_max", "unit_types", "floorplan", "connecting_road",
  "summary", "description", "features", "amenities", "connectivity", "images",
];
const NUMBERS = ["bhk", "baths", "area", "price", "units", "area_min", "area_max"];
const REQUIRED = ["title", "intent", "type", "bhk", "city", "locality", "area", "summary", "description", "advisor"];
// Key order of each object in listings.json
const JSON_ORDER = [
  "slug", "title", "developer", "project", "configs", "units", "area_min", "area_max", "intent", "type", "bhk", "city",
  "locality", "locality_slug", "price", "price_label", "area", "baths", "floor", "age", "possession", "rera", "floorplan",
  "badge", "images", "summary", "description", "features", "advisor", "posted", "unit_types", "amenities", "connecting_road",
  "connectivity",
];

export const CSV_PATH = "content/listings.csv";

// inrShort mirrors lib/format.ts
const trim = (v, d) => String(parseFloat(v.toFixed(d)));
export const inrShort = (n) =>
  n >= 1e7 ? `₹${trim(n / 1e7, 2)} Cr` : n >= 1e5 ? `₹${trim(n / 1e5, 2)} L` : `₹${new Intl.NumberFormat("en-IN").format(n)}`;
const slugify = (s) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const split = (cell, sep = "|") => cell.split(sep).map((s) => s.trim()).filter(Boolean);
const IMG_EXT = /\.(jpe?g|png|webp|avif)$/i;

/** RFC 4180: quotes, commas and newlines inside cells. */
export function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') (text[i + 1] === '"' ? ((cell += '"'), i++) : (quoted = false));
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") (row.push(cell), (cell = ""));
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      (row = []), (cell = "");
    } else cell += c;
  }
  if (cell || row.length) (row.push(cell), rows.push(row));
  return rows.filter((r) => r.some((v) => v.trim()));
}
export const csvCell = (v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const readJson = (root, f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));

/** CSV text -> { listings, errors, warnings }. Errors carry the sheet row number. */
export function buildListings(csvText, root = process.cwd(), refs = null) {
  // refs = { advisors: string[], localities: {name, slug}[], icons: string[] } validates against the database and skips every
  // file-system lookup (admin-panel import on a serverless host); without it the content/ files and public/ folders are used.
  const useFs = !refs;
  const [header, ...rows] = parseCsv(csvText).map((r) => r.map((v) => v.trim()));
  const errors = [], warnings = [], out = [], seen = new Map();
  if (!header) return { listings: [], errors: ["The listings sheet is empty"], warnings };
  const unknown = header.filter((h) => !COLUMNS.includes(h));
  if (unknown.length) warnings.push(`Ignoring unknown columns: ${unknown.join(", ")}`);

  const advisors = refs ? refs.advisors : Object.keys(readJson(root, "content/site.json").advisors);
  const localities = refs ? refs.localities : readJson(root, "content/localities.json");
  const icons = new Set(
    refs ? refs.icons : [...fs.readFileSync(path.join(root, "components/Icon.tsx"), "utf8").matchAll(/^\s{2}"?([a-z0-9-]+)"?:/gm)].map((m) => m[1]),
  );
  const today = new Date().toISOString().slice(0, 10);

  rows.forEach((cells, idx) => {
    const line = idx + 2; // spreadsheet row number (row 1 is the header)
    const r = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
    const fail = (msg) => errors.push(`Row ${line} (${r.title || r.slug || "untitled"}): ${msg}`);
    const warn = (msg) => warnings.push(`Row ${line} (${r.title || r.slug}): ${msg}`);

    for (const k of REQUIRED) if (!r[k]) fail(`"${k}" is required`);
    for (const k of NUMBERS) if (r[k] && !Number.isFinite(Number(r[k]))) fail(`"${k}" must be a number, got "${r[k]}"`);
    if (r.intent && !["buy", "rent"].includes(r.intent)) fail(`"intent" must be buy or rent, got "${r.intent}"`);
    if (r.advisor && !advisors.includes(r.advisor)) fail(`unknown advisor "${r.advisor}" (use one of: ${advisors.join(", ")})`);
    // Excel often rewrites dates as DD-MM-YYYY / DD/MM/YYYY: accept those and convert
    const dmy = r.posted?.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmy) r.posted = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
    if (r.posted && !/^\d{4}-\d{2}-\d{2}$/.test(r.posted)) fail(`"posted" must be YYYY-MM-DD, got "${r.posted}"`);

    const l = {};
    for (const k of NUMBERS) if (r[k]) l[k] = Number(r[k]);
    for (const k of ["title", "intent", "type", "developer", "project", "city", "locality", "price_label", "floor", "age", "possession", "rera", "badge", "advisor", "posted", "connecting_road", "floorplan", "summary", "description", "slug"]) {
      if (r[k]) l[k] = r[k];
    }

    // unit_types  bhk:area:price[:floorplan]
    const units = [];
    for (const item of split(r.unit_types ?? "")) {
      const [bhk, area, price, floorplan] = item.split(":").map((s) => s.trim());
      if (![bhk, area, price].every((v) => v && Number.isFinite(Number(v)))) { fail(`unit_types "${item}" should look like bhk:area:price`); continue; }
      units.push({ bhk: Number(bhk), area: Number(area), price: Number(price), ...(floorplan ? { floorplan } : {}) });
    }
    if (units.length) l.unit_types = units;

    if (!l.price && units.length) l.price = Math.min(...units.map((u) => u.price));
    if (!l.price) fail(`"price" is required (or give unit_types)`);
    if (l.price) l.price_label ||= inrShort(l.price);

    if (r.configs) l.configs = split(r.configs).map(Number);
    else if (units.length) l.configs = [...new Set(units.map((u) => u.bhk))].sort((a, b) => a - b);
    if (units.length) {
      l.area_min ??= Math.min(...units.map((u) => u.area));
      l.area_max ??= Math.max(...units.map((u) => u.area));
    }

    // Locality: link to the locality guide when there is one
    const loc = localities.find((x) => x.name.toLowerCase() === (r.locality ?? "").toLowerCase());
    l.locality_slug = loc ? loc.slug : "";
    if (loc) l.locality = loc.name;

    l.slug ||= slugify([r.locality, `${r.bhk}bhk`, r.project || r.type].join(" "));
    if (!/^[a-z0-9-]+$/.test(l.slug)) fail(`slug "${l.slug}" may only contain a-z, 0-9 and "-"`);
    if (seen.has(l.slug)) fail(`duplicate slug "${l.slug}" (also row ${seen.get(l.slug)}) — give one a different slug`);
    seen.set(l.slug, line);

    l.posted ||= today;

    if (useFs && !l.floorplan) {
      const dir = path.join(root, "public/floorplans");
      const hit = fs.existsSync(dir) && fs.readdirSync(dir).find((f) => f.replace(/\.[^.]+$/, "") === l.slug);
      if (hit) l.floorplan = `/floorplans/${hit}`;
    } else if (useFs && l.floorplan && l.floorplan.startsWith("/") && !fs.existsSync(path.join(root, "public", l.floorplan))) warn(`floorplan ${l.floorplan} not found in public/`);

    // images
    const folder = `public/properties/${l.slug}`;
    let images = split(r.images ?? "").map((item) => {
      const [src, alt] = item.split("::");
      const id = /^(\/|https?:)/.test(src) || !IMG_EXT.test(src) ? src : `/properties/${l.slug}/${src}`;
      return { id, alt: alt?.trim() };
    });
    if (useFs && !images.length && fs.existsSync(path.join(root, folder))) {
      images = fs.readdirSync(path.join(root, folder)).filter((f) => IMG_EXT.test(f)).sort().map((f) => ({ id: `/properties/${l.slug}/${f}` }));
    }
    images.forEach((p, i) => { p.alt ||= `${l.title} - photo ${i + 1}`; });
    if (useFs) for (const p of images) if (p.id.startsWith("/") && !fs.existsSync(path.join(root, "public", p.id))) warn(`image ${p.id} not found in public/`);
    if (!images.length) fail(`no photos: fill "images" or add files to ${folder}/`);
    l.images = images;

    l.features = split(r.features ?? "");
    if (!l.features.length) delete l.features;

    const amenities = split(r.amenities ?? "").map((item) => {
      const i = item.indexOf(":");
      return { icon: item.slice(0, i).trim(), label: item.slice(i + 1).trim() };
    });
    for (const a of amenities) if (!a.label || !icons.has(a.icon)) fail(`amenities "${a.icon}:${a.label}" — unknown icon or missing label`);
    if (amenities.length) l.amenities = amenities;

    const connectivity = split(r.connectivity ?? "").map((item) => {
      const a = item.indexOf(":"), b = item.lastIndexOf(":");
      return { icon: item.slice(0, a).trim(), place: item.slice(a + 1, b).trim(), time: item.slice(b + 1).trim() };
    });
    for (const c of connectivity) if (!c.place || !c.time || !icons.has(c.icon)) fail(`connectivity "${c.icon}:${c.place}:${c.time}" should be icon:place:time with a valid icon`);
    if (connectivity.length) l.connectivity = connectivity;

    out.push(Object.fromEntries(JSON_ORDER.filter((k) => l[k] !== undefined).map((k) => [k, l[k]])));
  });

  return { listings: out, errors, warnings };
}

/** Listing -> one spreadsheet row's cells (the reverse of buildListings). */
export function listingToCells(l) {
  const c = {
    ...l,
    price_label: l.price_label === inrShort(l.price) ? "" : l.price_label,
    configs: (l.configs ?? []).join(" | "),
    unit_types: (l.unit_types ?? []).map((u) => [u.bhk, u.area, u.price, u.floorplan].filter((x) => x !== undefined).join(":")).join(" | "),
    features: (l.features ?? []).join(" | "),
    amenities: (l.amenities ?? []).map((a) => `${a.icon}:${a.label}`).join(" | "),
    connectivity: (l.connectivity ?? []).map((x) => `${x.icon}:${x.place}:${x.time}`).join(" | "),
    images: (l.images ?? []).map((p) => `${p.id}::${p.alt}`).join(" | "),
  };
  return COLUMNS.map((k) => String(c[k] ?? ""));
}
