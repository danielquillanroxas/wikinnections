from fastapi import APIRouter, Query

from ..models import EntitySearchResult
from ..services import wikidata_client, cache

router = APIRouter()


@router.get("/search", response_model=list[EntitySearchResult])
async def search_entities(q: str = Query(..., min_length=1), limit: int = Query(7, ge=1, le=20)):
    cached = await cache.get_search_cache(q)
    if cached:
        return cached[:limit]

    results = await wikidata_client.search_entities(q, limit=limit)
    await cache.set_search_cache(q, results)
    return results
