import { z } from "zod";
import { ICON_NAMES } from "@/components/Icon";
import { BADGE_TONES } from "@/lib/budgets";
import { inrShort } from "@/lib/format";
import { optText, photo, reqText, slugSchema } from "./common";

const icon = z.enum(ICON_NAMES as [string, ...string[]], { message: "Unknown icon name" });
const optInt = z.number().int().positive().nullish().transform((v) => v ?? undefined);
const lines = (max: number, n: number) => z.array(reqText("Item", max)).max(n);

/* ---------- listings ---------- */
export const listingInput = z
  .object({
    slug: slugSchema,
    title: reqText("Title", 140),
    intent: z.enum(["buy", "rent"]).default("buy"),
    type: reqText("Type", 40),
    developer: optText(100),
    developerLogo: optText(500),
    project: optText(100),
    city: reqText("City", 60),
    locality: reqText("Locality", 80),
    localitySlug: z.union([slugSchema, z.literal("")]).optional(),
    price: z.number().int().positive().max(10_000_000_000).optional(),
    priceLabel: optText(40),
    possession: optText(80),
    rera: optText(300),
    badge: optText(40),
    advisorKey: reqText("Advisor", 40),
    postedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
    units: optInt,
    pricePerSqft: optInt,
    mapUrl: optText(2000),
    totalArea: optText(60),
    towers: optInt,
    structure: optText(80),
    hotSelling: z.boolean().default(false),
    handpicked: z.boolean().default(false),
    configs: z.array(z.number().int().min(0).max(20)).max(10).optional(),
    areaMin: optInt,
    areaMax: optInt,
    unitTypes: z
      .array(
        z
          .object({
            // Free text, e.g. "3 BHK Apartment" or "4 BHK Villa + study". Old rows without it fall back to "<bhk> BHK".
            label: optText(80),
            bhk: z.number().int().min(0).max(20).optional(),
            area: z.number().int().positive(),
            price: z.number().int().positive().optional(),
            // Price per sq ft: with it, the price is worked out as size x rate
            psf: z.number().positive().max(10_000_000).optional(),
            floorplan: optText(500),
          })
          .superRefine((u, ctx) => {
            if (!u.label && u.bhk == null) ctx.addIssue({ code: "custom", path: ["label"], message: "Describe the unit type, e.g. 3 BHK Apartment" });
            if (!u.price && !u.psf) ctx.addIssue({ code: "custom", path: ["price"], message: "Enter the price or the price per sq ft" });
          })
          .transform((u) => {
            const label = u.label || `${u.bhk} BHK`;
            return { ...u, label, bhk: u.bhk ?? (parseInt(label.match(/\d+/)?.[0] ?? "0", 10) || 0), price: u.price ?? Math.round(u.psf! * u.area) };
          }),
      )
      .max(20)
      .optional(),
    floorplan: optText(500),
    connectingRoad: optText(160),
    summary: reqText("Summary", 400),
    description: reqText("Description", 6000),
    features: lines(200, 30),
    // "Worth knowing" shown under Configuration
    notes: lines(600, 20).optional(),
    amenities: z.array(z.object({ icon, label: reqText("Amenity", 80) })).max(40).optional(),
    connectivity: z.array(z.object({ icon, place: reqText("Place", 100), time: reqText("Time", 40) })).max(30).optional(),
    images: z.array(photo).max(10, "You can add up to 10 photos"),
    status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  })
  .superRefine((v, ctx) => {
    if (v.areaMin && v.areaMax && v.areaMin > v.areaMax) ctx.addIssue({ code: "custom", path: ["areaMin"], message: "Smallest size can't exceed the largest" });
    if (v.status === "PUBLISHED" && v.images.length === 0) ctx.addIssue({ code: "custom", path: ["images"], message: "Add at least one photo before publishing" });
  })
  .transform((v) => {
    // Price and size are optional: 0 means "not given" (the site then hides them)
    const price = v.price ?? (v.unitTypes?.length ? Math.min(...v.unitTypes.map((u) => u.price)) : 0);
    // bhk and area are derived (they stay as database columns for search): from the BHK options and the smallest size
    const bhks = v.configs?.length ? v.configs : (v.unitTypes ?? []).map((u) => u.bhk);
    const area = v.areaMin ?? (v.unitTypes?.length ? Math.min(...v.unitTypes.map((u) => u.area)) : 0);
    return { ...v, price, priceLabel: v.priceLabel || (price ? inrShort(price) : ""), bhk: bhks.length ? Math.min(...bhks) : 0, baths: 0, area };
  });
export type ListingInput = z.output<typeof listingInput>;

/* ---------- localities & areas ---------- */
const strList = lines(400, 30);
export const localityInput = z.object({
  slug: slugSchema,
  name: reqText("Name", 80),
  zone: reqText("Zone", 40),
  tagline: reqText("Tagline", 200),
  image: photo,
  priceSqft: reqText("Price per sq ft", 60),
  priceMid: z.number().int().positive().max(10_000_000),
  rent2bhk: reqText("2 BHK rent", 60),
  yield: reqText("Yield", 20),
  growth: reqText("Growth", 20),
  metro: reqText("Metro", 300),
  metroShort: reqText("Metro (short)", 60),
  trend: z.array(z.number().positive()).min(2).max(12),
  overview: strList,
  bestFor: strList,
  pros: strList,
  cons: strList,
  schools: strList,
  hospitals: strList,
  work: strList,
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});
export const areaInput = z.object({ name: reqText("Name", 80), zone: reqText("Zone", 40), city: reqText("City", 60).default("Bengaluru") });

