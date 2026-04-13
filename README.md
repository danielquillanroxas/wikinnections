# Wikinnections

Ever wondered how Steve Jobs is connected to the Mayor of Ankara? Turns out, it's through his Syrian-born father, a shared border with Turkey, and a chain of citizenship links.

Wikinnections finds these hidden connections. Pick any two entities in the world — people, places, organizations, concepts — and the app traces a path between them through Wikidata's knowledge graph, visualizing every relationship along the way.

Link: https://wikinnections.onrender.com

## How it works

The backend runs a **bidirectional BFS** over Wikidata's SPARQL endpoint. It expands outward from both entities simultaneously, searching through ~50 curated relationship types (birthplace, employer, citizenship, awards, etc.) until the two frontiers meet. The result is the shortest chain of real-world relationships connecting your two picks.

The search is configurable. You can set **max hops** (4-8) to control how deep it goes, and a **popularity threshold** to block well-known entities (like "United States" or "politician") from appearing as intermediates — this forces more creative, obscure paths instead of obvious shortcuts.

If a path goes through something boring, just **click the edge or node** to block it and re-search for an alternative route.

There's also an **Explore mode** for browsing a single entity's neighborhood — see all its connections sorted by relevance, alphabetically, or grouped by property type.

## Filtering

The app blocks several categories of "shortcut" entities by default:

- **Type classes** like "human", "country", "city" — these connect everything trivially
- **Citizenship/country shortcuts** — blocks the P27/P17 properties that create lazy "Person A -> country -> Person B" chains
- **International orgs** like the UN, EU, NATO — universal connectors that make every path boring
- **Media types**, **Wikimedia internal pages**, **scientific entities** — noise that clutters paths

All filters are toggleable. You can also adjust the sitelink threshold with a slider — lower values mean only obscure entities can appear as intermediates.

## Data

All data comes from **Wikidata**, queried live through its public SPARQL endpoint. No dumps, no local copies. Article summaries and thumbnails come from the **Wikipedia REST API** on demand. Search autocomplete uses the **Wikidata wbsearchentities API**.

The app traverses 50 curated Wikidata properties across categories: people (birthplace, employer, spouse, awards...), places (capital, borders, head of state...), organizations (HQ, founder, CEO...), and creative works (author, director, cast...).

Results are cached in a local SQLite database to avoid redundant SPARQL queries.

## Tech stack

**Backend**: Python, FastAPI, httpx for async HTTP, aiosqlite for caching. The pathfinder makes iterative SPARQL queries with batched frontier expansion and supports blocking specific properties and entities per request.

**Frontend**: React + TypeScript, built with Vite. Graph visualization with Cytoscape.js (cose-bilkent layout). Interactive particle network background on the landing page (Canvas 2D). Dark theme with floating glass-morphism panels.

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
3. Connect the repo — Render handles the rest

Or manually: build with `bash build.sh`, start with `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

## References

- [Wikidata](https://www.wikidata.org/) — the knowledge base behind everything here (CC0)
- [Wikidata Query Service](https://query.wikidata.org/) — the SPARQL endpoint
- [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) — summaries and thumbnails
- [Cytoscape.js](https://js.cytoscape.org/) — graph rendering
- [cytoscape-cose-bilkent](https://github.com/cytoscape/cytoscape.js-cose-bilkent) — layout algorithm
