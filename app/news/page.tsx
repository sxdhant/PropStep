import type { Metadata } from "next";
import { ArticleCard } from "@/components/cards";
import { Crumbs, Split } from "@/components/primitives";
import { ARTICLES } from "@/lib/articles";

export const metadata: Metadata = {
  title: "News & blogs — property guides and market updates",
  description: "Guides and updates from Propstep advisors: resale paperwork, choosing a locality, NRI purchases and home loans.",
  alternates: { canonical: "/news/" },
};

export default function NewsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Crumbs items={[["Home", "/"], ["News & blogs", "/news/"]]} />
          <p className="eyebrow" style={{ marginTop: 28 }} data-reveal="">
            News &amp; blogs
          </p>
          <h1 className="h1" data-split="">
            <Split>
              Read before you <em>buy</em>.
            </Split>
          </h1>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="card-grid card-grid--3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))" }}>
            {ARTICLES.map((a) => (
              <ArticleCard key={a.slug} a={a} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
