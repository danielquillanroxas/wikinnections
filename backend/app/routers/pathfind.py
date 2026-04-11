import traceback

from fastapi import APIRouter

from .. import config
from ..models import PathRequest, PathResponse
from ..services.pathfinder import find_path

router = APIRouter()


@router.get("/filters")
async def get_filter_categories():
    return [
        {"key": key, "label": cat["label"], "default": cat["default"]}
        for key, cat in config.SUPERNODE_CATEGORIES.items()
    ]


@router.post("/path")
async def find_entity_path(req: PathRequest):
    try:
        result = await find_path(req.source_qid, req.target_qid, req.max_depth, req.filter_categories, req.max_sitelinks)
        return result
    except Exception as e:
        traceback.print_exc()
        msg = str(e)
        if "timeout" in msg.lower() or "timed out" in msg.lower():
            detail = "Search timed out. Try fewer hops or enable more filters."
        else:
            detail = f"Search failed: {msg}"
        return {"found": False, "path": [], "hops": 0, "cached": False, "search_time_ms": 0, "error": detail}
