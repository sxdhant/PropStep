import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import TrendChart from "@/components/TrendChart";
import { NoFooterCta, phoneProps } from "@/components/blocks";
import { ListingCard, LocalityCard } from "@/components/cards";
import { EnquiryForm } from "@/components/forms";
import { Crumbs, JsonLd, Photo, SectionHead, Split } from "@/components/primitives";
import { Rail } from "@/components/widgets";
import { getLocality, listings, localities, SITE_URL } from "@/lib/content";
import { photoUrl } from "@/lib/img";

export const dynamicParams = false;
export const generateStaticParams = () => localities.map((l) => ({ slug: l.slug }));

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const loc = getLocality((await params).slug);
  if (!loc) return {};
  return {
    title: `${loc.name}, Bengaluru — locality guide: prices, yields & metro`,
    description: `${loc.name} (${loc.zone}): average ${loc.price_sqft} per sq ft, ${loc.yield} gross yield. ${loc.tagline}`,
    alternates: { canonical: `/localities/${loc.slug}/` },
    openGraph: { images: [photoUrl(loc.image.id, 1200, [1200, 630], 75)] },
  };
}

export default async function LocalityPage({ params }: Params) {
  const loc = getLocality((await params).slug);
  if (!loc) notFound();
  const relListings = listings.filter((l) => l.locality_slug === loc.slug);
  const others = localities.filter((o) => o.slug !== loc.slug);

  return (
    <>
      <NoFooterCta />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Locality guides", item: `${SITE_URL}/localities/` },
            { "@type": "ListItem", position: 3, name: loc.name, item: `${SITE_URL}/localities/${loc.slug}/` },
          ],
        }}
      />
      <section className="lo-hero" data-hero-dark="">
        <div className="lo-hero__img">
          <Photo id={loc.image.id} alt={loc.image.alt} ratio={[16, 9]} sizes="100vw" eager />
        </div>
        <div className="container">
          <Crumbs items={[["Home", "/"], ["Locality guides", "/localities/"], [loc.name, `/localities/${loc.slug}/`]]} />
          <p className="eyebrow eyebrow--light" style={{ marginTop: 28 }} data-reveal="">
            {loc.zone}
          </p>
          <h1 className="h1" data-split="">
            <Split>{loc.name}</Split>
          </h1>
          <p className="lead" style={{ marginTop: 16 }} data-reveal="">
            {loc.tagline}
          </p>
          <dl className="lo-stats" data-reveal="">
            <div>
              <dt>Avg. price / sq ft</dt>
              <dd>{loc.price_sqft}</dd>
            </div>
            <div>
              <dt>2 BHK rent / month</dt>
              <dd>{loc.rent_2bhk}</dd>
            </div>
            <div>
              <dt>Gross rental yield</dt>
              <dd>{loc.yield}</dd>
            </div>
            <div>
              <dt>5-year price change</dt>
              <dd>{loc.growth}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section" aria-labelledby="lov-title">
        <div className="container overview">
          <div>
            <p className="eyebrow" data-reveal="">
              The briefing
            </p>
            <h2 className="h2" id="lov-title" style={{ marginTop: 18 }} data-split="">
              <Split>
                Living in <em>{loc.name}</em>
              </Split>
            </h2>
            <div className="prose" style={{ marginTop: 24 }} data-reveal="">
              {loc.overview.map((t) => (
                <p key={t.slice(0, 24)}>{t}</p>
              ))}
            </div>
            <p className="small" style={{ marginTop: 24, fontWeight: 600 }} data-reveal="">
              Best for
            </p>
            <div className="chip-group" style={{ marginTop: 10 }} data-reveal="">
              {loc.best_for.map((b) => (
                <span className="tag" key={b}>
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="panel" data-reveal="">
            <TrendChart name={loc.name} growth={loc.growth} values={loc.trend} />
          </div>
        </div>
      </section>

      <section className="section section--cool" aria-labelledby="pc-title">
        <div className="container">
          <SectionHead
            id="pc-title"
            eyebrow="Honest trade-offs"
            title={
              <>
                What people love — and what to <em>check</em>.
              </>
            }
          />
          <div className="pros-cons">
            <div className="panel good" data-reveal="">
              <h3>
                <span className="icon-wrap">
                  <Icon name="check" className="icon--sm" />
                </span>
                Why people move here
              </h3>
              <ul className="bullets" role="list">
                {loc.pros.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="panel watch" data-reveal="">
              <h3>
                <span className="icon-wrap">
                  <Icon name="alert" className="icon--sm" />
                </span>
                Worth checking first
              </h3>
              <ul className="bullets" role="list">
                {loc.cons.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="ga-title">
        <div className="container">
          <SectionHead
            id="ga-title"
            eyebrow="Getting around & everyday life"
            title={
              <>
                The <em>practical</em> details.
              </>
            }
          />
          <div className="info-cols" data-stagger="">
            <div data-reveal="">
              <h3>
                <Icon name="train" />
                Metro &amp; roads
              </h3>
              <p className="muted">{loc.metro}</p>
            </div>
            <div data-reveal="">
              <h3>
                <Icon name="school" />
                Schools &amp; healthcare
              </h3>
              <ul className="bullets" role="list">
                {[...loc.schools, ...loc.hospitals].map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div data-reveal="">
              <h3>
                <Icon name="briefcase" />
                Where people work
              </h3>
              <ul className="bullets" role="list">
                {loc.work.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {relListings.length > 0 ? (
        <section className="section section--paper" aria-labelledby="rel-title">
          <div className="container">
            <SectionHead
              id="rel-title"
              eyebrow={`Propstep in ${loc.name}`}
              title={
                <>
                  Homes <em>here</em>, right now.
                </>
              }
            />
            <div className="card-grid card-grid--3" data-stagger="">
              {relListings.map((l) => (
                <ListingCard key={l.slug} l={l} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="exp-title">
        <div className="container">
          <div className="cta">
            <div>
              <p className="eyebrow" data-reveal="">
                Talk to a local
              </p>
              <h2 className="h2" id="exp-title" style={{ marginTop: 18 }} data-split="">
                <Split>
                  Get the <em>{loc.name}</em> shortlist.
                </Split>
              </h2>
              <p className="lead" style={{ marginTop: 18 }} data-reveal="">
                Tell us your budget and timelines. An advisor who works this area every day will send you five homes worth seeing — including some that aren’t online yet.
              </p>
              <p className="small muted" style={{ marginTop: 24 }}>
                Figures on this page are indicative averages for Q3 2026 from Propstep research and are not a valuation or an offer.
              </p>
            </div>
            <div className="form-card" data-reveal="">
              <EnquiryForm prefix="lo" phone={phoneProps} subject={`Locality: ${loc.name}`} title="Request a shortlist" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--cool" aria-labelledby="ol-title" style={{ overflow: "hidden" }}>
        <div className="container">
          <SectionHead
            id="ol-title"
            eyebrow="Keep exploring"
            title={
              <>
                Other <em>localities</em>
              </>
            }
          />
        </div>
        <Rail label="Other localities">
          {others.map((o) => (
            <LocalityCard key={o.slug} loc={o} reveal={false} />
          ))}
        </Rail>
      </section>
    </>
  );
}
