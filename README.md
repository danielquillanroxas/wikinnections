# Wikinnections

A knowledge graph explorer that finds connections between any two entities using Wikidata. You pick two things (people, places, organizations, concepts) and it traces a path between them (if any) through real-world relationships.

There's also an Explore mode for browsing a single entity's neighborhood, sorted by relevance, alphabetically, or grouped by property type.

Link: https://wikinnections.onrender.com

## How it works

The backend runs a bidirectional BFS over Wikidata's SPARQL endpoint. It expands outward from both entities simultaneously, searching through ~50 curated relationship types (birthplace, employer, citizenship, awards, etc.) until the two frontiers meet. The result is the shortest chain of real-world relationships connecting the two picks.

The search is configurable. You can set max hops (4-8) to control depth, and a popularity threshold to block well-known entities (like "United States" or "politician") from appearing as intermediates. This pushes the search toward less obvious paths.

If a path goes through something uninteresting, you can click the edge or node to block it and re-search for an alternative route.

## Filtering

Several categories of shortcut entities are blocked by default:

- Type classes like "human", "country", "city" that connect everything trivially
- Citizenship/country properties (P27/P17) that create "Person A -> country -> Person B" chains
- International orgs like the UN, EU, NATO
- Media types, Wikimedia internal pages, scientific entities

All filters are toggleable. The sitelink threshold slider controls how famous an entity can be to appear as an intermediate. Lower values = only obscure entities allowed.

## Data

All data comes from Wikidata, queried live through its public SPARQL endpoint. No dumps or local copies. Article summaries and thumbnails come from the Wikipedia REST API on demand. Search autocomplete uses the Wikidata wbsearchentities API.

The app traverses 50 curated Wikidata properties across categories: people (birthplace, employer, spouse, awards), places (capital, borders, head of state), organizations (HQ, founder, CEO), and creative works (author, director, cast).

Results are cached in a local SQLite database to avoid redundant SPARQL queries.

## Tech stack

Backend: Python, FastAPI, httpx for async HTTP, aiosqlite for caching. The pathfinder makes iterative SPARQL queries with batched frontier expansion and supports blocking specific properties and entities per request.

Frontend: React + TypeScript, built with Vite. Graph visualization with Cytoscape.js (cose-bilkent layout). Particle network background on the landing page (Canvas 2D). Dark theme.

## Running locally

```bash
# Backend
cd backend
pip install -r requirements.txt
python run.py
# http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
# http://localhost:5173 (proxies /api to backend)
```

## Deploying

The repo includes a `render.yaml` blueprint for one-click deployment on Render (free tier). One service serves both the API and the React build.

1. Push this repo to GitHub
2. Go to [render.com/blueprints](https://render.com/blueprints)
3. Connect the repo, Render handles the rest

Or manually: build with `bash build.sh`, start with `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

## References

- [Wikidata](https://www.wikidata.org/) (CC0)
- [Wikidata Query Service](https://query.wikidata.org/)
- [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/)
- [Cytoscape.js](https://js.cytoscape.org/)
- [cytoscape-cose-bilkent](https://github.com/cytoscape/cytoscape.js-cose-bilkent)
