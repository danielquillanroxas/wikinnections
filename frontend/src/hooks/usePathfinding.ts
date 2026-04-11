import { useState, useCallback } from "react";
import type { PathResponse } from "../types";
import { findPath } from "../api/client";

export function usePathfinding() {
  const [result, setResult] = useState<PathResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (sourceQid: string, targetQid: string, filterCategories?: string[], maxSitelinks?: number | null, maxDepth = 4) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await findPath(sourceQid, targetQid, maxDepth, filterCategories, maxSitelinks);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Path search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, search };
}
