from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import get_db, close_db
from .routers import search, pathfind, entity, summary


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_db()
    yield
    await close_db()


app = FastAPI(title="WikiGraph Explorer", lifespan=lifespan)

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
