import aiosqlite
from pathlib import Path

from . import config

_db: aiosqlite.Connection | None = None

SCHEMA = """
CREATE TABLE IF NOT EXISTS entities (
    qid TEXT PRIMARY KEY,
    label TEXT,
    description TEXT,
    wikipedia_title TEXT,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_cache (
    query_text TEXT NOT NULL,
    results_json TEXT NOT NULL,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (query_text)
);

CREATE TABLE IF NOT EXISTS neighbors (
    source_qid TEXT NOT NULL,
    property_id TEXT NOT NULL,
    property_label TEXT,
    target_qid TEXT NOT NULL,
    target_label TEXT,
    direction TEXT NOT NULL DEFAULT 'outgoing',
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_qid, property_id, target_qid, direction)
);

CREATE TABLE IF NOT EXISTS paths (
    source_qid TEXT NOT NULL,
    target_qid TEXT NOT NULL,
    path_json TEXT NOT NULL,
    hops INTEGER NOT NULL,
    found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_qid, target_qid)
);

CREATE TABLE IF NOT EXISTS sitelink_counts (
    qid TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS summaries (
    qid TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    extract TEXT,
    thumbnail_url TEXT,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_neighbors_source ON neighbors(source_qid);
CREATE INDEX IF NOT EXISTS idx_neighbors_target ON neighbors(target_qid);
"""


async def get_db() -> aiosqlite.Connection:
    global _db
    if _db is None:
        db_path = Path(__file__).parent.parent / config.DB_PATH
        db_path.parent.mkdir(parents=True, exist_ok=True)
        _db = await aiosqlite.connect(str(db_path))
        _db.row_factory = aiosqlite.Row
        await _db.executescript(SCHEMA)
        await _db.commit()
    return _db


async def close_db():
    global _db
    if _db:
        await _db.close()
        _db = None
