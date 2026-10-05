/**
 * Usable space above and below an anchor for a popup menu, excluding the fixed header and the
 * phone quick-contact bar, measured against the visual viewport (so an open phone keyboard counts).
 */
export function spaceAround(anchor: Element) {
  const r = anchor.getBoundingClientRect();
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
  const bar = document.querySelector<HTMLElement>(".action-bar");
  const reserve = bar && getComputedStyle(bar).display !== "none" && !bar.classList.contains("is-hidden") ? bar.offsetHeight : 0;
  return { above: r.top - header, below: vh - reserve - r.bottom };
}

/**
 * Where to open a menu of natural height `height` (capped at `cap`). Below is preferred: it flips up only
 * when there's less than `comfortable` px below and more room above. `maxHeight` keeps it clear of the
 * header and the viewport edge (the menu scrolls inside). `gap` covers the menu's offset from its anchor
 * (8–14px) plus a margin.
 */
export function placeMenu(anchor: Element, height: number, cap: number, gap = 22, comfortable = 240) {
  const { above, below } = spaceAround(anchor);
  const need = Math.min(height, cap) + gap;
  const up = below < need && below < comfortable && above > below;
  return { up, maxHeight: Math.max(144, Math.min(cap, (up ? above : below) - gap)) };
}

/** Runs `fn` now and whenever the page scrolls or the (visual) viewport resizes; returns a cleanup. */
export function trackPosition(fn: () => void) {
  fn();
  window.addEventListener("scroll", fn, { passive: true });
  window.addEventListener("resize", fn);
  window.visualViewport?.addEventListener("resize", fn);
  return () => {
    window.removeEventListener("scroll", fn);
    window.removeEventListener("resize", fn);
    window.visualViewport?.removeEventListener("resize", fn);
  };
}
