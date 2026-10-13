import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import PropertySearch from "@/components/PropertySearch";
import ClampText from "@/components/ClampText";
import { Crumbs, Split } from "@/components/primitives";
import { areasIn, getListings, SEARCH_CITIES, zoneResolver, ZONES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Verified homes in Bengaluru",
  description:
    "Search verified resale homes across Bengaluru. Every listing is legally checked and visited by a Propstep advisor.",
  alternates: { canonical: "/properties/" },
};

export default async function PropertiesPage() {
  const [listings, zonesFor, ...cityAreas] = await Promise.all([getListings(), zoneResolver(), ...SEARCH_CITIES.map((c) => areasIn(c))]);
  return (
    <>
      <section className="page-hero" style={{ paddingTop: "calc(var(--header-h) + 8px)" }}>
        <div className="container">
          <Crumbs items={[["Home", "/"], ["Properties", "/properties/"]]} />
          <div className="page-hero__grid" style={{ rowGap: 6 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <p className="eyebrow" style={{ marginTop: 20 }} data-reveal="">
                Buy · Propstep Advisory
              </p>
              <h1 className="h1" data-split="" style={{ fontSize: "clamp(0.7rem, 3.05vw, 2.3rem)", maxWidth: "none", whiteSpace: "nowrap" }}>
                <Split>
                  Your next address in <em>Bengaluru</em> checked and ready.
                </Split>
              </h1>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <ClampText className="lead">
                Homes from across the market, new launches and resale — each one legally checked and visited by an advisor before it’s listed. Looking for something specific? Our advisors see new stock before it goes online.
              </ClampText>
            </div>
          </div>
        </div>
      </section>
      <PropertySearch
        listings={listings}
        cities={SEARCH_CITIES}
        zones={ZONES}
        areas={Object.fromEntries(SEARCH_CITIES.map((c, i) => [c, cityAreas[i].map((name) => ({ name, zones: zonesFor(name) }))]))}
      />
      <section className="section section--cool" style={{ paddingBlock: "clamp(32px,4vw,52px)" }}>
        <div className="container">
          <div className="page-hero__grid" style={{ alignItems: "center", rowGap: 6 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <p className="eyebrow">Selling your home?</p>
              <h2 className="h2" style={{ marginTop: 18, fontSize: "clamp(0.9rem, 3.4vw, 2.2rem)", maxWidth: "none", whiteSpace: "nowrap" }} data-split="">
                <Split>
                  List with an advisor who <em>knows</em> the street.
                </Split>
              </h2>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <ClampText className="lead">
                Free valuation backed by registration data, professional photography, and a buyer pool that’s been checked for funds and intent.
              </ClampText>
              <div className="btn-row" style={{ marginTop: 16 }}>
                <Link className="btn btn--sm" href="/contact-us/?type=sell">
                  Get a free valuation <Icon name="arrow-right" className="icon--arrow" />
                </Link>
                <Link className="btn btn--sm btn--outline" href="/services/#sell">
                  How selling works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
