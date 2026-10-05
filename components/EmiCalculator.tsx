"use client";

import { useRef, useState, type CSSProperties } from "react";
import { inr, inrShort } from "@/lib/format";

type Props = { price: number; heading?: string };

function bounds(price: number) {
  const step = price <= 25000000 ? 100000 : 500000;
  const lo = Math.max(2000000, Math.floor((price * 0.4) / step) * step);
  const hi = Math.max(lo * 2, Math.floor((price * 2) / step) * step);
  const val = Math.min(Math.max(Math.round(price / step) * step, lo), hi);
  return { step, lo, hi, val };
}

const fill = (v: number, min: number, max: number) => ({ "--fill": `${((v - min) / (max - min)) * 100}%` }) as CSSProperties;

export default function EmiCalculator({ price, heading = "Estimate your EMI" }: Props) {
  const b = bounds(price);
  const [p, setP] = useState(b.val);
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [tip, setTip] = useState<{ left: number; html: string } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const P = p * (1 - down / 100);
  const r = rate / 1200;
  const n = years * 12;
  const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - P;
  const pct = (v: number) => Math.round((v / total) * 100);

  const showTip = (el: HTMLElement, label: string, v: number) => {
    const br = barRef.current?.getBoundingClientRect();
    const sr = el.getBoundingClientRect();
    if (!br) return;
    setTip({ left: sr.left - br.left + sr.width / 2, html: `${label} <b>${inrShort(v)}</b> · ${pct(v)}%` });
  };

  return (
    <div className="emi" data-reveal="">
      <div className="emi__head">
        <h3 className="h4">{heading}</h3>
        <span className="small muted">Indicative only</span>
      </div>
      <div className="emi__fields">
        <div className="range">
          <div className="range__top">
            <label htmlFor="emi-price">Property price</label>
            <output htmlFor="emi-price">{inrShort(p)}</output>
          </div>
          <input id="emi-price" type="range" min={b.lo} max={b.hi} step={b.step} value={p} style={fill(p, b.lo, b.hi)} onChange={(e) => setP(+e.target.value)} />
        </div>
        <div className="range">
          <div className="range__top">
            <label htmlFor="emi-down">Down payment</label>
            <output htmlFor="emi-down">
              {down}% · {inrShort((p * down) / 100)}
            </output>
          </div>
          <input id="emi-down" type="range" min={10} max={60} step={5} value={down} style={fill(down, 10, 60)} onChange={(e) => setDown(+e.target.value)} />
        </div>
        <div className="range">
          <div className="range__top">
            <label htmlFor="emi-rate">Interest rate</label>
            <output htmlFor="emi-rate">{rate.toFixed(2)}%</output>
          </div>
          <input id="emi-rate" type="range" min={7} max={12} step={0.05} value={rate} style={fill(rate, 7, 12)} onChange={(e) => setRate(+e.target.value)} />
        </div>
        <div className="range">
          <div className="range__top">
            <label htmlFor="emi-years">Loan tenure</label>
            <output htmlFor="emi-years">{years} years</output>
          </div>
          <input id="emi-years" type="range" min={5} max={30} step={1} value={years} style={fill(years, 5, 30)} onChange={(e) => setYears(+e.target.value)} />
        </div>
      </div>
      <div className="emi__result" aria-live="polite">
        <div>
          <p className="small muted">Monthly EMI</p>
          <p className="emi__figure">
            <span>{inr(emi)}</span>
            <small>/ month</small>
          </p>
        </div>
        <div className="emi-bar" role="group" aria-label="Total repayment: principal versus interest" ref={barRef}>
          {(
            [
              ["principal", "Principal", P],
              ["interest", "Interest", interest],
            ] as const
          ).map(([key, label, v]) => (
            <span
              key={key}
              data-seg={key}
              tabIndex={0}
              aria-label={`${label} ${inrShort(v)}, ${pct(v)}% of total repayment`}
              style={{ flexGrow: +((v / total) * 100).toFixed(2) }}
              onPointerEnter={(e) => showTip(e.currentTarget, label, v)}
              onFocus={(e) => showTip(e.currentTarget, label, v)}
              onPointerLeave={() => setTip(null)}
              onBlur={() => setTip(null)}
            />
          ))}
          <div className={`chart-tip${tip ? " is-visible" : ""}`} aria-hidden="true" style={tip ? { left: tip.left } : undefined} dangerouslySetInnerHTML={{ __html: tip?.html ?? "" }} />
        </div>
        <dl className="emi-legend">
          <div>
            <dt>
              <span className="swatch swatch--1" />
              Loan (principal)
            </dt>
            <dd>{inrShort(P)}</dd>
          </div>
          <div>
            <dt>
              <span className="swatch swatch--2" />
              Total interest
            </dt>
            <dd>{inrShort(interest)}</dd>
          </div>
        </dl>
        <p className="small muted">
          Total repayment <b style={{ color: "var(--ink)" }}>{inrShort(total)}</b>. Rates vary by lender and profile; our loans desk compares 12+ lenders for you.
        </p>
      </div>
    </div>
  );
}
