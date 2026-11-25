"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Dropdown from "./Dropdown";
import { WhatsAppIcon } from "./Icon";

const CODES: [string, string][] = [
  ["+91", "India"], ["+971", "UAE"], ["+1", "USA / Canada"], ["+44", "UK"], ["+65", "Singapore"], ["+966", "Saudi Arabia"], ["+974", "Qatar"],
  ["+965", "Kuwait"], ["+968", "Oman"], ["+973", "Bahrain"], ["+61", "Australia"], ["+49", "Germany"], ["+60", "Malaysia"], ["+64", "New Zealand"],
];
// [label, value stored with the lead]
const INTERESTS: [string, "buy" | "sell" | "visit" | "nri" | "commercial" | "other"][] = [
  ["Buying a home", "buy"], ["Investing in property", "buy"], ["Selling my property", "sell"], ["Booking a site visit", "visit"],
  ["NRI services", "nri"], ["Commercial property", "commercial"], ["Something else", "other"],
];

const CODE_OPTIONS = CODES.map(([c, n]) => ({ value: c, label: c, sub: n }));
const INTEREST_OPTIONS = INTERESTS.map(([l], i) => ({ value: String(i), label: l }));

type Target = { href: string; number: string; text: string };

/** Any wa.me button on the site opens this quick form first: the lead is saved, then WhatsApp opens with the person's details in the message */
export default function WhatsAppEnquiry() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("+91");
  const [num, setNum] = useState("");
  const [interest, setInterest] = useState(0);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="https://wa.me/"]');
      if (!a) return;
      e.preventDefault();
      const u = new URL(a.href);
      setTarget({ href: a.href, number: u.pathname.replace(/\D/g, ""), text: u.searchParams.get("text") ?? "" });
      setErrors({});
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (target && d && !d.open) d.showModal();
  }, [target]);

  const close = () => {
    dialog.current?.close();
    setTarget(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!target || sending) return;
    const digits = num.replace(/\D/g, "");
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (code === "+91" ? !/^[6-9]\d{9}$/.test(digits) : digits.length < 6 || digits.length > 12) {
      next.phone = code === "+91" ? "Enter a 10-digit mobile number, for example 98450 12345." : "Enter a valid mobile number.";
    }
    setErrors(next);
    if (next.name || next.phone) return;

    const [interestLabel, enquiry] = INTERESTS[interest];
    const about = target.text.replace(/^Hi Propstep,\s*/i, "");
    const message = [`Hi Propstep, I'm ${name.trim()} (${code} ${digits}).`, `I'm interested in: ${interestLabel}.`, about].filter(Boolean).join("\n");
    const url = `https://wa.me/${target.number}?text=${encodeURIComponent(message)}`;

    // Open the tab inside the tap itself (phones block tabs opened after a wait), then point it at WhatsApp once the lead is saved
    const tab = window.open("", "_blank");
    setSending(true);
    let saved = false;
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: "whatsapp",
          name: name.trim(),
          phone: `${code}${digits}`,
          enquiry,
          subject: about.slice(0, 200) || undefined,
          message: `Interest: ${interestLabel}`,
          page: location.pathname,
          consent: "yes",
          idempotencyKey: `wa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        }),
      });
      saved = res.ok;
    } catch {}
    setSending(false);
    // Whatever happens, the visitor still reaches WhatsApp; a failed save is only flagged to us in the console
    if (!saved) console.error("[whatsapp] lead could not be saved");
    if (tab) tab.location.href = url;
    else location.href = url;
    close();
  };

  return (
    <dialog ref={dialog} className="wa-modal" aria-labelledby="wa-title" onClose={() => setTarget(null)} onClick={(e) => e.target === dialog.current && close()}>
      <form className="wa-modal__form" onSubmit={submit} noValidate>
        <button type="button" className="wa-modal__x" onClick={close} aria-label="Close">
          ×
        </button>
        <span className="wa-modal__icon">
          <WhatsAppIcon />
        </span>
        <h2 id="wa-title">Chat with an advisor</h2>
        <p className="wa-modal__lead">Tell us who you are and we’ll open WhatsApp with your details filled in.</p>

        <div className={`field${errors.name ? " has-error" : ""}`}>
          <label htmlFor="wa-name">
            Your name <span className="req" aria-hidden="true">*</span>
          </label>
          <input className="input" id="wa-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} placeholder="Full name" />
          {errors.name ? <p className="field-error">{errors.name}</p> : null}
        </div>

        <div className={`field${errors.phone ? " has-error" : ""}`}>
          <label htmlFor="wa-phone">
            Mobile number <span className="req" aria-hidden="true">*</span>
          </label>
          <div className="wa-modal__phone">
            <Dropdown className="dd--form wa-code" label="Country code" value={code} options={CODE_OPTIONS} onChange={setCode} search="Search country" />
            <input className="input" id="wa-phone" type="tel" inputMode="tel" autoComplete="tel-national" value={num} onChange={(e) => setNum(e.target.value)} aria-invalid={!!errors.phone} placeholder="98450 12345" />
          </div>
          {errors.phone ? <p className="field-error">{errors.phone}</p> : null}
        </div>

        <div className="field">
          <span className="label" aria-hidden="true">
            I’m interested in
          </span>
          <Dropdown className="dd--form" label="I’m interested in" value={String(interest)} options={INTEREST_OPTIONS} onChange={(v) => setInterest(Number(v))} />
        </div>

        <button className="btn btn--wa btn--block" type="submit" disabled={sending} aria-busy={sending}>
          <WhatsAppIcon /> {sending ? "Opening WhatsApp…" : "Continue to WhatsApp"}
        </button>
        <p className="wa-modal__fine">By continuing you agree that an advisor may contact you on this number.</p>
      </form>
    </dialog>
  );
}
