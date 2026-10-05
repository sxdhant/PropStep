import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import PropertySearch from "@/components/PropertySearch";
import { Crumbs, Split } from "@/components/primitives";
import { areasIn, listings, SEARCH_CITIES, ZONES, zonesOf } from "@/lib/content";

export const metadata: Metadata = {
  title: "Verified homes to buy — Bengaluru, Mumbai, Pune, Hyderabad, Delhi NCR",
  description:
    "Search verified resale homes across Bengaluru, Mumbai, Pune, Hyderabad, Chennai and Delhi NCR. Every listing is legally checked and visited by a Propstep advisor.",
  alternates: { canonical: "/properties/" },
};

export default function PropertiesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Crumbs items={[["Home", "/"], ["Properties", "/properties/"]]} />
          <div className="page-hero__grid">
            <div>
              <p className="eyebrow" style={{ marginTop: 28 }} data-reveal="">
                Buy · Propstep Advisory
              </p>
              <h1 className="h1" data-split="">
                <Split>
                  Verified homes across <em>India</em>.
                </Split>
              </h1>
            </div>
            <div>
              <p className="lead" data-reveal="">
                Homes from across the market, new launches and resale — each one legally checked and visited by an advisor before it’s listed. Looking for something specific? Our advisors see new stock before it goes online.
              </p>
            </div>
          </div>
        </div>
      </section>
      <PropertySearch
        listings={listings}
        cities={SEARCH_CITIES}
        zones={ZONES}
        areas={Object.fromEntries(SEARCH_CITIES.map((c) => [c, areasIn(c).map((name) => ({ name, zones: zonesOf(name) }))]))}
      />
      <section className="section section--cool">
        <div className="container">
          <div className="page-hero__grid" style={{ alignItems: "center" }}>
            <div>
              <p className="eyebrow">Selling your home?</p>
              <h2 className="h2" style={{ marginTop: 18 }} data-split="">
                <Split>
                  List with an advisor who <em>knows</em> the street.
                </Split>
              </h2>
            </div>
            <div>
              <p className="lead">Free valuation backed by registration data, professional photography, and a buyer pool that’s been checked for funds and intent.</p>
              <div className="btn-row" style={{ marginTop: 24 }}>
                <Link className="btn" href="/contact-us/?type=sell">
                  Get a free valuation <Icon name="arrow-right" className="icon--arrow" />
                </Link>
                <Link className="btn btn--outline" href="/services/#sell">
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
