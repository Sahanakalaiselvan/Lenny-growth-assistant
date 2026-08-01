import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Automatically load .env file into environment variables
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "The Lenny Growth Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database Settings (Supports Postgres, auto fallback to SQLite)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./lenny_growth.db")
    
    # LLM Provider Configuration
    DEFAULT_PROVIDER: str = os.getenv("DEFAULT_PROVIDER", "ollama") # 'ollama', 'anthropic', 'openai'
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "llama3.2")
    
    # Ollama Settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Cloud API Keys
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # RAG Transcripts Path
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    TRANSCRIPTS_DIR: str = os.path.join(BASE_DIR, "raw_transcripts", "episodes")
    
    class Config:
        case_sensitive = True

settings = Settings()
