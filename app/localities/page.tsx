import type { Metadata } from "next";
import Link from "next/link";
import { LocalityCard } from "@/components/cards";
import { Crumbs, SectionHead, Split } from "@/components/primitives";
import { SortableTable, type Cell, type Column } from "@/components/widgets";
import { getLocalities } from "@/lib/data";
import { inrGroup } from "@/lib/format";
import ClampText from "@/components/ClampText";

export const metadata: Metadata = {
  title: "Bengaluru locality guides — prices, yields & metro access",
  description:
    "Compare Bengaluru's most popular localities — Whitefield, Sarjapur Road, Hebbal, Devanahalli, Koramangala, Indiranagar, HSR Layout and Electronic City — on price, yield and metro access.",
  alternates: { canonical: "/localities/" },
};

const columns: Column[] = [
  { key: "name", label: "Locality", sort: "text" },
  { key: "zone", label: "Zone" },
  { key: "price", label: "Avg. ₹ / sq ft", sort: "num", num: true },
  { key: "rent", label: "2 BHK rent / month", sort: "num", num: true },
  { key: "yield", label: "Rental yield", sort: "num", num: true },
  { key: "growth", label: "5-yr change", sort: "num", num: true },
  { key: "metro", label: "Metro" },
];

export default async function LocalitiesPage() {
  const localities = await getLocalities();
  const rows: Record<string, Cell>[] = localities.map((l) => ({
    name: { v: l.name, node: <Link href={`/localities/${l.slug}/`}>{l.name}</Link> },
    zone: { v: l.zone, node: l.zone },
    price: { v: l.price_mid, node: `₹${inrGroup(l.price_mid)}` },
    rent: { v: parseInt(l.rent_2bhk.split("–")[0].replace(/[₹,\s]/g, ""), 10), node: l.rent_2bhk },
    yield: { v: parseFloat(l.yield), node: l.yield },
    growth: { v: parseFloat(l.growth.replace(/[+%]/g, "")), node: l.growth },
    metro: { v: l.metro_short, node: l.metro_short },
  }));
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Crumbs items={[["Home", "/"], ["Locality guides", "/localities/"]]} />
          <div className="page-hero__grid">
            <div>
              <p className="eyebrow" style={{ marginTop: 28 }} data-reveal="">
                Locality guides · Q3 2026
              </p>
              <h1 className="h1" data-split="">
                <Split>
                  Bengaluru, <em>neighbourhood</em> by neighbourhood.
                </Split>
              </h1>
            </div>
            <div>
              <ClampText className="lead">
                Where should you buy? It depends on your commute, your school run and your time horizon. These guides give you the numbers and the honest trade-offs — the same briefing our advisors give clients.
              </ClampText>
            </div>
          </div>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="card-grid card-grid--3" data-stagger="" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))" }}>
            {localities.map((l) => (
              <LocalityCard key={l.slug} loc={l} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section--cool" aria-labelledby="cmp-title">
        <div className="container">
          <SectionHead
            id="cmp-title"
            eyebrow="Compare"
            title={
              <>
                The numbers, <em>side by side</em>.
              </>
            }
            lead="Select a column heading to sort. Figures are indicative averages from Propstep research and registration data; individual projects vary."
          />
          <SortableTable columns={columns} rows={rows} caption="Bengaluru localities compared by price, rent, yield, growth and metro access" />
          <p className="small muted" style={{ marginTop: 16 }}>
            Indicative only, not a valuation or an offer. Rental yield = annual rent ÷ purchase price, gross.
          </p>
        </div>
      </section>
    </>
  );
}
