import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="nf">
      <div>
        <p className="code" aria-hidden="true">
          404
        </p>
        <h1 className="h2" style={{ marginTop: 12 }}>
          This address doesn’t exist — <em>yet</em>.
        </h1>
        <p className="lead" style={{ margin: "18px auto 28px" }}>
          The page may have moved, or the listing may have been sold.
        </p>
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <Link className="btn" href="/">
            Back to home
          </Link>
          <Link className="btn btn--outline" href="/properties/">
            Browse properties
          </Link>
        </div>
      </div>
    </section>
  );
}
