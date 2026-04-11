import type {
  EntitySearchResult,
  PathResponse,
  EntityDetail,
  WikipediaSummary,
} from "../types";

// In dev, Vite proxies /api to localhost:8000. In production, set VITE_API_URL.
const API_BASE = (import.meta.env.VITE_API_URL || "") + "/api";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${url}`, init);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

export async function searchEntities(
  query: string,
  limit = 7
): Promise<EntitySearchResult[]> {
  return fetchJSON(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

export interface FilterCategory {
  key: string;
  label: string;
  default: boolean;
}

export async function getFilters(): Promise<FilterCategory[]> {
  return fetchJSON("/filters");
}

export async function findPath(
  sourceQid: string,
  targetQid: string,
  maxDepth = 4,
  filterCategories?: string[],
  maxSitelinks?: number | null
): Promise<PathResponse> {
  return fetchJSON("/path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_qid: sourceQid,
      target_qid: targetQid,
      max_depth: maxDepth,
      filter_categories: filterCategories,
      max_sitelinks: maxSitelinks,
    }),
  });
}

export async function getEntity(
  qid: string,
  opts?: { limit?: number; sort?: string; includeIncoming?: boolean }
): Promise<EntityDetail> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.sort) params.set("sort", opts.sort);
  if (opts?.includeIncoming) params.set("include_incoming", "true");
  const qs = params.toString();
  return fetchJSON(`/entity/${qid}${qs ? `?${qs}` : ""}`);
}

export async function getSummary(qid: string): Promise<WikipediaSummary> {
  return fetchJSON(`/summary/${qid}`);
}
