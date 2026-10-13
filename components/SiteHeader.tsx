"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Icon from "./Icon";
import { Brand } from "./primitives";
import ThemeToggle from "./ThemeToggle";

type Props = { name: string; phone: string; phoneHref: string };

const NAV = [
  { key: "properties", label: "Properties", href: "/properties/" },
  { key: "localities", label: "Localities", href: "/localities/" },
  { key: "services", label: "Services", href: "/services/" },
  { key: "about", label: "About Us", href: "/about-us/" },
];

function activeKey(pathname: string) {
  if (pathname.startsWith("/properties")) return "properties";
  if (pathname.startsWith("/localities")) return "localities";
  if (pathname.startsWith("/services")) return "services";
  if (pathname.startsWith("/about")) return "about";
  return null;
}

export default function SiteHeader({ name, phone, phoneHref }: Props) {
  const pathname = usePathname();
  const active = activeKey(pathname);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [glass, setGlass] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close overlays on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Scrolled state + hide on scroll down, reveal on scroll up
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      // Over a dark full-bleed hero the header keeps its light text until the hero ends: transparent at
      // the top, then frosted navy so the copy scrolling underneath never collides with the nav.
      const dark = document.querySelector<HTMLElement>("[data-hero-dark]");
      const limit = dark ? Math.max(24, dark.offsetTop + dark.offsetHeight - 90) : 24;
      setScrolled(y > limit);
      setGlass(!!dark && y > 24 && y <= limit);
      const focusInside = headerRef.current?.contains(document.activeElement) && document.activeElement !== document.body;
      if (document.documentElement.classList.contains("html-nav-open") || focusInside) setHidden(false);
      else if (y > lastY + 4 && y > 420) setHidden(true);
      else if (y < lastY - 4 || y < 420) setHidden(false);
      lastY = y;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("header-visible", !hidden);
  }, [hidden]);

  // Mobile menu: page lock, focus, Escape, focus trap
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("html-nav-open", menuOpen);
    if (!menuOpen) return;
    const first = menuRef.current?.querySelector<HTMLElement>("a, button");
    const t = setTimeout(() => first?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && menuRef.current && toggleRef.current) {
        const items = [toggleRef.current, ...Array.from(menuRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"))];
        const firstEl = items[0], lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const mq = window.matchMedia("(min-width: 1100px)");
    const onMq = (m: MediaQueryListEvent) => m.matches && setMenuOpen(false);
    mq.addEventListener("change", onMq);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [menuOpen]);

  const mobile = [
    { label: "Properties", href: "/properties/", note: "Verified homes" },
    { label: "Localities", href: "/localities/", note: "Bengaluru guides" },
    { label: "Services", href: "/services/", note: "Advisory & NRI" },
    { label: "About Us", href: "/about-us/", note: "Since 2026" },
    { label: "Contact Us", href: "/contact-us/", note: "Bengaluru" },
  ];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="scroll-progress" aria-hidden="true" />
      <header ref={headerRef} className={`site-header${scrolled ? " is-scrolled" : ""}${glass ? " is-glass" : ""}${hidden && !menuOpen ? " is-hidden" : ""}`}>
        <div className="container header-inner">
          <Brand name={name} />
          <nav className="nav" aria-label="Primary">
            {NAV.map((n) => (
              <Link key={n.key} className="nav__link" href={n.href} aria-current={active === n.key ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <a className="header-phone" href={`tel:${phoneHref}`}>
              <Icon name="phone" className="icon--sm" />
              <span>{phone}</span>
            </a>
            <Link className="btn btn--sm header-cta" href="/contact-us/#visit">
              Book a visit
            </Link>
            <ThemeToggle />
            <button
              ref={toggleRef}
              className="menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="menu-toggle__bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>
      <div className="mobile-menu" id="mobile-menu" aria-label="Menu" ref={menuRef} inert={!menuOpen}>
        <nav aria-label="Mobile">
          <ul className="mobile-menu__list" role="list">
            {mobile.map((m, i) => (
              <li key={m.href}>
                <Link className="mobile-menu__link" href={m.href} style={{ "--i": i } as CSSProperties} onClick={() => setMenuOpen(false)}>
                  {m.label}
                  <small>{m.note}</small>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mobile-menu__foot">
          <Link className="btn btn--block" href="/contact-us/#visit" onClick={() => setMenuOpen(false)}>
            Book a site visit <Icon name="arrow-right" className="icon--arrow" />
          </Link>
          <a className="btn btn--call btn--block" href={`tel:${phoneHref}`}>
            <Icon name="phone" /> {phone}
          </a>
        </div>
      </div>
    </>
  );
}
