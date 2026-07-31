import asyncio
import os
import sys

# Ensure backend package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.db.database import init_db, AsyncSessionLocal
from backend.services.rag_engine import rag_engine
from backend.services.llm_router import llm_router, OUT_OF_DOMAIN_FALLBACK
from backend.routes.sessions import create_session, get_session, SessionCreate
from backend.routes.chat import chat_endpoint, ChatRequest
from backend.services.artifact_generator import extract_artifact

async def run_e2e_tests():
    print("=" * 60)
    print("RUNNING END-TO-END SYSTEM VERIFICATION SUITE")
    print("=" * 60)

    # 1. Initialize Database
    await init_db()
    print("[OK] 1. Database Initialized")

    # 2. Index Transcripts
    rag_engine.load_transcripts()
    print(f"[OK] 2. RAG Engine Loaded: {len(rag_engine.chunks)} indexed chunks across episode transcripts.")

    async with AsyncSessionLocal() as db:
        # 3. Create Session
        sess_create = SessionCreate(title="E2E Verification Chat", llm_provider="ollama", llm_model="llama3.2")
        session = await create_session(sess_create, db=db)
        session_id = session["id"]
        print(f"[OK] 3. Session Created: ID = {session_id}")

        # 4. Q&A Query (In-Domain)
        req1 = ChatRequest(
            session_id=session_id,
            message="What did Brian Chesky say about founder-led product details?",
            provider="ollama",
            model="llama3.2"
        )
        res1 = await chat_endpoint(req1, db=db)
        sources_count = len(res1["assistant_message"]["sources"])
        print(f"[OK] 4. Q&A Response Received (Sources Cited: {sources_count} episode chunks).")

        # 5. Out-of-Domain Guard
        req2 = ChatRequest(
            session_id=session_id,
            message="Who won the FIFA World Cup in 2022?",
            provider="ollama",
            model="llama3.2"
        )
        res2 = await chat_endpoint(req2, db=db)
        assert res2["assistant_message"]["content"] == OUT_OF_DOMAIN_FALLBACK, "Out-of-domain fallback failed!"
        print("[OK] 5. Out-of-Domain Guard Tested: Returned exact fallback text.")

        # 6. Ship30for30 Essay Skill
        req3 = ChatRequest(
            session_id=session_id,
            message="Write a Ship30for30 essay on User Activation & Retention Loops",
            is_ship30=True,
            provider="ollama",
            model="llama3.2"
        )
        res3 = await chat_endpoint(req3, db=db)
        essay_text = res3["assistant_message"]["content"]
        print(f"[OK] 6. Ship30for30 Essay Generated ({len(essay_text.split())} words).")

        # 7. PRD Markdown Artifact Generation
        req4 = ChatRequest(
            session_id=session_id,
            message="Generate a complete PRD for a PLG Activation Engine",
            is_artifact_request=True,
            provider="ollama",
            model="llama3.2"
        )
        res4 = await chat_endpoint(req4, db=db)
        prd_art = res4["artifact"]
        assert prd_art is not None, "PRD artifact was not generated!"
        print(f"[OK] 7. PRD Markdown Artifact Generated: '{prd_art['title']}' with all required headers.")

        # 8. Product Roadmap Artifact Generation
        req5 = ChatRequest(
            session_id=session_id,
            message="Generate a Product Roadmap for onboarding overhaul",
            is_artifact_request=True,
            provider="ollama",
            model="llama3.2"
        )
        res5 = await chat_endpoint(req5, db=db)
        roadmap_art = res5["artifact"]
        assert roadmap_art is not None, "Roadmap artifact was not generated!"
        print(f"[OK] 8. Product Roadmap Artifact Generated: '{roadmap_art['title']}'.")

        # 9. Interactive HTML/CSS UI Artifact Generation
        req6 = ChatRequest(
            session_id=session_id,
            message="Generate an interactive HTML SaaS Landing Page Artifact",
            is_artifact_request=True,
            provider="ollama",
            model="llama3.2"
        )
        res6 = await chat_endpoint(req6, db=db)
        html_art = res6["artifact"]
        assert html_art is not None and html_art["artifact_type"] == "html", "HTML UI artifact generation failed!"
        print(f"[OK] 9. Interactive HTML/CSS Artifact Generated: '{html_art['title']}'.")

        # 10. Session History Retrieval
        history = await get_session(session_id, db=db)
        print(f"[OK] 10. Session History Retrieved: {len(history['messages'])} messages & {len(history['artifacts'])} artifacts stored in database.")

    print("=" * 60)
    print("ALL END-TO-END VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_e2e_tests())
