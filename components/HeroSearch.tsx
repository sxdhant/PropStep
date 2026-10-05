"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import Dropdown, { type DropdownOption } from "./Dropdown";
import Icon from "./Icon";
import ZoneMap from "./ZoneMap";
import { BUDGETS, PROPERTY_TYPES } from "@/lib/budgets";

/** A Bengaluru area to search by, and the zones it falls in */
type Area = { name: string; zones: string[] };
type Props = { zones: string[]; areas: Area[]; counts: Record<string, number> };

const TYPE_OPTIONS: DropdownOption[] = [{ value: "", label: "All types" }, ...PROPERTY_TYPES.map((t) => ({ value: t, label: t }))];
const PRICE_OPTIONS: DropdownOption[] = BUDGETS.map(([value, label]) => ({ value, label: value ? label : "Any price" }));
const inZone = (a: Area, zone: string) => !zone || a.zones.includes(zone);

/**
 * The white search card on the hero photograph: Zone, Location (in that zone), Property type, Price range and Search,
 * which opens /properties/ filtered by them. With it, the Bengaluru zone map beside the tagline, which shares the Zone:
 * tap a zone there to choose it here, and the zone chosen here shows on the map. (Two grid items of .hero__content.)
 */
export default function HeroSearch({ zones, areas, counts }: Props) {
  const router = useRouter();
  const [zone, setZone] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");

  const chooseZone = (z: string) => {
    setZone(z);
    // Keep the location only if it's in the new zone
    if (location && !areas.some((a) => a.name === location && inZone(a, z))) setLocation("");
  };

  const locations: DropdownOption[] = [{ value: "", label: "All locations" }, ...areas.filter((a) => inZone(a, zone)).map((a) => ({ value: a.name, label: a.name }))];

  // Bengaluru is the search's only city, so it needs no parameter
  const params = new URLSearchParams();
  if (zone) params.set("zone", zone);
  if (location) params.set("locality", location);
  if (type) params.set("type", type);
  if (price) params.set("budget", price);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const qs = params.toString();
    router.push(`/properties/${qs ? `?${qs}` : ""}`);
  };

  return (
    <>
      <div className="hero__map" data-reveal="" style={{ "--delay": "260ms" } as CSSProperties}>
        <ZoneMap zones={zones} value={zone} onChange={chooseZone} counts={counts} />
      </div>
      {/* First in, as the photo settles, so the search is there at first sight */}
      <div className="hero__find" data-reveal="" style={{ "--delay": "120ms" } as CSSProperties}>
        <form className="hero-search" action="/properties/" method="get" role="search" aria-label="Property search" onSubmit={submit}>
          <Dropdown
            className="dd--field"
            label="Zone"
            icon="compass"
            value={zone}
            options={[{ value: "", label: "All zones" }, ...zones.map((z) => ({ value: z, label: z }))]}
            onChange={chooseZone}
          />
          <Dropdown className="dd--field" label="Location" icon="pin" search="Search location…" value={location} options={locations} onChange={setLocation} />
          <Dropdown className="dd--field" label="Property type" icon="building" value={type} options={TYPE_OPTIONS} onChange={setType} />
          <Dropdown className="dd--field" label="Price range" icon="rupee" value={price} options={PRICE_OPTIONS} onChange={setPrice} />
          {[...params].map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <button className="hero-search__go" type="submit">
            <Icon name="search" className="icon--sm" />
            <span>Search</span>
          </button>
        </form>
      </div>
    </>
  );
}
