"use client";

import { useState } from "react";

type Props = {
  src: string;
  src3d?: string;
  alt: string;
  /** Area figures shown as readable text under the plan, so they stay legible on a phone */
  rows?: [string, string][];
  /** false when the plan is mounted after load (a tab switch), where the scroll-reveal would never show it */
  reveal?: boolean;
};

const LEGEND: [string, string][] = [
  ["Bedroom", "#f3e7d3"],
  ["Living / lounge", "#f2f2ef"],
  ["Kitchen", "#e8edef"],
  ["Toilet", "#d9e9f1"],
  ["Balcony", "#dcebd8"],
];

/** A floor plan with a 2D / 3D icon button in its top-right corner (when there is a 3D image: each click crossfades to the other), and its area table and legend below */
export default function FloorPlan({ src, src3d, alt, rows, reveal = true }: Props) {
  const [is3d, setIs3d] = useState(false);
  // The view is a data attribute, not a class: the scroll-reveal adds its own class to this figure, and React would wipe it
  return (
    <figure className="floorplan" data-view={is3d ? "3d" : "2d"} {...(reveal ? { "data-reveal": "" } : {})}>
      {src3d ? (
        <button type="button" className="floorplan__toggle" onClick={() => setIs3d((v) => !v)} aria-pressed={is3d} aria-label={is3d ? "Show 2D plan" : "Show 3D plan"} title={is3d ? "2D view" : "3D view"}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {is3d ? (
              // 2D: a flat plan, a square split into rooms
              <>
                <rect x="4" y="4" width="16" height="16" rx="1.5" />
                <path d="M4 12h8M12 4v8M12 16v4M16 12h4" />
              </>
            ) : (
              // 3D: a cube
              <>
                <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" />
                <path d="M4 7.5 12 12l8-4.5M12 12v9" />
              </>
            )}
          </svg>
        </button>
      ) : null}
      <div className="floorplan__stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="floorplan__img floorplan__img--2d" src={src} alt={`${alt} (2D)`} loading="lazy" />
        {src3d ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="floorplan__img floorplan__img--3d" src={src3d} alt={`${alt} (3D)`} loading="lazy" />
        ) : null}
      </div>
      {rows ? (
        <div className="floorplan__info">
          <dl className="floorplan__rows" key={rows[0][1]}>
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <ul className="floorplan__legend" role="list">
            {LEGEND.map(([k, c]) => (
              <li key={k}>
                <span style={{ background: c }} aria-hidden="true" />
                {k}
              </li>
            ))}
          </ul>
          <p className="floorplan__note">Illustrative plan, not to scale. Dimensions and areas are approximate and subject to the final approved drawings.</p>
        </div>
      ) : null}
    </figure>
  );
}
