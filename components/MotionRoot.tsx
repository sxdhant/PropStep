"use client";

/**
 * Site-wide motion runtime. Renders nothing.
 * - scroll reveals ([data-reveal], [data-split], [data-inview]) and stagger indices ([data-stagger])
 * - count-up numbers ([data-count]) and image fade-in once decoded (img[data-fade])
 * - home hero entrance once the hero photo has decoded
 * - "lite" mode on Save-Data / low-memory devices
 * - page transitions: internal link clicks are wrapped in document.startViewTransition()
 * Re-runs on every client-side route change. All effects are skipped under prefers-reduced-motion.
 */
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __ps?: boolean;
  }
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function countUp(el: HTMLElement) {
  const target = parseFloat(el.dataset.count || "0");
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const fmt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const dur = 1800;
  let start: number | null = null;
  const step = (t: number) => {
    if (start === null) start = t;
    const p = Math.min(1, (t - start) / dur);
    el.textContent = fmt.format(target * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initPage(): () => void {
  const root = document.documentElement;
  const cleanups: (() => void)[] = [];
  const motion = !reduced() && "IntersectionObserver" in window;

  // Stagger indices
  document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
    group.querySelectorAll<HTMLElement>(":scope > [data-reveal], :scope > * > [data-reveal]").forEach((k, i) => k.style.setProperty("--i", String(i)));
  });

  // Images fade in once decoded
  const fadeIn = (img: HTMLImageElement) => {
    const show = () => img.classList.add("is-decoded");
    if (img.complete && img.naturalWidth) show();
    else {
      img.addEventListener("load", show, { once: true });
      img.addEventListener("error", show, { once: true });
    }
  };
  document.querySelectorAll<HTMLImageElement>("img[data-fade]:not(.is-decoded)").forEach(fadeIn);

  // Hero entrance
  const hero = document.querySelector<HTMLElement>(".hero:not(.is-loaded)");
  if (hero) {
    const done = () => requestAnimationFrame(() => hero.classList.add("is-loaded"));
    const img = hero.querySelector<HTMLImageElement>(".hero__frame img, .hero__zoom img");
    if (img && img.decode && motion) {
      let fired = false;
      const once = () => { if (!fired) { fired = true; done(); } };
      img.decode().then(once, once);
      const t = setTimeout(once, 1400);
      cleanups.push(() => clearTimeout(t));
    } else done();
  }

  // Scroll reveals
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in), [data-split]:not(.is-in), [data-inview]:not(.is-in)"));
  if (motion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    targets.forEach((el) => {
      if (el.closest(".hero") && el.hasAttribute("data-split")) {
        const t = setTimeout(() => el.classList.add("is-in"), 80);
        cleanups.push(() => clearTimeout(t));
      } else io.observe(el);
    });
    // Content mounted later (Suspense boundaries, tab panels, filtered lists) gets the same treatment.
    const SEL = "[data-reveal], [data-split], [data-inview]";
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) =>
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          [n, ...Array.from(n.querySelectorAll<HTMLElement>(SEL))].forEach((el) => {
            if (el.matches(SEL) && !el.classList.contains("is-in")) io.observe(el);
          });
          [n, ...Array.from(n.querySelectorAll<HTMLElement>("img[data-fade]"))].forEach((el) => {
            if (el instanceof HTMLImageElement && el.hasAttribute("data-fade") && !el.classList.contains("is-decoded")) fadeIn(el);
          });
          n.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) =>
            group.querySelectorAll<HTMLElement>(":scope > [data-reveal], :scope > * > [data-reveal]").forEach((k, i) => k.style.setProperty("--i", String(i))),
          );
        }),
      );
    });
    mo.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      io.disconnect();
      mo.disconnect();
    });
  } else {
    targets.forEach((el) => el.classList.add("is-in"));
    document.querySelectorAll<HTMLImageElement>("img[data-fade]").forEach((img) => img.classList.add("is-decoded"));
  }

  // Count-up numbers
  const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-count]:not([data-counted])"));
  if (counters.length && motion) {
    counters.forEach((c) => (c.textContent = "0"));
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.dataset.counted = "";
            countUp(el);
            cio.unobserve(el);
          }
        });
      },
      { threshold: 0.6 },
    );
    counters.forEach((c) => cio.observe(c));
    cleanups.push(() => cio.disconnect());
  }

  root.classList.add("is-ready");
  return () => cleanups.forEach((fn) => fn());
}

export default function MotionRoot() {
  const pathname = usePathname();
  const router = useRouter();
  const pending = useRef<(() => void) | null>(null);

  // Once: runtime flags
  useEffect(() => {
    window.__ps = true;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (nav.connection?.saveData || (nav.deviceMemory && nav.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)) {
      document.documentElement.classList.add("lite");
    }
  }, []);

  // Per route: reveals, counters, hero
  useEffect(() => {
    // Resolve a pending view transition now that the new route has committed.
    pending.current?.();
    pending.current = null;
    return initPage();
  }, [pathname]);

  // Page transitions for internal links (progressive enhancement).
  useEffect(() => {
    if (!("startViewTransition" in document)) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const next = new URL(a.href, location.href);
      if (next.origin !== location.origin || next.pathname.startsWith("/api")) return;
      if (next.pathname === location.pathname) return; // same page (hash or query change): let Next handle it
      if (reduced()) return;
      e.preventDefault();
      const href = next.pathname + next.search + next.hash;
      let pushed = false;
      const push = () => {
        if (pushed) return;
        pushed = true;
        router.push(href);
      };
      type VT = { skipTransition?: () => void; ready?: Promise<void>; finished?: Promise<void> };
      const vt = (document as Document & { startViewTransition: (cb: () => Promise<void>) => VT }).startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            pending.current = resolve;
            push();
            setTimeout(resolve, 2500); // never hold the page frozen
          }),
      );
      // A skipped transition rejects these promises; that's expected, not an error.
      vt.ready?.catch(() => {});
      vt.finished?.catch(() => {});
      // If the browser can't start the transition promptly (background tab, throttled rendering), navigate anyway.
      setTimeout(() => {
        if (!pushed) {
          vt.skipTransition?.();
          push();
        }
      }, 400);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
