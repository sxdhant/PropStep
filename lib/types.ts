import type { IconName } from "@/components/Icon";

export type Photo = { id: string; alt: string };

export type Category = "luxury" | "premium" | "plots" | "commercial";
export type StatusKey = "launch" | "ongoing" | "ready" | "completed";

export type Plan = {
  name: string;
  type: string;
  layout: string;
  area: string;
  plot: string;
  price: string;
  rows: [string, string][];
};

export type Project = {
  slug: string;
  name: string;
  short: string;
  category: Category;
  segment: string;
  status: string;
  status_key: StatusKey;
  locality: string;
  zone: string;
  city: string;
  tagline: string;
  summary: string;
  description: string[];
  config: string;
  size: string;
  price_from: number;
  price_label: string;
  possession: string;
  /** Path to the floor-plan image in /public; the Floor plan section is left out when empty */
  floorplan?: string;
  land: string;
  units: string;
  open_space: string;
  rera: string;
  cover: Photo;
  gallery: Photo[];
  highlights: string[];
  amenities: { icon: IconName; label: string }[];
  plans: Plan[];
  location: { icon: IconName; place: string; time: string }[];
  payment: [string, number][];
};

export type Listing = {
  slug: string;
  title: string;
  intent: "buy" | "rent";
  type: string;
  /** The project's card details: who builds it, what it is called, the BHK sizes on offer, how many homes, and the size range */
  developer?: string;
  project?: string;
  configs?: number[];
  units?: number;
  area_min?: number;
  area_max?: number;
  bhk: number;
  city: string;
  locality: string;
  locality_slug: string;
  price: number;
  price_label: string;
  area: number;
  baths: number;
  floor?: string;
  age?: string;
  /** Optional facts: each is shown only when filled in */
  total_area?: string;
  towers?: number;
  structure?: string;
  /** Chosen in the admin for the home page sections "Hot selling" and "Handpicked" */
  hot_selling?: boolean;
  handpicked?: boolean;
  possession: string;
  /** Path to the floor-plan image in /public; the Floor plan section is left out when empty */
  floorplan?: string;
  /** The sizes on offer, each with its starting price: they fill the Price list and the Floor plans tabs */
  unit_types?: { bhk: number; area: number; price: number; floorplan?: string }[];
  amenities?: { icon: IconName; label: string }[];
  connectivity?: { icon: IconName; place: string; time: string }[];
  connecting_road?: string;
  /** RERA registration number(s); "Available on request" shows when empty */
  rera?: string;
  badge?: string;
  images: Photo[];
  summary: string;
  description: string;
  features: string[];
  advisor: string;
  posted: string;
};

export type Locality = {
  slug: string;
  name: string;
  zone: string;
  tagline: string;
  image: Photo;
  price_sqft: string;
  price_mid: number;
  rent_2bhk: string;
  yield: string;
  growth: string;
  metro: string;
  metro_short: string;
  trend: number[];
  overview: string[];
  best_for: string[];
  pros: string[];
  cons: string[];
  schools: string[];
  hospitals: string[];
  work: string[];
};

/** phone: the advisor's own line in international format (+91...); the site-wide number is used when it is empty */
export type Advisor = { name: string; role: string; languages: string; years: number; phone?: string };

/** One "What we do" card on the home page. look: "accent" (orange) or "light" (white) overrides a button's default style */
export type PillarContent = { title: string; sub: string; tags: string[]; text: string; image: string; alt: string; links: { label: string; href: string; look?: "accent" | "light" }[] };

export type Site = {
  name: string;
  legal_name: string;
  url: string;
  base_path: string;
  description: string;
  since: number;
  phone: string;
  phone_href: string;
  whatsapp: string;
  email: string;
  hours: string;
  form_endpoint: string;
  agent_rera: string;
  /** Head office. street/postcode feed the structured data; map_query (company name + address, so it finds the Google listing) places the map pin; maps opens directions */
  hq: { line1: string; line2: string; street: string; postcode: string; map_query: string; maps: string };
  social: { instagram: string; linkedin: string; youtube: string };
  stats: { value: number; decimals?: number; suffix: string; label: string; note: string }[];
  /** image: a photo of the city's best-known landmark, named in `landmark` */
  cities: { slug: string; name: string; role: string; desks: string; image: string; landmark: string }[];
  offices: { city: string; label: string; address: string; phone: string }[];
  /** Home page "What we do" cards; the built-in defaults are used until this is saved */
  pillars?: PillarContent[];
  advisors: Record<string, Advisor>;
  /** linkedin: the person's LinkedIn profile URL */
  /** photo: optional headshot path under /public (the initials show without it) */
  leadership: { name: string; role: string; bio: string; linkedin: string; photo?: string }[];
  values: { icon: IconName; title: string; text: string }[];
  milestones: { year: string; title: string; text: string }[];
  testimonials: { quote: string; name: string; meta: string }[];
  services: { slug: string; icon: IconName; title: string; short: string; points: string[]; image: string }[];
  process: { title: string; text: string }[];
  faqs: { q: string; a: string }[];
};
