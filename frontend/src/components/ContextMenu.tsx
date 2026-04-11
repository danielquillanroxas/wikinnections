interface Props {
  x: number;
  y: number;
  qid: string;
  label: string;
  isExpanded: boolean;
  onExpand: () => void;
  onOpenWikipedia: () => void;
  onSetAsSource: () => void;
}

export function ContextMenu({
  x,
  y,
  label,
  isExpanded,
  onExpand,
  onOpenWikipedia,
}: Props) {
  // Keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 180);

  return (
    <div
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          padding: "6px 12px 4px",
          fontSize: "0.7rem",
          color: "#4ecdc4",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <button onClick={onOpenWikipedia}>
        <span style={{ opacity: 0.6 }}>W</span> View details
      </button>
      <button onClick={onExpand} disabled={isExpanded}>
        <span style={{ opacity: 0.6 }}>+</span>{" "}
        {isExpanded ? "Already expanded" : "Expand neighbors"}
      </button>
      <div className="sep" />
      <button
        onClick={() =>
          window.open(
            `https://www.wikidata.org/wiki/${label.includes("Q") ? label : ""}`,
            "_blank"
          )
        }
      >
        <span style={{ opacity: 0.6 }}>D</span> Open in Wikidata
      </button>
    </div>
  );
}
