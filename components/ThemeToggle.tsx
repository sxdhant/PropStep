"use client";

/**
 * Day / night switch in the header. The theme lives on <html data-theme="night"> (absent = day); it is remembered
 * in localStorage and restored before first paint by the head script in layout.tsx, so this component only reads
 * and flips it. The switch's look follows the attribute in CSS, so it is right before hydration too.
 */
import { useSyncExternalStore } from "react";
import { THEME_COLOR, THEME_KEY, type Theme } from "@/lib/theme";

const read = (): Theme => (document.documentElement.dataset.theme === "night" ? "night" : "day");
function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

let running: ViewTransition | null = null;
function apply(theme: Theme) {
  const root = document.documentElement;
  const commit = () => {
    if (theme === "night") root.dataset.theme = "night";
    else delete root.dataset.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  };
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return commit();
  // One crossfade between snapshots of the old and new theme (globals.css, "Theme switch"). Re-colouring every
  // element with CSS transitions instead repaints the whole page each frame and stutters.
  root.classList.add("theme-vt");
  const vt = document.startViewTransition(commit);
  running = vt;
  // A quick second click (or a hidden tab) skips the crossfade; the theme still commits, so that's not an error
  vt.ready.catch(() => {});
  vt.finished.finally(() => {
    if (running === vt) root.classList.remove("theme-vt");
  });
}

export default function ThemeToggle() {
  const night = useSyncExternalStore(subscribe, read, () => "day" as Theme) === "night";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={night}
      aria-label="Night mode"
      title={night ? "Switch to day mode" : "Switch to night mode"}
      onClick={() => apply(night ? "day" : "night")}
    >
      <span className="theme-toggle__stars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="theme-toggle__knob" aria-hidden="true">
        <svg className="theme-toggle__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </svg>
        <svg className="theme-toggle__moon" viewBox="0 0 24 24">
          <path fill="currentColor" d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" />
        </svg>
      </span>
    </button>
  );
}
