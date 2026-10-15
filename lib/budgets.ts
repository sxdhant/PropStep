/** Budget ranges in rupees, "min-max" (max empty = no upper limit). */
export const BUDGETS = [
  ["", "Any budget"],
  ["0-10000000", "Under ₹1 Cr"],
  ["10000000-20000000", "₹1 – 2 Cr"],
  ["20000000-50000000", "₹2 – 5 Cr"],
  ["50000000-100000000", "₹5 – 10 Cr"],
  ["100000000-", "₹10 Cr +"],
] as const;

/** Listing types the property search filters by (the hero search and /properties/) */
export const PROPERTY_TYPES = ["Apartment", "Independent house", "Villa", "Penthouse", "Studio apartment", "Plot", "Farmland", "Office"];

/** Badges a listing can carry (several at once); stored comma-separated in `badge` */
/** A badge the admin can put on a listing. tone: blue (trust), accent (orange highlight) or plain (neutral). Editable in Site settings. */
export type BadgeDef = { name: string; icon?: string; tone: "blue" | "accent" | "plain" };
export const DEFAULT_BADGES: BadgeDef[] = [
  { name: "Verified", icon: "verified", tone: "blue" },
  { name: "Exclusive", icon: "trophy", tone: "accent" },
  { name: "New", icon: "sparkles", tone: "accent" },
  { name: "Launching soon", icon: "clock", tone: "accent" },
  { name: "Price reduced", icon: "percent", tone: "accent" },
];
/** A listing's badge names -> how each is drawn, using the saved badge list (a name not in it shows as plain text) */
export const resolveBadges = (badge: string | null | undefined, defs: BadgeDef[] = DEFAULT_BADGES): BadgeDef[] =>
  badgeList(badge).map((name) => defs.find((d) => d.name.toLowerCase() === name.toLowerCase()) ?? { name, tone: "plain" as const });
/** Badges saved under an earlier name keep working */
const BADGE_RENAMED: Record<string, string> = { "Upcoming launch": "Launching soon" };
export const badgeList = (b?: string | null) => (b ? b.split(",").map((s) => BADGE_RENAMED[s.trim()] ?? s.trim()).filter(Boolean) : []);
