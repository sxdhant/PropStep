"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** A paragraph that shows in full while it fits in two lines; when it would run longer, it folds to two lines behind a "Read more" link */
export default function ClampText({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (open) return;
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  return (
    <div className={`clamp${open ? " is-open" : ""}`}>
      <p ref={ref} className={`clamp__text${className ? ` ${className}` : ""}`} style={style}>
        {children}
      </p>
      {overflows || open ? (
        <button className="rm__btn clamp__btn" type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
