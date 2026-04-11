import json
from datetime import datetime, timedelta

from ..database import get_db
from .. import config


def _is_fresh(fetched_at: str) -> bool:
    ts = datetime.fromisoformat(fetched_at)
    return datetime.utcnow() - ts < timedelta(days=config.CACHE_EXPIRY_DAYS)


async def get_search_cache(query_text: str) -> list[dict] | None:
    db = await get_db()
    row = await db.execute_fetchall(
        "SELECT results_json, fetched_at FROM search_cache WHERE query_text = ?",
        (query_text.lower(),),
    )
    if row and _is_fresh(row[0]["fetched_at"]):
        return json.loads(row[0]["results_json"])
    return None


async def set_search_cache(query_text: str, results: list[dict]):
    db = await get_db()
    await db.execute(
        "INSERT OR REPLACE INTO search_cache (query_text, results_json, fetched_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        (query_text.lower(), json.dumps(results)),
    )
    await db.commit()


async def get_cached_neighbors(qid: str, direction: str) -> list[dict] | None:
    db = await get_db()
    rows = await db.execute_fetchall(
        "SELECT property_id, property_label, target_qid, target_label, fetched_at "
        "FROM neighbors WHERE source_qid = ? AND direction = ?",
        (qid, direction),
    )
    if not rows:
        return None
    if not _is_fresh(rows[0]["fetched_at"]):
        return None
    return [dict(r) for r in rows]


async def set_neighbors(qid: str, direction: str, neighbors: list[dict]):
    db = await get_db()
    # Clear old entries
    await db.execute(
        "DELETE FROM neighbors WHERE source_qid = ? AND direction = ?",
        (qid, direction),
    )
    for n in neighbors:
        await db.execute(
            "INSERT OR REPLACE INTO neighbors (source_qid, property_id, property_label, target_qid, target_label, direction, fetched_at) "
            "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
            (qid, n["property_id"], n.get("property_label", ""), n["target_qid"], n.get("target_label", ""), direction),
        )
    await db.commit()


async def get_cached_path(source_qid: str, target_qid: str) -> dict | None:
    db = await get_db()
    rows = await db.execute_fetchall(
        "SELECT path_json, hops, found_at FROM paths WHERE source_qid = ? AND target_qid = ?",
        (source_qid, target_qid),
    )
    if rows and _is_fresh(rows[0]["found_at"]):
        return {"path": json.loads(rows[0]["path_json"]), "hops": rows[0]["hops"]}
    return None


async def set_path(source_qid: str, target_qid: str, path: list[dict], hops: int):
    db = await get_db()
    await db.execute(
        "INSERT OR REPLACE INTO paths (source_qid, target_qid, path_json, hops, found_at) "
        "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
        (source_qid, target_qid, json.dumps(path), hops),
    )
    await db.commit()


async def get_cached_summary(qid: str) -> dict | None:
    db = await get_db()
    rows = await db.execute_fetchall(
        "SELECT title, extract, thumbnail_url, fetched_at FROM summaries WHERE qid = ?",
        (qid,),
    )
    if rows and _is_fresh(rows[0]["fetched_at"]):
        return dict(rows[0])
    return None


async def set_summary(qid: str, title: str, extract: str, thumbnail_url: str | None):
    db = await get_db()
    await db.execute(
        "INSERT OR REPLACE INTO summaries (qid, title, extract, thumbnail_url, fetched_at) "
        "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
        (qid, title, extract, thumbnail_url),
    )
    await db.commit()


async def cache_entity(qid: str, label: str, description: str | None = None, wikipedia_title: str | None = None):
    db = await get_db()
    await db.execute(
        "INSERT OR REPLACE INTO entities (qid, label, description, wikipedia_title, fetched_at) "
        "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
        (qid, label, description, wikipedia_title),
    )
    await db.commit()


async def get_cached_sitelink_counts(qids: list[str]) -> dict[str, int | None]:
    """Return {qid: count_or_None} for all requested qids. None = not cached."""
    db = await get_db()
    result: dict[str, int | None] = {q: None for q in qids}
    if not qids:
        return result
    placeholders = ",".join("?" for _ in qids)
    rows = await db.execute_fetchall(
        f"SELECT qid, count, fetched_at FROM sitelink_counts WHERE qid IN ({placeholders})",
        tuple(qids),
    )
    for r in rows:
        if _is_fresh(r["fetched_at"]):
            result[r["qid"]] = r["count"]
    return result


async def set_sitelink_counts(counts: dict[str, int]):
    db = await get_db()
    for qid, count in counts.items():
        await db.execute(
            "INSERT OR REPLACE INTO sitelink_counts (qid, count, fetched_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
            (qid, count),
        )
    await db.commit()


async def get_cached_entity(qid: str) -> dict | None:
    db = await get_db()
    rows = await db.execute_fetchall(
        "SELECT label, description, wikipedia_title, fetched_at FROM entities WHERE qid = ?",
        (qid,),
    )
    if rows and _is_fresh(rows[0]["fetched_at"]):
        return dict(rows[0])
    return None
