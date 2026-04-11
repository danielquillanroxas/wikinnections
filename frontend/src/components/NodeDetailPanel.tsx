import { useState, useEffect } from "react";
import type { WikipediaSummary, EntityDetail } from "../types";
import { getSummary, getEntity } from "../api/client";

interface Props {
  qid: string | null;
  onClose: () => void;
  onNavigate: (qid: string) => void;
}

export function NodeDetailPanel({ qid, onClose, onNavigate }: Props) {
  const [summary, setSummary] = useState<WikipediaSummary | null>(null);
  const [detail, setDetail] = useState<EntityDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!qid) {
      setSummary(null);
      setDetail(null);
      return;
    }
    setLoading(true);
    setSummary(null);
    setDetail(null);
    Promise.allSettled([getSummary(qid), getEntity(qid)]).then(
      ([sumResult, detResult]) => {
        if (sumResult.status === "fulfilled") setSummary(sumResult.value);
        if (detResult.status === "fulfilled") setDetail(detResult.value);
        setLoading(false);
      }
    );
  }, [qid]);

  if (!qid) return null;

  return (
    <div className="detail-card">
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#e0e0e0" }}>
            {detail?.label || qid}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#818cf8" }}>{qid}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#555",
            fontSize: "1.2rem",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          x
        </button>
      </div>

      {loading && (
        <div style={{ padding: 20, color: "#555", textAlign: "center", fontSize: "0.85rem" }}>
          <div className="loading-spinner" style={{ width: 24, height: 24, margin: "0 auto 8px", borderWidth: 2 }} />
          Loading...
        </div>
      )}

      <div style={{ overflow: "auto", flex: 1 }}>
        {summary && (
          <div style={{ padding: 16 }}>
            {summary.thumbnail_url && (
              <img
                src={summary.thumbnail_url}
                alt={summary.title}
                style={{
                  width: "100%",
                  maxHeight: 160,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              />
            )}
            <p style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "#bbb", margin: 0 }}>
              {summary.extract}
            </p>
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                marginTop: 8,
                fontSize: "0.75rem",
                color: "#818cf8",
              }}
            >
              Read on Wikipedia &rarr;
            </a>
          </div>
        )}

        {detail && detail.properties.length > 0 && (
          <div style={{ padding: "0 16px 16px" }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.7rem",
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Connections ({detail.properties.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {detail.properties.slice(0, 25).map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "baseline",
                    fontSize: "0.78rem",
                    padding: "3px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.02)",
                  }}
                >
                  <span style={{ color: "#555", minWidth: 100, flexShrink: 0, fontSize: "0.72rem" }}>
                    {p.property_label}
                  </span>
                  <span
                    onClick={() => onNavigate(p.target_qid)}
                    style={{ color: "#a78bfa", cursor: "pointer", wordBreak: "break-word" }}
                  >
                    {p.target_label}
                  </span>
                </div>
              ))}
              {detail.properties.length > 25 && (
                <div style={{ color: "#444", fontSize: "0.72rem", padding: "3px 0" }}>
                  +{detail.properties.length - 25} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
