import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EmiCalculator from "@/components/EmiCalculator";
import Gallery from "@/components/Gallery";
import Icon, { WhatsAppIcon, type IconName } from "@/components/Icon";
import { AdvisorCard } from "@/components/blocks";
import { BadgeTags, ListingCard } from "@/components/cards";
import { EnquiryForm } from "@/components/forms";
import { Crumbs, JsonLd, SectionHead } from "@/components/primitives";
import { getListing, getListings, getLocalities, getPhoneProps, getSite, SITE_URL } from "@/lib/data";
import { resolveBadges } from "@/lib/budgets";
import { area1, inrGroup, inrShort, waLink } from "@/lib/format";
import { photoUrl } from "@/lib/img";
import fs from "node:fs";
import path from "node:path";
import ClampText from "@/components/ClampText";
import { Rail } from "@/components/widgets";
import PlanExplorer from "@/components/PlanExplorer";

/** The property's 3D image, if one has been added: public/floorplans/<slug>-3d.(webp|jpg|jpeg|png|avif|svg). The 2D / 3D button shows only when it exists */
function floorplan3d(slug: string) {
  const ext = ["webp", "jpg", "jpeg", "png", "avif", "svg"].find((e) => fs.existsSync(path.join(process.cwd(), "public", "floorplans", `${slug}-3d.${e}`)));
  return ext ? `/floorplans/${slug}-3d.${ext}` : undefined;
}

export const revalidate = 3600; // admin edits also revalidate by tag
// Existing listings are prerendered; ones added in the admin panel render on first visit (dynamicParams stays on)
export const generateStaticParams = async () => (await getListings()).map((l) => ({ slug: l.slug }));

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const l = await getListing((await params).slug);
  if (!l) return {};
  return {
    title: `${l.title}, ${l.locality} — ${l.price_label}`,
    description: `${l.summary} ${area1(l.area)} sq ft · ${l.locality}, ${l.city}. Verified by Propstep.`,
    alternates: { canonical: `/properties/${l.slug}/` },
    openGraph: { images: [photoUrl(l.images[0].id, 1200, [1200, 630], 75)] },
  };
}

