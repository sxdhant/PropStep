"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Icon from "./Icon";
import { Photo } from "./primitives";
import { photoUrl } from "@/lib/img";
import type { Photo as PhotoT } from "@/lib/types";

type Props = { images: PhotoT[]; variant: "project" | "listing"; vt?: string };

export default function Gallery({ images, variant, vt }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const n = images.length;

  const open = (i: number, btn: HTMLButtonElement) => {
    opener.current = btn;
    setIdx(i);
    dialog.current?.showModal();
    document.documentElement.style.overflow = "hidden";
  };
  const go = useCallback((d: number) => {
    setIdx((i) => (i + d + n) % n);
    setTick((t) => t + 1);
  }, [n]);

  // Restore page scroll and focus. Called directly on every close path; the dialog's own
  // "close" event (Escape key) calls it too, so cleanup never depends on event timing.
  const cleanup = useCallback(() => {
    if (document.documentElement.style.overflow !== "hidden") return;
    document.documentElement.style.overflow = "";
    opener.current?.focus();
  }, []);
  const close = useCallback(() => {
    dialog.current?.close();
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    const dlg = dialog.current;
    if (!dlg) return;
    dlg.addEventListener("close", cleanup);
    return () => {
      dlg.removeEventListener("close", cleanup);
      cleanup();
    };
  }, [cleanup]);

  // Swipe on touch devices
  const touch = useRef<{ x: number; y: number } | null>(null);

  const tiles = images.map((im, i) => {
    const more =
      variant === "project" && i === Math.min(4, n - 1) && n > 1 ? (
        <span className="g-item__more">
          <Icon name="image" className="icon--sm" /> View all {n}
        </span>
      ) : variant === "listing" && i === 0 ? (
        <span className="g-item__more">
          <Icon name="image" className="icon--sm" /> {n} photos
        </span>
      ) : null;
    const ratio: [number, number] = variant === "project" && i > 0 ? [4, 3] : [3, 2];
    const sizes = i === 0 ? (variant === "project" ? "(min-width: 900px) 50vw, 100vw" : "(min-width: 900px) 60vw, 100vw") : variant === "project" ? "(min-width: 900px) 25vw, 50vw" : "30vw";
    return (
      <button
        key={im.id}
        className="g-item"
        type="button"
        aria-label={`Open image ${i + 1} of ${n}: ${im.alt}`}
        onClick={(e) => open(i, e.currentTarget)}
        style={vt && i === 0 ? ({ viewTransitionName: vt } as CSSProperties) : undefined}
      >
        <Photo id={im.id} alt={im.alt} ratio={ratio} sizes={sizes} eager={i === 0} />
        {more}
      </button>
    );
  });

  const current = images[idx];
  return (
    <>
      <div className={variant === "project" ? "gallery-grid" : "ld-gallery"}>{tiles}</div>
      <dialog
        className="lightbox"
        ref={dialog}
        aria-label="Image gallery"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          }
        }}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t === dialog.current || t.classList.contains("lightbox__stage")) close();
        }}
      >
        <div className="lightbox__inner">
          <div className="lightbox__top">
            <span className="lightbox__count" aria-live="polite">
              {idx + 1} / {n}
            </span>
            <button className="icon-btn icon-btn--dark" type="button" aria-label="Close gallery" onClick={close}>
              <Icon name="x" />
            </button>
          </div>
          <div
            className="lightbox__stage"
            onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
            onTouchEnd={(e) => {
              if (!touch.current) return;
              const dx = e.changedTouches[0].clientX - touch.current.x;
              const dy = e.changedTouches[0].clientY - touch.current.y;
              if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
              touch.current = null;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={`${idx}-${tick}`} src={photoUrl(current.id, 1920, [3, 2], 80)} alt={current.alt} />
            <button className="icon-btn icon-btn--dark lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous image" onClick={() => go(-1)}>
              <Icon name="arrow-left" />
            </button>
            <button className="icon-btn icon-btn--dark lightbox__nav lightbox__nav--next" type="button" aria-label="Next image" onClick={() => go(1)}>
              <Icon name="arrow-right" />
            </button>
          </div>
          <p className="lightbox__caption">{current.alt}</p>
        </div>
      </dialog>
    </>
  );
}
