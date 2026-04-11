import { useState, useEffect } from "react";
import { EntityAutocomplete } from "./EntityAutocomplete";
import { getFilters } from "../api/client";
import type { FilterCategory } from "../api/client";
import type { EntitySearchResult } from "../types";

export type SearchMode = "path" | "explore";

interface Props {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  onPathSearch: (sourceQid: string, targetQid: string, filters: string[], maxSitelinks: number | null, maxDepth: number) => void;
  onExploreSearch: (qid: string, limit: number, sort: string) => void;
  loading: boolean;
  githubUrl: string;
  linkedinUrl: string;
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const SITELINK_MIN = 0;
const SITELINK_MAX = 500;

const NEIGHBOR_COUNTS = [10, 25, 50];
const SORT_OPTIONS = [
  { value: "connections", label: "Most connected" },
  { value: "alpha", label: "A-Z" },
  { value: "property", label: "By property" },
];

export function SearchPanel({ mode, onModeChange, onPathSearch, onExploreSearch, loading, githubUrl, linkedinUrl }: Props) {
  const [source, setSource] = useState<EntitySearchResult | null>(null);
  const [target, setTarget] = useState<EntitySearchResult | null>(null);
  const [exploreEntity, setExploreEntity] = useState<EntitySearchResult | null>(null);
  const [filters, setFilters] = useState<FilterCategory[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [maxSitelinks, setMaxSitelinks] = useState<number>(0);
  const [maxDepth, setMaxDepth] = useState(4);
  const [neighborCount, setNeighborCount] = useState(25);
  const [sortBy, setSortBy] = useState("connections");
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    getFilters().then((f) => {
      setFilters(f);
      setActiveFilters(new Set(f.filter((c) => c.default).map((c) => c.key)));
    });
  }, []);

  function handlePathSubmit() {
    if (source && target) {
      onPathSearch(source.qid, target.qid, Array.from(activeFilters), maxSitelinks > 0 ? maxSitelinks : null, maxDepth);
    }
  }

  function handleExploreSubmit() {
    if (exploreEntity) {
      onExploreSearch(exploreEntity.qid, neighborCount, sortBy);
    }
  }

