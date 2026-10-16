import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/cards";
import Masthead from "@/components/Masthead";
import { ARTICLES, articleDate } from "@/lib/articles";

export const metadata: Metadata = {
  title: "The Propstep Times — news & blogs",
  description: "Guides and updates from Propstep advisors: resale paperwork, choosing a locality, NRI purchases and home loans.",
  alternates: { canonical: "/news/" },
};

export default function NewsPage() {
  const [lead, ...rest] = ARTICLES;
  const latest = rest.slice(0, 3);
  const more = rest.slice(3);
  return (
    <div className="np">
      <div className="container">
        <Masthead />

        <section className="np-front" aria-label="Top stories">
          <div className="np-front__lead">
            <ArticleCard a={lead} lead />
          </div>
          <aside className="np-front__side" aria-label="Latest">
            <h2 className="np-section-title">Latest</h2>
            {latest.map((a) => (
              <article className="np-brief" key={a.slug}>
                <p className="np-story__kicker">{a.category}</p>
                <h3 className="np-brief__title">
                  <Link href={`/news/${a.slug}/`}>{a.title}</Link>
                </h3>
                <p className="np-story__by">
                  {articleDate(a.date)} · {a.read}
                </p>
              </article>
            ))}
          </aside>
        </section>

        <section aria-label="More stories">
          <h2 className="np-section-title np-section-title--wide">More stories</h2>
          <div className="np-columns">
            {more.map((a) => (
              <ArticleCard key={a.slug} a={a} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
