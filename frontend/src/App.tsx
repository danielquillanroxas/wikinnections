import { useState, useCallback, useEffect, useRef } from "react";
import { SearchPanel } from "./components/SearchPanel";
import type { SearchMode } from "./components/SearchPanel";
import { GraphCanvas } from "./components/GraphCanvas";
import { PathInfo } from "./components/PathInfo";
import { NodeDetailPanel } from "./components/NodeDetailPanel";
import { ContextMenu } from "./components/ContextMenu";
import { usePathfinding } from "./hooks/usePathfinding";
import { useNodeExpand } from "./hooks/useNodeExpand";
import { ParticleBackground } from "./components/ParticleBackground";
import { getEntity } from "./api/client";
import type { EntityDetail } from "./types";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState<SearchMode>("path");
  const { result, loading: pathLoading, error, search } = usePathfinding();
  const { expandedNodes, expand, reset } = useNodeExpand();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [sourceQid, setSourceQid] = useState<string | null>(null);
  const [targetQid, setTargetQid] = useState<string | null>(null);

  // Explore mode state
  const [exploreRoot, setExploreRoot] = useState<EntityDetail | null>(null);
  const [exploreLoading, setExploreLoading] = useState(false);

  // Blocked properties and entities (from edge/node "block" click)
  const [blockedProps, setBlockedProps] = useState<string[]>([]);
  const [blockedEntities, setBlockedEntities] = useState<string[]>([]);
  const lastSearchRef = useRef<{
    src: string; tgt: string; filters: string[]; maxSitelinks: number | null; maxDepth: number;
  } | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; qid: string; label: string; isExpanded: boolean; isPathNode: boolean;
  } | null>(null);

  // Edge context menu
  const [edgeMenu, setEdgeMenu] = useState<{
    x: number; y: number; propertyId: string; propertyLabel: string;
  } | null>(null);

  useEffect(() => {
    const close = () => { setContextMenu(null); setEdgeMenu(null); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const handlePathSearch = useCallback(
    (src: string, tgt: string, filters: string[], maxSitelinks: number | null, maxDepth: number) => {
      setSourceQid(src);
      setTargetQid(tgt);
      setSelectedNode(null);
      setContextMenu(null);
      setEdgeMenu(null);
      setExploreRoot(null);
      setBlockedProps([]);
      setBlockedEntities([]);
      reset();
      lastSearchRef.current = { src, tgt, filters, maxSitelinks, maxDepth };
      search(src, tgt, filters, maxSitelinks, maxDepth);
    },
    [search, reset]
  );

  const handleBlockProperty = useCallback(
    (propertyId: string) => {
      const newBlocked = [...blockedProps, propertyId];
      setBlockedProps(newBlocked);
      setEdgeMenu(null);
      reset();
      const p = lastSearchRef.current;
      if (p) {
        search(p.src, p.tgt, p.filters, p.maxSitelinks, p.maxDepth, newBlocked, blockedEntities);
      }
    },
    [blockedProps, blockedEntities, search, reset]
  );

  const handleBlockEntity = useCallback(
    (qid: string) => {
      const newBlocked = [...blockedEntities, qid];
      setBlockedEntities(newBlocked);
      setContextMenu(null);
      reset();
      const p = lastSearchRef.current;
      if (p) {
        search(p.src, p.tgt, p.filters, p.maxSitelinks, p.maxDepth, blockedProps, newBlocked);
      }
    },
    [blockedEntities, blockedProps, search, reset]
  );

  const handleExploreSearch = useCallback(
    async (qid: string, limit: number, sort: string) => {
      setExploreLoading(true);
      setSelectedNode(null);
      setContextMenu(null);
      setEdgeMenu(null);
      setSourceQid(null);
      setTargetQid(null);
      reset();
      try {
        const detail = await getEntity(qid, { limit, sort, includeIncoming: true });
        setExploreRoot(detail);
      } finally {
        setExploreLoading(false);
      }
    },
    [reset]
  );

  const handleNodeClick = useCallback((qid: string) => {
    setSelectedNode(qid);
    setContextMenu(null);
    setEdgeMenu(null);
  }, []);

  const pathQids = new Set<string>();
  if (result?.found) {
    for (const e of result.path) {
      pathQids.add(e.source_qid);
      pathQids.add(e.target_qid);
    }
  }

  const handleNodeContext = useCallback(
    (qid: string, label: string, x: number, y: number) => {
      setEdgeMenu(null);
      const isPath = pathQids.has(qid) && qid !== sourceQid && qid !== targetQid;
      setContextMenu({ x, y, qid, label, isExpanded: expandedNodes.has(qid), isPathNode: isPath });
    },
    [expandedNodes, pathQids, sourceQid, targetQid]
  );

  const handleEdgeContext = useCallback(
    (propertyId: string, propertyLabel: string, x: number, y: number) => {
      setContextMenu(null);
      setEdgeMenu({ x, y, propertyId, propertyLabel });
    },
    []
  );

  const handleNodeExpand = useCallback(
    (qid: string) => { expand(qid); setContextMenu(null); setEdgeMenu(null); },
    [expand]
  );

  const loading = pathLoading || exploreLoading;
  const hasPathGraph = result?.found && result.path.length > 0;
  const hasExploreGraph = exploreRoot !== null;
  const hasGraph = hasPathGraph || hasExploreGraph;

  const exploreEdges = exploreRoot
    ? exploreRoot.properties.map((p) => ({
        source_qid: p.direction === "outgoing" ? exploreRoot.qid : p.target_qid,
        source_label: p.direction === "outgoing" ? exploreRoot.label : p.target_label,
        property_id: p.property_id,
        property_label: p.property_label,
        target_qid: p.direction === "outgoing" ? p.target_qid : exploreRoot.qid,
        target_label: p.direction === "outgoing" ? p.target_label : exploreRoot.label,
      }))
    : [];

  return (
    <div className="app-root">
      <div className="graph-viewport">
        {hasGraph ? (
          <GraphCanvas
            path={hasPathGraph ? result!.path : exploreEdges}
            sourceQid={hasPathGraph ? sourceQid : exploreRoot?.qid ?? null}
            targetQid={hasPathGraph ? targetQid : null}
            expandedNodes={expandedNodes}
            onNodeClick={handleNodeClick}
            onNodeExpand={handleNodeExpand}
            onNodeContext={handleNodeContext}
            onEdgeContext={handleEdgeContext}
          />
        ) : (
          <>
            <ParticleBackground />
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner" />
                <div className="loading-text">
                  {mode === "path" ? "Searching the knowledge graph..." : "Loading neighbors..."}
                </div>
                <div className="loading-subtext">
                  {mode === "path" ? "Bidirectional BFS over Wikidata" : "Fetching entity connections"}
                </div>
              </div>
            )}
            {!loading && (
              <div className="empty-state">
                <div className="icon">{ }</div>
                <div className="title">
                  {mode === "path"
                    ? "Find the hidden connection between any two things"
                    : "Explore an entity's neighborhood in the knowledge graph"}
                </div>
                <div className="hint">
                  {mode === "path"
                    ? 'Try "Turkey" and "Barack Obama"'
                    : 'Try "MIT", "Tesla", or "Tokyo"'}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Search panel */}
      <div className="search-overlay">
        <SearchPanel
          mode={mode}
          onModeChange={setMode}
          onPathSearch={handlePathSearch}
          onExploreSearch={handleExploreSearch}
          loading={loading}
          githubUrl="https://github.com/danielquillanroxas/wikinnections"
          linkedinUrl="https://www.linkedin.com/in/daniel-quillan-roxas-aaa276248/"
        />
      </div>

      {/* Path info bar */}
      {mode === "path" && (result || error) && !loading && (
        <div className="path-bar">
          <PathInfo result={result} error={error} />
          {(blockedProps.length > 0 || blockedEntities.length > 0) && (
            <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.68rem", color: "#666" }}>Blocked:</span>
              {blockedProps.map((pid) => (
                <button
                  key={`p-${pid}`}
                  onClick={() => {
                    const nb = blockedProps.filter((p) => p !== pid);
                    setBlockedProps(nb);
                    reset();
                    const p = lastSearchRef.current;
                    if (p) search(p.src, p.tgt, p.filters, p.maxSitelinks, p.maxDepth, nb, blockedEntities);
                  }}
                  style={{
                    padding: "2px 8px", borderRadius: 4, border: "1px solid #f4726644",
                    background: "rgba(244,114,182,0.08)", color: "#f472b6", fontSize: "0.68rem",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {pid} <span style={{ opacity: 0.5 }}>x</span>
                </button>
              ))}
              {blockedEntities.map((qid) => (
                <button
                  key={`e-${qid}`}
                  onClick={() => {
                    const nb = blockedEntities.filter((q) => q !== qid);
                    setBlockedEntities(nb);
                    reset();
                    const p = lastSearchRef.current;
                    if (p) search(p.src, p.tgt, p.filters, p.maxSitelinks, p.maxDepth, blockedProps, nb);
                  }}
                  style={{
                    padding: "2px 8px", borderRadius: 4, border: "1px solid #818cf844",
                    background: "rgba(129,140,248,0.08)", color: "#818cf8", fontSize: "0.68rem",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {qid} <span style={{ opacity: 0.5 }}>x</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explore info bar */}
      {mode === "explore" && exploreRoot && (
        <div className="path-bar">
          <div className="path-bar-inner">
            <span className="status-pill found">{exploreRoot.properties.length} connections</span>
            <span className="node-chip">{exploreRoot.label}</span>
            {exploreRoot.description && (
              <span style={{ fontSize: "0.75rem", color: "#555" }}>{exploreRoot.description}</span>
            )}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedNode && (
        <div className="detail-overlay">
          <NodeDetailPanel
            qid={selectedNode}
            onClose={() => setSelectedNode(null)}
            onNavigate={(qid) => { expand(qid); setSelectedNode(qid); }}
          />
        </div>
      )}

      {/* Node context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          qid={contextMenu.qid} label={contextMenu.label}
          isExpanded={contextMenu.isExpanded}
          isPathNode={contextMenu.isPathNode}
          onExpand={() => handleNodeExpand(contextMenu.qid)}
          onOpenWikipedia={() => { setSelectedNode(contextMenu.qid); setContextMenu(null); }}
          onBlock={() => handleBlockEntity(contextMenu.qid)}
          onSetAsSource={() => setContextMenu(null)}
        />
      )}

      {/* Edge context menu */}
      {edgeMenu && (
        <div
          className="context-menu"
          style={{ left: Math.min(edgeMenu.x, window.innerWidth - 220), top: Math.min(edgeMenu.y, window.innerHeight - 100) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: "6px 12px 4px", fontSize: "0.7rem", color: "#818cf8", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: 2 }}>
            {edgeMenu.propertyLabel}
          </div>
          <button onClick={() => handleBlockProperty(edgeMenu.propertyId)}>
            <span style={{ color: "#f472b6" }}>x</span> Block "{edgeMenu.propertyLabel}" and re-search
          </button>
        </div>
      )}

      {/* Controls */}
      {hasGraph && (
        <div className="controls-overlay">
          <div className="controls-card">
            <span style={{ fontSize: "0.72rem", color: "#555" }}>
              {(hasPathGraph ? result!.path.length + 1 : exploreRoot!.properties.length + 1)} nodes
            </span>
            <button className="btn-ghost" onClick={() => { reset(); setSelectedNode(null); }}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
