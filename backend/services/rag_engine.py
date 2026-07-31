import os
import glob
import re
import yaml
import math
from collections import Counter
from typing import List, Dict, Any, Tuple
from backend.config import settings

class RAGEngine:
    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []
        self.idf: Dict[str, float] = {}
        self.doc_vectors: List[Dict[str, float]] = []
        self.is_indexed: bool = False

    def tokenize(self, text: str) -> List[str]:
        text = text.lower()
        words = re.findall(r'\b[a-z0-9]+\b', text)
        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "about",
            "against", "between", "into", "through", "during", "before", "after", "above", "below", "to",
            "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then",
            "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few",
            "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
            "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "i", "you",
            "he", "she", "it", "we", "they", "that", "this", "what", "is", "are", "was", "were", "be",
            "been", "being", "have", "has", "had", "do", "does", "did", "doing", "would", "could", "like"
        }
        return [w for w in words if w not in stop_words and len(w) > 1]

    def load_transcripts(self):
        if self.is_indexed:
            return

        episodes_path = settings.TRANSCRIPTS_DIR
        if not os.path.exists(episodes_path):
            print(f"[RAG] Transcripts path does not exist: {episodes_path}")
            return

        pattern = os.path.join(episodes_path, "*", "transcript.md")
        transcript_files = glob.glob(pattern)
        print(f"[RAG] Found {len(transcript_files)} transcript files.")

        raw_chunks = []
        for file_path in transcript_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                meta = {}
                body = content
                if content.startswith("---"):
                    parts = content.split("---", 2)
                    if len(parts) >= 3:
                        try:
                            meta = yaml.safe_load(parts[1]) or {}
                        except Exception:
                            meta = {}
                        body = parts[2]

                guest = meta.get("guest", "Unknown Guest")
                title = meta.get("title", meta.get("guest", "Lenny's Podcast Episode"))
                keywords = meta.get("keywords", [])
                keywords_str = ", ".join(keywords) if isinstance(keywords, list) else str(keywords)

                sections = re.split(r'\n(?=##|\n[A-Z][a-zA-Z\s]+(?:\([0-9:]+\))?:)', body)
                
                for idx, sec in enumerate(sections):
                    cleaned_sec = sec.strip()
                    if len(cleaned_sec) < 150:
                        continue
                    
                    chunk_obj = {
                        "chunk_id": f"{guest}_{idx}",
                        "guest": guest,
                        "title": title,
                        "keywords": keywords_str,
                        "text": cleaned_sec,
                        "file_path": file_path
                    }
                    raw_chunks.append(chunk_obj)
            except Exception as e:
                print(f"[RAG] Error reading {file_path}: {e}")

        self.chunks = raw_chunks
        self._build_tfidf_index()
        self.is_indexed = True
        print(f"[RAG] Indexed {len(self.chunks)} chunks across {len(transcript_files)} episodes.")

    def _build_tfidf_index(self):
        num_docs = len(self.chunks)
        if num_docs == 0:
            return

        doc_tokens = []
        doc_freqs = Counter()

        for chunk in self.chunks:
            tokens = self.tokenize(f"{chunk['guest']} {chunk['title']} {chunk['keywords']} {chunk['text']}")
            doc_tokens.append(tokens)
            unique_terms = set(tokens)
            for t in unique_terms:
                doc_freqs[t] += 1

        self.idf = {term: math.log((num_docs + 1) / (df + 1)) + 1.0 for term, df in doc_freqs.items()}

        self.doc_vectors = []
        for tokens in doc_tokens:
            tf = Counter(tokens)
            total = len(tokens) or 1
            vector = {term: (count / total) * self.idf.get(term, 0.0) for term, count in tf.items()}
            norm = math.sqrt(sum(v * v for v in vector.values())) or 1.0
            norm_vector = {k: v / norm for k, v in vector.items()}
            self.doc_vectors.append(norm_vector)

    def search(self, query: str, top_k: int = 5, min_threshold: float = 0.15) -> Tuple[List[Dict[str, Any]], float]:
        if not self.is_indexed:
            self.load_transcripts()

        if not self.chunks or not query.strip():
            return [], 0.0

        query_tokens = self.tokenize(query)
        if not query_tokens:
            return [], 0.0

        q_tf = Counter(query_tokens)
        q_total = len(query_tokens)
        q_vector = {term: (count / q_total) * self.idf.get(term, 0.0) for term, count in q_tf.items()}
        q_norm = math.sqrt(sum(v * v for v in q_vector.values())) or 1.0
        q_norm_vector = {k: v / q_norm for k, v in q_vector.items()}

        scores = []
        for idx, doc_vec in enumerate(self.doc_vectors):
            score = sum(val * doc_vec.get(term, 0.0) for term, val in q_norm_vector.items())
            
            # Boost score if query matches guest name explicitly
            guest_lower = self.chunks[idx]["guest"].lower()
            if any(qt in guest_lower for qt in query_tokens):
                score += 0.35

            if score > 0.02:
                scores.append((score, self.chunks[idx]))

        scores.sort(key=lambda x: x[0], reverse=True)
        
        max_score = scores[0][0] if scores else 0.0
        
        # Check against minimum similarity threshold
        if max_score < min_threshold:
            print(f"[RAG Threshold Check] Query '{query}' max_score={max_score:.4f} < threshold {min_threshold}. Rejecting out-of-domain query.")
            return [], max_score

        results = [item[1] for item in scores[:top_k]]
        return results, max_score

    def format_rag_context(self, search_results: List[Dict[str, Any]]) -> str:
        if not search_results:
            return "NO_RELEVANT_TRANSCRIPTS_FOUND"

        formatted = ["### Lenny's Podcast Knowledge Base Context:\n"]
        for idx, res in enumerate(search_results, 1):
            formatted.append(
                f"--- SOURCE [{idx}]: Guest: {res['guest']} | Episode: '{res['title']}' ---\n"
                f"{res['text'][:1200]}\n"
            )
        return "\n".join(formatted)

rag_engine = RAGEngine()
