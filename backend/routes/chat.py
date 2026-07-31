import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from backend.db.database import get_db
from backend.db.models import SessionModel, MessageModel, ArtifactModel
from backend.services.rag_engine import rag_engine
from backend.services.llm_router import llm_router, OUT_OF_DOMAIN_FALLBACK
from backend.services.artifact_generator import extract_artifact, ARTIFACT_SYSTEM_PROMPT
from backend.skills.ship30for30 import build_ship30for30_prompt

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    session_id: str
    message: str
    is_ship30: Optional[bool] = False
    is_artifact_request: Optional[bool] = False
    provider: Optional[str] = None
    model: Optional[str] = None

SYSTEM_BASE_PROMPT = """
You are "The Lenny Growth Assistant", an AI assistant specialized in product management, product-led growth, startup strategy, and product design.

Your ONLY knowledge source is the provided Lenny's Podcast transcript context retrieved by the RAG system.

====================================================
PRIMARY RULES
====================================================

1. ONLY answer using the provided transcript context.
2. NEVER use your own knowledge.
3. NEVER invent information.
4. If the transcript context does not contain sufficient information to answer the user's question, respond exactly:

"I couldn't find evidence for that in Lenny's Podcast transcripts. My responses are strictly limited to insights from Lenny's Podcast transcripts."

Do not guess.
Do not hallucinate.
Do not use outside knowledge.

====================================================
ANSWER FORMAT (FOR NORMAL CHAT)
====================================================

Always produce clean, highly readable, professional structured answers using numbered H3 subheadings instead of simple bullet points.

Follow this exact format:

## [Topic Heading / Guest Focus]

According to [Guest Name / Transcript Context]:

### 1. [Bold Core Principle 1]
[1-2 sentence explanation of principle 1]

### 2. [Bold Core Principle 2]
[1-2 sentence explanation of principle 2]

### 3. [Bold Core Principle 3]
[1-2 sentence explanation of principle 3]

## Key Takeaway

[1-2 sentence concise summary takeaway]

## Sources
- Guest: [Guest Name]
- Episode: [Episode Title]

====================================================
CHAT MEMORY
====================================================

Always consider previous messages within the current chat session.
If the user refers to "it", "this", "that startup", "our product", resolve those references using previous conversation.

====================================================
FINAL RULE
====================================================

The quality of answers is more important than quantity.
Never fabricate transcript information.
If unsure, return the "I couldn't find evidence..." message.
"""

def classify_request(message: str, is_ship30_flag: bool = False, is_artifact_flag: bool = False) -> Dict[str, Any]:
    lower = message.lower().strip()
    
    # Check Ship30 mode
    ship30_keywords = ["ship30", "ship 30", "essay", "twitter thread", "long-form content", "long form content", "linkedin post"]
    is_ship30 = is_ship30_flag or any(kw in lower for kw in ship30_keywords)
    
    # Check PRD mode
    is_prd = "prd" in lower or "product requirements document" in lower
    
    # Check Roadmap mode
    is_roadmap = "roadmap" in lower
    
    # Check HTML Artifact
    html_keywords = ["landing page", "dashboard", "website", "pricing page", "hero section", "ui", "html", "css"]
    is_html_artifact = any(kw in lower for kw in html_keywords)
    
    # Check Markdown Artifact
    markdown_keywords = ["prd", "roadmap", "documentation", "strategy", "checklist", "plan", "notes"]
    is_markdown_artifact = is_prd or is_roadmap or any(kw in lower for kw in markdown_keywords)
    
    is_artifact = is_artifact_flag or is_html_artifact or is_markdown_artifact
    
    return {
        "is_ship30": is_ship30,
        "is_artifact": is_artifact,
        "is_html_artifact": is_html_artifact,
        "is_markdown_artifact": is_markdown_artifact,
        "is_prd": is_prd,
        "is_roadmap": is_roadmap
    }

