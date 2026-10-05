/**
 * Home-page intro (~3 s, on every load): "property" appears in the logo's own letters on navy, then the last four
 * letters roll down like a countdown counter, one after another, and land as an orange "step": "propstep", set
 * exactly as the logo. The logo's house mark then rises in before the word, completing the logo, and the panel lifts
 * away to reveal the hero.
 *
 * The letters are the logo's shapes (lib/splash-glyphs.ts), drawn as SVG and defined once below, so there is no font
 * to load. Static markup only: whether it plays, and when each step runs, is decided by `splashBoot` (lib/splash.ts)
 * through classes on <html>; the motion itself is CSS (globals.css, "Home intro splash").
 */
import type { CSSProperties } from "react";
import { LogoMark } from "./primitives";
import { GLYPHS, GLYPH_EM, LINE, LOGO_WORD, SIDE, WORD_X } from "@/lib/splash-glyphs";

const FROM = "property";
const TO = "propstep";
const KEEP = 4; // "prop" stays; the rest rolls
/** The letters there are shapes for (e o p r s t y): the reels count down through these */
const ALPHABET = Object.keys(GLYPHS).sort().join("");

type Slot = [number, number];
const em = (units: number) => `${+(units * GLYPH_EM).toFixed(4)}em`;
/** A letter's slot when it is not in the logo's own spacing: its ink with even space either side */
const slotOf = (ch: string): Slot => [GLYPHS[ch].ink[0] - SIDE, GLYPHS[ch].ink[1] + SIDE];

/**
 * A reel's letters from top to bottom: the target, then letters counting down the alphabet from the start letter
 * towards it (a few evenly spaced, going round more than once if the way is short), then the start letter. It shows
 * the bottom first and rolls down.
 */
function reel(from: string, to: string, between = 6) {
  const n = ALPHABET.length;
  const i0 = ALPHABET.indexOf(from);
  let span = (i0 - ALPHABET.indexOf(to) + n) % n || n;
  while (span <= between) span += n;
  const passing = Array.from({ length: between }, (_, k) => ALPHABET[(((i0 - Math.round(((k + 1) * span) / (between + 1))) % n) + n) % n]);
  return [to, ...passing.reverse(), from];
}

/** One letter: an SVG as wide as its slot and as tall as the splash line, drawing a shape defined below */
function Letter({ id, slot }: { id: string; slot: Slot }) {
  return (
    <svg className="splash__glyph" viewBox={`${slot[0]} ${LINE[0]} ${slot[1] - slot[0]} ${LINE[1]}`} style={{ width: em(slot[1] - slot[0]) }}>
      <use href={`#${id}`} />
    </svg>
  );
}

export default function SplashIntro() {
  const keep: Slot = [LOGO_WORD[0].slot[0], LOGO_WORD[KEEP - 1].slot[1]];
  return (
    <div className="splash" aria-hidden="true">
      {/* The shapes, once: each letter of the alphabet above, and each letter of the logo's word where it sits */}
      <svg className="splash__defs" width="0" height="0" focusable="false">
        <defs>
          {Object.entries(GLYPHS).map(([ch, g]) => (
            <g id={`splash-g-${ch}`} key={ch}>
              {g.paths.map((d, k) => (
                <path key={k} d={d} fill="currentColor" fillRule="evenodd" />
              ))}
            </g>
          ))}
          {LOGO_WORD.map((l, i) => (
            <path id={`splash-w-${i}`} key={i} d={l.paths.join("")} fill="currentColor" fillRule="evenodd" />
          ))}
        </defs>
      </svg>
      <div className="splash__panel">
        <div className="splash__inner">
          <p className="splash__word">
            {/* Starts with no width, so "property" is centred alone; opens once the word has landed, to the logo's gap */}
            <span className="splash__mark" style={{ width: em(WORD_X + 0.5) }}>
              <LogoMark className="splash__mark-svg" />
            </span>
            <span className="splash__keep">
              <svg className="splash__glyph" viewBox={`${keep[0]} ${LINE[0]} ${keep[1] - keep[0]} ${LINE[1]}`} style={{ width: em(keep[1] - keep[0]) }}>
                {LOGO_WORD.slice(0, KEEP).map((_, i) => (
                  <use key={i} href={`#splash-w-${i}`} />
                ))}
              </svg>
            </span>
            {[...FROM.slice(KEEP)].map((from, i) => {
              const final = LOGO_WORD[KEEP + i];
              const letters = reel(from, TO[KEEP + i]);
              const w0 = slotOf(from), w1 = final.slot;
              const vars = { "--i": i, "--n": letters.length, "--w0": em(w0[1] - w0[0]), "--w1": em(w1[1] - w1[0]) } as CSSProperties;
              return (
                <span key={i} className="splash__reel" style={vars}>
                  <span className="splash__strip">
                    {letters.map((c, k) => (
                      <span key={k} className={k === 0 ? "is-final" : undefined}>
                        {/* The landing letter is the logo's own, in the logo's own slot */}
                        {k === 0 ? <Letter id={`splash-w-${KEEP + i}`} slot={w1} /> : <Letter id={`splash-g-${c}`} slot={slotOf(c)} />}
                      </span>
                    ))}
                  </span>
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
