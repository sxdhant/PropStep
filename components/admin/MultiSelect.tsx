"use client";

import { useEffect, useRef, useState } from "react";

type Props = { label: string; value: string[]; onChange: (value: string[]) => void; options: readonly string[]; placeholder?: string };

/** A dropdown with a checkbox per option, for choosing several values */
export default function MultiSelect({ label, value, onChange, options, placeholder = "Choose…" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="a-btn" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)} style={{ width: "100%", justifyContent: "space-between", textAlign: "left" }}>
        <span>{value.length ? value.join(", ") : placeholder}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div role="listbox" aria-multiselectable="true" style={{ position: "absolute", zIndex: 20, left: 0, right: 0, top: "calc(100% + 4px)", background: "var(--a-card, #fff)", border: "1px solid var(--a-line, #ddd)", borderRadius: 10, padding: 6, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
          {all.map((o) => (
            <label key={o} role="option" aria-selected={value.includes(o)} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 8px", cursor: "pointer" }}>
              <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} />
              {o}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
