"use client";

import { useEffect, useRef, useState } from "react";
import Icon, { ICON_NAMES } from "@/components/Icon";

type Props = { label: string; value: string; onChange: (value: string) => void; invalid?: boolean };

const words = (n: string) => n.replace(/-/g, " ");

/** A dropdown listing every icon the website has, each shown next to its name, with a search box */
export default function IconSelect({ label, value, onChange, invalid }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
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

  const shown = ICON_NAMES.filter((n) => words(n).includes(q.trim().toLowerCase()));
  const known = (ICON_NAMES as string[]).includes(value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="a-btn"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { setOpen((o) => !o); setQ(""); }}
        style={{ width: "100%", justifyContent: "space-between", textAlign: "left", ...(invalid ? { borderColor: "var(--c-error)" } : {}) }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {known ? <Icon name={value as never} className="icon--sm" /> : null}
          {value ? words(value) : "Choose icon"}
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div style={{ position: "absolute", zIndex: 20, left: 0, minWidth: 260, top: "calc(100% + 4px)", background: "var(--a-card, #fff)", border: "1px solid var(--a-line, #ddd)", borderRadius: 10, padding: 6, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
          <input autoFocus aria-label="Search icons" placeholder="Search icons" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%", marginBottom: 6 }} />
          <div role="listbox" style={{ maxHeight: 260, overflowY: "auto" }}>
            {shown.map((n) => (
              <button
                type="button"
                role="option"
                aria-selected={n === value}
                key={n}
                onClick={() => { onChange(n); setOpen(false); }}
                style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "6px 8px", border: 0, borderRadius: 6, background: n === value ? "var(--paper-3, #eef)" : "transparent", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit" }}
              >
                <Icon name={n} className="icon--sm" />
                {words(n)}
              </button>
            ))}
            {!shown.length ? <p className="admin-sub" style={{ margin: 8 }}>No icon matches “{q}”.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
