import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EmiCalculator from "@/components/EmiCalculator";
import Gallery from "@/components/Gallery";
import Icon, { type IconName } from "@/components/Icon";
import { AdvisorCard, phoneProps } from "@/components/blocks";
import { ListingCard } from "@/components/cards";
import { EnquiryForm } from "@/components/forms";
import { Crumbs, JsonLd, SectionHead, Split } from "@/components/primitives";
import { getListing, listings, localities, site, SITE_URL } from "@/lib/content";
import { inrGroup, waLink } from "@/lib/format";
import { photoUrl } from "@/lib/img";

export const dynamicParams = false;
export const generateStaticParams = () => listings.map((l) => ({ slug: l.slug }));

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const l = getListing((await params).slug);
  if (!l) return {};
  return {
    title: `${l.title}, ${l.locality} — ${l.price_label}`,
    description: `${l.summary} ${l.area} sq ft · ${l.furnishing} · ${l.locality}, ${l.city}. Verified by Propstep.`,
    alternates: { canonical: `/properties/${l.slug}/` },
    openGraph: { images: [photoUrl(l.images[0].id, 1200, [1200, 630], 75)] },
  };
}

export default async function ListingPage({ params }: Params) {
  const l = getListing((await params).slug);
  if (!l) notFound();
  const adv = site.advisors[l.advisor];
  let specs: [IconName, string, string][] = [];
  if (l.bhk) specs.push(["bed", "Bedrooms", `${l.bhk} BHK`], ["bath", "Bathrooms", String(l.baths)]);
  specs.push(
    ["area", "Area", `${inrGroup(l.area)} sq ft`],
    ["sofa", "Furnishing", l.furnishing],
    ["compass", "Facing", l.facing],
    ["layers", "Floor", l.floor],
    ["clock", "Age", l.age],
    ["car", "Parking", String(l.parking)],
  );
  if (!l.bhk) specs.unshift(["users", "Washrooms", String(l.baths)]);
  specs = specs.slice(0, 8);
  const loc = l.locality_slug ? localities.find((x) => x.slug === l.locality_slug) : undefined;
  let similar = listings.filter((x) => x.slug !== l.slug && x.intent === l.intent && x.city === l.city);
  similar = [...similar, ...listings.filter((x) => x.slug !== l.slug && !similar.includes(x) && x.intent === l.intent)].slice(0, 3);
  const wa = waLink(site.whatsapp, `Hi Propstep, I'm interested in ${l.title} in ${l.locality} (${l.price_label}).`);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Properties", item: `${SITE_URL}/properties/` },
            { "@type": "ListItem", position: 3, name: l.title, item: `${SITE_URL}/properties/${l.slug}/` },
          ],
        }}
      />
      <section className="pd-hero">
        <div className="container">
          <Crumbs items={[["Home", "/"], ["Properties", "/properties/"], [l.title, `/properties/${l.slug}/`]]} />
          <div className="pd-hero__head">
            <div>
              <div className="chip-group" data-reveal="">
                <span className="tag">For sale</span>
                {l.badge ? <span className="tag tag--accent">{l.badge}</span> : null}
                <span className="tag">{l.type}</span>
              </div>
              <h1 className="pd-hero__title" style={{ fontSize: "var(--fs-h2)" }} data-split="">
                <Split>{l.title}</Split>
              </h1>
              <p className="p-card__loc" style={{ marginTop: 12, fontSize: "1rem" }} data-reveal="">
                <Icon name="pin" className="icon--sm" />
                {l.locality}, {l.city}
              </p>
            </div>
            <div data-reveal="" style={{ textAlign: "left" }}>
              <p className="ld-price">{l.price_label}</p>
              <p className="small muted">₹{inrGroup(l.price / l.area)} per sq ft</p>
            </div>
          </div>
          <Gallery images={l.images} variant="listing" />
        </div>
      </section>

      <section className="section" style={{ paddingTop: "clamp(40px,5vw,64px)" }}>
        <div className="container ld-layout">
          <div>
            <dl className="spec-grid" data-reveal="">
              {specs.map(([ic, k, v]) => (
                <div key={k}>
                  <Icon name={ic} />
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div style={{ marginTop: 48 }} data-reveal="">
              <h2 className="h3">About this {l.type === "Office" ? "space" : "home"}</h2>
              <p className="lead" style={{ marginTop: 14 }}>
                {l.summary}
              </p>
              <div className="prose" style={{ marginTop: 14 }}>
                <p>{l.description}</p>
              </div>
            </div>
            <div style={{ marginTop: 48 }}>
              <h2 className="h3" data-reveal="">
                Features
              </h2>
              <ul className="checklist feature-list" role="list" style={{ marginTop: 20 }} data-stagger="">
                {l.features.map((f) => (
                  <li data-reveal="" key={f}>
                    <span className="tick">
                      <Icon name="check" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel" style={{ marginTop: 48, display: "flex", gap: 16, alignItems: "flex-start" }} data-reveal="">
              <span style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: "50%", background: "var(--blue-50)", color: "var(--blue-700)", flex: "none" }}>
                <Icon name="shield" />
              </span>
              <div>
                <h3 className="h4">Checked by Propstep</h3>
                <p className="small muted" style={{ marginTop: 6 }}>
                  Ownership documents, encumbrance certificate, khata and building approvals reviewed by our legal team; property visited in person by {adv.name.split(" ")[0]}. Listed {l.posted}.
                </p>
              </div>
            </div>
            {loc ? (
              <div className="panel panel--cool" style={{ marginTop: 24 }}>
                <p className="eyebrow">Locality guide</p>
                <h3 className="h4" style={{ margin: "12px 0 8px" }}>
                  {loc.name}: {loc.tagline}
                </h3>
                <p className="small muted">
                  Avg. ₹{inrGroup(loc.price_mid)} / sq ft · 2 BHK rent {loc.rent_2bhk} · {loc.metro_short}
                </p>
                <Link className="link" style={{ marginTop: 14 }} href={`/localities/${loc.slug}/`}>
                  Read the {loc.name} guide <Icon name="arrow-right" className="icon--sm" />
                </Link>
              </div>
            ) : null}
            <div style={{ marginTop: 48 }}>
              <EmiCalculator price={l.price} heading="What would the EMI be?" />
            </div>
          </div>
          <aside className="ld-aside" aria-label="Enquire">
            <div className="form-card">
              <AdvisorCard adv={adv} />
              <div className="btn-row" style={{ margin: "20px 0 24px" }}>
                <a className="btn btn--outline btn--sm" href={`tel:${site.phone_href}`}>
                  <Icon name="phone" className="icon--sm" /> Call
                </a>
                <a className="btn btn--outline btn--sm" href={wa} target="_blank" rel="noopener">
                  <Icon name="chat" className="icon--sm" /> WhatsApp
                </a>
              </div>
              <EnquiryForm prefix="ld" phone={phoneProps} subject={`${l.title} — ${l.locality}`} title="Arrange a viewing" compact types={false} />
            </div>
          </aside>
        </div>
      </section>

      <section className="section section--paper" aria-labelledby="sim-title">
        <div className="container">
          <SectionHead
            id="sim-title"
            eyebrow="You may also like"
            title={
              <>
                Similar <em>properties</em>
              </>
            }
            link={
              <Link className="link" href="/properties/">
                See all homes for sale <Icon name="arrow-right" className="icon--sm" />
              </Link>
            }
          />
          <div className="card-grid card-grid--3" data-stagger="">
            {similar.map((x) => (
              <ListingCard key={x.slug} l={x} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
