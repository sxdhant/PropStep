import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import HeroSearch from "@/components/HeroSearch";
import SplashIntro from "@/components/SplashIntro";
import Icon from "@/components/Icon";
import { ListingCard, LocalityFlipCard } from "@/components/cards";
import { CtaSection, Marquee, NoFooterCta, NriBand, Process, StatsBlock } from "@/components/blocks";
import { SectionHead, Split } from "@/components/primitives";
import { Cities, Pillars, Rail, Testimonials, type Pillar } from "@/components/widgets";
import { areasIn, listings, localities, site, ZONES, zonesOf } from "@/lib/content";

export const metadata: Metadata = {
  title: { absolute: `${site.name} — Property advisory & verified listings in Bengaluru | Across India` },
  description: site.description,
  alternates: { canonical: "/" },
};

// One villa by day and at night from the same camera (public/hero): aligned so the two frames overlay exactly, graded
// to read as photographs, and given more sky above the roof (the same extension on both). The theme switch
// crossfades between them.
const HERO = { day: "/hero/villa-day", night: "/hero/villa-night" };
const HERO_ALT = "A two-storey modern villa with timber screens, floor-to-ceiling glass and a long pool on a lawn";

function HeroPhoto({ src, alt, priority }: { src: string; alt: string; priority: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="hero__photo"
      src={`${src}-1672.webp`}
      srcSet={`${src}-1254.webp 1254w, ${src}-1672.webp 1672w`}
      // Portrait screens show the frame's full height, so it is drawn about 1.44 screen-heights wide
      sizes="(orientation: portrait) 144vh, 100vw"
      width={1672}
      height={1160}
      alt={alt}
      loading="eager"
      fetchPriority={priority ? "high" : "low"}
    />
  );
}

const PILLARS: Pillar[] = [
  {
    title: "Discover",
    sub: "Verified listings",
    tags: ["Apartments", "Villas", "Plots", "Farmhouses", "Penthouses"],
    text: "Homes, land and offices from across the market — new launches and resale — listed only after our legal team has checked the title and an advisor has visited in person.",
    links: [["Browse properties", "/properties/"], ["Book a site visit", "/contact-us/#visit"]],
    image: "1580587771525-78b9dba3b914",
    alt: "Modern villa with a pool and a pale stone facade",
  },
  {
    title: "Advise",
    sub: "Buy & sell",
    tags: ["New homes", "Resale", "Selling", "Home loans"],
    text: "Independent advice on new and resale homes in six cities: shortlists to your brief, prices benchmarked against actual registrations — not asking prices — and negotiation on your side.",
    links: [["Homes to buy", "/properties/"], ["Sell with us", "/services/#sell"], ["Home loans", "/services/#loans"]],
    image: "1560448204-e02f11c3d0e2",
    alt: "Bright living room with floor-to-ceiling windows",
  },
  {
    title: "Invest",
    sub: "Land, offices & NRI",
    tags: ["Plots & farmland", "Pre-leased offices", "NRI Desk"],
    text: "Title-clean plots and managed farmland, pre-leased offices, and an NRI Desk that handles everything from video walkthroughs to power of attorney.",
    links: [["NRI Desk", "/services/#nri"]],
    image: "1500382017468-9049fed747ef",
    alt: "Open grassland at sunset",
  },
];

