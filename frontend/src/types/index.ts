export interface EntitySearchResult {
  qid: string;
  label: string;
  description: string | null;
}

export interface PathEdge {
  source_qid: string;
  source_label: string;
  property_id: string;
  property_label: string;
  target_qid: string;
  target_label: string;
}

export interface PathResponse {
  found: boolean;
  path: PathEdge[];
  hops: number;
  cached: boolean;
  search_time_ms: number;
}

export interface EntityProperty {
  property_id: string;
  property_label: string;
  target_qid: string;
  target_label: string;
  direction: string;
}

export interface EntityDetail {
  qid: string;
  label: string;
  description: string | null;
  properties: EntityProperty[];
}

export interface WikipediaSummary {
  qid: string;
  title: string;
  extract: string;
  thumbnail_url: string | null;
}
