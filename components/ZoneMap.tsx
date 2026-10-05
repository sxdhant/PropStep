"use client";

/**
 * Bengaluru split into the search's five zones (North, Central, West, South and East), each in a light tint of its own
 * colour. Tapping a zone chooses it in the hero search (tapping it again clears it); the chosen zone turns a darker
 * shade of its colour, and the empty corner beside the map counts up to the zone's listings ("3 properties", which
 * opens them). Drawing data: lib/zone-map.ts.
 */
import Link from "next/link";
import { useEffect, useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ZONE_MAP as M } from "@/lib/zone-map";

type Props = { zones: string[]; value: string; onChange: (zone: string) => void; counts: Record<string, number> };

/** Counts up from 0 to `to`, easing out (a little longer for bigger numbers); at once with reduced motion */
function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (to === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(to);
    const t0 = performance.now(), dur = 450 + Math.min(to, 30) * 40;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <b className="zone-map__count-num">{n}</b>;
}

export default function ZoneMap({ zones, value, onChange, counts }: Props) {
  const city = `${useId().replace(/[^a-zA-Z0-9]/g, "")}-city`;
  const toggle = (z: string) => onChange(value === z ? "" : z);
  const onKey = (e: KeyboardEvent, z: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(z);
    }
  };

  return (
    <figure className="zone-map">
      <figcaption className="zone-map__head">
        <b>Bengaluru by zone</b>
        <span className={value ? "is-on" : undefined} style={value ? ({ "--on": `var(--on-${value.toLowerCase()})` } as CSSProperties) : undefined} aria-live="polite">
          {value ? `${value} selected` : "Tap a zone"}
        </span>
      </figcaption>
      <svg className="zone-map__svg" viewBox={`0 0 ${M.width} ${M.height}`} role="group" aria-label="Map of Bengaluru by zone">
        <defs>
          <clipPath id={city}>
            <path d={M.outline} />
          </clipPath>
        </defs>
        {/* In the order of `zones`, which is also the keyboard order */}
        {zones.map((z) =>
          M.zones[z] ? (
            <path
              key={z}
              className={`zone-map__zone zone-map__zone--${z.toLowerCase()}${value === z ? " is-on" : ""}`}
              d={M.zones[z]}
              fillRule="evenodd"
              role="button"
              tabIndex={0}
              aria-label={`${z} Bengaluru`}
              aria-pressed={value === z}
              onClick={() => toggle(z)}
              onKeyDown={(e) => onKey(e, z)}
            />
          ) : null,
        )}
        <path className="zone-map__wards" d={M.wards} clipPath={`url(#${city})`} />
        <path className="zone-map__divide" d={M.dividers} />
        <path className="zone-map__edge" d={M.outline} />
        {zones.map((z) =>
          M.labels[z] ? (
            <text
              key={z}
              className={`zone-map__label zone-map__label--${z.toLowerCase()}${value === z ? " is-on" : ""}`}
              x={M.labels[z][0]}
              y={M.labels[z][1]}
              aria-hidden="true"
            >
              {z}
            </text>
          ) : null,
        )}
      </svg>
      {value ? (
        // Keyed by zone, so it pops in and counts up afresh each time a zone is chosen
        <Link
          key={value}
          className="zone-map__count"
          href={`/properties/?zone=${encodeURIComponent(value)}`}
          style={{ "--on": `var(--on-${value.toLowerCase()})` } as CSSProperties}
        >
          <span aria-hidden="true">📍</span>
          <CountUp to={counts[value] ?? 0} />
          <span>{(counts[value] ?? 0) === 1 ? "property" : "properties"}</span>
        </Link>
      ) : null}
      <p className="zone-map__credit">
        <span>Zones: BBMP restructuring proposal</span>
        <span>
          Map:{" "}
          <a href="https://github.com/datameet/Municipal_Spatial_Data" target="_blank" rel="noopener">
            DataMeet
          </a>
          , CC BY 4.0
        </span>
      </p>
    </figure>
  );
}
