"use client";

import { useState, type ReactNode } from "react";

/** A paragraph whose second part folds behind a "Read more" link on phones (under 640px); wider screens show it all */
export default function ReadMore({ children, more, dots, className, style }: { children: ReactNode; more: ReactNode; dots?: boolean; className?: string; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  return (
    <p className={`rm${className ? ` ${className}` : ""}`} data-open={open || undefined} style={style}>
      {children}
      {dots ? <span className="rm__dots" aria-hidden="true">…</span> : null}
      <span className="rm__more">{more}</span>{" "}
      <button className="rm__btn" type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Read less" : "Read more"}
      </button>
    </p>
  );
}
