import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleAllCard, ArticleCard } from "@/components/cards";
import Masthead from "@/components/Masthead";
import { JsonLd, Photo } from "@/components/primitives";
import { Rail } from "@/components/widgets";
import { ARTICLES, articleDate, getArticle } from "@/lib/articles";
import { SITE_URL } from "@/lib/data";
import { photoUrl } from "@/lib/img";

export const generateStaticParams = () => ARTICLES.map((a) => ({ slug: a.slug }));

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const a = getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/news/${a.slug}/` },
    openGraph: { type: "article", images: [photoUrl(a.image.id, 1200, [1200, 630], 75)] },
  };
}

export default async function ArticlePage({ params }: Params) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  const more = ARTICLES.filter((o) => o.slug !== a.slug).slice(0, 5);
  return (
    <div className="np">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          datePublished: a.date,
          author: { "@type": "Organization", name: "Propstep" },
          image: photoUrl(a.image.id, 1200, [1200, 630], 75),
          mainEntityOfPage: `${SITE_URL}/news/${a.slug}/`,
        }}
      />
      <div className="container">
        <Masthead compact />
        <article className="np-article">
          <p className="np-story__kicker">{a.category}</p>
          <h1 className="np-article__title">{a.title}</h1>
          <p className="np-article__standfirst">{a.excerpt}</p>
          <p className="np-story__by np-article__by">
            By <strong>Propstep Desk</strong> · {articleDate(a.date)} · {a.read}
          </p>
          <figure className="np-article__figure">
            <div className="np-article__cover">
              <Photo id={a.image.id} alt={a.image.alt} ratio={[16, 8]} sizes="(min-width: 1200px) 1200px, 100vw" eager fade={false} />
            </div>
            <figcaption>{a.image.alt}</figcaption>
          </figure>
          <div className="np-article__body">
            {a.body.map((s, i) => (
              <section key={i}>
                {s.h && <h2>{s.h}</h2>}
                {s.p.map((t) => (
                  <p key={t.slice(0, 24)}>{t}</p>
                ))}
              </section>
            ))}
          </div>
          <p className="np-article__end">
            <Link className="np-story__more" href="/contact-us/#visit">
              Talk to an advisor
            </Link>
          </p>
        </article>
      </div>

      <section className="np-more" aria-labelledby="more-title">
        <div className="container">
          <h2 className="np-section-title np-section-title--wide" id="more-title">
            More to read
          </h2>
        </div>
        <Rail label="More articles" className="rail-wrap--np">
          {more.map((o) => (
            <ArticleCard key={o.slug} a={o} />
          ))}
          <ArticleAllCard count={ARTICLES.length} />
        </Rail>
      </section>
    </div>
  );
}
