import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.db.database import init_db
from backend.services.rag_engine import rag_engine
from backend.routes import sessions, chat, artifacts, config

from sqlalchemy.future import select
from backend.db.database import init_db, AsyncSessionLocal
from backend.db.models import ConfigModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB Tables
    print("[Main] Initializing database tables...")
    await init_db()
    
    # Load any saved API keys from DB
    try:
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(ConfigModel))
            for cfg in res.scalars().all():
                if cfg.key == "ANTHROPIC_API_KEY" and cfg.value:
                    settings.ANTHROPIC_API_KEY = cfg.value
                elif cfg.key == "OPENAI_API_KEY" and cfg.value:
                    settings.OPENAI_API_KEY = cfg.value
    except Exception as e:
        print(f"[Main Warning] Failed to load saved API keys: {e}")

    # Load and Index Lenny's Podcast Transcripts for RAG
    print("[Main] Indexing Lenny's Podcast transcripts for RAG...")
    try:
        rag_engine.load_transcripts()
    except Exception as e:
        print(f"[Main Warning] Failed to index transcripts: {e}")
        
    yield
    print("[Main] Shutting down Lenny Growth Assistant Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(sessions.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(artifacts.router, prefix=settings.API_V1_STR)
app.include_router(config.router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "rag_chunks": len(rag_engine.chunks)
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
