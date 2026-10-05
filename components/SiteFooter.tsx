import Link from "next/link";
import Icon from "./Icon";
import { Brand } from "./primitives";
import { NewsletterForm } from "./forms";
import { ActionBar } from "./widgets";
import { site } from "@/lib/content";
import { waLink } from "@/lib/format";

export default function SiteFooter() {
  const wa = waLink(site.whatsapp, "Hi Propstep, I'd like to know more.");
  const phone = { href: site.phone_href, label: site.phone };
  return (
    <>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-cta">
            <div>
              <p className="eyebrow eyebrow--light">Talk to an advisor</p>
              <h2 style={{ marginTop: 18 }}>
                Let’s find your <em style={{ color: "var(--blue-300)" }}>next</em> address.
              </h2>
            </div>
            <div className="btn-row">
              <Link className="btn btn--light" href="/contact-us/#visit">
                Book a site visit <Icon name="arrow-right" className="icon--arrow" />
              </Link>
              <a className="btn btn--ghost-light" href={wa} target="_blank" rel="noopener">
                <Icon name="chat" /> WhatsApp us
              </a>
            </div>
          </div>
          <div className="footer-grid">
            <div>
              <Brand name={site.name} />
              <p style={{ marginTop: 18, maxWidth: "40ch" }}>{site.description}</p>
              <div>
                <NewsletterForm phone={phone} />
              </div>
              <div className="socials">
                <a className="icon-btn icon-btn--dark" href={site.social.instagram} target="_blank" rel="noopener" aria-label="Propstep on Instagram">
                  <Icon name="instagram" />
                </a>
                <a className="icon-btn icon-btn--dark" href={site.social.linkedin} target="_blank" rel="noopener" aria-label="Propstep on LinkedIn">
                  <Icon name="linkedin" />
                </a>
                <a className="icon-btn icon-btn--dark" href={site.social.youtube} target="_blank" rel="noopener" aria-label="Propstep on YouTube">
                  <Icon name="youtube" />
                </a>
              </div>
            </div>
            <div>
              <h3>Explore</h3>
              <ul className="footer-links" role="list">
                <li><Link href="/properties/">Homes to buy</Link></li>
                <li><Link href="/localities/">Bengaluru locality guides</Link></li>
                <li><Link href="/services/#nri-desk">NRI Desk</Link></li>
                <li><Link href="/services/#sell">Sell your property</Link></li>
              </ul>
            </div>
            <div>
              <h3>Company</h3>
              <ul className="footer-links" role="list">
                <li><Link href="/about-us/">About Us</Link></li>
                <li><Link href="/services/">Services</Link></li>
                <li><Link href="/contact-us/">Contact Us</Link></li>
                <li><a href={`tel:${site.phone_href}`}>{site.phone}</a></li>
                <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-legal">
            <p>
              © {new Date().getFullYear()} {site.legal_name}. Karnataka RERA agent registration {site.agent_rera}. Every new project we list is registered with Karnataka RERA — registration numbers can be verified at{" "}
              <a href="https://rera.karnataka.gov.in/" target="_blank" rel="noopener">
                rera.karnataka.gov.in
              </a>
              . Images are representative. Prices, specifications and availability are indicative and subject to change; nothing on this site is an offer or a contract.
            </p>
            <p>
              <Link href="/privacy/">Privacy</Link> · <a href="/sitemap.xml">Sitemap</a>
            </p>
          </div>
        </div>
      </footer>
      <ActionBar phoneHref={site.phone_href} wa={wa} />
    </>
  );
}
