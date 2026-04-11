from pydantic import BaseModel


class EntitySearchResult(BaseModel):
    qid: str
    label: str
    description: str | None = None


class PathRequest(BaseModel):
    source_qid: str
    target_qid: str
    max_depth: int = 4
    filter_categories: list[str] | None = None
    max_sitelinks: int | None = None
    blocked_properties: list[str] | None = None  # extra property IDs to block (e.g. ["P106", "P27"])
    blocked_entities: list[str] | None = None  # extra entity QIDs to block (e.g. ["Q82955"])


class PathEdge(BaseModel):
    source_qid: str
    source_label: str
    property_id: str
    property_label: str
    target_qid: str
    target_label: str


class PathResponse(BaseModel):
    found: bool
    path: list[PathEdge] = []
    hops: int = 0
    cached: bool = False
    search_time_ms: int = 0


class EntityProperty(BaseModel):
    property_id: str
    property_label: str
    target_qid: str
    target_label: str
    direction: str  # "outgoing" or "incoming"


class EntityDetail(BaseModel):
    qid: str
    label: str
    description: str | None = None
    properties: list[EntityProperty] = []


class WikipediaSummary(BaseModel):
    qid: str
    title: str
    extract: str
    thumbnail_url: str | None = None
