import Link from "next/link";
import { ARTICLES } from "@/lib/articles";

/** The Propstep Times nameplate, shared by the news front page and each article */
export default function Masthead({ compact = false }: { compact?: boolean }) {
  const edition = new Date(ARTICLES[0].date + "T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const Title = compact ? "p" : "h1";
  return (
    <header className={`np-masthead${compact ? " np-masthead--compact" : ""}`}>
      <div className="np-masthead__top">
        <span>Vol. I</span>
        <span>Bengaluru · {edition}</span>
        <span>Free to read</span>
      </div>
      <Title className="np-masthead__name">
        <Link href="/news/">The Propstep Times</Link>
      </Title>
      {!compact && <p className="np-masthead__tag">Property news, guides &amp; market notes from your advisors</p>}
    </header>
  );
}
