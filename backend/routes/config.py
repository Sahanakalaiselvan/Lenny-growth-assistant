import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.config import settings
from backend.services.rag_engine import rag_engine
from backend.db.database import get_db
from backend.db.models import ConfigModel

router = APIRouter(prefix="/config", tags=["config"])

class APIKeyUpdatePayload(BaseModel):
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

@router.get("/")
async def get_config():
    ollama_online = False
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags")
            if res.status_code == 200:
                ollama_online = True
    except Exception:
        ollama_online = False

    return {
        "project_name": settings.PROJECT_NAME,
        "default_provider": settings.DEFAULT_PROVIDER,
        "default_model": settings.DEFAULT_MODEL,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "ollama_online": ollama_online,
        "has_anthropic_key": bool(settings.ANTHROPIC_API_KEY),
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "rag_chunk_count": len(rag_engine.chunks),
        "rag_is_indexed": rag_engine.is_indexed
    }

@router.post("/keys")
async def update_api_keys(payload: APIKeyUpdatePayload, db: AsyncSession = Depends(get_db)):
    if payload.anthropic_api_key is not None:
        key_val = payload.anthropic_api_key.strip()
        settings.ANTHROPIC_API_KEY = key_val
        key_record = await db.get(ConfigModel, "ANTHROPIC_API_KEY")
        if not key_record:
            key_record = ConfigModel(key="ANTHROPIC_API_KEY", value=key_val)
            db.add(key_record)
        else:
            key_record.value = key_val

    if payload.openai_api_key is not None:
        key_val = payload.openai_api_key.strip()
        settings.OPENAI_API_KEY = key_val
        key_record = await db.get(ConfigModel, "OPENAI_API_KEY")
        if not key_record:
            key_record = ConfigModel(key="OPENAI_API_KEY", value=key_val)
            db.add(key_record)
        else:
            key_record.value = key_val

    await db.commit()

    return {
        "status": "success",
        "has_anthropic_key": bool(settings.ANTHROPIC_API_KEY),
        "has_openai_key": bool(settings.OPENAI_API_KEY)
    }