  function toggleFilter(key: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="search-card">
      <div className="brand" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Wikinnections</h1>
          <div className="subtitle">Knowledge graph explorer</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={() => setShowInfo(!showInfo)}
            title="How it works"
            style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: "50%", width: 22, height: 22, color: showInfo ? "#818cf8" : "#555", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
          >?</button>
          <a href={githubUrl} target="_blank" rel="noreferrer" title="Source code" style={{ color: "#555", transition: "color 0.15s", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")} onMouseLeave={e => (e.currentTarget.style.color = "#555")}><GitHubIcon /></a>
          <a href={linkedinUrl} target="_blank" rel="noreferrer" title="LinkedIn" style={{ color: "#555", transition: "color 0.15s", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")} onMouseLeave={e => (e.currentTarget.style.color = "#555")}><LinkedInIcon /></a>
        </div>
      </div>

      {/* How it works panel */}
      {showInfo && (
        <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", marginBottom: 8, animation: "fadeIn 0.2s ease" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.78rem", lineHeight: 1.55, color: "#999" }}>
            <div>
              <span style={{ color: "#818cf8", fontWeight: 600 }}>Path Mode</span>{" "}
              Uses bidirectional BFS over Wikidata's SPARQL endpoint to find the shortest
              path between two entities. Expands from both sides through ~50 curated relationship types.
            </div>
            <div>
              <span style={{ color: "#818cf8", fontWeight: 600 }}>Explore Mode</span>{" "}
              Loads an entity's direct connections from Wikidata: birthplace, employer,
              awards, and more. Sort by relevance, alphabetically, or by property type.
              Double-click any node to expand further.
            </div>
            <div>
              <span style={{ color: "#818cf8", fontWeight: 600 }}>Filters</span>{" "}
              Popularity threshold blocks well-known entities (by sitelink count) as
              intermediates, forcing more creative paths. Category filters block
              shortcuts like citizenship chains or international org hubs.
            </div>
            <div style={{ fontSize: "0.68rem", color: "#555", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 6 }}>
              Data from Wikidata SPARQL. Summaries from Wikipedia REST API. Cached in SQLite.
            </div>
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div
        style={{ display: "flex", gap: 2, marginBottom: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3 }}
        title="Switch between finding paths between two entities or exploring one entity's neighborhood"
      >
        {(["path", "explore"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            title={m === "path" ? "Find the shortest path connecting two entities via Wikidata relationships" : "Explore a single entity's direct connections in the knowledge graph"}
            style={{
              flex: 1,
              padding: "6px 0",
              borderRadius: 6,
              border: "none",
              background: mode === m ? "rgba(99,102,241,0.15)" : "transparent",
              color: mode === m ? "#818cf8" : "#555",
              fontSize: "0.78rem",
              fontWeight: mode === m ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {m === "path" ? "Find Path" : "Explore"}
          </button>
        ))}
      </div>

      {/* ── Path mode ── */}
      {mode === "path" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <EntityAutocomplete label="FROM" onSelect={setSource} selected={source} accentColor="#6366f1" />
          <EntityAutocomplete label="TO" onSelect={setTarget} selected={target} accentColor="#f472b6" />
          <button
            className="btn-primary"
            onClick={handlePathSubmit}
            disabled={!source || !target || loading}
            style={{ width: "100%", marginTop: 4 }}
          >
            {loading ? "Searching..." : "Find Connection"}
          </button>

          {/* Path filters */}
          <div style={{ marginTop: 4 }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                background: "none", border: "none", color: "#555",
                fontSize: "0.72rem", cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <span style={{ transform: showFilters ? "rotate(90deg)" : "", transition: "transform 0.2s", display: "inline-block" }}>&rsaquo;</span>
              Filters
              {(activeFilters.size > 0 || maxSitelinks > 0) && (
                <span style={{ color: "#818cf8" }}>
                  ({activeFilters.size} blocked{maxSitelinks > 0 ? `, max ${maxSitelinks}` : ""})
                </span>
              )}
            </button>
            {showFilters && (
              <div style={{ marginTop: 8, padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: "0.7rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Max sitelinks</div>
                    <div style={{ fontSize: "0.75rem", color: maxSitelinks === 0 ? "#555" : "#818cf8", fontWeight: 600 }}>
                      {maxSitelinks === 0 ? "Off" : maxSitelinks}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={SITELINK_MIN}
                    max={SITELINK_MAX}
                    step={10}
                    value={maxSitelinks}
                    onChange={(e) => setMaxSitelinks(Number(e.target.value))}
                    title={maxSitelinks === 0 ? "No limit — all nodes allowed" : `Skip intermediate nodes with more than ${maxSitelinks} Wikipedia sitelinks`}
                    style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "#444", marginTop: 2 }}>
                    <span>Off</span>
                    <span>Obscure</span>
                    <span>Well-known</span>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: "0.7rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Max hops</div>
                    <div style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600 }}>{maxDepth}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[4, 5, 6, 7, 8].map((d) => (
                      <button key={d} onClick={() => setMaxDepth(d)} title={d <= 4 ? "Fast" : d === 5 ? "Slower, deeper search" : "Much slower, may timeout"} style={{
                        flex: 1, padding: "4px 0", borderRadius: 5,
                        border: `1px solid ${maxDepth === d ? "#6366f1" : "#2a2a3a"}`,
                        background: maxDepth === d ? "rgba(99,102,241,0.1)" : "transparent",
                        color: maxDepth === d ? "#818cf8" : "#555", fontSize: "0.75rem", cursor: "pointer",
                      }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: "0.7rem", color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Block categories</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {filters.map((f) => (
                    <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: activeFilters.has(f.key) ? "#aaa" : "#444", cursor: "pointer", userSelect: "none" }}>
                      <input type="checkbox" checked={activeFilters.has(f.key)} onChange={() => toggleFilter(f.key)} style={{ accentColor: "#6366f1", width: 13, height: 13 }} />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Explore mode ── */}
      {mode === "explore" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <EntityAutocomplete label="ENTITY" onSelect={setExploreEntity} selected={exploreEntity} accentColor="#6366f1" />

          {/* Neighbor controls */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }} title="How many neighbor entities to display in the graph">
              <div style={{ fontSize: "0.68rem", color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Show</div>
              <div style={{ display: "flex", gap: 3 }}>
                {NEIGHBOR_COUNTS.map((n) => (
                  <button key={n} onClick={() => setNeighborCount(n)} style={{
                    flex: 1, padding: "5px 0", borderRadius: 5,
                    border: `1px solid ${neighborCount === n ? "#6366f1" : "#2a2a3a"}`,
                    background: neighborCount === n ? "rgba(99,102,241,0.1)" : "transparent",
                    color: neighborCount === n ? "#818cf8" : "#555", fontSize: "0.75rem", cursor: "pointer",
                  }}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1.2 }} title="Order neighbors by connection count (most linked first), alphabetically, or grouped by property type">
              <div style={{ fontSize: "0.68rem", color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sort by</div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: "100%", padding: "5px 8px", borderRadius: 5,
                  border: "1px solid #2a2a3a", background: "#12121a", color: "#aaa",
                  fontSize: "0.75rem", outline: "none", cursor: "pointer",
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleExploreSubmit}
            disabled={!exploreEntity || loading}
            style={{ width: "100%" }}
          >
            {loading ? "Loading..." : "Explore Neighbors"}
          </button>
        </div>
      )}
    </div>
  );
}
