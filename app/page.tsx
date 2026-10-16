import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import HeroSearch from "@/components/HeroSearch";
import SplashIntro from "@/components/SplashIntro";
import Icon from "@/components/Icon";
import { ArticleCard, BrowseAllCard, ListingCard, LocalityFlipCard } from "@/components/cards";
import { CtaSection, Marquee, NoFooterCta, NriBand, Process, StatsBlock } from "@/components/blocks";
import { SectionHead, Split } from "@/components/primitives";
import { Pillars, Rail, Testimonials, type Pillar } from "@/components/widgets";
import BookSlider from "@/components/ui/book-slider";
import { ARTICLES } from "@/lib/articles";
import { DEFAULT_MARQUEE, DEFAULT_PILLARS } from "@/lib/pillars";
import { areasIn, getListings, getLocalities, getSite, zoneResolver, ZONES } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: { absolute: `${site.name} — Property advisory & verified listings in Bengaluru | Across India` },
    description: site.description,
    alternates: { canonical: "/" },
  };
}

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

export default async function Home() {
  const [site, listings, localities, areaNames, zonesFor] = await Promise.all([getSite(), getListings(), getLocalities(), areasIn("Bengaluru"), zoneResolver()]);
  // "What we do": the cards saved in Site settings, or the built-in ones
  const pillars: Pillar[] = (site.pillars?.length ? site.pillars : DEFAULT_PILLARS).map((p) => ({
    ...p,
    links: p.links.map((l) => [l.label, l.href, l.look] as [string, string, ("accent" | "light")?]),
  }));
  // Handpicked: Bengaluru's listings, in a horizontal rail
  // Ticked in the admin; with none ticked, falls back to all of Bengaluru's listings
  const picked = listings.filter((l) => l.handpicked);
  const buy = picked.length ? picked : listings.filter((l) => l.city === "Bengaluru");
  // Hot selling: six listings in a horizontal rail
  // Ticked in the admin (newest first, up to 12); with none ticked, the 6 newest
  const flagged = listings.filter((l) => l.hot_selling);
  const hot = flagged.length ? flagged.slice(0, 12) : listings.slice(0, 6);
  // Search: Bengaluru's localities and the zones each falls in
  const areas = areaNames.map((name) => ({ name, zones: zonesFor(name) }));
  // The map card's count: Bengaluru listings in each zone (the same ones the Properties search finds)
  const counts = Object.fromEntries(ZONES.map((z) => [z, listings.filter((l) => l.city === "Bengaluru" && zonesFor(l.locality).includes(z)).length]));

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
                  <span className="hero__title-accent">Step</span> into a better <span className="hero__title-accent">Address.</span>
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

      <section className="section section--tight" aria-label="Propstep in numbers" style={{ paddingBottom: "clamp(12px,2vw,20px)" }}>
        <div className="container">
          <StatsBlock />
        </div>
        <div style={{ marginTop: "clamp(18px,2.5vw,32px)" }}>
          <Marquee items={site.marquee?.length ? site.marquee : DEFAULT_MARQUEE} />
        </div>
      </section>

      <section className="section" aria-labelledby="hot-title" style={{ overflow: "hidden", paddingTop: "clamp(20px,3vw,36px)", paddingBottom: "clamp(16px,2.5vw,28px)" }}>
        <div className="container">
          <SectionHead
            id="hot-title"
            eyebrow="Trending now"
            title={
              <>
                Hot selling <em>properties</em>.
              </>
            }
            link={
              <Link className="btn btn--outline" href="/properties/">
                Browse all properties <Icon name="arrow-right" className="icon--arrow" />
              </Link>
            }
          />
        </div>
        <Rail label="Hot selling properties">
          {hot.map((l) => (
            <ListingCard key={l.slug} l={l} reveal={false} />
          ))}
        </Rail>
      </section>

      <section className="section section--paper" aria-labelledby="pillars-title" style={{ paddingTop: "clamp(28px,3.5vw,44px)" }}>
        <div className="container">
          <SectionHead
            id="pillars-title"
            eyebrow="What we do"
            title={
              <>
                Dedicated team for every <em>step</em> of property.
              </>
            }
          />
          <Pillars items={pillars} />
        </div>
      </section>

      <section className="section" aria-labelledby="listings-title" style={{ overflow: "hidden", paddingBottom: "clamp(6px,1vw,12px)" }}>
        <div className="container">
          <SectionHead
            id="listings-title"
            eyebrow="Handpicked by our advisors"
            title={
              <>
                Verified homes, <em>ready</em> when you are.
              </>
            }
            lead="Every resale listing is checked for title, approvals and khata, and visited in person,"
            leadMore=" before it appears here."
          />
        </div>
        <Rail label="Handpicked properties">
          {buy.map((l) => (
            <ListingCard key={l.slug} l={l} reveal={false} />
          ))}
          <BrowseAllCard
            image={buy[buy.length - 1].images[0].id}
            eyebrow={`${listings.length}+ verified homes`}
            title={
              <>
                See every home <em>we’ve checked</em>
              </>
            }
            text="Filter by area, budget and bedrooms, then book a visit with an advisor in a few taps."
          />
        </Rail>
      </section>

      <section className="section section--cool" aria-labelledby="loc-title" style={{ overflow: "hidden", paddingTop: "clamp(16px,2vw,24px)", paddingBottom: "clamp(16px,2.5vw,28px)" }}>
        <div className="container">
          <SectionHead
            id="loc-title"
            eyebrow="Locality guides"
            title={
              <>
                Know Bengaluru, <em>neighbourhood</em> by neighbourhood.
              </>
            }
            lead="Prices, yields, metro access and honest trade-offs for the city’s most asked-about areas,"
            leadMore=" refreshed every quarter by our research team."
          />
        </div>
        <Rail label="Locality guides" className="rail-wrap--flip">
          {localities.map((l) => (
            <LocalityFlipCard key={l.slug} loc={l} />
          ))}
          <BrowseAllCard
            image={localities[localities.length - 1].image.id}
            href="/localities/"
            label="All locality guides"
            eyebrow={`${localities.length} area guides`}
            title={
              <>
                Find your <em>neighbourhood</em>
              </>
            }
            text="Prices, yields, metro access and honest trade-offs for every area we cover, refreshed every quarter."
          />
        </Rail>
      </section>

      <section className="section" aria-labelledby="way-title" style={{ paddingTop: "clamp(28px,3.5vw,44px)", paddingBottom: "clamp(16px,2.5vw,28px)" }}>
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

      <section className="section" style={{ paddingBlock: "clamp(8px,1.5vw,16px)" }}>
        <div className="container">
          <NriBand />
        </div>
      </section>

      <section className="section section--paper" style={{ paddingBlock: "clamp(28px,3.5vw,44px) clamp(14px,2vw,24px)" }}>
        <div className="container">
          <Testimonials items={site.testimonials} />
        </div>
      </section>

      <CtaSection />

      <section className="section section--paper" aria-labelledby="news-title" style={{ overflow: "hidden", paddingBlock: "clamp(28px,3.5vw,44px) clamp(16px,2.5vw,28px)" }}>
        <div className="container">
          <SectionHead id="news-title" eyebrow="Guides & updates" title="News & Blogs" />
        </div>
        <BookSlider
          articles={ARTICLES}
          fallback={
            <Rail label="News and blogs" className="rail-wrap--news">
              {ARTICLES.map((a) => (
                <ArticleCard key={a.slug} a={a} />
              ))}
            </Rail>
          }
        />
      </section>
    </>
  );
}
