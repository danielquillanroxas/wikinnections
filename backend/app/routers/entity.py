from fastapi import APIRouter, Query

from ..models import EntityDetail, EntityProperty
from ..services import wikidata_client, cache

router = APIRouter()


@router.get("/entity/{qid}", response_model=EntityDetail)
async def get_entity(
    qid: str,
    limit: int = Query(0, ge=0, le=200),
    sort: str = Query("connections", pattern="^(connections|alpha|property)$"),
    include_incoming: bool = Query(False),
):
    # Get label
    cached_entity = await cache.get_cached_entity(qid)
    if cached_entity:
        label = cached_entity["label"]
        description = cached_entity.get("description")
    else:
        info = await wikidata_client.get_entity_label(qid)
        label = info["label"]
        description = info.get("description")
        await cache.cache_entity(qid, label, description)

    # Get outgoing neighbors
    cached_out = await cache.get_cached_neighbors(qid, "outgoing")
    if cached_out is None:
        results = await wikidata_client.get_neighbors_outgoing([qid])
        neighbors = []
        for r in results:
            neighbors.append({
                "property_id": r["prop"],
                "target_qid": r["target"],
                "target_label": r.get("targetLabel", r["target"]),
            })
        await cache.set_neighbors(qid, "outgoing", neighbors)
        cached_out = neighbors

    # Optionally include incoming neighbors
    all_neighbors = list(cached_out)
    if include_incoming:
        cached_in = await cache.get_cached_neighbors(qid, "incoming")
        if cached_in is None:
            results = await wikidata_client.get_neighbors_incoming([qid], limit=100)
            incoming = []
            for r in results:
                incoming.append({
                    "property_id": r["prop"],
                    "target_qid": r["source"],
                    "target_label": r.get("sourceLabel", r["source"]),
                    "direction": "incoming",
                })
            await cache.set_neighbors(qid, "incoming", incoming)
            cached_in = incoming
        all_neighbors.extend(cached_in)

    # Resolve property labels
    pids = list({n["property_id"] for n in all_neighbors})
    prop_labels = await wikidata_client.get_property_labels(pids)

    properties = [
        EntityProperty(
            property_id=n["property_id"],
            property_label=prop_labels.get(n["property_id"], n["property_id"]),
            target_qid=n["target_qid"],
            target_label=n.get("target_label", n["target_qid"]),
            direction=n.get("direction", "outgoing"),
        )
        for n in all_neighbors
    ]

    # Sort
    if sort == "alpha":
        properties.sort(key=lambda p: p.target_label.lower())
    elif sort == "property":
        properties.sort(key=lambda p: p.property_label.lower())
    # "connections" keeps the natural order (most relevant first from SPARQL)

    # Limit
    if limit > 0:
        properties = properties[:limit]

    return EntityDetail(qid=qid, label=label, description=description, properties=properties)
