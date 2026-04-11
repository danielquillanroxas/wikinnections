import time

from .. import config
from . import wikidata_client, cache


def _chunk(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


async def _expand_outgoing(qids: list[str]) -> list[tuple[str, str, str, str]]:
    """Returns list of (source_qid, property_id, target_qid, target_label)."""
    edges = []
    for batch in _chunk(qids, config.BFS_BATCH_SIZE):
        # Check cache first for each qid
        uncached = []
        for qid in batch:
            cached = await cache.get_cached_neighbors(qid, "outgoing")
            if cached:
                for n in cached:
                    edges.append((qid, n["property_id"], n["target_qid"], n.get("target_label", "")))
            else:
                uncached.append(qid)

        if uncached:
            results = await wikidata_client.get_neighbors_outgoing(uncached)
            # Group by source for caching
            by_source: dict[str, list[dict]] = {}
            for r in results:
                src = r["source"]
                tgt = r["target"]
                prop = r["prop"]
                label = r.get("targetLabel", tgt)
                edges.append((src, prop, tgt, label))
                by_source.setdefault(src, []).append({
                    "property_id": prop,
                    "target_qid": tgt,
                    "target_label": label,
                })
            for qid in uncached:
                await cache.set_neighbors(qid, "outgoing", by_source.get(qid, []))
    return edges


async def _expand_incoming(qids: list[str]) -> list[tuple[str, str, str, str]]:
    """Returns list of (source_qid, property_id, target_qid, source_label) where target is in qids."""
    edges = []
    for batch in _chunk(qids, config.BFS_BATCH_SIZE):
        uncached = []
        for qid in batch:
            cached = await cache.get_cached_neighbors(qid, "incoming")
            if cached:
                for n in cached:
                    edges.append((n["target_qid"], n["property_id"], qid, n.get("target_label", "")))
            else:
                uncached.append(qid)

        if uncached:
            results = await wikidata_client.get_neighbors_incoming(
                uncached, limit=config.INCOMING_NEIGHBOR_LIMIT
            )
            by_target: dict[str, list[dict]] = {}
            for r in results:
                src = r["source"]
                tgt = r["target"]
                prop = r["prop"]
                label = r.get("sourceLabel", src)
                edges.append((src, prop, tgt, label))
                by_target.setdefault(tgt, []).append({
                    "property_id": prop,
                    "target_qid": src,
                    "target_label": label,
                })
            for qid in uncached:
                await cache.set_neighbors(qid, "incoming", by_target.get(qid, []))
    return edges


async def _check_popularity(qids: list[str], max_sitelinks: int) -> set[str]:
    """Return set of QIDs that exceed the sitelink threshold (too popular)."""
    if not qids:
        return set()
    try:
        cached = await cache.get_cached_sitelink_counts(qids)
        uncached = [q for q, c in cached.items() if c is None]

        if uncached:
            fetched = await wikidata_client.get_sitelink_counts(uncached)
            await cache.set_sitelink_counts(fetched)
            for q, c in fetched.items():
                cached[q] = c

        return {q for q, c in cached.items() if c is not None and c > max_sitelinks}
    except Exception:
        return set()  # degrade gracefully — don't block the BFS


SEARCH_TIMEOUT_SEC = 360


async def find_path(source_qid: str, target_qid: str, max_depth: int = None, filter_categories: list[str] | None = None, max_sitelinks: int | None = None) -> dict:
    if max_depth is None:
        max_depth = config.BFS_MAX_DEPTH

    start_time = time.time()

    # Check cache — only use when filters are default (no custom filters/sitelinks)
    has_custom_filters = filter_categories is not None or max_sitelinks is not None
    cached = None if has_custom_filters else await cache.get_cached_path(source_qid, target_qid)
    if cached:
        return {
            "found": True,
            "path": cached["path"],
            "hops": cached["hops"],
            "cached": True,
            "search_time_ms": int((time.time() - start_time) * 1000),
        }

    if source_qid == target_qid:
        return {
            "found": True,
            "path": [],
            "hops": 0,
            "cached": False,
            "search_time_ms": 0,
        }

    # Bidirectional BFS
    # Build filters: blocked entities + blocked properties
    blocked_qids, blocked_props = config.get_filters(filter_categories)
    blacklist = blocked_qids - {source_qid, target_qid}
    # Build a filtered property list (remove blocked properties from the whitelist)
    allowed_properties = [p for p in config.PROPERTIES if p not in blocked_props]

    forward_parent: dict[str, tuple[str, str, str] | None] = {source_qid: None}
    backward_parent: dict[str, tuple[str, str, str] | None] = {target_qid: None}

    # Collect labels discovered during BFS for reliable label resolution
    # Pre-fetch labels for source and target (they're never "discovered" as neighbors)
    src_tgt_labels = await wikidata_client.get_entity_labels([source_qid, target_qid])
    known_labels: dict[str, str] = dict(src_tgt_labels)

    forward_frontier = [source_qid]
    backward_frontier = [target_qid]

    meeting_node = None

    for depth in range(max_depth):
        if time.time() - start_time > SEARCH_TIMEOUT_SEC:
            break
        if not forward_frontier and not backward_frontier:
            break

        # Expand the smaller frontier
        # Strategy: collect ALL new nodes first, filter by popularity, THEN check intersection
        if len(forward_frontier) <= len(backward_frontier) and forward_frontier:
            new_frontier = []
            out_edges = await _expand_outgoing(forward_frontier)
            for src, prop, tgt, label in out_edges:
                if label and label != tgt:
                    known_labels[tgt] = label
                if tgt in blacklist or prop in blocked_props:
                    continue
                if tgt not in forward_parent:
                    forward_parent[tgt] = (src, prop, "forward")
                    new_frontier.append(tgt)

            in_edges = await _expand_incoming(forward_frontier)
            for src, prop, tgt, label in in_edges:
                if label and label != src:
                    known_labels[src] = label
                if src in blacklist or prop in blocked_props:
                    continue
                if src not in forward_parent:
                    forward_parent[src] = (tgt, prop, "reverse")
                    new_frontier.append(src)

            # Popularity filter BEFORE intersection check
            if max_sitelinks and new_frontier:
                too_popular = await _check_popularity(new_frontier, max_sitelinks)
                if too_popular:
                    new_frontier = [q for q in new_frontier if q not in too_popular]
                    for q in too_popular:
                        forward_parent.pop(q, None)

            # NOW check for intersection with backward frontier
            for q in new_frontier:
                if q in backward_parent:
                    meeting_node = q
                    break

            forward_frontier = new_frontier
        elif backward_frontier:
            new_frontier = []
            out_edges = await _expand_outgoing(backward_frontier)
            for src, prop, tgt, label in out_edges:
                if label and label != tgt:
                    known_labels[tgt] = label
                if tgt in blacklist or prop in blocked_props:
                    continue
                if tgt not in backward_parent:
                    backward_parent[tgt] = (src, prop, "forward")
                    new_frontier.append(tgt)

            in_edges = await _expand_incoming(backward_frontier)
            for src, prop, tgt, label in in_edges:
                if label and label != src:
                    known_labels[src] = label
                if src in blacklist or prop in blocked_props:
                    continue
                if src not in backward_parent:
                    backward_parent[src] = (tgt, prop, "reverse")
                    new_frontier.append(src)

            # Popularity filter BEFORE intersection check
            if max_sitelinks and new_frontier:
                too_popular = await _check_popularity(new_frontier, max_sitelinks)
                if too_popular:
                    new_frontier = [q for q in new_frontier if q not in too_popular]
                    for q in too_popular:
                        backward_parent.pop(q, None)

            # NOW check for intersection with forward frontier
            for q in new_frontier:
                if q in forward_parent:
                    meeting_node = q
                    break

            backward_frontier = new_frontier

        if meeting_node:
            break

    if not meeting_node:
        return {
            "found": False,
            "path": [],
            "hops": 0,
            "cached": False,
            "search_time_ms": int((time.time() - start_time) * 1000),
        }

    # Reconstruct path
    path_edges = await _reconstruct_path(
        forward_parent, backward_parent, meeting_node, source_qid, target_qid,
        known_labels,
    )

    elapsed = int((time.time() - start_time) * 1000)

    # Cache the result
    path_dicts = [e.copy() for e in path_edges]
    await cache.set_path(source_qid, target_qid, path_dicts, len(path_dicts))

    return {
        "found": True,
        "path": path_edges,
        "hops": len(path_edges),
        "cached": False,
        "search_time_ms": elapsed,
    }


async def _reconstruct_path(
    forward_parent: dict,
    backward_parent: dict,
    meeting_node: str,
    source_qid: str,
    target_qid: str,
    known_labels: dict[str, str] | None = None,
) -> list[dict]:
    """Build an ordered list of edges from source to target through meeting_node.

    Each edge preserves the real Wikidata triple direction (source --prop--> target).
    Edges are returned in path-traversal order so consecutive edges share a node.
    """
    # Each entry: (path_from, path_to, prop, real_src, real_tgt)
    raw_edges: list[tuple[str, str, str, str, str]] = []

    # Forward half: trace from meeting back to source, collect edges, then reverse
    fwd_edges: list[tuple[str, str, str, str, str]] = []
    node = meeting_node
    while forward_parent.get(node) is not None:
        parent_qid, prop, direction = forward_parent[node]
        # path goes: parent_qid -> node
        if direction == "forward":
            # Real Wikidata edge: parent_qid -> node
            fwd_edges.append((parent_qid, node, prop, parent_qid, node))
        else:
            # Real Wikidata edge: node -> parent_qid (traversed backwards)
            fwd_edges.append((parent_qid, node, prop, node, parent_qid))
        node = parent_qid
    fwd_edges.reverse()
    raw_edges.extend(fwd_edges)

    # Backward half: trace from meeting back to target
    node = meeting_node
    while backward_parent.get(node) is not None:
        parent_qid, prop, direction = backward_parent[node]
        # In backward BFS, path goes: node -> parent_qid (toward target)
        if direction == "forward":
            # Backward BFS expanded outgoing from node, finding parent_qid
            # Real edge: node -> parent_qid
            raw_edges.append((node, parent_qid, prop, node, parent_qid))
        else:
            # Backward BFS expanded incoming to node, finding parent_qid
            # Real edge: parent_qid -> node
            raw_edges.append((node, parent_qid, prop, parent_qid, node))
        node = parent_qid

    # Collect all QIDs and property IDs for label resolution
    all_qids: set[str] = set()
    all_pids: set[str] = set()
    for _, _, prop, real_src, real_tgt in raw_edges:
        all_qids.add(real_src)
        all_qids.add(real_tgt)
        all_pids.add(prop)
    # Always include source and target
    all_qids.add(source_qid)
    all_qids.add(target_qid)

    entity_labels = await wikidata_client.get_entity_labels(list(all_qids))
    prop_labels = await wikidata_client.get_property_labels(list(all_pids))

    # Merge in known_labels from BFS as fallback
    if known_labels:
        for qid, label in known_labels.items():
            if qid not in entity_labels or entity_labels[qid] == qid:
                entity_labels[qid] = label

    def _label(qid: str) -> str:
        return entity_labels.get(qid, qid)

    path = []
    for path_from, path_to, prop, real_src, real_tgt in raw_edges:
        path.append({
            "source_qid": real_src,
            "source_label": _label(real_src),
            "property_id": prop,
            "property_label": prop_labels.get(prop, prop),
            "target_qid": real_tgt,
            "target_label": _label(real_tgt),
        })

    return path
