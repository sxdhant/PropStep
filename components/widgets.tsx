"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import Icon, { WhatsAppIcon } from "./Icon";
import { Photo, Split } from "./primitives";
import { initials } from "@/lib/format";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================ Tabs (ARIA) */
type TabItem = { id: string; label: string; panel: ReactNode; panelClassName?: string };

export function Tabs({ items, label, className, listReveal = false, panelStyle }: { items: TabItem[]; label: string; className?: string; listReveal?: boolean; panelStyle?: CSSProperties }) {
  const [sel, setSel] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    let n: number | null = null;
    if (e.key === "ArrowRight") n = (i + 1) % items.length;
    if (e.key === "ArrowLeft") n = (i - 1 + items.length) % items.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = items.length - 1;
    if (n !== null) {
      e.preventDefault();
      setSel(n);
      refs.current[n]?.focus();
    }
  };
  return (
    <div className={className}>
      <div className="tabs__list" role="tablist" aria-label={label} {...(listReveal ? { "data-reveal": "" } : {})}>
        {items.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="tab"
            role="tab"
            id={`${t.id}-tab`}
            aria-selected={sel === i}
            aria-controls={`${t.id}-panel`}
            tabIndex={sel === i ? 0 : -1}
            onClick={() => setSel(i)}
            onKeyDown={(e) => onKey(e, i)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>
      {items.map((t, i) => (
        <div
          key={t.id}
          className={`tab-panel${t.panelClassName ? ` ${t.panelClassName}` : ""}`}
          role="tabpanel"
          id={`${t.id}-panel`}
          aria-labelledby={`${t.id}-tab`}
          tabIndex={0}
          hidden={sel !== i}
          style={panelStyle}
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}

/* ============================================================ Rail (horizontal scroller) */
export function Rail({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [progress, setProgress] = useState(0.25);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = el.scrollWidth - el.clientWidth;
      const x = el.scrollLeft;
      setAtStart(x <= 4);
      setAtEnd(x >= max - 4);
      const visible = el.clientWidth / el.scrollWidth;
      setProgress(Math.min(1, Math.max(0, visible + (max > 0 ? (x / max) * (1 - visible) : 1))));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const page = (dir: number) => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    const n = Math.max(1, Math.floor(el.clientWidth / step));
    el.scrollBy({ left: dir * step * n, behavior: reduced() ? "auto" : "smooth" });
  };

  return (
    <div className={`rail-wrap${className ? ` ${className}` : ""}`}>
      <div className="rail" tabIndex={0} role="region" aria-label={label} ref={rail}>
        {children}
      </div>
      <div className="container" style={{ marginTop: 16 }}>
        <div className="rail-controls">
          <button className="icon-btn" type="button" onClick={() => page(-1)} disabled={atStart} aria-label={`Scroll ${label} left`}>
            <Icon name="arrow-left" />
          </button>
          <button className="icon-btn" type="button" onClick={() => page(1)} disabled={atEnd} aria-label={`Scroll ${label} right`}>
            <Icon name="arrow-right" />
          </button>
          <div className="rail-progress" aria-hidden="true">
            <span style={{ "--p": progress } as CSSProperties} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ Pillars (stacked cards) */
export type Pillar = { title: string; sub: string; tags: string[]; text: string; /** [label, href, look?]: the look ("accent" orange, "light" white) overrides the position-based default */
  links: [string, string, ("accent" | "light")?][]; image: string; alt: string };

/** Every card takes the first card's (Discover's) navy theme, buttons included; "paper" and "blue" themes still exist in the CSS */
const PILLAR_THEMES = ["navy", "navy", "navy"] as const;
/** Cards stick and stack only where one fits on screen with room to spare; smaller screens get a plain list. */
const STACK_MQ = "(min-width: 900px) and (min-height: 700px)";
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function Pillars({ items }: { items: Pillar[] }) {
  const list = useRef<HTMLOListElement>(null);

  // Scroll-linked depth: --enter (0 to 1) zooms a card photo into place as the card arrives;
  // --stack (0 to 1) shrinks and dims a stuck card as the next one slides over it.
  useEffect(() => {
    const el = list.current;
    if (!el || reduced()) return;
    const cards = Array.from(el.children) as HTMLElement[];
    const mq = window.matchMedia(STACK_MQ);
    let tops: number[] = [];
    let raf = 0;
    const measure = () => {
      tops = cards.map((c) => (mq.matches ? parseFloat(getComputedStyle(c).top) || 0 : 0));
    };
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const rects = cards.map((c) => c.getBoundingClientRect());
      cards.forEach((card, i) => {
        card.style.setProperty("--enter", clamp01((vh - rects[i].top) / (vh - tops[i])).toFixed(3));
        const next = rects[i + 1];
        const stack = mq.matches && next ? clamp01((vh - next.top) / (vh - tops[i + 1])) : 0;
        card.style.setProperty("--stack", stack.toFixed(3));
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    // Only listen while the section is near the viewport
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      } else window.removeEventListener("scroll", onScroll);
    }, { rootMargin: "20% 0px" });
    measure();
    update();
    io.observe(el);
    window.addEventListener("resize", onResize);
    mq.addEventListener("change", onResize);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", onResize);
    };
  }, []);

  return (
    <ol className="pillars" ref={list}>
      {items.map((p, i) => {
        const theme = PILLAR_THEMES[i % PILLAR_THEMES.length];
        const dark = true; // every card is navy, so light-on-dark buttons
        return (
          <li key={p.title} className={`pillar pillar--${theme}`} style={{ "--n": i } as CSSProperties}>
            <article className="pillar__card">
              <div className="pillar__content">
                <p className="pillar__top">
                  <span className="pillar__num">0{i + 1}</span>
                  <span>{p.sub}</span>
                </p>
                <h3 className="pillar__title">{p.title}</h3>
                <p className="pillar__text">{p.text}</p>
                <ul className="pillar__tags" aria-label={`${p.title}: what we offer`}>
                  {p.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <p className="pillar__links">
                  {p.links.map(([label, href, look], j) =>
                    look ? (
                      <Link className={`btn btn--sm ${look === "accent" ? "btn--accent" : "btn--light"}`} href={href} key={href}>
                        {label} <Icon name="arrow-right" className="icon--sm icon--arrow" />
                      </Link>
                    ) : j === 0 ? (
                      <Link className={`btn btn--sm${dark ? " btn--light" : ""}`} href={href} key={href}>
                        {label} <Icon name="arrow-right" className="icon--sm icon--arrow" />
                      </Link>
                    ) : href.endsWith("#visit") ? (
                      <Link className="btn btn--sm btn--accent" href={href} key={href}>
                        {label} <Icon name="arrow-right" className="icon--sm icon--arrow" />
                      </Link>
                    ) : (
                      <Link className={`btn btn--sm ${dark ? "btn--ghost-light" : "btn--outline"}`} href={href} key={href}>
                        {label} <Icon name="arrow-right" className="icon--sm icon--arrow" />
                      </Link>
                    ),
                  )}
                </p>
                <p className="pillar__count" aria-hidden="true">
                  0{i + 1} / 0{items.length}
                </p>
              </div>
              <div className="pillar__media">
                <Photo id={p.image} alt={p.alt} ratio={[5, 4]} sizes="(min-width: 900px) 50vw, 92vw" />
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}

/* ============================================================ Cities (landmark cards with a curtain reveal, on a Rail) */
type City = { slug: string; name: string; role: string; desks: string; image: string; landmark: string };

export function Cities({ cities }: { cities: City[] }) {
  return (
    <Rail label="Cities we work in" className="rail-wrap--cities">
      {cities.map((c, i) => (
        <Link className="city-card" key={c.slug} href={`/properties/?city=${encodeURIComponent(c.name)}`}>
          <span className="city-card__photo">
            <Photo id={c.image} ratio={[3, 5]} sizes="(min-width: 1000px) 290px, 250px" />
          </span>
          {/* Tints the photo into the navy card; parts from the centre on hover to show it in colour */}
          <span className="city-card__curtain" aria-hidden="true" />
          <span className="city-card__shade" aria-hidden="true" />
          <span className="city-card__top">
            <span className="city-card__num">{String(i + 1).padStart(2, "0")}</span>
            <span className="city-card__landmark">{c.landmark}</span>
          </span>
          <span className="city-card__body">
            <span className="city-card__name">{c.name}</span>
            <span className="city-card__role">{c.role}</span>
            <span className="city-card__more">
              <span>
                <span className="city-card__desks">
                  <Icon name="pin" className="icon--sm" />
                  {c.desks}
                </span>
                <span className="city-card__cta">
                  View homes <Icon name="arrow-up-right" className="icon--sm" />
                </span>
              </span>
            </span>
          </span>
        </Link>
      ))}
    </Rail>
  );
}

/* ============================================================ Testimonials */
type Quote = { quote: string; name: string; meta: string };

export function Testimonials({ items }: { items: Quote[] }) {
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const go = (d: number) => {
    setIdx((i) => (i + d + items.length) % items.length);
    setTick((t) => t + 1);
  };
  return (
    <div className="quotes">
      <div>
        <p className="eyebrow" data-reveal="">
          In their words
        </p>
        <h2 className="h2" style={{ marginTop: 18, fontSize: "clamp(2rem,1.6rem + 1.4vw,2.8rem)" }} data-split="">
          <Split>
            Trust, earned one <em>home</em> at a time.
          </Split>
        </h2>
        <div className="quotes__nav">
          <button className="icon-btn" type="button" onClick={() => go(-1)} aria-label="Previous testimonial">
            <Icon name="arrow-left" />
          </button>
          <button className="icon-btn" type="button" onClick={() => go(1)} aria-label="Next testimonial">
            <Icon name="arrow-right" />
          </button>
          <span className="quotes__count" aria-hidden="true">
            {idx + 1} / {items.length}
          </span>
        </div>
      </div>
      <div className="quotes__stage" aria-live="polite" data-reveal="">
        {items.map((t, i) => (
          <figure className={`quote${i === idx && tick ? " is-entering" : ""}`} key={`${t.name}-${i === idx ? tick : "x"}`} hidden={i !== idx}>
            <blockquote>
              <p>{t.quote}</p>
            </blockquote>
            <figcaption>
              <span className="avatar" aria-hidden="true">
                {initials(t.name)}
              </span>
              <span>
                <b>{t.name}</b>
                <span>{t.meta}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ============================================================ World clocks */
export function Clocks({ zones }: { zones: [string, string][] }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="clocks" aria-label="Current local times">
      {zones.map(([city, tz]) => (
        <div className="clock" key={tz}>
          <b>{now ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(now) : "--:--"}</b>
          <span>{city}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================ Leadership card */
/** A portrait card: name, designation and a LinkedIn link; the double arrow unfolds the bio below. */
export function LeaderCard({ name, role, bio, linkedin, photo }: { name: string; role: string; bio: string; linkedin: string; photo?: string }) {
  const [open, setOpen] = useState(false);
  const bioId = `bio-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const first = name.split(" ")[0];
  return (
    // Open state as an attribute, not a class: re-rendering className would drop the reveal's is-in class
    <article className="person" data-reveal="" data-open={open || undefined}>
      {/* Portrait area: the initials until headshots are added */}
      <span className="person__portrait" aria-hidden={photo ? undefined : "true"}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={name} loading="lazy" />
        ) : (
          initials(name)
        )}
      </span>
      <div className="person__head">
        <div className="person__id">
          <h3>{name}</h3>
          <p className="role">{role}</p>
        </div>
        <a className="person__in" href={linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${name} on LinkedIn`} title="LinkedIn">
          <Icon name="linkedin" />
        </a>
      </div>
      <div className="person__bio" id={bioId} inert={!open}>
        <div>
          <p>{bio}</p>
        </div>
      </div>
      <button className="person__more" type="button" aria-expanded={open} aria-controls={bioId} onClick={() => setOpen((o) => !o)}>
        <Icon name="chevrons-down" />
        <span className="visually-hidden">{open ? `Hide ${first}’s profile` : `Read ${first}’s profile`}</span>
      </button>
    </article>
  );
}

/* ============================================================ Sortable table */
export type Column = { key: string; label: string; sort?: "num" | "text"; num?: boolean };
export type Cell = { v: number | string; node: ReactNode };

export function SortableTable({ columns, rows, caption }: { columns: Column[]; rows: Record<string, Cell>[]; caption: string }) {
  const [sort, setSort] = useState<{ key: string; dir: "ascending" | "descending" } | null>(null);
  const sorted = sort
    ? [...rows].sort((a, b) => {
        const av = a[sort.key].v, bv = b[sort.key].v;
        const r = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sort.dir === "ascending" ? r : -r;
      })
    : rows;
  const label = sort ? `Sorted by ${columns.find((c) => c.key === sort.key)?.label}, ${sort.dir}.` : "";
  return (
    <>
      <div className="table-wrap" data-reveal="">
        <table className="data-table">
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={c.num ? "num" : undefined} aria-sort={sort?.key === c.key ? sort.dir : undefined}>
                  {c.sort ? (
                    <button
                      className="sort-btn"
                      type="button"
                      onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === "ascending" ? "descending" : "ascending" }))}
                    >
                      {c.label} <Icon name="chevron-down" className="icon--sm" />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={String(r[columns[0].key].v) + i}>
                {columns.map((c) => (
                  <td key={c.key} className={c.num ? "num" : undefined}>
                    {r[c.key].node}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {label}
      </p>
    </>
  );
}

/* ============================================================ Mobile quick-contact bar */
export function ActionBar({ phoneHref, wa }: { phoneHref: string; wa: string }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const footer = document.querySelector(".site-footer");
    if (!footer || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => setHide(entries[0].isIntersecting), { threshold: 0.05 });
    io.observe(footer);
    return () => io.disconnect();
  }, []);
  return (
    <nav className={`action-bar${hide ? " is-hidden" : ""}`} aria-label="Quick contact">
      <a className="call" href={`tel:${phoneHref}`}>
        <Icon name="phone" className="icon--sm" /> Call
      </a>
      <a className="wa" href={wa} target="_blank" rel="noopener">
        <WhatsAppIcon /> WhatsApp
      </a>
      <Link className="primary" href="/contact-us/#visit">
        <Icon name="calendar" className="icon--sm" /> Book a visit
      </Link>
    </nav>
  );
}
