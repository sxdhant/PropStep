"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";

type PerspectiveFlipCardProps = {
  className?: string;
  front: ReactNode;
  back: ReactNode;
  /** CSS lengths; the card fills its grid or rail column by default. */
  h?: string;
  w?: string;
};

/**
 * Perspective flip card, ported from the 21st.dev "Card 14" to the site's own CSS (.flip-card in globals.css).
 * Flips on hover with a mouse, on tap with touch or pen, and when a link inside it gets keyboard focus.
 * Inside a face, give a layer the .flip-z class and a --z depth to lift it off the card;
 * each wrapper between it and the face needs .flip-3d so the depth isn't flattened.
 */
export function PerspectiveFlipCard({ className, front, back, h = "480px", w = "100%" }: PerspectiveFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const pointer = useRef("mouse");

  return (
    <div
      className={`flip-card${flipped ? " is-flipped" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--flip-h": h, "--flip-w": w } as CSSProperties}
      onPointerDown={(e) => {
        pointer.current = e.pointerType;
      }}
      onClick={(e) => {
        // A mouse already flips on hover, and links and buttons inside the card keep their own click.
        if (pointer.current === "mouse" || (e.target as Element).closest("a, button")) return;
        setFlipped((f) => !f);
      }}
    >
      <div className="flip-card__inner">
        <div className="flip-card__face flip-card__face--front">{front}</div>
        <div className="flip-card__face flip-card__face--back">{back}</div>
      </div>
    </div>
  );
}
