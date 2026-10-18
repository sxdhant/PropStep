import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Manrope } from "next/font/google";
import Script from "next/script";
import MotionRoot from "@/components/MotionRoot";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { JsonLd } from "@/components/primitives";
import { getSite, SITE_URL } from "@/lib/data";
import { photoUrl } from "@/lib/img";
import { splashBoot } from "@/lib/splash";
import { themeBoot } from "@/lib/theme";
import "./globals.css";

const GA_ID = "G-7LR3HPHXQJ";

//font
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", variable: "--font-instrument", display: "swap" });


export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
  metadataBase: new URL(SITE_URL),
  title: { default: `${site.name} — Property advisory & verified listings in Bengaluru`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    images: [photoUrl("1600585154340-be6161a56a0c", 1200, [1200, 630], 75)],
  },
  twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

// Marks the document as JS-enabled before first paint (reveal styles apply only under .js);
// if the app never hydrates, content is revealed after 3.5 s.
const bootScript =
  "document.documentElement.classList.add('js');setTimeout(function(){if(!window.__ps)document.documentElement.classList.remove('js')},3500)";

const orgData = (site: Awaited<ReturnType<typeof getSite>>) => ({
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: site.name,
  legalName: site.legal_name,
  url: SITE_URL,
  logo: `${SITE_URL}/logo-mark.svg`,
  telephone: site.phone,
  email: site.email,
  foundingDate: String(site.since),
  address: {
    "@type": "PostalAddress",
    streetAddress: site.hq.street,
    addressLocality: "Bengaluru",
    addressRegion: "Karnataka",
    postalCode: site.hq.postcode,
    addressCountry: "IN",
  },
  areaServed: site.cities.map((c) => c.name),
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const site = await getSite();
  const org = orgData(site);
  return (
    <html lang="en-IN" className={`${manrope.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="google-tag" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <script dangerouslySetInnerHTML={{ __html: `${bootScript};${themeBoot};${splashBoot}` }} />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body>
        <SiteHeader name={site.name} phone={site.phone} phoneHref={site.phone_href} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <MotionRoot />
        <JsonLd data={org} />
      </body>
    </html>
  );
}
