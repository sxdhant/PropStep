"use client";

import Link from "next/link";
import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import HTMLFlipBook from "react-pageflip";
import { Photo } from "../primitives";
import { articleDate, type Article } from "@/lib/articles";

// react-pageflip needs real DOM nodes for its pages, so each page is a forwardRef div
const Page = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(function Page({ children, className }, ref) {
  return (
    <div className={`book__page${className ? ` ${className}` : ""}`} ref={ref}>
      {children}
    </div>
  );
});

/** The news articles as a page-turning book (swipe or tap the edges). */
function Book({ articles }: { articles: Article[] }) {
  // On wide screens the book opens as a two-page spread. A closed cover sits on the right half and the back cover on
  // the left, so the book slides sideways to stay centred (CSS, wide screens only).
  const shell = useRef<HTMLDivElement>(null);
  const last = articles.length + 1;
  const flip = useRef<{ pageFlip: () => { flip: (page: number) => void; flipNext: () => void } } | null>(null);
  const place = (i: number) => {
    // Set the class on the element directly: re-rendering the flipbook mid-turn makes the animation stutter
    shell.current?.classList.toggle("book--closed-front", i === 0);
    shell.current?.classList.toggle("book--closed-back", i === last);
  };
  return (
    <div className="book book--closed-front" ref={shell}>
      <HTMLFlipBook
        ref={flip}
        onFlip={(e: { data: number }) => place(e.data)}
        width={310}
        height={430}
        size="fixed"
        minWidth={310}
        maxWidth={310}
        minHeight={430}
        maxHeight={430}
        usePortrait
        showCover
        drawShadow
        maxShadowOpacity={0.4}
        mobileScrollSupport
        className="book__flip"
        style={{}}
        startPage={0}
        flippingTime={900}
        startZIndex={0}
        autoSize
        clickEventForward
        useMouseEvents
        swipeDistance={30}
        showPageCorners
        disableFlipByClick={false}
      >
        <Page className="book__page--cover book__page--front">
          <span className="book__spine" aria-hidden="true" />
          <div className="book__frame">
            <p className="book__kicker">News &amp; Blogs</p>
            <h3 className="book__cover-title">
              Read before <em>you buy</em>
            </h3>
            <span className="book__rule" aria-hidden="true" />
            <p className="book__author">
              <small>by</small> Propstep
            </p>
          </div>
        </Page>
        {articles.map((a) => (
          <Page key={a.slug}>
            <div className="book__photo">
              <Photo id={a.image.id} alt={a.image.alt} ratio={[3, 2]} sizes="90vw" fade={false} />
            </div>
            <div className="book__text">
              <p className="news-card__meta">
                <span className="tag">{a.category}</span> {articleDate(a.date)}
              </p>
              <h3 className="news-card__title">{a.title}</h3>
              <p className="news-card__text">{a.excerpt}</p>
              <Link className="news-card__more" href={`/news/${a.slug}/`}>
                Continue reading<span className="visually-hidden">: {a.title}</span> →
              </Link>
            </div>
          </Page>
        ))}
        <Page className="book__page--cover book__page--back">
          <div className="book__frame">
            <p className="book__kicker">The end of this volume</p>
            <h3 className="book__cover-title">
              More on <em>the blog</em>
            </h3>
            <span className="book__rule" aria-hidden="true" />
            <Link className="book__cta" href="/news/">
              All articles <span aria-hidden="true">→</span>
            </Link>
          </div>
          <button className="book__reset" type="button" onClick={() => flip.current?.pageFlip().flip(0)}>
            ↺ Back to the front
          </button>
        </Page>
      </HTMLFlipBook>
      <button className="book__close book__open" type="button" onClick={() => flip.current?.pageFlip().flipNext()}>
        Swipe to open →
      </button>
      <button className="book__close" type="button" onClick={() => flip.current?.pageFlip().flip(0)}>
        Close book
      </button>
    </div>
  );
}

/** The book on every screen: one page at a time on phones, a two-page spread on wide screens.
 *  react-pageflip needs the browser, so `fallback` (the scroll rail) shows until the page has loaded. */
export default function BookSlider({ articles, fallback }: { articles: Article[]; fallback: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? <Book articles={articles} /> : <>{fallback}</>;
}
