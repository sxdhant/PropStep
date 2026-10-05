"use client";

/**
 * The giant "propstep" name set into the sky of the hero photo.
 *
 * The letters sit *between* layers of the photograph through an SVG mask: sky → letters visible; trees, the
 * house and everything else in front → letters hidden. The mask is either a ready-made sky mask of the photo
 * (`mask`), or computed in the browser from the image the hero already chose (img.currentSrc) with a colour key.
 * Either way it is drawn with the photo's own cover geometry, so it always lines up with the crop.
 *
 * The letters are extruded in 3D and, once the mask is ready, rise one by one from behind the roof
 * (.hero__bm-letter in globals.css). Switching between day and night plays the rise again, into the new sky.
 */
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { LOGO_ORANGE, WORDMARK_PATH } from "./primitives";

// Wordmark letter bounds on the logo grid (from the traced artwork)
const TEXT_X0 = 85.75;
const TEXT_W = 220.12;
const TEXT_TOP = 2.4; // top of the "t" stems
const BASELINE = 44.5;

/**
 * The wordmark split into letters so each can rise on its own. The traced path is absolute M/Q/Z only:
 * each "M…" run is a letter outline or the hole of one (p, o, e), and a hole's box sits inside its letter's box.
 */
type Box = { d: string; x0: number; x1: number; y0: number; y1: number };
const LETTERS: string[] = (() => {
  const boxes: Box[] = (WORDMARK_PATH.match(/M[^M]*/g) ?? []).map((d) => {
    const n = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    const xs = n.filter((_, i) => i % 2 === 0);
    const ys = n.filter((_, i) => i % 2 === 1);
    return { d, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  });
  const inside = (a: Box, b: Box) => a !== b && a.x0 >= b.x0 && a.x1 <= b.x1 && a.y0 >= b.y0 && a.y1 <= b.y1;
  return boxes
    .filter((b) => !boxes.some((o) => inside(b, o)))
    .sort((a, b) => a.x0 - b.x0)
    .map((outer) => [outer, ...boxes.filter((b) => inside(b, outer))].map((b) => b.d).join(""));
})();
const DESCENDER = 61.1; // bottom of the p's

/**
 * 3D: each letter is extruded towards a vanishing point below the word, so we look up at its underside,
 * as at a tall sign standing behind the house. Layers are drawn deepest first, shading from dark to light.
 * "prop" is white on navy-to-steel sides; "step" takes the logo's orange (as in the logo mark) on burnt-orange sides.
 */
const DEPTH = 12;
const STEP = 0.0024; // scale lost per layer towards the vanishing point
const VP = { x: TEXT_X0 + TEXT_W / 2, y: BASELINE + 150 };
const layerTransform = (k: number) => `translate(${VP.x} ${VP.y}) scale(${(1 - k * STEP).toFixed(4)}) translate(${-VP.x} ${-VP.y})`;
const SIDES = { prop: [[184, 200, 227], [34, 58, 104]], step: [[206, 92, 0], [92, 36, 4]] } as const;
const layerColor = (k: number, part: keyof typeof SIDES) => {
  const t = (k - 1) / (DEPTH - 1); // 0 next to the face, 1 at the back
  const [near, far] = SIDES[part];
  const mix = (i: number) => Math.round(near[i] + (far[i] - near[i]) * t);
  return `rgb(${mix(0)} ${mix(1)} ${mix(2)})`;
};
/** Letters from this index on spell "step" */
const STEP_FROM = 4;
/** Lowest point of the extruded letters: the clip line they rise from behind. */
const CLIP_BOTTOM = VP.y + (DESCENDER - VP.y) * (1 - DEPTH * STEP) + 1;

type Props = {
  /** Where the letters' baseline sits, as a fraction of the displayed photo's height: landscape / portrait frames. */
  baseline: { wide: number; tall: number };
  /** Letter width as a fraction of the frame width (the maximum; see `clearance`). */
  width?: { desktop: number; mobile: number };
  /** Minimum space between the fixed header and the top of the letters, in px. The letters shrink to keep it. */
  clearance?: number;
  /**
   * Enlarges the letters past that fit (1.15 = 15% larger): half the extra height rises toward the header and half
   * sinks behind the roof. Never wider than the frame.
   */
  size?: number;
  /**
   * A precomputed sky mask for the photo (white = sky, same framing, any resolution). Use it when the colour key
   * can't separate the sky, e.g. clouds and a pale roof of the same colour.
   */
  mask?: string;
};

type Geo = {
  w: number;
  h: number;
  img: { x: number; y: number; w: number; h: number; href: string };
  text: { x: number; y: number; s: number };
};

export default function HeroBrandmark({ baseline, width = { desktop: 0.92, mobile: 0.9 }, clearance = 24, size = 1, mask }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [ready, setReady] = useState(false);
  // Bumped each time the theme switches (day ↔ night): remounts the letters with the rise animation (.hero__bm-replay)
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    let night = root.dataset.theme === "night";
    const mo = new MutationObserver(() => {
      const now = root.dataset.theme === "night";
      if (now !== night && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) setReplay((r) => r + 1);
      night = now;
    });
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const svg = ref.current;
    const box = svg?.parentElement;
    const img = box?.querySelector("img");
    if (!svg || !box || !img) return;

    const compute = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (!img.naturalWidth || !img.naturalHeight || !img.currentSrc || !w || !h) return;
      // Replicates object-fit: cover with the image's computed object-position (percentages)
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const iw = img.naturalWidth * scale;
      const ih = img.naturalHeight * scale;
      const [px = 50, py = 0] = getComputedStyle(img)
        .objectPosition.split(" ")
        .map((v) => (v.endsWith("%") ? parseFloat(v) : v === "left" || v === "top" ? 0 : v === "right" || v === "bottom" ? 100 : 50));
      const ix = (w - iw) * (px / 100);
      const iy = (h - ih) * (py / 100);
      // Portrait frames crop the photo to its middle, where the roof sits higher up the frame
      const base = iy + ih * (h > w ? baseline.tall : baseline.wide);
      // The letters scale with the frame's width but the sky scales with its height, so on wide screens
      // cap their size to keep the tallest stroke below the fixed header. offsetTop ignores the
      // entrance zoom and scroll parallax transforms, so this is the box's resting position.
      let boxTop = 0;
      for (let el: HTMLElement | null = box; el; el = el.offsetParent as HTMLElement | null) boxTop += el.offsetTop;
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
      const minTop = header + clearance - boxTop;
      const fit = Math.min((w * (w < 700 ? width.mobile : width.desktop)) / TEXT_W, (base - minTop) / (BASELINE - TEXT_TOP));
      const s = Math.min(fit * size, (w * 0.98) / TEXT_W);
      const line = base + ((s - fit) * (BASELINE - TEXT_TOP)) / 2;
      const tw = TEXT_W * s;
      setGeo({
        w,
        h,
        img: { x: ix, y: iy, w: iw, h: ih, href: img.currentSrc },
        text: { x: (w - tw) / 2 - TEXT_X0 * s, y: line - BASELINE * s, s },
      });
    };

    compute();
    img.addEventListener("load", compute);
    const ro = new ResizeObserver(compute);
    ro.observe(box);
    return () => {
      img.removeEventListener("load", compute);
      ro.disconnect();
    };
  }, [baseline.tall, baseline.wide, width.desktop, width.mobile, clearance, size]);

  return (
    <svg
      ref={ref}
      className={`hero__brandmark${ready ? " is-ready" : ""}`}
      viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : "0 0 1 1"}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {geo ? (
        <>
          <defs>
            {/* Colour key (without `mask`). Sky score = B − R: high for a blue sky, low for walls, timber, glass
                and foliage. Then a steep threshold at ~0.21 and a slight feather. */}
            <filter id={`${uid}-sky`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values="-1 0 1 0 0  -1 0 1 0 0  -1 0 1 0 0  0 0 0 0 1" />
              <feComponentTransfer>
                <feFuncR type="linear" slope="20" intercept="-3.8" />
                <feFuncG type="linear" slope="20" intercept="-3.8" />
                <feFuncB type="linear" slope="20" intercept="-3.8" />
              </feComponentTransfer>
              <feGaussianBlur stdDeviation="0.8" />
            </filter>
            <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={geo.w} height={geo.h}>
              <image
                href={mask ?? geo.img.href}
                x={geo.img.x}
                y={geo.img.y}
                width={geo.img.w}
                height={geo.img.h}
                preserveAspectRatio="none"
                filter={mask ? undefined : `url(#${uid}-sky)`}
                onLoad={() => setReady(true)}
              />
            </mask>
            {/* Letter faces, lit from above: white for "prop", the logo orange (#F17202) for "step" */}
            <linearGradient id={`${uid}-face`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#d3def0" />
            </linearGradient>
            <linearGradient id={`${uid}-face-step`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff8f33" />
              <stop offset="1" stopColor={LOGO_ORANGE} />
            </linearGradient>
            {/* In logo units. The letters start below this line and rise out from behind the roof, which
                the sky mask already hides them behind; the clip keeps them off the bright rooms below it. */}
            <clipPath id={`${uid}-clip`} clipPathUnits="userSpaceOnUse">
              <rect x={-TEXT_W} y={-1000} width={TEXT_W * 4} height={1000 + CLIP_BOTTOM} />
            </clipPath>
            {LETTERS.map((d, i) => (
              <path key={i} id={`${uid}-l${i}`} d={d} fillRule="evenodd" />
            ))}
          </defs>
          <g mask={`url(#${uid}-mask)`}>
            <g transform={`translate(${geo.text.x.toFixed(2)} ${geo.text.y.toFixed(2)}) scale(${geo.text.s.toFixed(4)})`}>
              <g clipPath={`url(#${uid}-clip)`}>
                <g key={replay} className={replay ? "hero__bm-replay" : undefined}>
                  {LETTERS.map((_, i) => {
                    const part = i >= STEP_FROM ? "step" : "prop";
                    return (
                      // "prop" lets a little sky through; the orange "step" stays solid, as in the logo
                      <g key={i} className="hero__bm-letter" style={{ "--i": i } as CSSProperties} opacity={part === "step" ? 1 : 0.9}>
                        {Array.from({ length: DEPTH }, (_, j) => DEPTH - j).map((k) => (
                          <use key={k} href={`#${uid}-l${i}`} fill={layerColor(k, part)} transform={layerTransform(k)} />
                        ))}
                        <use href={`#${uid}-l${i}`} fill={`url(#${uid}-face${part === "step" ? "-step" : ""})`} />
                      </g>
                    );
                  })}
                </g>
              </g>
            </g>
          </g>
        </>
      ) : null}
    </svg>
  );
}
