import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Icon from "@/components/Icon";
import { StatsBlock } from "@/components/blocks";
import { Crumbs, Photo, SectionHead, Split } from "@/components/primitives";
import { LeaderCard } from "@/components/widgets";
import { getSite } from "@/lib/data";
import ClampText from "@/components/ClampText";

export const metadata: Metadata = {
  title: "About Propstep — property advisory & consulting since 2026",
  description: "Propstep has advised property buyers since 2026: verified listings from across the market and an advisor at every step. Meet the team, our values and our story.",
  alternates: { canonical: "/about-us/" },
};

export default async function AboutPage() {
  const site = await getSite();
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Crumbs items={[["Home", "/"], ["About Us", "/about-us/"]]} />
          <div className="page-hero__grid">
            <div>
              <p className="eyebrow" style={{ marginTop: 28 }} data-reveal="">
                About Propstep
              </p>
              <h1 className="h1" data-split="">
                <Split>
                  We started as advisors. We’re <em>still</em> advisors.
                </Split>
              </h1>
            </div>
            <div>
              <ClampText className="lead">
                For fifteen years we’ve sat on the buyer’s side of the table: finding properties from across the market, checking every one, and staying with our clients from the first shortlist to the day they get the keys.
              </ClampText>
            </div>
          </div>
        </div>
      </section>

      <section aria-hidden="true">
        <div className="container">
          <div className="media" style={{ aspectRatio: "21/9" }} data-reveal="clip">
            <Photo id="1600607688969-a5bfcd646154" ratio={[21, 9]} sizes="100vw" />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="story-title">
        <div className="container overview">
          <div>
            <p className="eyebrow" data-reveal="">
              Our story
            </p>
            <h2 className="h2" id="story-title" style={{ marginTop: 18 }} data-split="">
              <Split>
                Always on the <em>buyer’s</em> side of the table.
              </Split>
            </h2>
          </div>
          <div className="prose" data-reveal="">
            <p>
              Propstep began in 2011 as a single advisory desk in Indiranagar, helping Bengaluru’s first generation of tech homebuyers make sense of a market with few rules and fewer guarantees. We checked titles no one else checked, and we told clients when to walk away.
            </p>
            <p>
              As the city grew, so did the questions. In 2014 we brought legal checks in-house, so every title, approval and khata is read by our own team before a client signs — and in 2017 we opened an NRI Desk for buyers who can’t be here in person.
            </p>
            <p>
              Today Propstep lists verified homes, land and offices from across the market and advises clients in six cities. We don’t build and we don’t sell stock of our own, so our only job is finding the right property for you — and seeing you through to the keys.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <StatsBlock />
        </div>
      </section>

      <section className="section" aria-labelledby="val-title">
        <div className="container">
          <SectionHead
            id="val-title"
            eyebrow="What we stand for"
            title={
              <>
                Four promises we <em>put in writing</em>.
              </>
            }
          />
          <div className="values" data-stagger="">
            {site.values.map((v) => (
              <div className="value" data-reveal="" key={v.title}>
                <Icon name={v.icon} />
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="ppl-title">
        <div className="container">
          <SectionHead
            id="ppl-title"
            eyebrow="Leadership"
            title={
              <>
                The people <em>accountable</em>.
              </>
            }
          />
          <div className="people" data-stagger="" style={{ "--n": site.leadership.length } as CSSProperties}>
            {site.leadership.map((p) => (
              <LeaderCard key={p.name} {...p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
