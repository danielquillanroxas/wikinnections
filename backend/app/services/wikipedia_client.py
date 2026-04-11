import httpx

from .. import config


async def get_summary(title: str) -> dict | None:
    url = f"{config.WIKIPEDIA_API_URL}/{title}"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, headers={"User-Agent": config.USER_AGENT})
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        data = resp.json()
        thumbnail = None
        if "thumbnail" in data:
            thumbnail = data["thumbnail"].get("source")
        return {
            "title": data.get("title", title),
            "extract": data.get("extract", ""),
            "thumbnail_url": thumbnail,
        }
