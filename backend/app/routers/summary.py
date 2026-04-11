from fastapi import APIRouter, HTTPException

from ..models import WikipediaSummary
from ..services import wikidata_client, wikipedia_client, cache

router = APIRouter()


@router.get("/summary/{qid}", response_model=WikipediaSummary)
async def get_summary(qid: str):
    # Check cache
    cached = await cache.get_cached_summary(qid)
    if cached:
        return WikipediaSummary(qid=qid, **{k: v for k, v in cached.items() if k != "fetched_at"})

    # Resolve QID to Wikipedia title
    title = await wikidata_client.get_wikipedia_title(qid)
    if not title:
        raise HTTPException(status_code=404, detail=f"No English Wikipedia article for {qid}")

    # Fetch summary
    summary = await wikipedia_client.get_summary(title)
    if not summary:
        raise HTTPException(status_code=404, detail=f"Wikipedia summary not found for {title}")

    await cache.set_summary(qid, summary["title"], summary["extract"], summary.get("thumbnail_url"))

    return WikipediaSummary(qid=qid, **summary)
