import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import Icon, { WhatsAppIcon } from "./Icon";
import { Photo, Split } from "./primitives";
import { Clocks } from "./widgets";
import { VisitForm } from "./forms";
import { inrGroup, initials, waLink } from "@/lib/format";
import { getPhoneProps, getSite, getVisitOptions } from "@/lib/data";
import type { Advisor } from "@/lib/types";
import ClampText from "./ClampText";
import GmailLink from "./GmailLink";


/* ---------- Stats with count-up ---------- */
export async function StatsBlock() {
  const site = await getSite();
  return (
    <div className="stats" data-stagger="" style={{ "--n": site.stats.length } as CSSProperties}>
      {site.stats.map((s) => {
        const dec = s.decimals ?? 0;
        return (
          <div className="stat" data-reveal="" key={s.label}>
            <p className="stat__value">
              <span data-count={s.value} data-decimals={dec}>
                {dec ? s.value.toFixed(dec) : inrGroup(s.value)}
              </span>
              <span className="suffix">{s.suffix}</span>
            </p>
            <p className="stat__label">{s.label}</p>
            <p className="stat__note">{s.note}</p>
          </div>
        );
      })}
    </div>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = items.map((t) => (
    <span className="marquee__item" key={t}>
      {t}
    </span>
  ));
  return (
    <div className="marquee" aria-label="Highlights">
      <div className="marquee__track">
        <div style={{ display: "flex", gap: 40 }}>{row}</div>
        <div style={{ display: "flex", gap: 40 }} aria-hidden="true">
          {row}
        </div>
      </div>
    </div>
  );
}

export async function ContactLines({ waText = "Hi Propstep, I'd like to talk to an advisor." }: { waText?: string }) {
  const site = await getSite();
  return (
    <div className="contact-lines">
      <a className="contact-line contact-line--phone" href={`tel:${site.phone_href}`}>
        <span className="icon-wrap">
          <Icon name="phone" />
        </span>
        <span>
          {site.phone}
          <small>{site.hours}</small>
        </span>
      </a>
      <a className="contact-line contact-line--wa" href={waLink(site.whatsapp, waText)} target="_blank" rel="noopener">
        <span className="icon-wrap">
          <WhatsAppIcon />
        </span>
        <span>
          WhatsApp an advisor<small>Replies in under 15 minutes during office hours</small>
        </span>
      </a>
      <GmailLink className="contact-line contact-line--mail" email={site.email}>
        <span className="icon-wrap">
          <Icon name="mail" />
        </span>
        <span>
          {site.email}
          <small>For documents, brochures and NRI queries</small>
        </span>
      </GmailLink>
    </div>
  );
}

export function NriBand() {
  const points = [
    "Live video walkthroughs at hours that suit your time zone",
    "Power of attorney, FEMA and repatriation guidance from our legal team",
    "Documents couriered and explained, page by page",
    "Property care and management once you own",
  ];
  return (
    <div className="band" id="nri-desk">
      <div>
        <p className="eyebrow eyebrow--light" data-reveal="">
          NRI Desk
        </p>
        <h2 className="h2" style={{ marginTop: 18 }} data-split="">
          <Split>
            Buying from Dubai, Singapore or <em style={{ color: "var(--orange-400)" }}>San Jose?</em>
          </Split>
        </h2>
        <ClampText className="lead" style={{ marginTop: 18 }}>
          A third of our clients live outside India. Our NRI Desk works your hours and handles every step, so you can buy with confidence without flying in.
        </ClampText>
        <ul className="band__list" role="list" data-stagger="">
          {points.map((p) => (
            <li data-reveal="" key={p}>
              <Icon name="check-circle" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <Clocks
          zones={[
            ["Bengaluru", "Asia/Kolkata"],
            ["Dubai", "Asia/Dubai"],
            ["Singapore", "Asia/Singapore"],
            ["London", "Europe/London"],
            ["San Jose", "America/Los_Angeles"],
            
          ]}
        />
        <div className="btn-row" style={{ marginTop: 32 }}>
          <Link className="btn btn--light" href="/contact-us/?type=nri">
            Talk to the NRI Desk <Icon name="arrow-right" className="icon--arrow" />
          </Link>
          <Link className="btn btn--ghost-light" href="/services/#nri-desk">
            How it works
          </Link>
        </div>
      </div>
      <div className="band__media" data-reveal="clip">
        <Photo id="1600566753086-00f18fb6b3ea" alt="Double-height living room with a sculptural staircase" ratio={[4, 3.4]} sizes="(min-width: 1000px) 40vw, 90vw" />
      </div>
    </div>
  );
}

export async function Process() {
  const site = await getSite();
  return (
    <ol className="process" role="list" data-inview="" data-stagger="">
      <span className="process__line" aria-hidden="true">
        <span />
      </span>
      {site.process.map((s, i) => (
        <li className="step" style={{ "--i": i } as CSSProperties} data-reveal="" key={s.title}>
          <span className="step__num">{String(i + 1).padStart(2, "0")}</span>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function Checklist({ items, className = "checklist", style }: { items: string[]; className?: string; style?: CSSProperties }) {
  return (
    <ul className={className} role="list" data-stagger="" style={style}>
      {items.map((t) => (
        <li data-reveal="" key={t}>
          <span className="tick">
            <Icon name="check" />
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="faq" data-reveal="">
      {items.map((f) => (
        <details key={f.q}>
          <summary>
            {f.q}
            <span className="plus" aria-hidden="true" />
          </summary>
          <div className="answer">
            <p>{f.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

/* ---------- CTA with site-visit form ---------- */
export async function CtaSection({ title, text, form }: { title?: ReactNode; text?: string; form?: ReactNode }) {
  const [phoneProps, visitPropertyOptions] = form ? [null, null] : await Promise.all([getPhoneProps(), getVisitOptions()]);
  return (
    <section className="section" id="visit" style={{ paddingTop: "clamp(20px,3vw,36px)" }}>
      <div className="container">
        <div className="cta">
          <div>
            <p className="eyebrow" data-reveal="">
              Site visits
            </p>
            <h2 className="h2" style={{ marginTop: 18 }} data-split="">
              <Split>
                {title ?? (
                  <>
                    See your shortlist <em>this weekend</em>.
                  </>
                )}
              </Split>
            </h2>
            <ClampText className="lead" style={{ marginTop: 18 }}>
              {text ?? "Tell us when suits you and we'll do the rest — a chauffeured visit in Bengaluru, or a live video walkthrough from anywhere in the world."}
            </ClampText>
            <div data-reveal="">
              <ContactLines />
            </div>
          </div>
          <div className="form-card" data-reveal="">
            {form ?? (phoneProps && visitPropertyOptions && <VisitForm prefix="home-visit" phone={phoneProps} properties={visitPropertyOptions} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdvisorCard({ adv }: { adv: Advisor }) {
  return (
    <div className="advisor">
      <span className="avatar avatar--lg" aria-hidden="true">
        {initials(adv.name)}
      </span>
      <span>
        <b>{adv.name}</b>
        <span>{adv.role}</span>
        <span>Speaks {adv.languages}</span>
      </span>
    </div>
  );
}

/* Hides the footer call-to-action on pages that already end with one (see globals.css). */
export const NoFooterCta = () => <span data-no-footer-cta="" hidden />;
