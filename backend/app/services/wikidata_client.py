import asyncio
import httpx

from .. import config

_semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_SPARQL)
_last_request_time = 0.0


async def _rate_limited_request(client: httpx.AsyncClient, **kwargs) -> httpx.Response:
    global _last_request_time
    async with _semaphore:
        now = asyncio.get_event_loop().time()
        wait = (1.0 / config.SPARQL_RATE_LIMIT_PER_SEC) - (now - _last_request_time)
        if wait > 0:
            await asyncio.sleep(wait)
        _last_request_time = asyncio.get_event_loop().time()
        return await client.request(**kwargs)


def _get_headers():
    return {"User-Agent": config.USER_AGENT}


async def search_entities(query: str, limit: int = 7) -> list[dict]:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            config.WIKIDATA_API_URL,
            params={
                "action": "wbsearchentities",
                "search": query,
                "language": "en",
                "limit": limit,
                "format": "json",
            },
            headers=_get_headers(),
        )
        resp.raise_for_status()
        data = resp.json()
        return [
            {
                "qid": r["id"],
                "label": r.get("label", r["id"]),
                "description": r.get("description", ""),
            }
            for r in data.get("search", [])
        ]


async def sparql_query(query: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=config.SPARQL_TIMEOUT_SEC) as client:
        resp = await _rate_limited_request(
            client,
            method="GET",
            url=config.WIKIDATA_SPARQL_URL,
            params={"query": query, "format": "json"},
            headers={**_get_headers(), "Accept": "application/sparql-results+json"},
        )
        resp.raise_for_status()
        data = resp.json()
        results = []
        for binding in data.get("results", {}).get("bindings", []):
            row = {}
            for key, val in binding.items():
                v = val.get("value", "")
                if v.startswith("http://www.wikidata.org/entity/"):
                    v = v.split("/")[-1]
                elif v.startswith("http://www.wikidata.org/prop/direct/"):
                    v = v.split("/")[-1]
                row[key] = v
            results.append(row)
        return results


def _prop_values_clause() -> str:
    props = " ".join(f"wdt:{p}" for p in config.PROPERTIES)
    return f"VALUES ?prop {{ {props} }}"


async def get_neighbors_outgoing(qids: list[str]) -> list[dict]:
    qid_values = " ".join(f"wd:{q}" for q in qids)
    query = f"""
    SELECT ?source ?prop ?target ?targetLabel WHERE {{
      VALUES ?source {{ {qid_values} }}
      {_prop_values_clause()}
      ?source ?prop ?target .
      FILTER(isIRI(?target))
      FILTER(STRSTARTS(STR(?target), "http://www.wikidata.org/entity/Q"))
      SERVICE wikibase:label {{
        bd:serviceParam wikibase:language "en" .
        ?target rdfs:label ?targetLabel .
      }}
    }}
    """
    return await sparql_query(query)


async def get_neighbors_incoming(qids: list[str], limit: int | None = None) -> list[dict]:
    qid_values = " ".join(f"wd:{q}" for q in qids)
    limit_clause = f"LIMIT {limit}" if limit else ""
    query = f"""
    SELECT ?source ?prop ?target ?sourceLabel WHERE {{
      VALUES ?target {{ {qid_values} }}
      {_prop_values_clause()}
      ?source ?prop ?target .
      FILTER(isIRI(?source))
      FILTER(STRSTARTS(STR(?source), "http://www.wikidata.org/entity/Q"))
      SERVICE wikibase:label {{
        bd:serviceParam wikibase:language "en" .
        ?source rdfs:label ?sourceLabel .
      }}
    }}
    {limit_clause}
    """
    return await sparql_query(query)


async def get_entity_label(qid: str) -> dict:
    query = f"""
    SELECT ?label ?description WHERE {{
      wd:{qid} rdfs:label ?label .
      FILTER(LANG(?label) = "en")
      OPTIONAL {{
        wd:{qid} schema:description ?description .
        FILTER(LANG(?description) = "en")
      }}
    }}
    LIMIT 1
    """
    results = await sparql_query(query)
    if results:
        return {"label": results[0].get("label", qid), "description": results[0].get("description")}
    return {"label": qid, "description": None}


async def get_entity_labels(qids: list[str]) -> dict[str, str]:
    if not qids:
        return {}
    qid_values = " ".join(f"wd:{q}" for q in qids)
    query = f"""
    SELECT ?entity ?label WHERE {{
      VALUES ?entity {{ {qid_values} }}
      ?entity rdfs:label ?label .
      FILTER(LANG(?label) = "en")
    }}
    """
    results = await sparql_query(query)
    return {r["entity"]: r.get("label", r["entity"]) for r in results}


async def get_property_labels(pids: list[str]) -> dict[str, str]:
    if not pids:
        return {}
    pid_values = " ".join(f"wd:{p}" for p in pids)
    query = f"""
    SELECT ?prop ?propLabel WHERE {{
      VALUES ?prop {{ {pid_values} }}
      SERVICE wikibase:label {{
        bd:serviceParam wikibase:language "en" .
      }}
    }}
    """
    results = await sparql_query(query)
    return {r["prop"]: r.get("propLabel", r["prop"]) for r in results}


async def get_sitelink_counts(qids: list[str]) -> dict[str, int]:
    """Get the number of sitelinks for each entity via the Wikidata API.
    Uses wbgetentities which is fast — avoids the expensive SPARQL schema:about join.
    """
    if not qids:
        return {}
    result: dict[str, int] = {}
    # API accepts up to 50 IDs per request
    for i in range(0, len(qids), 50):
        batch = qids[i : i + 50]
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                config.WIKIDATA_API_URL,
                params={
                    "action": "wbgetentities",
                    "ids": "|".join(batch),
                    "props": "sitelinks",
                    "format": "json",
                },
                headers=_get_headers(),
            )
            resp.raise_for_status()
            data = resp.json()
            for qid, entity in data.get("entities", {}).items():
                sitelinks = entity.get("sitelinks", {})
                result[qid] = len(sitelinks)
    return result


async def get_wikipedia_title(qid: str) -> str | None:
    query = f"""
    SELECT ?article WHERE {{
      ?article schema:about wd:{qid} ;
               schema:isPartOf <https://en.wikipedia.org/> .
    }}
    LIMIT 1
    """
    results = await sparql_query(query)
    if results:
        url = results[0].get("article", "")
        if "en.wikipedia.org/wiki/" in url:
            return url.split("/wiki/")[-1]
    return None
