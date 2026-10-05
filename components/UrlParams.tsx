"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function Listener({ onChange }: { onChange: (p: URLSearchParams) => void }) {
  const params = useSearchParams();
  const key = params.toString();
  useEffect(() => {
    onChange(new URLSearchParams(key));
  }, [key, onChange]);
  return null;
}

/**
 * Reports the current query string to its parent. Isolated in its own Suspense boundary so the
 * surrounding list still renders fully into the static HTML; filters apply after hydration.
 */
export default function UrlParams({ onChange }: { onChange: (p: URLSearchParams) => void }) {
  return (
    <Suspense fallback={null}>
      <Listener onChange={onChange} />
    </Suspense>
  );
}

/** Replace the query string without adding history entries. */
export function writeQuery(p: URLSearchParams) {
  const qs = p.toString();
  if (qs === window.location.search.replace(/^\?/, "")) return qs;
  window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  return qs;
}

/** Replay the entrance animation on items that just became visible after filtering. */
export function animateIn(container: HTMLElement | null) {
  if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  Array.from(container.querySelectorAll<HTMLElement>(":scope > :not([hidden])")).forEach((el, i) => {
    el.classList.add("is-in");
    el.classList.remove("is-filtering-in");
    el.style.setProperty("--i", String(Math.min(i, 8)));
    void el.offsetWidth;
    el.classList.add("is-filtering-in");
    el.addEventListener("animationend", () => el.classList.remove("is-filtering-in"), { once: true });
  });
}