export default async function ListingPage({ params }: Params) {
  const l = await getListing((await params).slug);
  if (!l) notFound();
  const [site, listings, localities, phoneProps] = await Promise.all([getSite(), getListings(), getLocalities(), getPhoneProps()]);
  const adv = site.advisors[l.advisor];
  const project = l.project ?? l.title;
  const configs = l.configs?.length ? l.configs : l.bhk ? [l.bhk] : [];
  const units = l.unit_types ?? [];
  const lo = l.area_min ?? l.area;
  const hi = l.area_max ?? l.area;
  const prices = units.map((u) => u.price);
  const priceRange = prices.length > 1 ? `${inrShort(Math.min(...prices))} - ${inrShort(Math.max(...prices))}` : l.price_label;
  const loc = l.locality_slug ? localities.find((x) => x.slug === l.locality_slug) : undefined;
  const others = listings.filter((x) => x.slug !== l.slug);
  const sameDev = l.developer ? others.filter((x) => x.developer === l.developer) : [];
  const rest = others.filter((x) => !sameDev.includes(x));
  const sameLoc = rest.filter((x) => x.locality === l.locality);
  const otherDev = (sameLoc.length ? sameLoc : [...rest.filter((x) => x.city === l.city), ...rest.filter((x) => x.city !== l.city)]).slice(0, 8);
  // The advisor's own number when they have one, otherwise the company line
  const callHref = adv?.phone ?? site.phone_href;
  const wa = waLink(adv?.phone ? adv.phone.replace(/\D/g, "") : site.whatsapp, `Hi Propstep, I'm interested in ${l.title} in ${l.locality} (${l.price_label}).`);
  const configText = configs.length > 1 ? `${configs.slice(0, -1).join(", ")} & ${configs[configs.length - 1]}` : String(configs[0] ?? "");
  // Anything the admin left empty is simply not shown
  const config = ([
    ["home", "Property type", l.type ?? ""],
    ["bed", "Bedrooms", configs.length ? `${configText} BHK` : ""],
    ["area", "Size", lo ? (lo === hi ? `${area1(lo)} sq ft` : `${area1(lo)} - ${area1(hi)} sq ft`) : ""],
    ["building", "Number of units", l.units ? inrGroup(l.units) : ""],
    ["layers", "Total area", l.total_area ?? ""],
    ["building", "Number of towers", l.towers ? inrGroup(l.towers) : ""],
    ["home", "Structure", l.structure ?? ""],
    ["rupee", "Price range", l.price ? priceRange : ""],
    ["key", "Possession", l.possession ?? ""],
  ] as [IconName, string, string][]).filter((r) => r[2].trim());
  const about = ([
    ["Project name", project],
    ["Developer", l.developer ?? ""],
    ["Property type", l.type ?? ""],
    ["Location", `${l.locality}, ${l.city}`],
    ["Status", l.possession ?? ""],
    ["Connecting road", l.connecting_road ?? ""],
    ["RERA numbers", l.rera ?? ""],
  ] as [string, string][]).filter((r) => r[1].trim());

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
          <Crumbs items={[["Home", "/"], ["Properties", "/properties/"], [project, `/properties/${l.slug}/`]]} />
          <div className="pd-intro">
            {(l.badges ?? resolveBadges(l.badge)).length ? (
              <div className="chip-group" data-reveal="">
                <BadgeTags l={l} />
              </div>
            ) : null}
            <div className="pd-titlebar">
              {l.developer_logo ? (
                <span className="pd-logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.developer_logo} alt={l.developer ? `${l.developer} logo` : "Developer logo"} />
                </span>
              ) : null}
              <div>
                {l.developer ? <p className="pd-dev">{l.developer}</p> : null}
                <h1 className="pd-project">{project}</h1>
                <p className="pd-loc">
                  <Icon name="pin" className="icon--sm" />
                  {l.locality}, {l.city}
                </p>
              </div>
            </div>
            <ClampText className="pd-desc">
              {l.summary} {l.description}
            </ClampText>
          </div>
          <Gallery images={l.images} variant="listing" />
        </div>
      </section>

      <section className="section" style={{ paddingTop: "clamp(40px,5vw,64px)" }}>
        <div className="container ld-layout">
          <div className="pd-main">
            {config.length ? (
              <div className="pd-sec">
                <h2 className="h3" data-reveal="">Configuration</h2>
                <dl className="spec-grid spec-grid--3" data-reveal="">
                  {config.map(([ic, k, v]) => (
                    <div key={k}>
                      <Icon name={ic} />
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {l.notes?.length ? (
              <div className="pd-sec">
                <h2 className="h3" data-reveal="">Worth knowing</h2>
                <ul className="pd-notes" role="list" data-reveal="">
                  {l.notes.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="pd-sec">
              <h2 className="h3" data-reveal="">About the project</h2>
              <table className="pd-table" data-reveal="">
                <thead>
                  <tr><th scope="col">Parameters</th><th scope="col">Details</th></tr>
                </thead>
                <tbody>
                  {about.map(([k, v]) => (
                    <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            {units.length ? (
              <div className="pd-sec">
                <h2 className="h3" data-reveal="">Price list</h2>
                <p className="small muted" style={{ marginTop: 6 }}>View the latest price list for {project}.</p>
                <table className="pd-table pd-table--price" data-reveal="">
                  <thead>
                    <tr><th scope="col">Unit type</th><th scope="col">Size</th><th scope="col">Price*</th></tr>
                  </thead>
                  <tbody>
                    {units.map((u) => (
                      <tr key={`${u.label}-${u.area}`}>
                        <th scope="row">{u.label}</th>
                        <td>{area1(u.area)} sq ft</td>
                        <td><b>{inrShort(u.price)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="small muted" style={{ marginTop: 10 }}>*Prices are indicative and subject to applicable charges and project terms.</p>
              </div>
            ) : null}

            {units.length && (l.floorplan || units.some((u) => u.floorplan)) ? (
              <div className="pd-sec">
                <h2 className="h3" data-reveal="">{project} floor plans</h2>
                <PlanExplorer units={units} fallback={l.floorplan ?? ""} fallback3d={floorplan3d(l.slug)} title={project} />
              </div>
            ) : null}

            {l.amenities?.length ? (
              <div className="pd-sec pd-sec--tight">
                <h2 className="h3" data-reveal="">Amenities</h2>
                <ul className="amen" role="list" data-stagger="">
                  {l.amenities.map((a) => (
                    <li data-reveal="" key={a.label}>
                      <span><Icon name={a.icon} /></span>
                      {a.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="pd-sec">
              <h2 className="h3" data-reveal="">Location and connectivity</h2>
              <p className="small muted" style={{ marginTop: 6 }}>
                {project} is in {l.locality}, {l.city}{l.connecting_road ? `, off ${l.connecting_road}` : ""}. Travel times are approximate.
              </p>
              <div className="map-embed map-embed--wide" data-reveal="">
                <iframe
                  title={`Map of ${project}, ${l.locality}`}
                  src={l.map_embed ?? `https://www.google.com/maps?q=${encodeURIComponent(`${project}, ${l.locality}, ${l.city}`)}&z=15&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              {l.connectivity?.length ? (
                <h3 className="conn-title">Nearest places</h3>
              ) : null}
              {l.connectivity?.length ? (
                <ul className="conn" style={{ marginTop: 12 }} role="list" data-stagger="">
                  {l.connectivity.map((c) => (
                    <li data-reveal="" key={c.place}>
                      <span><Icon name={c.icon} /></span>
                      <b>{c.place}</b>
                      <em>{c.time}</em>
                    </li>
                  ))}
                </ul>
              ) : null}
              {l.map_url ? (
                <p style={{ marginTop: 12 }}>
                  <a className="btn btn--outline btn--sm" href={l.map_url} target="_blank" rel="noopener">
                    Open in Google Maps <Icon name="arrow-up-right" className="icon--sm" />
                  </a>
                </p>
              ) : null}
              <div className="conn-guide">
                {loc ? (
                  <Link className="btn btn--accent btn--sm" href={`/localities/${loc.slug}/`}>
                    {loc.name} locality guide <Icon name="arrow-right" className="icon--sm" />
                  </Link>
                ) : null}
              </div>
            </div>

            {l.price > 0 ? (
              <div className="pd-sec">
                <h2 className="h3" data-reveal="">EMI calculator</h2>
                <EmiCalculator price={l.price} heading="What would the EMI be?" />
              </div>
            ) : null}
          </div>
          <aside className="ld-aside" id="enquire" aria-label="Enquire">
            <div className="form-card">
              <AdvisorCard adv={adv} />
              <div className="btn-row" style={{ margin: "20px 0 24px" }}>
                <a className="btn btn--call btn--sm" href={`tel:${callHref}`}>
                  <Icon name="phone" className="icon--sm" /> Call
                </a>
                <a className="btn btn--wa btn--sm" href={wa} target="_blank" rel="noopener">
                  <WhatsAppIcon className="icon--sm" /> WhatsApp
                </a>
              </div>
              <EnquiryForm prefix="ld" phone={phoneProps} subject={`${l.title} — ${l.locality}`} title="Arrange a viewing" compact types={false} />
            </div>
          </aside>
        </div>
      </section>

      {sameDev.length ? (
        <section className="section section--paper" aria-labelledby="dev-title" style={{ overflow: "hidden" }}>
          <div className="container">
            <SectionHead id="dev-title" eyebrow="Same developer" title={<>More from <em>{l.developer}</em></>} />
            </div>
          <Rail label={`More from ${l.developer}`}>
            {sameDev.slice(0, 8).map((x) => <ListingCard key={x.slug} l={x} reveal={false} />)}
          </Rail>
          <div>
          </div>
        </section>
      ) : null}

      {otherDev.length ? (
        <section className={`section${sameDev.length ? "" : " section--paper"}`} aria-labelledby="sim-title" style={{ overflow: "hidden" }}>
          <div className="container">
            <SectionHead
              id="sim-title"
              eyebrow="You may also like"
              title={sameLoc.length ? <>Similar properties in <em>{l.locality}</em></> : <>Similar <em>properties</em></>}
              link={
                <Link className="link" href="/properties/">
                  See all <Icon name="arrow-right" className="icon--sm" />
                </Link>
              }
            />
            </div>
          <Rail label="Similar properties">
            {otherDev.map((x) => <ListingCard key={x.slug} l={x} reveal={false} />)}
          </Rail>
          <div>
          </div>
        </section>
      ) : null}
    </>
  );
}
