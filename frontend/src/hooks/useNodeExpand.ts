import { useState, useCallback } from "react";
import type { EntityDetail } from "../types";
import { getEntity } from "../api/client";

export function useNodeExpand() {
  const [expandedNodes, setExpandedNodes] = useState<Map<string, EntityDetail>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);

  const expand = useCallback(
    async (qid: string) => {
      if (expandedNodes.has(qid)) return expandedNodes.get(qid)!;

      setLoading(true);
      try {
        const detail = await getEntity(qid);
        setExpandedNodes((prev) => new Map(prev).set(qid, detail));
        return detail;
      } finally {
        setLoading(false);
      }
    },
    [expandedNodes]
  );

  const reset = useCallback(() => {
    setExpandedNodes(new Map());
  }, []);

  return { expandedNodes, loading, expand, reset };
}
