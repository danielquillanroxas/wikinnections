from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .database import get_db, close_db
from .routers import search, pathfind, entity, summary

STATIC_DIR = Path(__file__).parent.parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_db()
    yield
    await close_db()


app = FastAPI(title="Wikinnections", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api")
app.include_router(pathfind.router, prefix="/api")
app.include_router(entity.router, prefix="/api")
app.include_router(summary.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Serve React build if it exists (production)
if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Try the exact file first, fall back to index.html (SPA routing)
        file = STATIC_DIR / full_path
        if file.is_file():
            return FileResponse(file)
        return FileResponse(STATIC_DIR / "index.html")
