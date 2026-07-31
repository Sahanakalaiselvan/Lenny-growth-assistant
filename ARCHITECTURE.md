# 🏗️ Technical Architecture Document (`ARCHITECTURE.md`)

## 1. System Overview

**The Lenny Growth Assistant** is an agentic, full-stack web application designed for high-precision product management Q&A, content generation, and artifact rendering based strictly on **Lenny's Podcast transcripts**.

```mermaid
flowchart TD
    %% Custom Styling Definitions
    classDef client fill:#0f172a,stroke:#6366f1,stroke-width:2px,color:#f8fafc;
    classDef api fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef engine fill:#31104b,stroke:#c084fc,stroke-width:2px,color:#f8fafc;
    classDef db fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef provider fill:#164e63,stroke:#22d3ee,stroke-width:2px,color:#f8fafc;

    subgraph Layer1 ["🖥️ CLIENT BROWSER LAYER (React 18 + Vite + Tailwind)"]
        UI["Dual-Pane Chat Workspace"]
        Stream["Interactive Chat Stream & Citations"]
        ArtPanel["Side-by-Side Artifact Viewer (Sandboxed Iframe)"]
        ConfigModal["API Key & LLM Switcher Modal"]
    end

    subgraph Layer2 ["⚡ FASTAPI BACKEND SERVER LAYER"]
        APIGateway["FastAPI REST API Gateway (/api)"]
        SessionMgr["Session & History Controller"]
        Classifier["Intent & Skill Routing Engine"]
    end

    subgraph Layer3 ["🎙️ KNOWLEDGE BASE & RAG SEARCH ENGINE"]
        Transcripts["303 Lenny's Podcast Transcripts Index"]
        TFIDF["TF-IDF Similarity Search & Tokenizer"]
        Booster["Guest Entity Name Booster (+0.35)"]
        Guard["Strict Out-of-Domain Guard (0.15 Score Threshold)"]
    end

    subgraph Layer4 ["⚙️ FLEXIBLE LLM ENGINE ROUTER"]
        LLMSwitch["LLM Execution Router Switch"]
        OllamaEngine["Local Ollama Server (llama3.2)"]
        ClaudeEngine["Anthropic Claude SDK (claude-3-5-sonnet)"]
        OpenAIEngine["OpenAI API (gpt-4o)"]
        FallbackEngine["Knowledge Synthesis Engine (Zero-Key Demo)"]
    end

    subgraph Layer5 ["🎨 ARTIFACT EXTRACTOR & PARSER"]
        RegexParser["XML Tag Parser (<artifact>)"]
        PRDBuilder["PRD Generator (19 Required Headers)"]
        HTMLBuilder["HTML/CSS Live UI Generator"]
    end

    subgraph Layer6 ["🗄️ PERSISTENT DATABASE LAYER (SQLAlchemy Async ORM)"]
        ORM["Async Session Manager"]
        PostgresDB[("PostgreSQL / Supabase / Railway")]
        SQLiteDB[("SQLite Local Fallback (lenny_growth.db)")]
    end

    %% Flow Connections
    UI -->|"POST /api/chat"| APIGateway
    APIGateway --> SessionMgr
    APIGateway --> Classifier
    
    Classifier -->|"1. Transcript Query"| Transcripts
    Transcripts --> TFIDF
    TFIDF --> Booster
    Booster --> Guard
    
    Guard -->|"2. Context Chunks"| LLMSwitch
    
    LLMSwitch -->|"Provider: Local"| OllamaEngine
    LLMSwitch -->|"Provider: Claude"| ClaudeEngine
    LLMSwitch -->|"Provider: OpenAI"| OpenAIEngine
    LLMSwitch -->|"Provider: Offline Fallback"| FallbackEngine
    
    OllamaEngine --> RegexParser
    ClaudeEngine --> RegexParser
    OpenAIEngine --> RegexParser
    FallbackEngine --> RegexParser
    
    RegexParser --> PRDBuilder
    RegexParser --> HTMLBuilder
    
    PRDBuilder --> ORM
    HTMLBuilder --> ORM
    
    ORM --> PostgresDB
    ORM --> SQLiteDB
    
    HTMLBuilder -->|"3. Live Sandboxed Render"| ArtPanel
    PRDBuilder -->|"3. Render Markdown"| ArtPanel
    RegexParser -->|"3. Stream Response & Sources"| Stream

    %% Apply Class Styles
    class UI,Stream,ArtPanel,ConfigModal client;
    class APIGateway,SessionMgr,Classifier api;
    class Transcripts,TFIDF,Booster,Guard engine;
    class LLMSwitch,OllamaEngine,ClaudeEngine,OpenAIEngine,FallbackEngine provider;
    class RegexParser,PRDBuilder,HTMLBuilder engine;
    class ORM,PostgresDB,SQLiteDB db;
```

---

