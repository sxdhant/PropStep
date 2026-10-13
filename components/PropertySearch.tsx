"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Icon from "./Icon";
import Dropdown from "./Dropdown";
import { ListingCard } from "./cards";
import UrlParams, { animateIn, writeQuery } from "./UrlParams";
import { BUDGETS, PROPERTY_TYPES as TYPES } from "@/lib/budgets";
import type { Listing } from "@/lib/types";

const SORTS = [
  ["recommended", "Recommended"],
  ["newest", "Newest first"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["area-desc", "Largest first"],
] as const;

const BHKS = [
  { value: "", label: "Any BHK" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4", label: "4+ BHK" },
];

/** A locality to search by, and the zones it falls in */
type Area = { name: string; zones: string[] };
const inZone = (a: Area, zone: string) => !zone || a.zones.includes(zone);

/** What's searched for ("" = any) */
type Query = { city: string; zone: string; locality: string; type: string; bhk: string; budget: string };
const blank = (city: string): Query => ({ city, zone: "", locality: "", type: "", bhk: "", budget: "" });

type Props = {
  listings: Listing[];
  /** The cities to choose from; the first is the default */
  cities: string[];
  /** The zones to choose from (North, South, …) */
  zones: string[];
  /** Each city's localities, A–Z: the Locality choices follow the chosen city and zone */
  areas: Record<string, Area[]>;
};

/**
 * The search bar on /properties/: City, Zone, Locality (in that zone), Property type, Bedrooms and Budget in one bar.
 * The choices are a draft until Search runs them; the sort applies at once.
 */
export default function PropertySearch({ listings, cities, zones, areas }: Props) {
  const defaultCity = cities[0];
  const [query, setQuery] = useState<Query>(() => blank(defaultCity));
  const [draft, setDraft] = useState<Query>(() => blank(defaultCity));
  const [sort, setSort] = useState("recommended");
  const [ready, setReady] = useState(false);
  const lastWritten = useRef<string | null>(null);
  const firstRun = useRef(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const areasOf = (q: Query) => (areas[q.city] ?? []).filter((a) => inZone(a, q.zone));
  const activeCount = [query.zone, query.locality, query.type, query.bhk, query.budget].filter(Boolean).length;

  const onParams = useCallback(
    (p: URLSearchParams) => {
      if (p.toString() === lastWritten.current) return;
      const city = cities.find((x) => x === p.get("city")) ?? cities[0];
      const zone = zones.find((x) => x === p.get("zone")) ?? "";
      // ?locality=…, or a locality name in ?q= (older links)
      const loc = p.get("locality") || p.get("q") || "";
      const t = p.get("type") || "";
      const b = p.get("budget") || "";
      const q: Query = {
        city,
        zone,
        locality: (areas[city] ?? []).some((a) => a.name === loc && inZone(a, zone)) ? loc : "",
        type: TYPES.includes(t) ? t : "",
        bhk: BHKS.some((o) => o.value === p.get("bhk")) ? (p.get("bhk") as string) : "",
        budget: BUDGETS.some(([v]) => v === b) ? b : "",
      };
      setQuery(q);
      setDraft(q);
      setSort(SORTS.some(([v]) => v === p.get("sort")) ? (p.get("sort") as string) : "recommended");
      setReady(true);
    },
    [cities, zones, areas],
  );

  // Filter + sort
  const inQueryZone = new Set(areasOf(query).map((a) => a.name));
  const range = query.budget ? query.budget.split("-") : null;
  const min = range ? parseFloat(range[0] || "0") : 0;
  const max = range && range[1] ? parseFloat(range[1]) : Infinity;
  const matches = (l: Listing) =>
    l.city === query.city &&
    (!query.zone || inQueryZone.has(l.locality)) &&
    (!query.locality || l.locality === query.locality) &&
    (!query.type || l.type === query.type) &&
    (!query.bhk || (query.bhk === "4" ? l.bhk >= 4 : String(l.bhk) === query.bhk)) &&
    (!range || (l.price >= min && l.price < max));
  const shown = listings.filter(matches);
  const ordered = [...shown];
  if (sort === "price-asc") ordered.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") ordered.sort((a, b) => b.price - a.price);
  else if (sort === "newest") ordered.sort((a, b) => b.posted.localeCompare(a.posted));
  else if (sort === "area-desc") ordered.sort((a, b) => b.area - a.area);
  const hiddenOnes = listings.filter((l) => !matches(l));

  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (query.city !== defaultCity) p.set("city", query.city);
    if (query.zone) p.set("zone", query.zone);
    if (query.locality) p.set("locality", query.locality);
    if (query.type) p.set("type", query.type);
    if (query.bhk) p.set("bhk", query.bhk);
    if (query.budget) p.set("budget", query.budget);
    if (sort !== "recommended") p.set("sort", sort);
    lastWritten.current = writeQuery(p);
    if (firstRun.current) firstRun.current = false;
    else animateIn(gridRef.current);
  }, [ready, defaultCity, query, sort]);

  const search = (e: FormEvent) => {
    e.preventDefault();
    setQuery(draft);
    setReady(true);
    // On phones this puts the menus and keyboard away so the results can be seen
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const reset = () => {
    setQuery(blank(defaultCity));
    setDraft(blank(defaultCity));
    setSort("recommended");
    setReady(true);
  };

  return (
    <>
      <UrlParams onChange={onParams} />
      <div className="filter-bar filter-bar--search">
        <div className="container">
          <form className="prop-search" role="search" aria-label="Search properties" onSubmit={search}>
            <Dropdown
              className="dd--field"
              label="City"
              emptyValue={defaultCity}
              value={draft.city}
              onChange={(city) => setDraft((d) => ({ ...d, city, zone: "", locality: "" }))}
              options={cities.map((c) => ({ value: c, label: c }))}
            />
            <Dropdown
              className="dd--field"
              label="Zone"
              value={draft.zone}
              // Keep the locality only if it's in the new zone
              onChange={(zone) =>
                setDraft((d) => ({ ...d, zone, locality: (areas[d.city] ?? []).some((a) => a.name === d.locality && inZone(a, zone)) ? d.locality : "" }))
              }
              options={[{ value: "", label: "All zones" }, ...zones.map((z) => ({ value: z, label: z }))]}
            />
            <Dropdown
              className="dd--field"
              label="Locality"
              value={draft.locality}
              // Choosing a locality selects its zone (keeping the current one if the locality falls in several)
              onChange={(locality) =>
                setDraft((d) => {
                  const zs = (areas[d.city] ?? []).find((a) => a.name === locality)?.zones ?? [];
                  return { ...d, locality, zone: zs.length && !zs.includes(d.zone) ? zs[0] : d.zone };
                })
              }
              options={[{ value: "", label: "All localities" }, ...areasOf(draft).map((a) => ({ value: a.name, label: a.name }))]}
            />
            <Dropdown
              className="dd--field"
              label="Property type"
              value={draft.type}
              onChange={(type) => setDraft((d) => ({ ...d, type }))}
              options={[{ value: "", label: "All types" }, ...TYPES.map((t) => ({ value: t, label: t }))]}
            />
            <Dropdown className="dd--field" label="Bedrooms" value={draft.bhk} onChange={(bhk) => setDraft((d) => ({ ...d, bhk }))} options={BHKS} />
            <Dropdown
              className="dd--field"
              label="Budget"
              value={draft.budget}
              onChange={(budget) => setDraft((d) => ({ ...d, budget }))}
              options={BUDGETS.map(([v, l]) => ({ value: v, label: l }))}
            />
            <button className="prop-search__go" type="submit">
              <Icon name="search" className="icon--sm" />
              <span>Search</span>
            </button>
          </form>
        </div>
      </div>
      <section className="section" style={{ paddingTop: "clamp(28px,4vw,44px)", paddingBottom: "clamp(16px,2.5vw,28px)" }}>
        <div className="container">
          <div className="results-bar">
            <div className="results-bar__meta">
              <p className="results-meta" aria-live="polite">
                <b>{shown.length}</b> {shown.length === 1 ? "property" : "properties"}
              </p>
              {activeCount ? (
                <button className="btn-reset" type="button" onClick={reset}>
                  <Icon name="x" className="icon--sm" /> Clear filters
                </button>
              ) : null}
            </div>
            <Dropdown
              label="Sort by"
              icon="sort"
              width={168}
              className="dd--inline"
              emptyValue="recommended"
              value={sort}
              onChange={(v) => {
                setSort(v);
                setReady(true);
              }}
              options={SORTS.map(([v, l]) => ({ value: v, label: l }))}
            />
          </div>
          <div className="card-grid card-grid--3" ref={gridRef}>
            {ordered.map((l, i) => (
              <ListingCard key={l.slug} l={l} eager={i < 3} />
            ))}
            {hiddenOnes.map((l) => (
              <ListingCard key={l.slug} l={l} hidden />
            ))}
          </div>
          {shown.length === 0 ? (
            <div className="empty-state">
              <span className="icon-wrap">
                <Icon name="search" />
              </span>
              <h2 className="h4">Nothing matches — yet</h2>
              <p className="muted" style={{ maxWidth: "46ch" }}>
                New homes come to our advisors before they’re listed. Share your brief and we’ll send matches within 48 hours.
              </p>
              <div className="btn-row" style={{ justifyContent: "center" }}>
                <button className="btn btn--outline" type="button" onClick={reset}>
                  Clear filters
                </button>
                <Link className="btn" href="/contact-us/?type=buy">
                  Share your brief
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
