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


@router.post("/path", response_model=PathResponse)
async def find_entity_path(req: PathRequest):
    try:
        result = await find_path(req.source_qid, req.target_qid, req.max_depth, req.filter_categories, req.max_sitelinks)
        return PathResponse(**result)
    except Exception as e:
        traceback.print_exc()
        # Return a graceful "not found" instead of 500
        return PathResponse(
            found=False, path=[], hops=0, cached=False,
            search_time_ms=0,
        )
