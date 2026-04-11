import { useState } from "react";

interface Props {
  githubUrl: string;
  linkedinUrl: string;
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function InfoBar({ githubUrl, linkedinUrl }: Props) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          gap: 6,
          animation: "fadeIn 0.3s ease",
        }}
      >
        <button
          className="btn-ghost"
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          title="Learn how Wikinnections finds connections between entities"
          style={{ fontSize: "0.72rem" }}
        >
          How it works
        </button>
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", padding: "6px 10px" }}
          title="View source code on GitHub"
        >
          <GitHubIcon />
        </a>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", padding: "6px 10px" }}
          title="Connect on LinkedIn"
        >
          <LinkedInIcon />
        </a>
      </div>

      {showHowItWorks && (
        <div
          style={{
            position: "absolute",
            top: 52,
            right: 16,
            zIndex: 15,
            width: 360,
            background: "rgba(22, 22, 32, 0.96)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: 14,
            padding: "20px",
            animation: "fadeIn 0.2s ease",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#e0e0e0" }}>How it works</h3>
            <button
              onClick={() => setShowHowItWorks(false)}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1rem" }}
            >
              x
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "0.8rem", lineHeight: 1.6, color: "#aaa" }}>
            <div>
              <div style={{ color: "#818cf8", fontWeight: 600, marginBottom: 2 }}>Path Mode</div>
              Uses <strong style={{ color: "#ccc" }}>bidirectional BFS</strong> over Wikidata's SPARQL
              endpoint to find the shortest path between two entities. The search expands
              from both sides simultaneously through ~50 curated relationship types.
            </div>

            <div>
              <div style={{ color: "#818cf8", fontWeight: 600, marginBottom: 2 }}>Explore Mode</div>
              Loads an entity's direct connections from Wikidata — properties like
              birthplace, employer, awards, etc. Sort by relevance, alphabetically,
              or by property type. Double-click any node to expand further.
            </div>

            <div>
              <div style={{ color: "#818cf8", fontWeight: 600, marginBottom: 2 }}>Filters</div>
              <strong style={{ color: "#ccc" }}>Popularity threshold</strong> blocks well-known
              entities (by Wikipedia sitelink count) from appearing as intermediate nodes,
              forcing more creative paths. <strong style={{ color: "#ccc" }}>Category filters</strong> block
              shortcuts like citizenship chains or international org hubs.
            </div>

            <div style={{ fontSize: "0.72rem", color: "#555", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8 }}>
              Data from Wikidata SPARQL. Summaries from Wikipedia REST API. Cached in SQLite.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
