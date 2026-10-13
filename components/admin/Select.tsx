"use client";

import Dropdown, { type DropdownOption } from "@/components/Dropdown";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (DropdownOption | [string, string])[];
  /** Smaller trigger, for table cells and filter bars */
  compact?: boolean;
  /** Add a search box to the open menu (long lists) */
  search?: string;
};

/** The website's own dropdown (same look, keyboard handling and animation), styled for the admin panel */
export default function Select({ label, value, onChange, options, compact, search }: Props) {
  const opts = options.map((o) => (Array.isArray(o) ? { value: o[0], label: o[1] } : o));
  return <Dropdown className={`dd--form${compact ? " dd--sm" : ""}`} label={label} value={value} options={opts} onChange={onChange} search={search} />;
}