export default function Home() {
  const buy = ["whitefield-4bhk-villa-banyan-grove", "koramangala-3bhk-cedar-court", "sadashivanagar-penthouse-lalbagh-terraces"]
    .map((s) => listings.find((l) => l.slug === s)!)
    .sort((a, b) => listings.indexOf(a) - listings.indexOf(b));
  // Search: Bengaluru's localities and the zones each falls in
  const areas = areasIn("Bengaluru").map((name) => ({ name, zones: zonesOf(name) }));
  // The map card's count: Bengaluru listings in each zone (the same ones the Properties search finds)
  const counts = Object.fromEntries(ZONES.map((z) => [z, listings.filter((l) => l.city === "Bengaluru" && zonesOf(l.locality).includes(z)).length]));

  return (
    <>
      <SplashIntro />
      <NoFooterCta />
      <section className="hero hero--immersive" data-hero-dark="" aria-labelledby="hero-title">
        <div className="hero__stage">
          <div className="hero__media">
            <div className="hero__parallax">
              <div className="hero__zoom">
                <HeroPhoto src={HERO.day} alt={HERO_ALT} priority />
                <div className="hero__night" aria-hidden="true">
                  <HeroPhoto src={HERO.night} alt="" priority={false} />
                </div>
                <div className="hero__tint" aria-hidden="true" />
              </div>
            </div>
            <div className="hero__shade" aria-hidden="true" />
          </div>
          <div className="container hero__content">
            <div className="hero__copy">
              <h1 className="hero__title" id="hero-title" data-split="">
                <Split>
                  <span className="hero__title-accent">Step</span> into a better <span className="hero__title-accent">address.</span>
                </Split>
              </h1>
              <p className="hero__lead" data-reveal="" style={{ "--delay": "420ms" } as CSSProperties}>
                Verified properties from across the market, and an advisor beside you from first shortlist to the keys.
              </p>
            </div>
            <HeroSearch zones={ZONES} areas={areas} counts={counts} />
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-label="Propstep in numbers">
        <div className="container">
          <StatsBlock />
        </div>
        <div style={{ marginTop: "clamp(48px,6vw,80px)" }}>
          <Marquee
            items={[
              "Karnataka RERA-registered agent",
              "40-point legal due diligence",
              "Every listing visited in person",
              "12+ partner lenders",
              "Advisory in six cities",
              "New launches and resale, side by side",
              "Chauffeured site visits",
            ]}
          />
        </div>
      </section>

      <section className="section section--paper" aria-labelledby="pillars-title">
        <div className="container">
          <SectionHead
            id="pillars-title"
            eyebrow="What we do"
            title={
              <>
                One team for every <em>step</em> of property.
              </>
            }
          />
          <Pillars items={PILLARS} />
        </div>
      </section>

      <section className="section" aria-labelledby="listings-title">
        <div className="container">
          <SectionHead
            id="listings-title"
            eyebrow="Handpicked by our advisors"
            title={
              <>
                Verified homes, <em>ready</em> when you are.
              </>
            }
            lead="Every resale listing is checked for title, approvals and khata, and visited in person, before it appears here."
            link={
              <Link className="btn btn--outline" href="/properties/">
                Browse all properties <Icon name="arrow-right" className="icon--arrow" />
              </Link>
            }
          />
          <div className="card-grid card-grid--3" data-stagger="" style={{ marginTop: 32 }}>
            {buy.map((l) => (
              <ListingCard key={l.slug} l={l} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cool" aria-labelledby="loc-title" style={{ overflow: "hidden" }}>
        <div className="container">
          <SectionHead
            id="loc-title"
            eyebrow="Locality guides"
            title={
              <>
                Know Bengaluru, <em>neighbourhood</em> by neighbourhood.
              </>
            }
            lead="Prices, yields, metro access and honest trade-offs for the city’s most asked-about areas — refreshed every quarter by our research team."
            link={
              <Link className="btn btn--outline" href="/localities/">
                All locality guides <Icon name="arrow-right" className="icon--arrow" />
              </Link>
            }
          />
        </div>
        <Rail label="Locality guides" className="rail-wrap--flip">
          {localities.map((l) => (
            <LocalityFlipCard key={l.slug} loc={l} />
          ))}
        </Rail>
      </section>

      <section className="section" aria-labelledby="way-title">
        <div className="container">
          <SectionHead
            id="way-title"
            eyebrow="The Propstep way"
            title={
              <>
                Four steps. <em>No</em> surprises.
              </>
            }
            lead="Whether you are buying your first apartment or leasing a headquarters, the process — and the paperwork — is the same careful sequence."
          />
          <Process />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <NriBand />
        </div>
      </section>

      <section className="section" aria-labelledby="cities-title" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead
            id="cities-title"
            eyebrow="Where we work"
            title={
              <>
                Rooted in Bengaluru. <em>Advising</em> across India.
              </>
            }
          />
        </div>
        <Cities cities={site.cities} />
      </section>

      <section className="section section--paper">
        <div className="container">
          <Testimonials items={site.testimonials} />
        </div>
      </section>

      <CtaSection />
    </>
  );
}
