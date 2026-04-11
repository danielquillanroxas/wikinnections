import { useState, useCallback, useEffect } from "react";
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

  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; qid: string; label: string; isExpanded: boolean;
  } | null>(null);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const handlePathSearch = useCallback(
    (src: string, tgt: string, filters: string[], maxSitelinks: number | null) => {
      setSourceQid(src);
      setTargetQid(tgt);
      setSelectedNode(null);
      setContextMenu(null);
      setExploreRoot(null);
      reset();
      search(src, tgt, filters, maxSitelinks);
    },
    [search, reset]
  );

  const handleExploreSearch = useCallback(
    async (qid: string, limit: number, sort: string) => {
      setExploreLoading(true);
      setSelectedNode(null);
      setContextMenu(null);
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
  }, []);

  const handleNodeContext = useCallback(
    (qid: string, label: string, x: number, y: number) => {
      setContextMenu({ x, y, qid, label, isExpanded: expandedNodes.has(qid) });
    },
    [expandedNodes]
  );

  const handleNodeExpand = useCallback(
    (qid: string) => { expand(qid); setContextMenu(null); },
    [expand]
  );

  const loading = pathLoading || exploreLoading;
  const hasPathGraph = result?.found && result.path.length > 0;
  const hasExploreGraph = exploreRoot !== null;
  const hasGraph = hasPathGraph || hasExploreGraph;

  // Build explore-mode path edges from the root entity
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
      {/* Full-viewport graph */}
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
          />
        ) : (
          <>
            {/* Interactive particle network background */}
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

      {/* Floating search panel */}
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

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          qid={contextMenu.qid} label={contextMenu.label}
          isExpanded={contextMenu.isExpanded}
          onExpand={() => handleNodeExpand(contextMenu.qid)}
          onOpenWikipedia={() => { setSelectedNode(contextMenu.qid); setContextMenu(null); }}
          onSetAsSource={() => setContextMenu(null)}
        />
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
