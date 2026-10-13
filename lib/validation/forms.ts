import { z } from "zod";
import { addDays, isSunday, optEmail, optText, phone, reqText, slugSchema, todayIST } from "./common";

export const ENQUIRY_TYPES = ["buy", "sell", "visit", "nri", "commercial", "other"] as const;
export const SLOTS = ["Morning", "Afternoon", "Evening"] as const;
export const MODES = ["In person", "Video tour"] as const;

const base = {
  name: reqText("Name", 100),
  phone,
  email: optEmail,
  page: optText(200),
  consent: z.literal("yes", { message: "Please agree so an advisor can contact you." }),
  idempotencyKey: z.string().max(80).optional(),
};

export const enquirySchema = z.object({
  ...base,
  form: optText(40),
  enquiry: z.enum(ENQUIRY_TYPES, { message: "Please choose what you need help with" }).optional(),
  subject: optText(200),
  message: optText(2000),
});

export const visitSchema = z
  .object({
    ...base,
    property: z.union([slugSchema, z.literal("")]).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a visit date"),
    // The form sends "Morning (10 AM – 1 PM)"; keep just the slot name
    time: z.string().transform((v) => v.split(" (")[0]).pipe(z.enum(SLOTS, { message: "Choose a time slot" })),
    mode: z.enum(MODES, { message: "Choose how you'd like to visit" }),
  })
  .superRefine((v, ctx) => {
    const today = todayIST();
    if (new Date(`${v.date}T00:00:00Z`).toISOString().slice(0, 10) !== v.date) {
      ctx.addIssue({ code: "custom", path: ["date"], message: "That date isn't valid" });
      return;
    }
    if (v.date <= today) ctx.addIssue({ code: "custom", path: ["date"], message: "Pick a date from tomorrow onwards" });
    else if (v.date > addDays(today, 365)) ctx.addIssue({ code: "custom", path: ["date"], message: "Pick a date within the next year" });
    else if (isSunday(v.date)) ctx.addIssue({ code: "custom", path: ["date"], message: "We don't run visits on Sundays. Pick Monday to Saturday." });
  });

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address")
    .max(254),
});

/** Max pending + confirmed visits per date and slot (our advisors' capacity) */
export const SLOT_CAPACITY = 4;
