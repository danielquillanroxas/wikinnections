import type { PathResponse } from "../types";

interface Props {
  result: PathResponse | null;
  error: string | null;
}

export function PathInfo({ result, error }: Props) {
  if (error) {
    return (
      <div className="path-bar-inner">
        <span className="status-pill error">Error</span>
        <span style={{ fontSize: "0.82rem", color: "#f44336" }}>{error}</span>
      </div>
    );
  }

  if (!result) return null;

  if (!result.found) {
    return (
      <div className="path-bar-inner">
        <span className="status-pill not-found">No path</span>
        <span style={{ fontSize: "0.82rem", color: "#FF9800" }}>
          No connection found within 4 hops. Try relaxing filters.
        </span>
      </div>
    );
  }

  // Build breadcrumb: extract unique ordered node chain
  const nodeChain: { qid: string; label: string }[] = [];
  const propLabels: string[] = [];
  if (result.path.length > 0) {
    nodeChain.push({ qid: result.path[0].source_qid, label: result.path[0].source_label });
    for (const edge of result.path) {
      propLabels.push(edge.property_label);
      const lastQid = nodeChain[nodeChain.length - 1].qid;
      if (edge.source_qid === lastQid) {
        nodeChain.push({ qid: edge.target_qid, label: edge.target_label });
      } else if (edge.target_qid === lastQid) {
        nodeChain.push({ qid: edge.source_qid, label: edge.source_label });
      } else {
        nodeChain.push({ qid: edge.target_qid, label: edge.target_label });
      }
    }
  }

  return (
    <div className="path-bar-inner">
      <span className="status-pill found">
        {result.hops} hop{result.hops !== 1 ? "s" : ""}
      </span>
      <span style={{ fontSize: "0.68rem", color: "#555" }}>
        {(result.search_time_ms / 1000).toFixed(1)}s
        {result.cached && " (cached)"}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {nodeChain.map((n, i) => (
          <span key={n.qid + i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="node-chip">{n.label}</span>
            {i < propLabels.length && (
              <span className="edge-label">{propLabels[i]} &rarr;</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
