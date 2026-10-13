"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/primitives";
import Icon, { type IconName } from "@/components/Icon";

type Item = [href: string, label: string, icon: IconName];

const CONTENT: Item[] = [
  ["/admin/listings/", "Listings", "building"],
  ["/admin/localities/", "Localities", "pin"],
  ["/admin/areas/", "Search areas", "search"],
  ["/admin/advisors/", "Advisors", "users"],
  ["/admin/site/", "Site settings", "sliders"],
  ["/admin/testimonials/", "Testimonials", "chat"],
  ["/admin/faqs/", "FAQs", "info"],
];
const INBOX: Item[] = [
  ["/admin/leads/", "Leads", "phone"],
  ["/admin/visits/", "Site visits", "calendar"],
  ["/admin/subscribers/", "Subscribers", "mail"],
];

/** Give every table cell its column name, so tables can fold into labelled cards on a phone */
function labelTables() {
  document.querySelectorAll<HTMLTableElement>("table.a-table").forEach((t) => {
    const heads = Array.from(t.querySelectorAll("thead th")).map((h) => h.textContent?.trim() ?? "");
    t.querySelectorAll("tbody tr").forEach((tr) =>
      Array.from(tr.children).forEach((td, i) => {
        if (heads[i] && td.getAttribute("data-label") !== heads[i]) td.setAttribute("data-label", heads[i]);
      }),
    );
  });
}

const ADMIN_ONLY: Item[] = [
  ["/admin/users/", "Users", "users"],
  ["/admin/audit/", "Activity log", "clock"],
];

export default function AdminNav({ email, role }: { email: string; role: "ADMIN" | "EDITOR" }) {
  const path = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const groups: { id: string; title: string; items: Item[] }[] = [
    { id: "content", title: "Website content", items: CONTENT },
    { id: "inbox", title: "Inbox", items: INBOX },
    ...(role === "ADMIN" ? [{ id: "admin", title: "Admin", items: ADMIN_ONLY }] : []),
  ];
  // On a phone each group folds away; the one holding the current page starts open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const g = groups.find((x) => x.items.some(([h]) => path.startsWith(h)));
    if (g) setOpenGroups((o) => ({ ...o, [g.id]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  // Close the phone menu after navigating
  useEffect(() => setOpen(false), [path]);
  // Lock page scroll behind the open menu; Esc closes it
  useEffect(() => {
    document.documentElement.classList.toggle("admin-menu-open", open);
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);
  // Label table cells now and whenever a page loads its rows
  useEffect(() => {
    labelTables();
    const mo = new MutationObserver(labelTables);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  const link = ([href, label, icon]: Item) => (
    <Link key={href} href={href} aria-current={path.startsWith(href) ? "page" : undefined}>
      <Icon name={icon} />
      {label}
    </Link>
  );
  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login/";
  }

  return (
    <>
      {/* Phone: a slim top bar with the menu button (hidden on larger screens) */}
      <header className="admin-top">
        <Link href="/admin/" className="admin-brand" aria-label="Propstep Admin home">
          <Logo className="admin-logo" />
        </Link>
        <button className="admin-burger" aria-expanded={open} aria-controls="admin-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
          <span />
        </button>
      </header>
      <div className="admin-scrim" onClick={() => setOpen(false)} aria-hidden="true" />

      {/* Sidebar on desktop; slides in from the left on a phone */}
      <nav id="admin-menu" className="admin-nav" aria-label="Admin">
        <Link href="/admin/" className="admin-brand admin-brand--side" aria-label="Propstep Admin home">
          <Logo className="admin-logo" />
          <span className="admin-tag">Admin</span>
        </Link>
        <Link href="/admin/" aria-current={path === "/admin/" || path === "/admin" ? "page" : undefined}>
          <Icon name="home" />
          Dashboard
        </Link>
        {groups.map((g) => {
          const isOpen = !!openGroups[g.id];
          return (
            <div className={`admin-group${isOpen ? " is-open" : ""}`} key={g.id}>
              <button type="button" className="admin-group__head" aria-expanded={isOpen} aria-controls={`grp-${g.id}`} onClick={() => setOpenGroups((o) => ({ ...o, [g.id]: !o[g.id] }))}>
                {g.title}
                <Icon name="chevron-down" />
              </button>
              <div className="admin-group__body" id={`grp-${g.id}`}>
                <div className="admin-group__list">{g.items.map(link)}</div>
              </div>
            </div>
          );
        })}
        <div className="admin-nav__foot">
          <div className="who">
            <b>{email}</b>
            <span>{role === "ADMIN" ? "Administrator" : "Editor"}</span>
          </div>
          {link(["/admin/account/", "Change password", "key"])}
          <a href="/" target="_blank" rel="noopener">
            <Icon name="arrow-up-right" />
            View website
          </a>
          <button onClick={logout}>
            <Icon name="arrow-left" />
            Sign out
          </button>
        </div>
      </nav>
    </>
  );
}
