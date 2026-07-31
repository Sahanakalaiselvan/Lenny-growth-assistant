from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.db.database import get_db
from backend.db.models import ArtifactModel

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

@router.get("/{artifact_id}")
async def get_artifact(artifact_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ArtifactModel).filter(ArtifactModel.id == artifact_id))
    artifact = result.scalars().first()
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return {
        "id": artifact.id,
        "session_id": artifact.session_id,
        "title": artifact.title,
        "artifact_type": artifact.artifact_type,
        "content": artifact.content,
        "language": artifact.language,
        "created_at": artifact.created_at.isoformat()
    }

@router.get("/session/{session_id}")
async def list_session_artifacts(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ArtifactModel)
        .filter(ArtifactModel.session_id == session_id)
        .order_by(ArtifactModel.created_at.desc())
    )
    artifacts = result.scalars().all()
    return [
        {
            "id": a.id,
            "session_id": a.session_id,
            "title": a.title,
            "artifact_type": a.artifact_type,
            "content": a.content,
            "language": a.language,
            "created_at": a.created_at.isoformat()
        }
        for a in artifacts
    ]
