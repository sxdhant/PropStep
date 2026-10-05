import type { Metadata } from "next";
import { Crumbs } from "@/components/primitives";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Propstep collects and uses personal data.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container container--narrow">
          <Crumbs items={[["Home", "/"], ["Privacy", "/privacy/"]]} />
          <p className="eyebrow" style={{ marginTop: 28 }}>
            Legal
          </p>
          <h1 className="h1">Privacy policy</h1>
          <p className="lead" style={{ marginTop: 18 }}>
            How {site.legal_name} collects and uses your personal data. Last updated September 2026.
          </p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container container--narrow prose">
          <p>
            <strong>This is placeholder text.</strong> Replace it with a policy reviewed by your legal counsel for compliance with the Digital Personal Data Protection Act, 2023 and applicable rules.
          </p>
          <h2 className="h3" style={{ margin: "40px 0 12px" }}>What we collect</h2>
          <p>When you submit a form on this site we collect the details you provide — typically your name, mobile number, email address and information about the property you’re interested in.</p>
          <h2 className="h3" style={{ margin: "40px 0 12px" }}>How we use it</h2>
          <p>We use your details only to respond to your enquiry, arrange site visits and, if you agree, send you relevant property updates. We do not sell your data.</p>
          <h2 className="h3" style={{ margin: "40px 0 12px" }}>Your choices</h2>
          <p>You can ask us to access, correct or erase your data, or withdraw consent, at any time by writing to {site.email}.</p>
          <h2 className="h3" style={{ margin: "40px 0 12px" }}>Contact</h2>
          <p>
            Grievance officer: {site.legal_name}, {site.hq.line1}, {site.hq.line2}. Email {site.email}.
          </p>
        </div>
      </section>
    </>
  );
}
