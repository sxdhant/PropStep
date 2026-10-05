import Link from "next/link";
import type { CSSProperties } from "react";
import Icon from "./Icon";
import { Photo } from "./primitives";
import { PerspectiveFlipCard } from "./ui/card-14";
import { inrGroup } from "@/lib/format";
import type { Listing, Locality } from "@/lib/types";

export function ListingFacts({ l }: { l: Listing }) {
  return (
    <p className="l-card__facts">
      {l.bhk ? (
        <>
          <span>
            <Icon name="bed" className="icon--sm" />
            {l.bhk} BHK
          </span>
          <span>
            <Icon name="bath" className="icon--sm" />
            {l.baths} baths
          </span>
        </>
      ) : (
        <span>
          <Icon name="briefcase" className="icon--sm" />
          {l.furnishing}
        </span>
      )}
      <span>
        <Icon name="area" className="icon--sm" />
        {inrGroup(l.area)} sq ft
      </span>
    </p>
  );
}

type ListingCardProps = { l: Listing; reveal?: boolean; hidden?: boolean; className?: string; eager?: boolean };

export function ListingCard({ l, reveal = true, hidden, className, eager = false }: ListingCardProps) {
  const badgeCls = l.badge && ["Exclusive", "Price reduced", "New"].includes(l.badge) ? "tag--accent" : "tag--glass";
  return (
    <Link
      className={`l-card${className ? ` ${className}` : ""}`}
      href={`/properties/${l.slug}/`}
      hidden={hidden}
      data-listing=""
      {...(reveal ? { "data-reveal": "" } : {})}
    >
      <div className="media">
        <Photo id={l.images[0].id} alt={l.images[0].alt} ratio={[3, 2]} sizes="(min-width: 1000px) 30vw, (min-width: 640px) 46vw, 92vw" eager={eager} />
        <div className="l-card__tags">
          <span className="tag tag--glass">For sale</span>
          {l.badge ? (
            <span className={`tag ${badgeCls}`}>
              {l.badge === "Verified" ? <Icon name="verified" className="icon--sm" /> : null}
              {l.badge}
            </span>
          ) : null}
        </div>
      </div>
      <div className="l-card__body">
        <p className="l-card__price">{l.price_label}</p>
        <h3 className="l-card__title">{l.title}</h3>
        <p className="l-card__loc">
          <Icon name="pin" className="icon--sm" />
          {l.locality}, {l.city}
        </p>
        <ListingFacts l={l} />
      </div>
    </Link>
  );
}

export function LocalityCard({ loc, reveal = true }: { loc: Locality; reveal?: boolean }) {
  return (
    <Link className="loc-card" href={`/localities/${loc.slug}/`} {...(reveal ? { "data-reveal": "" } : {})}>
      <div className="loc-card__img">
        <Photo id={loc.image.id} ratio={[3, 4]} sizes="(min-width: 1000px) 25vw, 80vw" />
      </div>
      <span className="tag tag--glass">
        <Icon name="train" className="icon--sm" />
        {loc.metro_short}
      </span>
      <p className="loc-card__zone">{loc.zone}</p>
      <h3 className="loc-card__name">{loc.name}</h3>
      <dl className="loc-card__stats">
        <div>
          <dt>Avg. price / sq ft</dt>
          <dd>₹{inrGroup(loc.price_mid)}</dd>
        </div>
        <div>
          <dt>5-year change</dt>
          <dd>{loc.growth}</dd>
        </div>
      </dl>
    </Link>
  );
}

/** Depth for a .flip-z layer inside a PerspectiveFlipCard face. */
const lift = (px: number) => ({ "--z": `${px}px` }) as CSSProperties;
const listFormat = new Intl.ListFormat("en-GB", { type: "conjunction" });

/** "₹32,000 – ₹45,000" → "₹32–45k", short enough for a stat tile. */
const rentShort = (range: string) => {
  const [lo, hi] = (range.match(/[\d,]+/g) ?? []).map((n) => Math.round(Number(n.replace(/,/g, "")) / 1000));
  return hi ? `₹${lo}–${hi}k` : range;
};

/** Home-page locality guide: photo and name in front, the numbers on the back (a PerspectiveFlipCard). */
export function LocalityFlipCard({ loc }: { loc: Locality }) {
  const stats = [
    { icon: "rupee", value: `₹${inrGroup(loc.price_mid)}`, label: "per sq ft", z: 130 },
    { icon: "trending", value: loc.growth, label: "in 5 years", z: 160 },
    { icon: "key", value: rentShort(loc.rent_2bhk), label: "2BHK rent", z: 130 },
  ] as const;
  const [first, ...rest] = loc.best_for;
  const bestFor = listFormat.format([first, ...rest.map((b) => b.charAt(0).toLowerCase() + b.slice(1))]);

  const front = (
    <div className="loc-flip__front flip-3d">
      <div className="loc-flip__media flip-3d flip-z" style={lift(50)}>
        <div className="loc-flip__img">
          <Photo id={loc.image.id} alt={loc.image.alt} ratio={[1, 1]} sizes="(min-width: 1280px) 22vw, (min-width: 1000px) 30vw, 84vw" />
        </div>
        <span className="tag tag--glass loc-flip__badge flip-z" style={lift(30)}>
          <Icon name="train" className="icon--sm" />
          {loc.metro_short}
        </span>
      </div>
      <div className="loc-flip__body flip-3d">
        <div className="flip-z" style={lift(60)}>
          <p className="loc-flip__eyebrow">
            <Icon name="compass" className="icon--sm" />
            {loc.zone}
          </p>
          <h3 className="loc-flip__name">{loc.name}</h3>
          <p className="loc-flip__tagline">{loc.tagline}</p>
        </div>
        <p className="loc-flip__hint flip-z" style={lift(40)} aria-hidden="true">
          <span className="loc-flip__hint-hover">Hover for the numbers</span>
          <span className="loc-flip__hint-tap">Tap for the numbers</span>
          <Icon name="arrow-right" className="icon--sm" />
        </p>
      </div>
    </div>
  );

  const back = (
    <div className="loc-flip__back flip-3d">
      <ul className="loc-flip__stats flip-3d">
        {stats.map((s) => (
          <li key={s.label} className="loc-flip__stat flip-3d flip-z" style={lift(s.z)}>
            <span className="loc-flip__stat-icon flip-z" style={lift(s.z === 160 ? 25 : 20)}>
              <Icon name={s.icon} />
            </span>
            <strong className="flip-z" style={lift(10)}>{s.value}</strong>
            <span className="loc-flip__stat-label">{s.label}</span>
          </li>
        ))}
      </ul>
      <div className="loc-flip__copy flip-3d">
        <p className="loc-flip__eyebrow flip-z" style={lift(80)}>Best for</p>
        <p className="loc-flip__lead flip-z" style={lift(80)}>{bestFor}</p>
        <p className="loc-flip__range flip-z" style={lift(40)}>
          Homes trade at <span>{loc.price_sqft} per sq ft.</span>
        </p>
      </div>
      <div className="loc-flip__cta flip-z" style={lift(100)}>
        <Link className="btn btn--light btn--sm btn--block" href={`/localities/${loc.slug}/`}>
          Read the guide<span className="visually-hidden"> to {loc.name}</span> <Icon name="arrow-right" className="icon--arrow" />
        </Link>
      </div>
    </div>
  );

  return <PerspectiveFlipCard className="loc-flip" front={front} back={back} />;
}
