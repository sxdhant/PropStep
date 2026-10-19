"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FloorPlan from "./FloorPlan";
import Icon from "./Icon";
import { area1, inrGroup, inrShort } from "@/lib/format";

export type PlanUnit = { label: string; area: number; price: number; psf?: number; floorplan?: string; floorplan3d?: string };

type Props = {
  units: PlanUnit[];
  /** The property's own plan, used by any size without one of its own */
  fallback: string;
  fallback3d?: string;
  title: string;
};

/** Floor plans: a tab for each BHK, a tab for each size within it, then the plan with the unit's price and a contact button underneath. Works for any number of BHKs and sizes */
export default function PlanExplorer({ units, fallback, fallback3d, title }: Props) {
  // A tab for each unit type, in the order they were entered
  const labels = [...new Set(units.map((u) => u.label))];
  const [label, setLabel] = useState(labels[0]);
  const sizes = units.filter((u) => u.label === label);
  const [pick, setPick] = useState(0);
  const unit = sizes[Math.min(pick, sizes.length - 1)];
  const key = (u: PlanUnit) => `${u.label}-${u.area}`;
  // A crossfade: the plan being left stays on top of the new one while it fades out
  const [shown, setShown] = useState(unit);
  const [leaving, setLeaving] = useState<PlanUnit | null>(null);
  useEffect(() => {
    if (key(shown) === key(unit)) return;
    setLeaving(shown);
    setShown(unit);
    const t = setTimeout(() => setLeaving(null), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.label, unit.area]);

  const src = unit.floorplan ?? fallback;
  // Only the price footer crossfades: the plan image stays mounted (a new <img> blinks on phones) and just its figures fade in
  const foot = (u: PlanUnit) => (
    <div className="plans__foot">
      <div>
        <h3 className="plans__name">{u.label} · {area1(u.area)} sq ft</h3>
        <p className="plans__price">{inrShort(u.price)}</p>
        <p className="small muted">₹{inrGroup(u.psf ?? Math.round(u.price / u.area))} per sq ft</p>
      </div>
      <Link className="btn btn--accent btn--sm plans__cta" href="#enquire">
        Contact us
      </Link>
    </div>
  );

  return (
    <div className="plans">
      <div className="plans__bhk" role="tablist" aria-label="Configuration">
        {labels.map((b) => (
          <button key={b} type="button" role="tab" aria-selected={b === label} className="plans__tab" onClick={() => { setLabel(b); setPick(0); }}>
            {b}
          </button>
        ))}
      </div>
      <div className="plans__sizes" role="tablist" aria-label="Size">
        {sizes.map((u, i) => (
          <button key={u.area} type="button" role="tab" aria-selected={i === pick} className="plans__size" onClick={() => setPick(i)}>
            <span>{area1(u.area)} sq.ft</span>
            <b>{inrShort(u.price)}</b>
          </button>
        ))}
      </div>
      {src ? (
      <FloorPlan
        key={src}
        reveal={false}
        src={src}
        src3d={unit.floorplan3d ?? (src === fallback ? fallback3d : undefined)}
        alt={`${unit.label} floor plan of ${title}, ${area1(unit.area)} sq ft`}
      />
      ) : (
        <p className="small muted" style={{ margin: "20px 0" }}>The floor plan for this size is coming soon. Contact us and we will share it.</p>
      )}
      <div className="plans__stack">
        <div className="plans__swap" key={key(shown)}>{foot(shown)}</div>
        {leaving ? (
          <div className="plans__out" key={`out-${key(leaving)}`} aria-hidden="true" inert>
            {foot(leaving)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