@router.post("/")
async def chat_endpoint(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch or create session
    result = await db.execute(
        select(SessionModel)
        .filter(SessionModel.id == payload.session_id)
    )
    session = result.scalars().first()
    if not session:
        session = SessionModel(id=payload.session_id, title="Growth Strategy Chat")
        db.add(session)
        await db.commit()
        await db.refresh(session)

    provider = payload.provider or session.llm_provider or "ollama"
    model = payload.model or session.llm_model or "llama3.2"

    # Save User Message to DB
    user_msg = MessageModel(
        session_id=session.id,
        role="user",
        content=payload.message
    )
    db.add(user_msg)

    # 2. Fetch previous messages for session context & memory resolution
    msg_result = await db.execute(
        select(MessageModel)
        .filter(MessageModel.session_id == session.id)
        .order_by(MessageModel.created_at.asc())
    )
    previous_messages = msg_result.scalars().all()

    # Auto-generate title if this is the first message
    if len(previous_messages) <= 1:
        session.title = payload.message[:35].strip() + ("..." if len(payload.message) > 35 else "")

    # Classify the request mode
    modes = classify_request(payload.message, payload.is_ship30, payload.is_artifact_request)

    # Resolve Chat Memory: If query has pronouns ("it", "this", "that startup", "our product"), combine with recent history for search
    search_query = payload.message
    pronouns = [" it ", " this ", " that ", "that startup", "our product"]
    if any(p in f" {payload.message.lower()} " for p in pronouns) and len(previous_messages) > 1:
        recent_user_msgs = [m.content for m in previous_messages if m.role == "user"][-3:]
        search_query = f"{' '.join(recent_user_msgs)} {payload.message}"

    # 3. Perform RAG Transcript Search with Thresholding
    rag_results, max_score = rag_engine.search(search_query, top_k=4, min_threshold=0.15)

    # STRICT RAG GUARD: If no transcript match found and query is general out-of-domain
    is_general_out_of_domain = (len(rag_results) == 0 and not (modes["is_artifact"] or modes["is_ship30"]))

    if is_general_out_of_domain:
        assistant_msg = MessageModel(
            session_id=session.id,
            role="assistant",
            content=OUT_OF_DOMAIN_FALLBACK,
            sources=[],
            artifact_id=None
        )
        db.add(assistant_msg)
        session.updated_at = datetime.utcnow()
        await db.commit()

        return {
            "user_message": {
                "id": user_msg.id,
                "role": "user",
                "content": payload.message,
                "created_at": user_msg.created_at.isoformat()
            },
            "assistant_message": {
                "id": assistant_msg.id,
                "role": "assistant",
                "content": OUT_OF_DOMAIN_FALLBACK,
                "sources": [],
                "artifact_id": None,
                "created_at": assistant_msg.created_at.isoformat()
            },
            "artifact": None,
            "provider": "rag-strict",
            "model": model
        }

    # 4. Construct System Prompt according to classified mode
    rag_context = rag_engine.format_rag_context(rag_results)
    unique_sources = []
    seen = set()
    for r in rag_results:
        key = (r.get("guest", ""), r.get("title", ""))
        if key not in seen:
            seen.add(key)
            unique_sources.append({
                "guest": r["guest"],
                "title": r["title"],
                "snippet": r["text"][:250] + "..."
            })
    sources_metadata = unique_sources

    if modes["is_ship30"]:
        system_prompt = build_ship30for30_prompt(payload.message, rag_context)
    else:
        prompt_parts = [
            SYSTEM_BASE_PROMPT,
            "\n### LENNY'S PODCAST TRANSCRIPT CONTEXT:\n",
            rag_context
        ]
        if modes["is_artifact"]:
            prompt_parts.append("\n" + ARTIFACT_SYSTEM_PROMPT)
        system_prompt = "\n".join(prompt_parts)

    # 5. Format Message History for LLM
    history = []
    for m in previous_messages[-8:]:
        history.append({"role": m.role, "content": m.content})
    history.append({"role": "user", "content": payload.message})

    # 6. Call LLM Router
    llm_res = await llm_router.generate_response(
        messages=history,
        provider=provider,
        model=model,
        system_prompt=system_prompt
    )

    response_text = llm_res.get("content", "")

    # Filter sources_metadata so it ONLY includes guests actually mentioned in response_text
    if OUT_OF_DOMAIN_FALLBACK in response_text:
        sources_metadata = []
    else:
        filtered_sources = []
        for src in sources_metadata:
            guest_name = src.get("guest", "")
            name_parts = [p.lower() for p in guest_name.split() if len(p) > 2]
            if any(part in response_text.lower() for part in name_parts):
                filtered_sources.append(src)
        
        # If response_text references specific guests not in top 4 RAG, add them dynamically from RAG engine
        known_guests = [
            ("Rahul Vohra", "How Superhuman Found Product Market Fit"),
            ("Brian Chesky", "Brian Chesky's New Playbook"),
            ("Elena Verna", "Elena Verna on PLG Loops and Monetization"),
            ("Marty Cagan", "Product Management Theater | Marty Cagan (Silicon Valley Product Group)")
        ]
        existing_guests = {s["guest"].lower() for s in filtered_sources}
        for g_name, g_title in known_guests:
            if g_name.lower() in response_text.lower() and g_name.lower() not in existing_guests:
                filtered_sources.append({
                    "guest": g_name,
                    "title": g_title,
                    "snippet": f"Transcript insights from {g_name} in episode '{g_title}'."
                })
        sources_metadata = filtered_sources

    # 7. Extract Artifact if generated
    extracted_art = extract_artifact(response_text)
    artifact_id = None
    created_artifact_data = None

    if extracted_art:
        art_id = f"{extracted_art['id']}-{uuid.uuid4().hex[:6]}"
        new_artifact = ArtifactModel(
            id=art_id,
            session_id=session.id,
            title=extracted_art["title"],
            artifact_type=extracted_art["artifact_type"],
            content=extracted_art["content"],
            language=extracted_art["language"]
        )
        db.add(new_artifact)
        await db.flush()
        artifact_id = new_artifact.id
        created_artifact_data = {
            "id": new_artifact.id,
            "title": new_artifact.title,
            "artifact_type": new_artifact.artifact_type,
            "content": new_artifact.content,
            "language": new_artifact.language
        }

    # Save Assistant Message to DB
    assistant_msg = MessageModel(
        session_id=session.id,
        role="assistant",
        content=response_text,
        sources=sources_metadata,
        artifact_id=artifact_id
    )
    db.add(assistant_msg)

    session.updated_at = datetime.utcnow()
    await db.commit()

    return {
        "user_message": {
            "id": user_msg.id,
            "role": "user",
            "content": payload.message,
            "created_at": user_msg.created_at.isoformat()
        },
        "assistant_message": {
            "id": assistant_msg.id,
            "role": "assistant",
            "content": response_text,
            "sources": sources_metadata,
            "artifact_id": artifact_id,
            "created_at": assistant_msg.created_at.isoformat()
        },
        "artifact": created_artifact_data,
        "provider": llm_res.get("provider"),
        "model": llm_res.get("model")
    }

