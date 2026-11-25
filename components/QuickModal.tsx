"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { QuickEnquiryForm, VisitForm } from "./forms";

type Kind = "visit" | "enquiry";
type Phone = { href: string; label: string };
type Open = { kind: Kind; type?: string; property?: string; n: number };

/**
 * Book-a-visit and enquiry buttons open a popup form instead of leaving the page:
 *  - links to /contact-us/#visit  -> the site-visit form
 *  - links to /contact-us/#enquiry, /contact-us/?type=… and #enquire -> the enquiry form
 * On a property page the property is already selected. The same goes on the contact page: its buttons open the popup too, they never scroll or redirect.
 */
export default function QuickModal({ phone, properties }: { phone: Phone; properties: [string, string][] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Open | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
      if (!a || a.target === "_blank") return;
      let u: URL;
      try {
        u = new URL(a.href);
      } catch {
        return;
      }
      if (u.origin !== location.origin) return;
      let kind: Kind | null = null;
      let type: string | undefined;
      if (/^\/contact-us\/?$/.test(u.pathname)) {
        if (u.hash === "#visit") kind = "visit";
        else if (u.hash === "#enquiry") kind = "enquiry";
        else if (u.searchParams.has("type")) {
          kind = "enquiry";
          type = u.searchParams.get("type") ?? undefined;
        }
      } else if (u.pathname === location.pathname && u.hash === "#enquire") kind = "enquiry";
      if (!kind) return;
      e.preventDefault();
      const slug = /^\/properties\/([^/]+)\/?$/.exec(location.pathname)?.[1];
      setOpen({ kind, type, property: slug, n: Date.now() });
    };
    // Window capture runs before everything else (the page-transition handler in MotionRoot, next/link): once the click is prevented they all skip navigating
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (open && d && !d.open) d.showModal();
  }, [open]);

  const close = () => {
    dialog.current?.close();
    setOpen(null);
  };

  const title = open?.kind === "visit" ? "Book a private site visit" : open?.property ? "Enquire about this property" : "Talk to an advisor";
  const sub = open?.kind === "visit" ? "Pick a slot. An advisor confirms within two working hours." : "Leave your details and an advisor will get back to you.";

  return (
    <dialog ref={dialog} className="wa-modal qf-modal" aria-labelledby="qf-title" onClose={() => setOpen(null)} onClick={(e) => e.target === dialog.current && close()}>
      {open ? (
        <div className="qf-modal__body" key={open.n}>
          <button type="button" className="wa-modal__x" onClick={close} aria-label="Close">
            ×
          </button>
          <header className="qf-modal__head">
            <span className={`qf-modal__badge qf-modal__badge--${open.kind}`}>
              <Icon name={open.kind === "visit" ? "calendar" : "chat"} />
            </span>
            <div>
              <p className="qf-modal__eyebrow">{open.kind === "visit" ? "Site visit" : "Quick enquiry"}</p>
              <h2 id="qf-title">{title}</h2>
              <p className="qf-modal__sub">{sub}</p>
            </div>
          </header>
          {open.kind === "visit" ? (
            <VisitForm prefix="qf-visit" phone={phone} property={open.property && properties.some(([v]) => v === open.property) ? open.property : undefined} properties={properties} heading={false} />
          ) : (
            <QuickEnquiryForm prefix="qf-enq" phone={phone} properties={properties} property={open.property} type={open.type} />
          )}
          <p className="qf-modal__trust">
            <Icon name="shield" className="icon--sm" /> Your details go only to the advisor handling your request. No spam.
          </p>
        </div>
      ) : null}
    </dialog>
  );
}
