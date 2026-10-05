"use client";

import { useState } from "react";
import Icon from "./Icon";
import { inrGroup } from "@/lib/format";

type Props = { name: string; growth: string; values: number[]; startYear?: number };

/** Single-series line chart: HTML labels over a stretched SVG plot, with a crosshair + tooltip hover layer and a table view. */
export default function TrendChart({ name, growth, values, startYear = 2021 }: Props) {
  const [hot, setHot] = useState<number | null>(null);
  const years = values.map((_, i) => String(startYear + i));
  const lo = Math.min(...values), hi = Math.max(...values);
  const step = hi - lo < 9000 ? 2000 : 4000;
  const y0 = Math.floor((lo * 0.8) / step) * step;
  const ticks: number[] = [];
  for (let t = y0; t <= Math.floor((hi * 1.05) / step + 1) * step; t += step) ticks.push(t);
  const y1 = ticks[ticks.length - 1];
  const X = (i: number) => 4 + i * (92 / (values.length - 1));
  const Y = (v: number) => 100 - ((v - y0) / (y1 - y0)) * 100;
  const pts = values.map((v, i) => `${X(i).toFixed(2)},${Y(v).toFixed(2)}`).join(" ");
  const area = `M${X(0).toFixed(2)},100 L${values.map((v, i) => `${X(i).toFixed(2)},${Y(v).toFixed(2)}`).join(" L")} L${X(values.length - 1).toFixed(2)},100 Z`;
  const last = values.length - 1;
  const delta = hot !== null && hot > 0 ? Math.round(((values[hot] - values[hot - 1]) / values[hot - 1]) * 100) : null;

  return (
    <figure className="chart">
      <figcaption>
        <p className="h4">Average asking price, ₹ per sq ft</p>
        <p className="small muted">
          {name}, {years[0]}–{years[last]} · up {growth} over five years
        </p>
      </figcaption>
      <div className="chart__plot" onPointerLeave={() => setHot(null)}>
        <div className="chart__ylabels" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ top: `${Y(t).toFixed(2)}%` }}>
              {inrGroup(t)}
            </span>
          ))}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <g className="chart__grid">
            {ticks.map((t) => (
              <line key={t} x1="0" x2="100" y1={Y(t).toFixed(2)} y2={Y(t).toFixed(2)} />
            ))}
          </g>
          <path className="chart__area" d={area} />
          <polyline className="chart__line" points={pts} />
        </svg>
        <span className={`chart__cross${hot !== null ? " is-visible" : ""}`} style={hot !== null ? { left: `${X(hot).toFixed(2)}%` } : undefined} aria-hidden="true" />
        {values.map((v, i) => (
          <span key={i} className={`chart__dot${hot === i ? " is-hot" : ""}`} style={{ left: `${X(i).toFixed(2)}%`, top: `${Y(v).toFixed(2)}%` }} />
        ))}
        <span className="chart__end" style={{ left: `${X(last).toFixed(2)}%`, top: `${Y(values[last]).toFixed(2)}%` }}>
          ₹{inrGroup(values[last])}
        </span>
        <div className="chart__hits">
          {values.map((v, i) => (
            <button
              key={i}
              className="chart__hit"
              type="button"
              aria-label={`${years[i]}: ₹${inrGroup(v)} per sq ft`}
              onPointerEnter={() => setHot(i)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(null)}
            />
          ))}
        </div>
        <div
          className={`chart-tip${hot !== null ? " is-visible" : ""}`}
          aria-hidden="true"
          style={hot !== null ? { left: `clamp(70px, ${X(hot).toFixed(2)}%, calc(100% - 70px))`, top: `${Y(values[hot]).toFixed(2)}%` } : undefined}
        >
          {hot !== null ? (
            <>
              {years[hot]} &nbsp;<b>₹{inrGroup(values[hot])} / sq ft</b>
              {delta !== null ? ` · ${delta >= 0 ? "+" : ""}${delta}% YoY` : ""}
            </>
          ) : null}
        </div>
      </div>
      <div className="chart__xlabels" aria-hidden="true">
        {years.map((y, i) => (
          <span key={y} style={{ left: `${X(i).toFixed(2)}%` }}>
            {y}
          </span>
        ))}
      </div>
      <details className="disclose">
        <summary>
          View as table <Icon name="chevron-down" className="icon--sm" />
        </summary>
        <table className="chart-table">
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">₹ per sq ft</th>
            </tr>
          </thead>
          <tbody>
            {values.map((v, i) => (
              <tr key={i}>
                <td>{years[i]}</td>
                <td>₹{inrGroup(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
