"use client";

/**
 * Select-only combobox (WAI-ARIA APG pattern) with a designed option list.
 * Keyboard: ↓/↑/Enter/Space open · ↑/↓ move · Home/End · type to jump · Enter/Space choose · Esc close · Tab choose and move on.
 * With `search`, the open menu has a search field pinned at the top: typing (on the closed button too) filters the
 * options, ↑/↓ move through the matches, Enter chooses, Esc closes.
 */
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Icon, { type IconName } from "./Icon";
import { placeMenu, trackPosition } from "@/lib/popover";

export type DropdownOption = { value: string; label: string; /** A second, quieter line under the label */ sub?: string };

type Props = {
  label: string;
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
  icon?: IconName;
  /** Value that means "no filter" — anything else gets the highlighted "set" state. */
  emptyValue?: string;
  /** Fixed trigger width on desktop, so neighbours never shift when the value changes. */
  width?: number;
  className?: string;
  /** Placeholder of a search field in the open menu that filters the options (for long lists). */
  search?: string;
};

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const fold = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
/** How well a label matches a search: 0 starts with it, 1 a word starts with it, 2 contains it, -1 no match */
const rank = (label: string, q: string) => {
  const l = fold(label);
  if (!q || l.startsWith(q)) return 0;
  if (l.split(/[\s&,/-]+/).some((w) => w.startsWith(q))) return 1;
  return l.includes(q) ? 2 : -1;
};
/** Option indexes matching a search, best matches first (otherwise in list order) */
const matching = (options: readonly DropdownOption[], query: string) => {
  const q = fold(query);
  return [...options.keys()]
    .map((i) => [i, rank(options[i].sub ? `${options[i].label} ${options[i].sub}` : options[i].label, q)])
    .filter(([, r]) => r >= 0)
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map(([i]) => i);
};

