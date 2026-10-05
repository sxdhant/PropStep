"use client";

/**
 * Editable combobox with a grouped suggestion list (WAI-ARIA APG "list autocomplete" pattern).
 * Keyboard: ↓/↑ move through suggestions · Enter picks the highlighted one (or submits the form when none is)
 * · Esc closes, then clears · Tab closes. Focus always stays in the input.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
import { placeMenu, trackPosition } from "@/lib/popover";

/** `match` is the text searched when typing (defaults to label + sub). */
export type Suggestion = { key: string; label: string; sub: string; icon: IconName; href?: string; match?: string };
export type SuggestionGroup = { label: string; items: Suggestion[] };

type Props = {
  id: string;
  name: string;
  label: string;
  value: string;
  placeholder: string;
  groups: SuggestionGroup[];
  onChange: (value: string) => void;
  /** Called for a suggestion with an href (it's a destination, not a search term). */
  onNavigate: (href: string) => void;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Bolds the part of the label that matches what was typed. */
function highlight(label: string, q: string): ReactNode {
  const nq = norm(q);
  if (!nq) return label;
  // Map normalised positions back onto the original string, so "hsr lay" matches "HSR Layout".
  const idx: number[] = [];
  for (let i = 0; i < label.length; i++) if (/[a-z0-9]/i.test(label[i])) idx.push(i);
  const at = norm(label).indexOf(nq);
  if (at < 0) return label;
  const start = idx[at];
  const end = idx[at + nq.length - 1] + 1;
  return (
    <>
      {label.slice(0, start)}
      <mark>{label.slice(start, end)}</mark>
      {label.slice(end)}
    </>
  );
}

export default function SuggestInput({ id, name, label, value, placeholder, groups, onChange, onNavigate }: Props) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState<{ up: boolean; maxHeight?: number }>({ up: false });
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const nq = norm(value);
  const shown = groups
    .map((g) => ({ ...g, items: g.items.filter((s) => !nq || norm(s.match ?? `${s.label} ${s.sub}`).includes(nq)) }))
    .filter((g) => g.items.length);
  const flat = shown.flatMap((g) => g.items);
  const expanded = open && flat.length > 0;
  const optId = (i: number) => `${uid}-opt-${i}`;

  const pick = (s: Suggestion) => {
    setOpen(false);
    setActive(-1);
    if (s.href) onNavigate(s.href);
    else onChange(s.label);
  };

  // Open upwards when there isn't room below (e.g. phones with the keyboard up), close on outside press
  useEffect(() => {
    if (!expanded) return;
    const untrack = trackPosition(() => {
      // The menu is positioned against the surrounding field (marked data-suggest-anchor), not the bare input
      const anchor = wrapRef.current?.closest("[data-suggest-anchor]") ?? wrapRef.current;
      const list = listRef.current;
      if (anchor && list) setPlace(placeMenu(anchor, list.scrollHeight, 372));
    });
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      untrack();
    };
  }, [expanded, flat.length]);

  // Keep the highlighted suggestion visible inside the scrolling list
  useEffect(() => {
    if (!expanded || active < 0) return;
    const list = listRef.current;
    const el = document.getElementById(`${uid}-opt-${active}`);
    if (!list || !el) return;
    const top = el.offsetTop, bottom = top + el.offsetHeight;
    if (top < list.scrollTop + 32) list.scrollTop = top - 32; // 32: room for the group heading
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 6;
  }, [active, expanded, uid]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!expanded) {
          setOpen(true);
          setActive(0);
        } else setActive((a) => (a + 1) % flat.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!expanded) {
          setOpen(true);
          setActive(flat.length - 1);
        } else setActive((a) => (a <= 0 ? flat.length - 1 : a - 1));
        break;
      case "Enter":
        if (expanded && active >= 0 && flat[active]) {
          e.preventDefault();
          pick(flat[active]);
        } else setOpen(false); // let the form submit
        break;
      case "Escape":
        if (expanded) {
          e.preventDefault();
          setOpen(false);
          setActive(-1);
        } else if (value) {
          e.preventDefault();
          onChange("");
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  let n = -1;
  return (
    <div ref={wrapRef} className="suggest">
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? optId(active) : undefined}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={`${label} suggestions`}
        className={`suggest__menu${expanded ? " is-open" : ""}${place.up ? " suggest__menu--up" : ""}`}
        style={place.maxHeight ? { maxHeight: place.maxHeight } : undefined}
      >
        {shown.map((g, gi) => (
          <div key={g.label} role="group" aria-labelledby={`${uid}-g${gi}`} className="suggest__group">
            <div role="presentation" id={`${uid}-g${gi}`} className="suggest__head">
              {g.label}
            </div>
            {g.items.map((s) => {
              n += 1;
              const i = n;
              return (
                <div
                  key={s.key}
                  id={optId(i)}
                  role="option"
                  aria-selected={i === active}
                  className={`suggest__opt${i === active ? " is-active" : ""}`}
                  onPointerMove={() => active !== i && setActive(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                >
                  <span className="suggest__icon" aria-hidden="true">
                    <Icon name={s.icon} className="icon--sm" />
                  </span>
                  <span className="suggest__text">
                    <span className="suggest__label">{highlight(s.label, value)}</span>
                    <span className="suggest__sub">{s.sub}</span>
                  </span>
                  {s.href ? (
                    <span className="suggest__go">
                      <span>View project</span>
                      <Icon name="arrow-up-right" className="icon--sm" />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
