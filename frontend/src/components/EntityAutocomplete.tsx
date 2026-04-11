import { useState, useRef, useEffect } from "react";
import { useEntitySearch } from "../hooks/useEntitySearch";
import type { EntitySearchResult } from "../types";

interface Props {
  label: string;
  onSelect: (entity: EntitySearchResult) => void;
  selected: EntitySearchResult | null;
  accentColor: string;
}

export function EntityAutocomplete({ label, onSelect, selected, accentColor }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results, loading } = useEntitySearch(query);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(entity: EntitySearchResult) {
    onSelect(entity);
    setQuery(entity.label);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: accentColor,
            minWidth: 32,
          }}
        >
          {label}
        </span>
        <input
          className="dark-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search entity..."
          style={{
            borderColor: selected ? accentColor : undefined,
          }}
        />
        {selected && (
          <button
            onClick={() => {
              setQuery("");
              onSelect(null as unknown as EntitySearchResult);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              cursor: "pointer",
              fontSize: "0.9rem",
              padding: "0 2px",
            }}
          >
            x
          </button>
        )}
        {loading && (
          <span style={{ color: "#4ecdc4", fontSize: "0.7rem" }}>...</span>
        )}
      </div>
      {selected && (
        <div style={{ fontSize: "0.68rem", color: "#555", marginTop: 2, paddingLeft: 40 }}>
          {selected.qid}
          {selected.description && ` - ${selected.description}`}
        </div>
      )}
      {open && results.length > 0 && (
        <div className="autocomplete-dropdown">
          {results.map((r) => (
            <div
              key={r.qid}
              className="autocomplete-item"
              onClick={() => handleSelect(r)}
            >
              <div className="label">{r.label}</div>
              <div className="desc">
                {r.qid}
                {r.description && ` - ${r.description}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
