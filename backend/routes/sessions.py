from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend.db.database import get_db
from backend.db.models import SessionModel, MessageModel, ArtifactModel

router = APIRouter(prefix="/sessions", tags=["sessions"])

class SessionCreate(BaseModel):
    title: Optional[str] = "New Growth Chat"
    llm_provider: Optional[str] = "ollama"
    llm_model: Optional[str] = "llama3.2"

class SessionUpdate(BaseModel):
    title: Optional[str] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None

@router.get("/")
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SessionModel).order_by(SessionModel.updated_at.desc())
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "llm_provider": s.llm_provider,
            "llm_model": s.llm_model,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
        }
        for s in sessions
    ]

@router.post("/")
async def create_session(payload: SessionCreate, db: AsyncSession = Depends(get_db)):
    new_session = SessionModel(
        title=payload.title or "New Growth Chat",
        llm_provider=payload.llm_provider or "ollama",
        llm_model=payload.llm_model or "llama3.2"
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return {
        "id": new_session.id,
        "title": new_session.title,
        "llm_provider": new_session.llm_provider,
        "llm_model": new_session.llm_model,
        "created_at": new_session.created_at.isoformat(),
        "updated_at": new_session.updated_at.isoformat(),
        "messages": [],
        "artifacts": []
    }

@router.get("/{session_id}")
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SessionModel)
        .options(selectinload(SessionModel.messages), selectinload(SessionModel.artifacts))
        .filter(SessionModel.id == session_id)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": session.id,
        "title": session.title,
        "llm_provider": session.llm_provider,
        "llm_model": session.llm_model,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat(),
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "sources": m.sources,
                "artifact_id": m.artifact_id,
                "created_at": m.created_at.isoformat()
            }
            for m in session.messages
        ],
        "artifacts": [
            {
                "id": a.id,
                "title": a.title,
                "artifact_type": a.artifact_type,
                "content": a.content,
                "language": a.language,
                "created_at": a.created_at.isoformat()
            }
            for a in session.artifacts
        ]
    }

@router.put("/{session_id}")
async def update_session(session_id: str, payload: SessionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SessionModel).filter(SessionModel.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if payload.title is not None:
        session.title = payload.title
    if payload.llm_provider is not None:
        session.llm_provider = payload.llm_provider
    if payload.llm_model is not None:
        session.llm_model = payload.llm_model

    session.updated_at = datetime.utcnow()
    await db.commit()
    return {"status": "success", "id": session.id, "title": session.title}

@router.delete("/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SessionModel).filter(SessionModel.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    await db.commit()
    return {"status": "deleted", "id": session_id}