## 2. Database Schema (Supabase / Railway / PostgreSQL / SQLite)

The database schema is managed via **SQLAlchemy Async ORM** (`backend/db/models.py`) and supports PostgreSQL (Supabase/Railway) with automatic local SQLite fallback.

```mermaid
erDiagram
    SESSIONS ||--o{ MESSAGES : contains
    SESSIONS ||--o{ ARTIFACTS : generates
    
    SESSIONS {
        string id PK
        string title
        string llm_provider
        string llm_model
        datetime created_at
        datetime updated_at
    }

    MESSAGES {
        string id PK
        string session_id FK
        string role
        text content
        json sources
        string artifact_id FK
        datetime created_at
    }

    ARTIFACTS {
        string id PK
        string session_id FK
        string title
        string artifact_type
        text content
        string language
        datetime created_at
    }

    APP_CONFIG {
        string key PK
        text value
        datetime updated_at
    }
```

### Table Definitions
1. **`sessions`**: Stores active chat sessions, title, active LLM provider (`ollama`/`cloud`), and timestamps.
2. **`messages`**: Stores message history (`user` / `assistant`), full content, serialized RAG sources metadata (guest, episode title, snippet), and optional linked artifact ID.
3. **`artifacts`**: Stores generated HTML UI artifacts or Markdown documents.
4. **`app_config`**: Stores persistent configuration settings (e.g. `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`).

---

## 3. API Endpoints Specification

FastAPI routers are grouped under `/api` (`backend/routes/`):

### Sessions Router (`/api/sessions`)
- **`GET /api/sessions/`**: Returns a list of all active sessions sorted by last updated time.
- **`POST /api/sessions/`**: Creates a new session with default title and provider.
- **`GET /api/sessions/{session_id}`**: Returns full session details including messages, transcript citations, and generated artifacts.
- **`PUT /api/sessions/{session_id}`**: Updates session title or model parameters.
- **`DELETE /api/sessions/{session_id}`**: Deletes the specified session and cascade deletes associated messages and artifacts.

### Chat Router (`/api/chat`)
- **`POST /api/chat/`**: Main agentic endpoint.
  - **Payload:** `{ session_id, message, is_ship30, is_artifact_request, provider, model }`
  - **Workflow:**
    1. Resolves chat memory references (`it`, `this`, `that startup`, `our product`).
    2. Runs TF-IDF transcript search with entity boosting.
    3. Evaluates score against min threshold (0.15). If query is out of domain, returns exact fallback message.
    4. Classifies intent: Normal Chat, Ship30for30 Skill, PRD Mode, Roadmap Mode, or HTML Artifact.
    5. Calls LLM Router engine and extracts generated `<artifact>`.
    6. Saves user & assistant messages to DB and returns response.

### Artifacts Router (`/api/artifacts`)
- **`GET /api/artifacts/{artifact_id}`**: Returns full content of a single artifact.

### Config Router (`/api/config`)
- **`GET /api/config/`**: Returns system status, Ollama online state, API key status, and RAG chunk counts.
- **`POST /api/config/keys`**: Dynamically updates API keys in settings and database.

---

## 4. Agentic Routing Logic & Intent Classification

```python
def classify_request(message: str, is_ship30_flag: bool = False, is_artifact_flag: bool = False) -> Dict[str, Any]:
    lower = message.lower().strip()
    
    # 1. Ship30for30 Essay Skill
    ship30_keywords = ["ship30", "ship 30", "essay", "twitter thread", "long-form content", "linkedin post"]
    is_ship30 = is_ship30_flag or any(kw in lower for kw in ship30_keywords)
    
    # 2. PRD Mode
    is_prd = "prd" in lower or "product requirements document" in lower
    
    # 3. Roadmap Mode
    is_roadmap = "roadmap" in lower
    
    # 4. HTML Artifact
    html_keywords = ["landing page", "dashboard", "website", "pricing page", "hero section", "ui", "html", "css"]
    is_html_artifact = any(kw in lower for kw in html_keywords)
    
    # 5. Markdown Artifact
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
```

---

## 5. LLM Engine Switch Architecture

The `LLMRouter` (`backend/services/llm_router.py`) handles execution routing:

1. **Local Ollama Execution:**
   - Sends requests to `OLLAMA_BASE_URL` (`http://localhost:11434/api/chat`).
2. **Cloud Execution:**
   - Routes to Anthropic Claude SDK (`anthropic.AsyncAnthropic`) if `ANTHROPIC_API_KEY` is present.
   - Routes to OpenAI API (`openai.AsyncOpenAI`) if `OPENAI_API_KEY` is present.
3. **Knowledge Synthesis Engine (Graceful Fallback):**
   - If Ollama is offline or API keys are unconfigured during local evaluation, the in-memory engine dynamically synthesizes structured responses adhering to PRD templates, Roadmap templates, HTML artifacts, and Ship30for30 essays using RAG context.