export default function Dropdown({ label, value, options, onChange, icon, emptyValue = "", width, className, search }: Props) {
  const uid = useId();
  const labelId = `${uid}-label`;
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [alignRight, setAlignRight] = useState(false);
  const [place, setPlace] = useState<{ up: boolean; maxHeight?: number }>({ up: false });
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const setMenu = (el: HTMLElement | null) => {
    menuRef.current = el;
  };
  const searchRef = useRef<HTMLInputElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const selected = Math.max(0, options.findIndex((o) => o.value === value));
  const isSet = value !== emptyValue;
  // Indexes of the options on show, in order: all of them, or the matches of the search, best first
  const visible = matching(options, query);

  const openAt = (i: number) => {
    setActive(i);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const choose = (i: number) => {
    close();
    if (options[i] && options[i].value !== value) onChange(options[i].value);
  };

  // Keep the menu on screen, close on outside press
  useEffect(() => {
    if (!open) return;
    const untrack = trackPosition(() => {
      const wrap = wrapRef.current;
      const menu = menuRef.current;
      if (!wrap || !menu) return;
      const r = wrap.getBoundingClientRect();
      setAlignRight(r.left + Math.max(menu.offsetWidth, r.width) > window.innerWidth - 12);
      setPlace(placeMenu(wrap, menu.scrollHeight, 340));
    });
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      untrack();
    };
  }, [open]);

  // A searchable menu takes the focus into its search field
  useEffect(() => {
    if (open && search) searchRef.current?.focus({ preventScroll: true });
  }, [open, search]);

  // Keep the highlighted option visible inside a scrolling list (below the pinned search field, if any)
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const el = document.getElementById(`${uid}-opt-${active}`);
    if (!menu || !el) return;
    const top = search ? (searchRef.current?.parentElement?.offsetHeight ?? 0) : 0;
    if (el.offsetTop - top < menu.scrollTop) menu.scrollTop = el.offsetTop - top - 6;
    else if (el.offsetTop + el.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = el.offsetTop + el.offsetHeight - menu.clientHeight + 6;
  }, [active, open, uid, search]);

  const typeahead = (key: string) => {
    const now = Date.now();
    typed.current.text = (now - typed.current.at > 700 ? "" : typed.current.text) + key.toLowerCase();
    typed.current.at = now;
    const q = clean(typed.current.text);
    const start = open ? active : selected;
    const order = [...options.keys()].map((k) => (start + 1 + k) % options.length);
    const hit = order.find((i) => clean(options[i].label).startsWith(q));
    if (hit === undefined) return;
    if (open) setActive(hit);
    else openAt(hit);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openAt(selected);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        openAt(e.key === "Home" ? 0 : last);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (search) {
          // Typing on the closed button starts a search, on its first match
          e.preventDefault();
          setQuery(e.key);
          openAt(matching(options, e.key)[0] ?? selected);
        } else typeahead(e.key);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(last, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (e.altKey) choose(active);
        else setActive((a) => Math.max(0, a - 1));
        break;
      case "Home":
      case "PageUp":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
      case "PageDown":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        choose(active);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(e.key);
    }
  };

  // In the search field: ↑/↓ move through the matches, Enter chooses, Esc closes
  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const at = visible.indexOf(active);
    const move = (i: number) => visible.length && setActive(visible[Math.max(0, Math.min(visible.length - 1, i))]);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(at < 0 ? 0 : at + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(at < 0 ? 0 : at - 1);
        break;
      case "PageDown":
        e.preventDefault();
        move(visible.length - 1);
        break;
      case "PageUp":
        e.preventDefault();
        move(0);
        break;
      case "Enter":
        e.preventDefault();
        if (at >= 0) {
          choose(active);
          btnRef.current?.focus();
        }
        break;
      case "Escape":
        e.preventDefault();
        close();
        btnRef.current?.focus();
        break;
      case "Tab":
        close();
        break;
    }
  };

  const optionItem = (o: DropdownOption, i: number) => (
    <li
      key={o.value || "__all"}
      id={`${uid}-opt-${i}`}
      role="option"
      aria-selected={i === selected}
      className={`dd__opt${i === active ? " is-active" : ""}`}
      onPointerMove={() => active !== i && setActive(i)}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => {
        choose(i);
        btnRef.current?.focus();
      }}
    >
      {o.sub ? (
        <span className="dd__opt-text">
          <span className="dd__opt-main">{o.label}</span>
          <span className="dd__opt-sub">{o.sub}</span>
        </span>
      ) : (
        <span>{o.label}</span>
      )}
      {i === selected ? <Icon name="check" className="icon--sm dd__tick" /> : null}
    </li>
  );
  const menuClass = `dd__menu${alignRight ? " dd__menu--right" : ""}${place.up ? " dd__menu--up" : ""}`;
  const menuStyle = place.maxHeight ? { maxHeight: place.maxHeight } : undefined;

  return (
    <div
      ref={wrapRef}
      className={`dd${open ? " is-open" : ""}${isSet ? " is-set" : ""}${className ? ` ${className}` : ""}`}
      style={width ? ({ "--dd-w": `${width}px` } as CSSProperties) : undefined}
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <span className="dd__label" id={labelId}>
        {label}
      </span>
      <button
        ref={btnRef}
        type="button"
        className="dd__btn"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        aria-activedescendant={open && !search ? `${uid}-opt-${active}` : undefined}
        onClick={() => (open ? close() : openAt(selected))}
        onKeyDown={onKeyDown}
      >
        {icon ? <Icon name={icon} className="icon--sm dd__icon" /> : null}
        <span className="dd__value">{options[selected]?.label}</span>
        <Icon name="chevron-down" className="icon--sm dd__chev" />
      </button>
      {search ? (
        <div ref={setMenu} className={`${menuClass} dd__menu--search`} style={menuStyle}>
          <div className="dd__search">
            <Icon name="search" className="icon--sm" />
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              aria-label={`Search ${label.toLowerCase()}`}
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open && visible.includes(active) ? `${uid}-opt-${active}` : undefined}
              placeholder={search}
              autoComplete="off"
              spellCheck={false}
              tabIndex={open ? 0 : -1}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                // Highlight the best match
                const best = matching(options, e.target.value)[0];
                if (best !== undefined) setActive(best);
              }}
              onKeyDown={onSearchKeyDown}
            />
          </div>
          <ul className="dd__list" id={listId} role="listbox" aria-labelledby={labelId}>
            {visible.length ? (
              visible.map((i) => optionItem(options[i], i))
            ) : (
              <li className="dd__empty" role="presentation">
                No matches for “{query}”
              </li>
            )}
          </ul>
        </div>
      ) : (
        <ul
          ref={setMenu}
          className={menuClass}
          style={menuStyle}
          id={listId} role="listbox" aria-labelledby={labelId} tabIndex={-1}>
          <li className="dd__head" role="presentation" aria-hidden="true">
            {label}
          </li>
          {options.map(optionItem)}
        </ul>
      )}
    </div>
  );
}
