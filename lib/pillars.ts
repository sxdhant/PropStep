import type { PillarContent } from "./types";

/** The scrolling line of highlights under the home page stats, until it is edited in Site settings. */
export const DEFAULT_MARQUEE = [
  "Karnataka RERA-registered agent",
  "40-point legal due diligence",
  "Every listing visited in person",
  "12+ partner lenders",
  "Best Advisory in Bengaluru",
  "New launches and resale, side by side",
  "Chauffeured site visits",
];

/** The "What we do" cards on the home page, until they are edited in Site settings. */
export const DEFAULT_PILLARS: PillarContent[] = [
  {
    title: "Discover",
    sub: "Verified listings",
    tags: ["Apartments", "Villas", "Plots", "Farmlands", "Penthouses"],
    text: "Homes, land and offices from across the market — new launches and resale — listed only after our legal team has checked the title and an advisor has visited in person.",
    links: [{ label: "Browse properties", href: "/properties/" }, { label: "Book a site visit", href: "/contact-us/#visit" }],
    image: "1580587771525-78b9dba3b914",
    alt: "Modern villa with a pool and a pale stone facade",
  },
  {
    title: "Advise",
    sub: "Buy & sell",
    tags: ["New homes", "Resale", "Selling", "Home loans"],
    text: "Independent advice on new and resale homes in six cities: shortlists to your brief, prices benchmarked against actual registrations — not asking prices — and negotiation on your side.",
    links: [{ label: "Homes to buy", href: "/properties/", look: "accent" }, { label: "Sell with us", href: "/services/#sell", look: "light" }, { label: "Home loans", href: "/services/#loans", look: "light" }],
    image: "1560448204-e02f11c3d0e2",
    alt: "Bright living room with floor-to-ceiling windows",
  },
  {
    title: "Invest",
    sub: "Land, offices & NRI",
    tags: ["Plots & farmland", "Pre-leased offices", "NRI Desk"],
    text: "Title-clean plots and managed farmland, pre-leased offices, and an NRI Desk that handles everything from video walkthroughs to power of attorney.",
    links: [{ label: "NRI Desk", href: "/services/#nri", look: "accent" }],
    image: "1500382017468-9049fed747ef",
    alt: "Open grassland at sunset",
  },
];