/* ---------- advisors, testimonials, FAQs ---------- */
export const advisorInput = z.object({
  key: z.string().regex(/^[a-z0-9]{2,30}$/, "2-30 lowercase letters or numbers"),
  name: reqText("Name", 80),
  role: reqText("Role", 80),
  languages: reqText("Languages", 120),
  years: z.number().int().min(0).max(60),
  // Optional direct line, used by the Call and WhatsApp buttons on this advisor's listings. Spaces and dashes are ignored.
  phone: z
    .string()
    .optional()
    .transform((v) => (v ?? "").replace(/[\s-]/g, ""))
    .refine((v) => v === "" || /^\+[1-9]\d{7,14}$/.test(v), "Phone: use international format, e.g. +919187103101")
    .transform((v) => v || null),
});
export const testimonialsInput = z.array(z.object({ quote: reqText("Quote", 600), name: reqText("Name", 80), meta: reqText("Detail", 120) })).max(30);
export const faqsInput = z.array(z.object({ q: reqText("Question", 300), a: reqText("Answer", 2000) })).max(60);

/* ---------- site settings (one validator per block) ---------- */
const url = z.string().url().max(300).refine((u) => /^https:\/\//.test(u), "Use an https link");
const sPhone = z.string().regex(/^\+?[0-9 ()-]{8,20}$/, "Enter a valid phone number");
export const SETTINGS = {
  name: reqText("Name", 80),
  legal_name: reqText("Legal name", 160),
  description: reqText("Description", 500),
  since: z.number().int().min(1900).max(2100),
  phone: sPhone,
  phone_href: z.string().regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +919187103101"),
  whatsapp: z.string().regex(/^[1-9]\d{9,14}$/, "Digits only with country code, e.g. 919187103101"),
  email: z.string().email().max(254),
  hours: reqText("Hours", 120),
  agent_rera: reqText("RERA registration", 80),
  hq: z.object({ line1: reqText("Line 1", 160), line2: reqText("Line 2", 160), street: reqText("Street", 160), postcode: z.string().regex(/^\d{6}$/, "6-digit postcode"), map_query: reqText("Map query", 300), maps: url }),
  social: z.object({ instagram: url, linkedin: url, youtube: url }),
  stats: z.array(z.object({ value: z.number().nonnegative(), decimals: z.number().int().min(0).max(3).optional(), suffix: z.string().max(10), label: reqText("Label", 60), note: z.string().max(160) })).max(8),
  cities: z.array(z.object({ slug: slugSchema, name: reqText("Name", 60), role: reqText("Role", 100), desks: reqText("Desks", 100), image: reqText("Image", 500), landmark: reqText("Landmark", 100) })).max(20),
  offices: z.array(z.object({ city: reqText("City", 60), label: reqText("Label", 60), address: reqText("Address", 300), phone: sPhone })).max(20),
  leadership: z.array(z.object({ name: reqText("Name", 80), role: reqText("Role", 80), bio: reqText("Bio", 1200), linkedin: url, photo: optText(500) })).max(30),
  values: z.array(z.object({ icon, title: reqText("Title", 80), text: reqText("Text", 400) })).max(12),
  milestones: z.array(z.object({ year: reqText("Year", 10), title: reqText("Title", 100), text: reqText("Text", 400) })).max(20),
  services: z.array(z.object({ slug: slugSchema, icon, title: reqText("Title", 100), short: reqText("Summary", 400), points: lines(200, 12), image: reqText("Image", 500) })).max(20),
  badges: z
    .array(z.object({ name: reqText("Name", 30), icon: z.union([icon, z.literal("")]).optional(), tone: z.enum(BADGE_TONES) }))
    .min(1, "Keep at least one badge")
    .max(20),
  marquee: z.array(reqText("Text", 80)).min(1, "Keep at least one line").max(20),
  pillars: z
    .array(
      z.object({
        title: reqText("Title", 60),
        sub: reqText("Subtitle", 60),
        text: reqText("Description", 500),
        tags: lines(40, 10),
        image: reqText("Photo", 500),
        alt: reqText("Photo description", 200),
        links: z.array(z.object({ label: reqText("Button label", 40), href: reqText("Button link", 200), look: z.enum(["accent", "light"]).optional() })).max(3),
      }),
    )
    .min(1, "Keep at least one card")
    .max(6),
  process: z.array(z.object({ title: reqText("Title", 80), text: reqText("Text", 400) })).max(10),
} as const;
export type SettingKey = keyof typeof SETTINGS;
export const isSettingKey = (k: string): k is SettingKey => k in SETTINGS;

/* ---------- users, leads, auth ---------- */
export const password = z.string().min(12, "Use at least 12 characters").max(128);
export const userCreate = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: optText(80),
  role: z.enum(["ADMIN", "EDITOR"]),
  password,
});
export const userUpdate = z.object({ name: optText(80), role: z.enum(["ADMIN", "EDITOR"]).optional(), active: z.boolean().optional(), password: password.optional() });
export const loginInput = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(128) });
export const changePasswordInput = z.object({ current: z.string().min(1).max(128), next: password });
export const leadUpdate = z.object({ status: z.enum(["NEW", "CONTACTED", "CLOSED"]) });
export const visitUpdate = z.object({ status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]) });
