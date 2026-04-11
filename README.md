# Wikinnections

A knowledge graph explorer that finds and visualizes connections between any two entities using Wikidata. Search for two things (people, places, organizations, concepts) and discover how they're linked through a chain of real-world relationships.

Also supports single-entity exploration, where you can browse an entity's neighborhood, sorted by relevance, alphabetically, or by property type.

<!-- screenshot placeholder -->

## Features

- **Path finding**: Bidirectional BFS over Wikidata's SPARQL endpoint finds the shortest path between two entities
- **Explore mode**: Browse a single entity's direct connections with configurable neighbor count (10/25/50) and sort order
- **Popularity threshold**: Slider (0-500) that filters intermediate nodes by Wikipedia sitelink count, forcing more obscure/creative paths
- **Category filters**: Block type classes, citizenship shortcuts, international orgs, media types, scientific entities, and Wikimedia internal pages from appearing as intermediate nodes
- **Interactive graph**: Cytoscape.js visualization with click to inspect, double-click to expand neighbors, right-click context menu
- **Wikipedia summaries**: On-demand article summaries and thumbnails fetched from the Wikipedia REST API
- **SQLite caching**: Neighbors, search results, sitelink counts, and summaries are cached locally

## Data Sources

### Wikidata (via SPARQL endpoint)

All entity and relationship data comes from [Wikidata](https://www.wikidata.org/), a free and open knowledge base maintained by the Wikimedia Foundation. Data is queried live through the [Wikidata Query Service](https://query.wikidata.org/) SPARQL endpoint.

**Entity fields used:**
| Field | Description |
|---|---|
| QID | Unique Wikidata identifier (e.g., Q76 for Barack Obama) |
| `rdfs:label` | Human-readable entity name (English) |
| `schema:description` | Short description text |
| Sitelinks | Count of Wikipedia language editions linking to the entity (used as popularity proxy) |

**Relationship properties traversed** (50 curated properties):

| Category | Properties |
|---|---|
| General | instance of (P31), subclass of (P279), part of (P361), has part (P527) |
| People | country of citizenship (P27), place of birth (P19), place of death (P20), educated at (P69), employer (P108), position held (P39), spouse (P26), father (P22), mother (P25), child (P40), sibling (P3373), member of (P463), political party (P102), award received (P166), participant in (P1344), notable work (P800), occupation (P106), residence (P551) |
| Places | country (P17), located in admin territory (P131), capital (P36), contains admin territory (P150), continent (P30), shares border with (P47), official language (P37), head of government (P6), head of state (P35), capital of (P1376) |
| Organizations | headquarters location (P159), founded by (P112), owned by (P127), parent organization (P749), subsidiary (P355), CEO (P169), chairperson (P488) |
| Creative works | author (P50), director (P57), composer (P86), cast member (P161), performer (P175), record label (P264), country of origin (P495), genre (P136) |

### Wikipedia (via REST API)

Article summaries and thumbnail images are fetched on-demand from the [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/).

**Fields used:**
| Field | Description |
|---|---|
| `title` | Article title |
| `extract` | Plain-text summary of the article |
| `thumbnail.source` | URL of the article's thumbnail image |

### Wikidata Search API

Entity autocomplete uses the [Wikidata wbsearchentities API](https://www.wikidata.org/w/api.php?action=help&modules=wbsearchentities) to match user input to entity candidates.

## Architecture

```
Backend (Python)                    Frontend (React + TypeScript)
  FastAPI                             Vite dev server
  httpx (async HTTP)                  Cytoscape.js (graph viz)
  aiosqlite (cache)                   Canvas (particle background)
       |                                    |
       +--- Wikidata SPARQL endpoint -------+
       +--- Wikipedia REST API -------------+
```

**Backend** (`backend/`): FastAPI app with four API routes (`/api/search`, `/api/path`, `/api/entity/{qid}`, `/api/summary/{qid}`). The pathfinder runs application-level bidirectional BFS, making iterative SPARQL queries with batched frontier expansion. Results are cached in a local SQLite database.

**Frontend** (`frontend/`): React + TypeScript app built with Vite. The graph is rendered with Cytoscape.js using the cose-bilkent layout. The landing page has an interactive particle network background (Canvas 2D).

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
python run.py
# Runs on http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173 (proxies /api to backend)
```

## Deploy to Render (free tier)

This repo includes a `render.yaml` blueprint. One service serves both the API and the React build.

1. Fork or push this repo to your GitHub
2. Go to [render.com/blueprints](https://render.com/blueprints)
3. Click **New Blueprint Instance** and connect your repo
4. Render reads `render.yaml` and sets everything up
5. Done. Your app is live.

Alternatively, create a Web Service manually on Render:
- **Build Command**: `bash build.sh`
- **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## References

- [Wikidata](https://www.wikidata.org/) - Free knowledge base, CC0 license
- [Wikidata Query Service](https://query.wikidata.org/) - SPARQL endpoint for Wikidata
- [Wikidata SPARQL query service usage policy](https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual)
- [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) - Article summaries and metadata
- [Cytoscape.js](https://js.cytoscape.org/) - Graph visualization library
- [cytoscape-cose-bilkent](https://github.com/cytoscape/cytoscape.js-cose-bilkent) - Compound graph layout algorithm
