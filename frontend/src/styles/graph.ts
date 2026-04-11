// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const graphStylesheet: any[] = [
  // ── Default node ──
  {
    selector: "node",
    style: {
      label: "data(label)",
      "background-color": "#6366f1",
      color: "#ccc",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-margin-y": 8,
      width: 36,
      height: 36,
      "font-size": "10px",
      "font-weight": "500",
      "text-wrap": "wrap",
      "text-max-width": "100px",
      "border-width": 2,
      "border-color": "#2a2a3a",
      "text-outline-width": 2,
      "text-outline-color": "#0f0f14",
      "overlay-opacity": 0,
      "transition-property":
        "background-color, border-color, border-width, width, height",
      "transition-duration": 300,
    },
  },
  // ── Source node ──
  {
    selector: "node.source",
    style: {
      "background-color": "#818cf8",
      "border-color": "#a78bfa",
      "border-width": 3,
      width: 46,
      height: 46,
      "font-size": "11px",
      "font-weight": "700",
      color: "#e0e0e0",
    },
  },
  // ── Target node ──
  {
    selector: "node.target",
    style: {
      "background-color": "#f472b6",
      "border-color": "#fb7185",
      "border-width": 3,
      width: 46,
      height: 46,
      "font-size": "11px",
      "font-weight": "700",
      color: "#e0e0e0",
    },
  },
  // ── Intermediate path nodes ──
  {
    selector: "node.path-node",
    style: {
      "background-color": "#fbbf24",
      "border-color": "#f59e0b",
      "border-width": 2,
      width: 38,
      height: 38,
      "font-size": "10px",
      color: "#e0e0e0",
    },
  },
  // ── Expanded neighbor nodes ──
  {
    selector: "node.expanded",
    style: {
      "background-color": "#8b5cf6",
      "border-color": "#a78bfa",
      "border-width": 2,
      width: 34,
      height: 34,
      "font-size": "9px",
    },
  },
  // ── Neighbor nodes ──
  {
    selector: "node.neighbor",
    style: {
      "background-color": "#4b5563",
      "border-color": "#6b7280",
      width: 32,
      height: 32,
      "font-size": "8px",
      color: "#aaa",
    },
  },
  // ── Selected ──
  {
    selector: "node:selected",
    style: {
      "border-width": 4,
      "border-color": "#818cf8",
    },
  },
  // ── Expandable (dashed) ──
  {
    selector: "node.expandable",
    style: {
      "border-color": "#fbbf24",
      "border-width": 2,
      "border-style": "dashed",
    },
  },
  // ── Default edge ──
  {
    selector: "edge",
    style: {
      label: "data(label)",
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      "line-color": "#333",
      "target-arrow-color": "#333",
      width: 1.5,
      "font-size": "7px",
      "text-rotation": "autorotate",
      "text-background-color": "#0f0f14",
      "text-background-opacity": 0.85,
      "text-background-padding": "2px",
      color: "#666",
      opacity: 0.5,
      "overlay-opacity": 0,
    },
  },
  // ── Path edge ──
  {
    selector: "edge.path-edge",
    style: {
      "line-color": "#818cf8",
      "target-arrow-color": "#818cf8",
      width: 2.5,
      "font-size": "9px",
      color: "#a78bfa",
      opacity: 1,
    },
  },
  // ── Neighbor edge ──
  {
    selector: "edge.neighbor-edge",
    style: {
      "line-color": "#4b5563",
      "target-arrow-color": "#4b5563",
      width: 1.2,
      opacity: 0.5,
      "font-size": "7px",
      color: "#6b7280",
    },
  },
];
