import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Faq, NriBand, Process } from "@/components/blocks";
import { Crumbs, JsonLd, SectionHead, Split } from "@/components/primitives";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Property advisory services — buy, sell, NRI, plots & commercial",
  description:
    "Buy and sell with Propstep Advisory: verified listings, a 40-point legal check, home-loan comparison and a dedicated NRI Desk across six Indian cities.",
  alternates: { canonical: "/services/" },
};

const contactType = (slug: string) =>
  ["buy", "loans", "legal"].includes(slug) ? "buy" : ["sell", "nri", "commercial"].includes(slug) ? slug : "other";

const FEES: [string, string][] = [
  ["New launches", "No fee to buyers"],
  ["Resale purchase", "1% of value + GST"],
  ["Selling your property", "2% of value + GST"],
  ["Commercial leasing", "Agreed in writing upfront"],
  ["Legal due diligence only", "Fixed fee from ₹25,000"],
];

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: site.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <section className="page-hero">
        <div className="container">
          <Crumbs items={[["Home", "/"], ["Services", "/services/"]]} />
          <div className="page-hero__grid">
            <div>
              <p className="eyebrow" style={{ marginTop: 28 }} data-reveal="">
                Propstep Advisory
              </p>
              <h1 className="h1" data-split="">
                <Split>
                  Advice for every <em>step</em> — before, during and after.
                </Split>
              </h1>
            </div>
            <div>
              <p className="lead" data-reveal="">
                Ninety advisors, an in-house legal team and a loans desk, working across six cities. We’re paid on client satisfaction as well as transactions, so sometimes our advice is to wait.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-label="Services">
        <div className="container">
          <div className="svc-grid" data-stagger="">
            {site.services.map((s) => (
              <article className="svc" id={s.slug} data-reveal="" key={s.slug}>
                <span className="icon-wrap">
                  <Icon name={s.icon} />
                </span>
                <h3>{s.title}</h3>
                <p>{s.short}</p>
                <ul className="bullets" role="list">
                  {s.points.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <Link className="link" style={{ marginTop: 12 }} href={`/contact-us/?type=${contactType(s.slug)}`}>
                  Talk to us <Icon name="arrow-right" className="icon--sm" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cool" aria-labelledby="how-title">
        <div className="container">
          <SectionHead
            id="how-title"
            eyebrow="How it works"
            title={
              <>
                Four steps. <em>No</em> surprises.
              </>
            }
          />
          <Process />
        </div>
      </section>

      <section className="section" aria-label="NRI Desk">
        <div className="container">
          <NriBand />
        </div>
      </section>

      <section className="section section--paper" aria-labelledby="fee-title">
        <div className="container pay">
          <div>
            <SectionHead
              id="fee-title"
              eyebrow="Transparent fees"
              title={
                <>
                  What it <em>costs</em>, in writing.
                </>
              }
              lead="Our fee is agreed and signed before we start, and it never depends on which developer you choose."
            />
          </div>
          <div className="panel" data-reveal="">
            <table className="plan-table">
              <tbody>
                {FEES.map(([a, b]) => (
                  <tr key={a}>
                    <th scope="row">{a}</th>
                    <td>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 16 }}>
              GST at 18% applies to advisory fees. Stamp duty and registration charges are payable to the government.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-title">
        <div className="container container--narrow">
          <SectionHead
            id="faq-title"
            eyebrow="Questions"
            title={
              <>
                Frequently <em>asked</em>
              </>
            }
          />
          <Faq items={site.faqs} />
        </div>
      </section>
    </>
  );
}
