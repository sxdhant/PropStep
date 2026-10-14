"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Dropdown from "./Dropdown";
import Icon from "./Icon";

/* ============================================================ Validation */
/** Indian mobiles (optionally +91 / 91 / 0) or an international number starting with + (8-15 digits): same rule as the server */
const PHONE = (v: string) => {
  const t = v.replace(/[\s\-().]/g, "");
  return /^(?:\+?91|0)?[6-9]\d{9}$/.test(t) || /^\+[1-9]\d{7,14}$/.test(t);
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function labelOf(el: Control) {
  const f = el.closest<HTMLElement>(".field");
  return f?.dataset.label || el.name;
}

function errorFor(el: Control, form: HTMLFormElement): string {
  if (el instanceof HTMLInputElement && el.type === "radio") {
    const group = Array.from(form.querySelectorAll<HTMLInputElement>(`input[name="${el.name}"]`));
    if (group.some((r) => r.required) && !group.some((r) => r.checked)) return `Please choose a ${labelOf(el)}.`;
    return "";
  }
  if (el instanceof HTMLInputElement && el.type === "checkbox") {
    return el.required && !el.checked ? el.closest<HTMLElement>(".field")?.dataset.msg || "Please tick this box to continue." : "";
  }
  const v = el.value.trim();
  const label = labelOf(el);
  if (el.required && !v) return `${el.tagName === "SELECT" ? "Please choose " : "Please enter "}${/^(a|an|your)\s/.test(label) ? "" : "your "}${label}.`;
  if (v && el.dataset.validate === "phone" && !PHONE(v)) return "Enter a 10-digit Indian mobile number, for example 98450 12345. Outside India? Start with + and your country code.";
  if (v && el instanceof HTMLInputElement && el.type === "email" && !EMAIL.test(v)) return "Enter an email address like name@example.com.";
  return "";
}

/* ============================================================ Form shell */
type Ctx = { errors: Record<string, string>; revalidate: (el: Control) => void };
const FormCtx = createContext<Ctx>({ errors: {}, revalidate: () => {} });

type LeadFormProps = {
  label: string;
  formName: string;
  children: ReactNode;
  heading?: ReactNode;
  success: { title: (firstName: string) => ReactNode; text: ReactNode };
  className?: string;
  variant?: "default" | "newsletter";
  phone: { href: string; label: string };
  submit: ReactNode;
  after?: ReactNode;
};

export function LeadForm({ label, formName, children, heading, success, className = "form", variant = "default", phone, submit, after }: LeadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<{ id: string; msg: string }[] | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [firstName, setFirstName] = useState("");
  const idemKey = useRef<string | null>(null);

  useEffect(() => {
    if (summary && summary.length) summaryRef.current?.focus();
  }, [summary]);
  useEffect(() => {
    if (status === "done") successRef.current?.focus();
    if (status === "failed") summaryRef.current?.focus();
  }, [status]);

  const revalidate = (el: Control) => {
    const form = formRef.current;
    if (!form) return;
    setErrors((prev) => {
      const msg = errorFor(el, form);
      if ((prev[el.name] || "") === msg) return prev;
      return { ...prev, [el.name]: msg };
    });
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const controls = Array.from(form.querySelectorAll<Control>("input:not([type=hidden]), select, textarea")).filter(
      (el) => !el.closest("[hidden]") && !el.closest(".hp"),
    );
    const next: Record<string, string> = {};
    const list: { id: string; msg: string }[] = [];
    const seen = new Set<string>();
    controls.forEach((el) => {
      if (seen.has(el.name)) return;
      seen.add(el.name);
      const msg = errorFor(el, form);
      next[el.name] = msg;
      if (msg) list.push({ id: el.id || form.querySelector<HTMLElement>(`[name="${el.name}"][id]`)?.id || "", msg });
    });
    setErrors(next);
    if (list.length) {
      if (list.length > 1) setSummary(list);
      else {
        setSummary(null);
        (document.getElementById(list[0].id) as HTMLElement | null)?.focus();
      }
      return;
    }
    setSummary(null);
    setStatus("sending");
    // One key per form instance: a retry after a dropped connection can't create a duplicate lead
    const data: Record<string, string> = { form: formName, page: window.location.pathname, idempotencyKey: (idemKey.current ??= crypto.randomUUID()) };
    new FormData(form).forEach((v, k) => (data[k] = String(v)));
    const endpoint = formName === "newsletter" ? "/api/newsletter/subscribe" : formName === "site-visit" ? "/api/visits" : "/api/enquiry";
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const out = await res.json().catch(() => ({}));
      if (res.status === 422 && out.errors) {
        // The server's field messages (e.g. a date that just filled up) show beside the fields
        setErrors(out.errors);
        setSummary(Object.values(out.errors as Record<string, string>).filter(Boolean).map((msg) => ({ id: "", msg })));
        setStatus("idle");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setFirstName(variant === "newsletter" && out.pending ? "pending" : (data.name || "").split(" ")[0]);
      setStatus("done");
    } catch {
      setStatus("failed");
      if (variant === "newsletter") setErrors({ email: "We couldn’t subscribe you just now — please try again." });
    }
  };

  if (status === "done") {
    return variant === "newsletter" ? (
      <div className="form-success" role="status" tabIndex={-1} ref={successRef}>
        <p style={{ color: "#fff", fontWeight: 600 }}>{success.title(firstName)}</p>
      </div>
    ) : (
      <div className="form-success" role="status" tabIndex={-1} ref={successRef}>
        <span className="icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h3 className="h3">{success.title(firstName)}</h3>
        <p className="muted">{success.text}</p>
      </div>
    );
  }

  return (
    <FormCtx.Provider value={{ errors, revalidate }}>
      <form className={className} noValidate aria-label={label} ref={formRef} onSubmit={onSubmit}>
        {heading}
        {variant === "default" ? (
          <div className="error-summary" tabIndex={-1} role="alert" ref={summaryRef} hidden={!summary?.length && status !== "failed"}>
            {status === "failed" ? (
              <>
                <h3>We couldn’t send your request</h3>
                <p>
                  Please check your connection and try again, or call us on <a href={`tel:${phone.href}`}>{phone.label}</a>.
                </p>
              </>
            ) : summary ? (
              <>
                <h3>There are {summary.length} problems with your details</h3>
                <ul>
                  {summary.map((s) => (
                    <li key={s.id + s.msg}>
                      <a
                        href={`#${s.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(s.id)?.focus();
                        }}
                      >
                        {s.msg}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}
        {/* Honeypot: hidden from people, tempting to bots */}
        <div className="hp visually-hidden" aria-hidden="true">
          <label>
            Company website
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {children}
        <button
          className={`btn ${variant === "newsletter" ? "btn--accent" : "btn--block"}${status === "sending" ? " is-loading" : ""}`}
          type="submit"
          disabled={status === "sending"}
          aria-busy={status === "sending"}
        >
          {submit}
        </button>
        {after}
      </form>
    </FormCtx.Provider>
  );
}

/* ============================================================ Fields */
function useField(name: string) {
  const { errors, revalidate } = useContext(FormCtx);
  const error = errors[name] || "";
  return {
    error,
    onBlur: (e: { currentTarget: Control }) => {
      const el = e.currentTarget;
      if (el.value || error) revalidate(el);
    },
    onChange: (e: { currentTarget: Control }) => {
      if (error) revalidate(e.currentTarget);
    },
  };
}

function ErrorText({ id, msg }: { id?: string; msg: string }) {
  return (
    <p className="field-error" id={id} aria-live="polite">
      {msg ? (
        <>
          <Icon name="alert" />
          <span>{msg}</span>
        </>
      ) : null}
    </p>
  );
}

type FieldBase = { id: string; label: string; name: string; required?: boolean; dataLabel?: string; hint?: ReactNode };

function Req({ required }: { required?: boolean }) {
  return required ? (
    <span className="req" aria-hidden="true">
      *
    </span>
  ) : (
    <>
      {" "}
      <span className="muted" style={{ fontWeight: 500 }}>
        (optional)
      </span>
    </>
  );
}

export function TextField({ id, label, name, required, dataLabel, hint, type = "text", autoComplete, placeholder }: FieldBase & { type?: string; autoComplete?: string; placeholder?: string }) {
  const f = useField(name);
  const describedBy = [hint ? `${id}-hint` : "", `${id}-err`].filter(Boolean).join(" ");
  return (
    <div className={`field${f.error ? " has-error" : ""}`} data-label={dataLabel}>
      <label htmlFor={id}>
        {label}
        <Req required={required} />
      </label>
      <input className="input" id={id} name={name} type={type} autoComplete={autoComplete} placeholder={placeholder} required={required} aria-invalid={!!f.error} aria-describedby={describedBy} onBlur={f.onBlur} onChange={f.onChange} />
      {hint ? (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <ErrorText id={`${id}-err`} msg={f.error} />
    </div>
  );
}

export function PhoneField({ id, hint }: { id: string; hint?: ReactNode }) {
  const f = useField("phone");
  const describedBy = [hint ? `${id}-hint` : "", `${id}-err`].filter(Boolean).join(" ");
  return (
    <div className={`field${f.error ? " has-error" : ""}`} data-label="mobile number">
      <label htmlFor={id}>
        Mobile number
        <Req required />
      </label>
      <div className="phone-input">
        <span className="prefix" aria-hidden="true">
          +91
        </span>
        <input
          className="input"
          id={id}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          data-validate="phone"
          required
          placeholder="98450 12345"
          aria-invalid={!!f.error}
          aria-describedby={describedBy}
          onBlur={f.onBlur}
          onChange={f.onChange}
        />
      </div>
      {hint ? (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <ErrorText id={`${id}-err`} msg={f.error} />
    </div>
  );
}

export function SelectField({ id, label, name, required, dataLabel, options, placeholder, defaultValue }: FieldBase & { options: [string, string][]; placeholder: string; defaultValue?: string }) {
  const f = useField(name);
  return (
    <div className={`field${f.error ? " has-error" : ""}`} data-label={dataLabel}>
      <label htmlFor={id}>
        {label}
        <Req required={required} />
      </label>
      <select id={id} name={name} required={required} defaultValue={defaultValue ?? ""} aria-invalid={!!f.error} aria-describedby={`${id}-err`} onBlur={f.onBlur} onChange={f.onChange}>
        <option value="">{placeholder}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <ErrorText id={`${id}-err`} msg={f.error} />
    </div>
  );
}

/** A select with the site's designed option list (the native select can't be styled). A hidden proxy input carries the value, so the form's validation and submit work as with a plain select. */
export function DropdownField({ id, label, name, required, dataLabel, options, placeholder }: FieldBase & { options: [string, string][]; placeholder: string }) {
  const f = useField(name);
  const [value, setValue] = useState("");
  // Once a choice is made, clear a "choose a property" error
  useEffect(() => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el && value) f.onChange({ currentTarget: el });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  // "Title — Locality" labels become a title with the locality under it
  const items = [
    { value: "", label: placeholder },
    ...options.map(([v, l]) => {
      const [main, ...rest] = l.split(" — ");
      return { value: v, label: main, sub: rest.join(" — ") || undefined };
    }),
  ];
  return (
    <div className={`field${f.error ? " has-error" : ""}`} data-label={dataLabel}>
      <span className="label" aria-hidden="true">
        {label}
        <Req required={required} />
      </span>
      <Dropdown
        className="dd--form"
        label={label}
        value={value}
        options={items}
        onChange={setValue}
      />
      <input className="dd-form__proxy" id={id} name={name} value={value} required={required} tabIndex={-1} aria-hidden="true" onChange={f.onChange} />
      <ErrorText id={`${id}-err`} msg={f.error} />
    </div>
  );
}

export function TextArea({ id, label, name, placeholder }: { id: string; label: string; name: string; placeholder?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        <Req />
      </label>
      <textarea id={id} name={name} rows={4} placeholder={placeholder} aria-describedby={`${id}-err`} />
      <p className="field-error" id={`${id}-err`} />
    </div>
  );
}

export function ConsentField({ id }: { id: string }) {
  const f = useField("consent");
  return (
    <div className={`field${f.error ? " has-error" : ""}`} data-msg="Please agree so an advisor can contact you.">
      <label className="check">
        <input type="checkbox" id={id} name="consent" value="yes" defaultChecked required aria-invalid={!!f.error} aria-describedby={`${id}-err`} onChange={f.onChange} />
        <span>
          I agree to be contacted by Propstep by phone, WhatsApp or email about this enquiry. Read our <Link href="/privacy/">privacy policy</Link>.
        </span>
      </label>
      <ErrorText id={`${id}-err`} msg={f.error} />
    </div>
  );
}

/** Date chips for the next N days, plus a calendar for any later date. Rendered after mount so server and client agree on "today". */
export function DateSlots({ id, days = 12 }: { id: string; days?: number }) {
  const f = useField("date");
  const [dates, setDates] = useState<Date[] | null>(null);
  const [sel, setSel] = useState("");
  const [custom, setCustom] = useState("");
  const [bounds, setBounds] = useState({ min: "", max: "" });
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  useEffect(() => {
    const out: Date[] = [];
    for (let i = 1; out.length < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (d.getDay() === 0) continue; // no visits on Sundays (the server enforces this too)
      out.push(d);
    }
    setDates(out);
    const max = new Date();
    max.setFullYear(max.getFullYear() + 1);
    setBounds({ min: iso(out[0]), max: iso(max) });
  }, [days]);
  const fmtW = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
  const fmtM = new Intl.DateTimeFormat("en-IN", { month: "short" });
  const customDate = custom ? new Date(`${custom}T00:00:00`) : null;
  const pick = (v: string) => setSel(v);
  // A date chosen in the calendar has no radio change event: once its chip is checked, clear any "choose a date" error
  useEffect(() => {
    const el = document.getElementById(`${id}-first`) as HTMLInputElement | null;
    if (el && sel) f.onChange({ currentTarget: el });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);
  const chip = (d: Date, first: boolean) => (
    <label className="slot" key={iso(d)}>
      <input type="radio" name="date" value={iso(d)} required={first} id={first ? `${id}-first` : undefined} checked={sel === iso(d)} onChange={(e) => { pick(iso(d)); f.onChange(e); }} />
      <span>
        <small>{fmtW.format(d)}</small>
        <b>{d.getDate()}</b>
        <small>{fmtM.format(d)}</small>
      </span>
    </label>
  );
  return (
    <fieldset className={`slot-group field${f.error ? " has-error" : ""}`} data-label="date">
      <legend className="label">
        Preferred date<span className="req" aria-hidden="true">*</span>
      </legend>
      <div className="slots">
        {dates ? (
          <label className="slot slot--cal">
            <input
              type="date"
              aria-label="Pick another date from the calendar"
              min={bounds.min}
              max={bounds.max}
              value={custom}
              onClick={(e) => {
                // Open the calendar wherever on the chip it is tapped (a bare date field only opens it from its own icon)
                try {
                  e.currentTarget.showPicker?.();
                } catch {
                  /* already open, or not allowed: the browser's own handling applies */
                }
              }}
              onChange={(e) => {
                const v = e.currentTarget.value;
                if (!v) return;
                setCustom(v);
                pick(v);
              }}
            />
            <span>
              <small>More</small>
              <Icon name="calendar" />
              <small>Calendar</small>
            </span>
          </label>
        ) : null}
        {dates && customDate && !dates.some((d) => iso(d) === custom) ? chip(customDate, false) : null}
        {dates
          ? dates.map((d, i) => chip(d, i === 0))
          : Array.from({ length: 7 }, (_, i) => (
              <span className="slot" key={i} aria-hidden="true">
                <span style={{ opacity: 0.35 }}>
                  <small>&nbsp;</small>
                  <b>&nbsp;</b>
                  <small>&nbsp;</small>
                </span>
              </span>
            ))}
      </div>
      <ErrorText msg={f.error} />
    </fieldset>
  );
}

export function RadioSlots({ id, name, legend, required, dataLabel, options, defaultValue, layout = "wrap" }: { id: string; name: string; legend: string; required?: boolean; dataLabel: string; options: { value: string; main: string; sub: string }[]; defaultValue?: string; /** wrap: chips wrap; scroll: one row that scrolls sideways; equal: one row, every option the same width */ layout?: "wrap" | "scroll" | "equal" }) {
  const f = useField(name);
  const big = options.some((o) => o.main.length > 6);
  return (
    <fieldset className={`slot-group field${f.error ? " has-error" : ""}`} data-label={dataLabel}>
      <legend className="label">
        {legend}
        {required ? (
          <span className="req" aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>
      <div className={layout === "scroll" ? "slots" : layout === "equal" ? "slots slots--equal" : "slots slots--wrap"}>
        {options.map((o, i) => (
          <label className="slot" key={o.value}>
            <input type="radio" name={name} value={o.value} required={required && i === 0} id={i === 0 ? id : undefined} defaultChecked={defaultValue === o.value} onChange={f.onChange} />
            <span style={big && layout !== "equal" ? { padding: "12px 16px" } : undefined}>
              <b style={big ? { fontSize: ".95rem" } : undefined}>{o.main}</b>
              <small>{o.sub}</small>
            </span>
          </label>
        ))}
      </div>
      {required ? <ErrorText msg={f.error} /> : null}
    </fieldset>
  );
}

/* ============================================================ Concrete forms */
type Phone = { href: string; label: string };
const ENQUIRY_TYPES: [string, string][] = [
  ["buy", "I want to buy"],
  ["sell", "I want to sell"],
  ["visit", "Book a site visit"],
  ["nri", "NRI Desk"],
  ["commercial", "Commercial / office space"],
  ["other", "Something else"],
];
const TIMES = [
  ["Morning", "10 AM – 1 PM"],
  ["Afternoon", "1 PM – 4 PM"],
  ["Evening", "4 PM – 7 PM"],
];

type VisitProps = { prefix: string; phone: Phone; property?: string; properties?: [string, string][]; heading?: boolean };

export function VisitForm({ prefix, phone, property, properties = [], heading = true }: VisitProps) {
  return (
    <LeadForm
      label="Book a site visit"
      formName="site-visit"
      phone={phone}
      heading={
        heading ? (
          <>
            <h3>Book a private site visit</h3>
            <p className="muted" style={{ marginTop: -6 }}>
              Pick a slot — an advisor confirms within two working hours.
            </p>
          </>
        ) : null
      }
      success={{
        title: (n) => <>Visit requested{n ? `, ${n}` : ""}.</>,
        text: "Your advisor will call within two working hours to confirm the slot and arrange a pickup if you need one. You’ll also get the location pin on WhatsApp.",
      }}
      submit={
        <>
          Request this visit <Icon name="arrow-right" className="icon--arrow" />
        </>
      }
      after={<p className="form-note">No spam, no call centres. Your details go only to the advisor handling your visit.</p>}
    >
      {property ? (
        <input type="hidden" name="property" value={property} />
      ) : (
        <DropdownField
          id={`${prefix}-property`}
          label="Property"
          name="property"
          required
          dataLabel="a property"
          placeholder="Choose a property"
          options={[...properties, ["Not sure yet", "Not sure yet — help me choose"]]}
        />
      )}
      <DateSlots id={`${prefix}-date`} />
      <RadioSlots
        id={`${prefix}-time`}
        name="time"
        legend="Preferred time"
        required
        dataLabel="time"
        layout="equal"
        options={TIMES.map(([label, range]) => ({ value: `${label} (${range})`, main: label, sub: range }))}
      />
      <RadioSlots
        id={`${prefix}-mode`}
        name="mode"
        legend="How would you like to visit?"
        dataLabel="visit type"
        defaultValue="In person"
        layout="equal"
        options={[
          { value: "In person", main: "At the site", sub: "Free pickup in Bengaluru" },
          { value: "Video tour", main: "Live video tour", sub: "Ideal for NRIs" },
        ]}
      />
      <div className="form-grid form-grid--2">
        <TextField id={`${prefix}-name`} label="Full name" name="name" required dataLabel="full name" autoComplete="name" />
        <PhoneField id={`${prefix}-phone`} />
      </div>
      <TextField id={`${prefix}-email`} label="Email" name="email" type="email" dataLabel="email address" autoComplete="email" />
      <ConsentField id={`${prefix}-consent`} />
    </LeadForm>
  );
}

type EnquiryProps = { prefix: string; phone: Phone; subject?: string; title?: string; compact?: boolean; types?: boolean };

export function EnquiryForm({ prefix, phone, subject, title = "Talk to an advisor", compact = false, types = true }: EnquiryProps) {
  const [initialType, setInitialType] = useState<string | undefined>(undefined);
  // Prefill the enquiry type from links like /contact-us/?type=sell
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    if (t && ENQUIRY_TYPES.some(([v]) => v === t)) setInitialType(t);
  }, []);
  return (
    <LeadForm
      label={title || "Enquiry"}
      formName="enquiry"
      phone={phone}
      heading={title ? <h3>{title}</h3> : null}
      success={{
        title: (n) => <>Thank you{n ? `, ${n}` : ""}.</>,
        text: "An advisor will be in touch within two working hours (Mon – Sat, 10 am – 7 pm IST).",
      }}
      submit={
        <>
          Send enquiry <Icon name="arrow-right" className="icon--arrow" />
        </>
      }
    >
      {subject ? <input type="hidden" name="subject" value={subject} /> : null}
      {types ? (
        <SelectField
          key={initialType || "none"}
          id={`${prefix}-type`}
          label="How can we help?"
          name="enquiry"
          required
          dataLabel="an enquiry type"
          placeholder="Choose one"
          options={ENQUIRY_TYPES}
          defaultValue={initialType}
        />
      ) : null}
      <TextField id={`${prefix}-name`} label="Full name" name="name" required dataLabel="full name" autoComplete="name" />
      <PhoneField id={`${prefix}-phone`} hint="We’ll call or WhatsApp you from our Bengaluru office." />
      <TextField id={`${prefix}-email`} label="Email" name="email" type="email" dataLabel="email address" autoComplete="email" />
      {compact ? null : <TextArea id={`${prefix}-msg`} label="Message" name="message" placeholder="Budget, preferred localities, timelines — anything that helps." />}
      <ConsentField id={`${prefix}-consent`} />
    </LeadForm>
  );
}

export function NewsletterForm({ phone }: { phone: Phone }) {
  return (
    <LeadForm
      label="Newsletter"
      formName="newsletter"
      className="news"
      variant="newsletter"
      phone={phone}
      success={{ title: (n) => (n === "pending" ? "Almost there. Check your inbox to confirm your subscription." : "You’re subscribed. Our first note arrives next month."), text: null }}
      submit="Subscribe"
    >
      <NewsletterEmail />
    </LeadForm>
  );
}

function NewsletterEmail() {
  const f = useField("email");
  return (
    <div className={`field${f.error ? " has-error" : ""}`} style={{ flex: 1 }} data-label="email address">
      <label className="visually-hidden" htmlFor="news-email">
        Email address
      </label>
      <input className="input" id="news-email" type="email" name="email" autoComplete="email" placeholder="Monthly market notes by email" required aria-invalid={!!f.error} aria-describedby="news-email-err" onBlur={f.onBlur} onChange={f.onChange} />
      <ErrorText id="news-email-err" msg={f.error} />
    </div>
  );
}
