import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/cards";
import { Crumbs, JsonLd, Photo, Split } from "@/components/primitives";
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
  const more = ARTICLES.filter((o) => o.slug !== a.slug).slice(0, 3);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          datePublished: a.date,
          image: photoUrl(a.image.id, 1200, [1200, 630], 75),
          mainEntityOfPage: `${SITE_URL}/news/${a.slug}/`,
        }}
      />
      <section className="page-hero">
        <div className="container">
          <Crumbs items={[["Home", "/"], ["News & blogs", "/news/"], [a.title, `/news/${a.slug}/`]]} />
          <p className="eyebrow" style={{ marginTop: 28 }} data-reveal="">
            {a.category} · {articleDate(a.date)} · {a.read}
          </p>
          <h1 className="h1" style={{ maxWidth: "22ch" }} data-split="">
            <Split>{a.title}</Split>
          </h1>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="article-cover">
            <Photo id={a.image.id} alt={a.image.alt} ratio={[16, 7]} sizes="(min-width: 1200px) 1200px, 100vw" eager />
          </div>
          <div className="article-body" style={{ marginTop: "clamp(24px,3vw,40px)" }}>
            {a.body.map((s, i) => (
              <div key={i}>
                {s.h && <h2>{s.h}</h2>}
                <div className="prose">
                  {s.p.map((t) => (
                    <p key={t.slice(0, 24)}>{t}</p>
                  ))}
                </div>
              </div>
            ))}
            <p style={{ marginTop: 40 }}>
              <Link className="btn" href="/contact-us/#visit">
                Talk to an advisor
              </Link>
            </p>
          </div>
        </div>
      </section>
      <section className="section section--paper">
        <div className="container">
          <h2 className="h2" style={{ marginBottom: 24 }}>
            More to read
          </h2>
          <div className="card-grid card-grid--3">
            {more.map((o) => (
              <ArticleCard key={o.slug} a={o} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
