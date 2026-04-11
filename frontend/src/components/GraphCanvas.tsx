import { useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import type { PathEdge, EntityDetail } from "../types";
import { graphStylesheet } from "../styles/graph";

cytoscape.use(coseBilkent);

interface Props {
  path: PathEdge[];
  sourceQid: string | null;
  targetQid: string | null;
  expandedNodes: Map<string, EntityDetail>;
  onNodeClick: (qid: string) => void;
  onNodeExpand: (qid: string) => void;
  onNodeContext: (qid: string, label: string, x: number, y: number) => void;
}

export function GraphCanvas({
  path,
  sourceQid,
  targetQid,
  expandedNodes,
  onNodeClick,
  onNodeExpand,
  onNodeContext,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Collect all path node QIDs for classification
  const pathNodeSet = useCallback(() => {
    const s = new Set<string>();
    for (const edge of path) {
      s.add(edge.source_qid);
      s.add(edge.target_qid);
    }
    return s;
  }, [path]);

  const buildElements = useCallback(() => {
    const nodes = new Map<string, { label: string; classes: string }>();
    const edges: { id: string; source: string; target: string; label: string; classes: string }[] = [];
    const pathNodes = pathNodeSet();

    // Path nodes and edges
    for (const edge of path) {
      for (const [qid, label] of [
        [edge.source_qid, edge.source_label],
        [edge.target_qid, edge.target_label],
      ] as [string, string][]) {
        if (!nodes.has(qid)) {
          let cls = "path-node";
          if (qid === sourceQid) cls = "source";
          else if (qid === targetQid) cls = "target";
          // Mark expandable if not yet expanded
          if (!expandedNodes.has(qid)) cls += " expandable";
          nodes.set(qid, { label, classes: cls });
        }
      }

      const edgeId = `${edge.source_qid}-${edge.property_id}-${edge.target_qid}`;
      if (!edges.find((e) => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: edge.source_qid,
          target: edge.target_qid,
          label: edge.property_label,
          classes: "path-edge",
        });
      }
    }

    // Expanded neighbor nodes
    for (const [qid, detail] of expandedNodes) {
      if (!nodes.has(qid)) {
        nodes.set(qid, { label: detail.label, classes: "expanded" });
      }

      for (const prop of detail.properties) {
        if (!nodes.has(prop.target_qid)) {
          const cls = pathNodes.has(prop.target_qid) ? "path-node" : "neighbor";
          nodes.set(prop.target_qid, { label: prop.target_label, classes: cls });
        }
        const edgeId = `${qid}-${prop.property_id}-${prop.target_qid}`;
        if (!edges.find((e) => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: qid,
            target: prop.target_qid,
            label: prop.property_label,
            classes: "neighbor-edge",
          });
        }
      }
    }

    return {
      nodes: Array.from(nodes.entries()).map(([id, data]) => ({
        data: { id, label: data.label },
        classes: data.classes,
      })),
      edges: edges.map((e) => ({
        data: { id: e.id, source: e.source, target: e.target, label: e.label },
        classes: e.classes,
      })),
    };
  }, [path, sourceQid, targetQid, expandedNodes, pathNodeSet]);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = buildElements();
    if (elements.nodes.length === 0) {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      return;
    }

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...elements.nodes, ...elements.edges],
      style: graphStylesheet as cytoscape.Stylesheet[],
      layout: {
        name: "cose-bilkent",
        animate: true,
        animationDuration: 800,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 180,
        edgeElasticity: 0.06,
        nodeRepulsion: 10000,
        gravity: 0.12,
        numIter: 2500,
        tile: true,
      } as unknown as cytoscape.LayoutOptions,
      minZoom: 0.2,
      maxZoom: 4,
      wheelSensitivity: 0.3,
    });

    // Single tap = select
    cy.on("tap", "node", (e) => {
      onNodeClick(e.target.id());
    });

    // Double tap = expand
    cy.on("dbltap", "node", (e) => {
      onNodeExpand(e.target.id());
    });

    // Right click = context menu
    cy.on("cxttap", "node", (e) => {
      const node = e.target;
      const pos = node.renderedPosition();
      const container = containerRef.current!.getBoundingClientRect();
      onNodeContext(
        node.id(),
        node.data("label"),
        container.left + pos.x,
        container.top + pos.y
      );
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [buildElements, onNodeClick, onNodeExpand, onNodeContext]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#0f0f14",
      }}
    />
  );
}
