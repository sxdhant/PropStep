import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
import { Photo } from "./primitives";
import { PerspectiveFlipCard } from "./ui/card-14";
import { BADGE_TONE_CLASS, resolveBadges } from "@/lib/budgets";
import { inrGroup } from "@/lib/format";
import type { Listing, Locality } from "@/lib/types";

/** Three tiles: BHK sizes on offer, how many homes, and the size range */
export function ListingFacts({ l }: { l: Listing }) {
  const configs = l.configs?.length ? l.configs : l.bhk ? [l.bhk] : [];
  const lo = l.area_min ?? l.area;
  const hi = l.area_max ?? l.area;
  const facts: { icon: "bed" | "building" | "area"; value: string; label: string }[] = [];
  if (configs.length) facts.push({ icon: "bed", value: `${configs.length > 1 ? `${configs.slice(0, -1).join(", ")} & ${configs[configs.length - 1]}` : configs[0]} BHK`, label: "Configurations" });
  if (l.units) facts.push({ icon: "building", value: inrGroup(l.units), label: "Units" });
  if (lo) facts.push({ icon: "area", value: lo === hi ? inrGroup(lo) : `${inrGroup(lo)} - ${inrGroup(hi)}`, label: "Size (sq ft)" });
  return (
    <ul className="l-card__facts" role="list">
      {facts.map((f) => (
        <li key={f.label}>
          <span className="l-card__fact-label">{f.label}</span>
          <strong>
            <Icon name={f.icon} className="icon--sm" />
            {f.value}
          </strong>
        </li>
      ))}
    </ul>
  );
}

/** The listing's badges as tags, each with its own icon */
export function BadgeTags({ l }: { l: Pick<Listing, "badge" | "badges"> }) {
  return (
    <>
      {(l.badges ?? resolveBadges(l.badge)).map((b) => (
        <span key={b.name} className={`tag ${BADGE_TONE_CLASS[b.tone] ?? "tag--glass"}`}>
          {b.icon ? <Icon name={b.icon as IconName} className="icon--sm" /> : null}
          {b.name}
        </span>
      ))}
    </>
  );
}

type ListingCardProps = { l: Listing; reveal?: boolean; hidden?: boolean; className?: string; eager?: boolean };

export function ListingCard({ l, reveal = true, hidden, className, eager = false }: ListingCardProps) {
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
        {(l.badges ?? resolveBadges(l.badge)).length ? (
          <div className="l-card__tags">
            <BadgeTags l={l} />
          </div>
        ) : null}
      </div>
      <div className="l-card__body">
        <div className="l-card__head">
          <div className="l-card__who">
            {l.developer ? (
              <p className={`l-card__dev${l.developer_logo ? " l-card__dev--logo" : ""}`}>
                {l.developer_logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="dev-logo" src={l.developer_logo} alt="" loading="lazy" />
                ) : null}
                {l.developer}
              </p>
            ) : null}
            <h3 className="l-card__title">{l.project ?? l.title}</h3>
            <p className="l-card__loc">
              <Icon name="pin" className="icon--sm" />
              {l.locality}, {l.city}
            </p>
          </div>
          <div className="l-card__cost">
            {l.price ? <span className="l-card__from">Starting from</span> : null}
            <p className="l-card__price">{l.price_label}<sup>*</sup></p>
            {l.price && l.price_psf ? <span className="l-card__psf">₹{inrGroup(l.price_psf)} per sq ft</span> : null}
          </div>
        </div>
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

/** The last card of a rail: a frosted, blurred-photo card that leads to the full list */
export function BrowseAllCard({ image, href = "/properties/", eyebrow, title, text, label = "Browse all properties" }: { image: string; href?: string; eyebrow: string; title: ReactNode; text: string; label?: string }) {
  return (
    <Link className="l-card l-card--all" href={href} aria-label={label}>
      <span className="l-card--all__bg" aria-hidden="true">
        <Photo id={image} ratio={[3, 4]} sizes="(min-width: 1000px) 25vw, 82vw" fade={false} />
      </span>
      <span className="l-card--all__veil" aria-hidden="true" />
      <span className="l-card--all__body">
        <span className="l-card--all__eyebrow">{eyebrow}</span>
        <span className="l-card--all__title">{title}</span>
        <span className="l-card--all__text">{text}</span>
        <span className="l-card--all__go" aria-hidden="true">
          <Icon name="arrow-right" />
        </span>
      </span>
    </Link>
  );
}

/** Home-page locality guide: photo and name in front, the numbers on the back (a PerspectiveFlipCard). */
export function LocalityFlipCard({ loc }: { loc: Locality }) {
  const stats = [
    { icon: "rupee", value: `₹${inrGroup(loc.price_mid)}`, label: "per sq ft", z: 60 },
    { icon: "trending", value: loc.growth, label: "in 5 years", z: 80 },
    { icon: "key", value: rentShort(loc.rent_2bhk), label: "2BHK rent", z: 60 },
  ] as const;
  const [first, ...rest] = loc.best_for;
  const bestFor = listFormat.format([first, ...rest.map((b) => b.charAt(0).toLowerCase() + b.slice(1))]);

  const front = (
    <div className="loc-flip__front flip-3d">
      <div className="loc-flip__media flip-3d flip-z" style={lift(50)}>
        <div className="loc-flip__img">
          <Photo id={loc.image.id} alt={loc.image.alt} ratio={[16, 9]} sizes="(min-width: 1280px) 22vw, (min-width: 1000px) 30vw, 84vw" />
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
          <ul className="loc-flip__points" role="list">
            {[loc.pros[0], loc.pros[1], `Rental yield around ${loc.yield}`].filter(Boolean).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
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
            <span className="loc-flip__stat-icon flip-z" style={lift(s.z === 80 ? 25 : 20)}>
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

  return <PerspectiveFlipCard className="loc-flip" h="440px" front={front} back={back} />;
}
