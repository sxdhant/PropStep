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
export const PROPERTY_TYPES = ["Apartment", "Villa", "Plot", "Farmland", "Studio apartment", "Penthouse"];
