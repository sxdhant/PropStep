import type { Metadata } from "next";
import Icon from "@/components/Icon";
import { Checklist, ContactLines, NoFooterCta } from "@/components/blocks";
import { EnquiryForm, VisitForm } from "@/components/forms";
import { Crumbs, Split } from "@/components/primitives";
import { getSite, getPhoneProps, getVisitOptions } from "@/lib/data";
import ClampText from "@/components/ClampText";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
  title: "Contact Propstep — book a site visit or talk to an advisor",
  description: `Call ${site.phone}, WhatsApp or email Propstep. Book a site visit to a listed property or talk to an advisor in Bengaluru, Mumbai, Pune, Hyderabad, Chennai or Delhi NCR.`,
  alternates: { canonical: "/contact-us/" },
  };
}

export default async function ContactPage() {
  const site = await getSite();
  const [phoneProps, visitPropertyOptions] = await Promise.all([getPhoneProps(), getVisitOptions()]);
  return (
    <>
      <NoFooterCta />
      <section className="page-hero">
        <div className="container">
          <Crumbs items={[["Home", "/"], ["Contact Us", "/contact-us/"]]} />
          <div className="page-hero__grid">
            <div>
              <p className="eyebrow" style={{ marginTop: 28 }} data-reveal="">
                Contact
              </p>
              <h1 className="h1" data-split="">
                <Split>
                  Start with a <em>conversation</em>.
                </Split>
              </h1>
            </div>
            <div>
              <ClampText className="lead">
                Whether you’re buying, selling or just thinking about it — tell us a little about what you need, and the right advisor will get back to you within two working hours.
              </ClampText>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-label="Enquiry">
        <div className="container">
          <div className="cta cta--plain">
            <div className="form-card" data-reveal="">
              <EnquiryForm prefix="ct" phone={phoneProps} title="Send us a message" />
            </div>
            <div>
              <div data-reveal="">
                <ContactLines />
              </div>
              <div className="panel panel--cool" style={{ marginTop: 20 }} data-reveal="">
                <p className="eyebrow">Head office</p>
                <p className="small" style={{ marginTop: 12, fontWeight: 700 }}>
                  {site.legal_name}
                </p>
                <p className="h4" style={{ marginTop: 6 }}>
                  {site.hq.line1}
                  <br />
                  {site.hq.line2}
                </p>
                <p className="small muted" style={{ marginTop: 8 }}>
                  {site.hours}
                </p>
                <a className="link" style={{ marginTop: 14 }} href={site.hq.maps} target="_blank" rel="noopener">
                  Get directions <Icon name="arrow-up-right" className="icon--sm" />
                </a>
              </div>
              <div style={{ marginTop: 20 }}>
                <div className="map-embed" data-reveal="scale">
                  <iframe
                    title={`Map: ${site.legal_name}, ${site.hq.line1}, ${site.hq.line2}`}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(site.hq.map_query)}&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--cool" id="visit" aria-labelledby="sv-title">
        <div className="container">
          <div className="cta cta--plain">
            <div>
              <p className="eyebrow" data-reveal="">
                Site visits
              </p>
              <h2 className="h2" id="sv-title" style={{ marginTop: 18 }} data-split="">
                <Split>
                  Book a <em>private</em> site visit.
                </Split>
              </h2>
              <ClampText className="lead" style={{ marginTop: 18 }}>
                Choose a property, a day and a time. We’ll confirm within two working hours and send a car to pick you up anywhere in Bengaluru — or set up a live video walkthrough if you’re overseas.
              </ClampText>
              <Checklist
                style={{ marginTop: 28 }}
                items={[
                  "Free chauffeured pickup and drop within Bengaluru",
                  "Your advisor walks every visit with you",
                  "Live video tours timed for Gulf, Asia, Europe and US time zones",
                ]}
              />
            </div>
            <div className="form-card" data-reveal="">
              <VisitForm prefix="ct-visit" phone={phoneProps} properties={visitPropertyOptions} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
