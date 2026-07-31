# 📄 Product Requirements Document (PRD)

## Project Title: **The Lenny Growth Assistant**

---

## 1. Executive Summary

**The Lenny Growth Assistant** is a full-stack, AI-powered conversational web application designed to turn transcripts from *Lenny's Podcast* into an interactive product management and startup strategy advisor.

Built using **FastAPI**, **React 18**, **SQLAlchemy Async ORM (Supabase/PostgreSQL/SQLite)**, and a **Flexible LLM Engine (Local Ollama / Anthropic Claude / OpenAI)**, the platform enables users to execute deep Q&A, generate ~1,200-word Ship30for30 digital essays, and render live interactive HTML/CSS UI artifacts and Markdown PRDs side-by-side within the web UI.

---

## 2. Problem Statement

Product Managers, Growth Leads, and Founders often struggle to extract actionable playbooks from long podcast transcripts and growth newsletters. Existing general-purpose AI chat tools frequently hallucinate non-existent advice or fail to provide strict attribution. Furthermore, when users request structural artifacts (such as PRDs or UI mockups), standard chat interfaces display raw text blocks instead of live interactive previews.

---

## 3. Product Goals & Success Metrics

### Primary Objectives
1. **Strict Knowledge Grounding:** Answer questions strictly using insights from Lenny's Podcast transcripts with explicit guest & episode citations.
2. **Flexible LLM Engine Switching:** Allow switching between local LLMs (Ollama `llama3.2`) for offline demo privacy and Cloud LLMs (Anthropic Claude 3.5 Sonnet / OpenAI GPT-4o) for high-reasoning tasks.
3. **Dedicated Content Generation Skills:** Provide specialized content generation capabilities, specifically the **Ship30for30** digital writing style.
4. **Side-by-Side In-App Artifact Workspace:** Render HTML/CSS artifacts live inside an interactive iframe and display formatted Markdown documents (PRD & Roadmap modes) natively.

### Target Success Metrics
- **Zero Hallucination Rate on Out-of-Domain Queries:** 100% compliance with strict fallback message on non-transcript topics.
- **RAG Retrieval Precision:** Top-4 chunk context precision with guest entity boosting.
- **Artifact Render Speed:** < 300ms iframe render time for HTML UI artifacts.

---

## 4. Target Personas & User Stories

### User Personas
- **Alex (Senior Product Manager):** Wants to audit onboarding user journeys using Brian Chesky's "Founder in the Details" playbook.
- **Sarah (Growth Lead):** Needs to build self-sustaining viral acquisition loops using Elena Verna's PLG framework.
- **Marcus (Startup Founder):** Wants to quantify product-market fit (PMF) using Rahul Vohra's 40% PMF survey engine.

### User Stories
- *As a PM*, I want to ask growth questions and receive answers cited directly from specific Lenny's Podcast episodes.
- *As a Content Lead*, I want to turn transcript insights into a ~1,200-word Ship30for30 essay with punchy subheaders and bullet points.
- *As a Founder*, I want the assistant to generate a full PRD or product roadmap and render it side-by-side with our chat.
- *As a Designer*, I want to request a SaaS landing page UI artifact and interact with the live rendered HTML/CSS code directly.

---

## 5. Functional Requirements

### 5.1. API & Session Management (FastAPI)
- `POST /api/sessions/`: Initialize a new isolated chat session.
- `GET /api/sessions/`: List all past chat sessions ordered by last update time.
- `GET /api/sessions/{id}`: Fetch session history including all user/assistant messages, transcript sources, and generated artifacts.
- `PUT /api/sessions/{id}`: Update session title or active model configurations.
- `DELETE /api/sessions/{id}`: Delete conversation thread.

### 5.2. Flexible LLM Engine Configuration
- `GET /api/config/`: Return system status, Ollama online status, API key presence, and RAG chunk counts.
- `POST /api/config/keys`: Persistently update Anthropic (`ANTHROPIC_API_KEY`) or OpenAI (`OPENAI_API_KEY`) credentials.
- Local LLM: Default execution via Ollama (`http://localhost:11434/api/chat`).

### 5.3. Transcript RAG & Citation Engine
- Automatic indexing of 300+ episode transcripts (~27,700 chunks).
- TF-IDF similarity scoring with entity boosting for guest name queries.
- Strict Out-of-Domain Guard: Return exact fallback string when transcript evidence is insufficient:
  > *"I couldn't find evidence for that in Lenny's Podcast transcripts. My responses are strictly limited to insights from Lenny's Podcast transcripts."*

### 5.4. Ship30for30 Content Generation Skill
- Formatted as 1,100–1,300 word digital essay.
- Features: Strong hook, multiple sections with headings, expanded insights with explanations and examples, short paragraphs (1-2 sentences max), bold insights, bullet points, strong takeaway, and relevant guest/episode citations only.

### 5.5. In-App Artifact Viewer UI
- `<artifact id="..." title="..." type="html|markdown" language="html|markdown">`: Extracted by parser.
- **HTML Artifacts:** Rendered live in safe sandboxed `<iframe>`.
- **PRD Mode:** Generates complete PRD adhering to all 19 required headers.
- **Roadmap Mode:** Generates multi-phase product roadmaps.

---

## 6. Non-Functional & Technical Requirements

- **Performance:** Sub-second RAG search across 27,700 chunks.
- **Database Scalability:** SQLAlchemy Async ORM with dual support for PostgreSQL (Supabase/Railway) and SQLite.
- **Security:** API keys stored securely in `.env` / database configuration table without exposing keys in frontend code.

---

## 7. MVP Scope & Future Roadmap

| Milestone | Deliverable | Status |
| :--- | :--- | :--- |
| **Phase 1** | FastAPI backend, RAG transcript indexing, and database schema | ✅ Completed |
| **Phase 2** | Ship30for30 content skill, local Ollama / cloud LLM router | ✅ Completed |
| **Phase 3** | Dual-pane React UI & live side-by-side Artifact Viewer | ✅ Completed |
| **Phase 4** | E2E verification test suite & public documentation | ✅ Completed |
| **Future (v2)** | Multi-modal diagram artifacts (Mermaid/Chart.js live rendering) | ⏳ Planned |
