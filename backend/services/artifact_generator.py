import re
import uuid
from typing import Optional, Dict, Any

ARTIFACT_SYSTEM_PROMPT = """
====================================================
ARTIFACT MODE INSTRUCTIONS
====================================================

If the user requests an artifact, determine the correct artifact type.

A. HTML Artifact
If user asks for: Landing page, Dashboard, Website, Pricing page, Hero section, UI, HTML, CSS:
Generate COMPLETE HTML + CSS wrapped in an artifact tag:
<artifact id="UNIQUE_ID" title="DESCRIPTIVE_TITLE" type="html" language="html">
<!DOCTYPE html>
<html lang="en">
...
</html>
</artifact>

Requirements for HTML Artifacts:
- Return ONLY valid self-contained HTML + CSS.
- Modern, responsive design (use Tailwind CSS via cdn.tailwindcss.com or modern styling).
- Do NOT include markdown code fences inside the artifact tag content.

B. Markdown Artifact
If the user asks for: PRD, Roadmap, Documentation, Strategy, Checklist, Plan, Notes:
Generate VALID MARKDOWN wrapped in an artifact tag:
<artifact id="UNIQUE_ID" title="DESCRIPTIVE_TITLE" type="markdown" language="markdown">
# ...
</artifact>

Do NOT generate HTML for Markdown artifacts.

------------------------------------
PRD MODE STRUCTURE:
If user explicitly requests a PRD (Product Requirements Document), DO NOT generate a roadmap.
Instead generate a complete PRD using this exact structure:

# Product Requirements Document

## Executive Summary

## Problem Statement

## Goals

## Success Metrics

## Target Users

## User Personas

## User Stories

## Functional Requirements

## Non Functional Requirements

## MVP Scope

## Out of Scope

## User Journey

## Technical Considerations

## Risks

## Milestones

## Launch Plan

## Future Enhancements

## References from Lenny's Podcast

------------------------------------
ROADMAP MODE STRUCTURE:
If user explicitly asks for a roadmap, generate:

# Product Roadmap

Phase 1

Objectives

Deliverables

Success Metrics

Timeline

Phase 2

...
"""

def extract_artifact(text: str) -> Optional[Dict[str, Any]]:
    # Match <artifact id="..." title="..." type="..." language="...">content</artifact>
    pattern = r'<artifact\s+id=["\']?([^"\'>]+)["\']?\s+title=["\']?([^"\'>]+)["\']?\s+type=["\']?([^"\'>]+)["\']?\s*(?:language=["\']?([^"\'>]+)["\']?)?>([\s\S]*?)</artifact>'
    match = re.search(pattern, text)
    if match:
        art_id, title, art_type, lang, content = match.groups()
        cleaned_content = content.strip()
        # Clean any accidental outer markdown fences inside the artifact block if present
        if cleaned_content.startswith("```html") or cleaned_content.startswith("```markdown"):
            cleaned_content = re.sub(r'^```(?:html|markdown)?\n?', '', cleaned_content)
            cleaned_content = re.sub(r'\n?```$', '', cleaned_content).strip()
            
        return {
            "id": art_id or str(uuid.uuid4()),
            "title": title or "Generated Artifact",
            "artifact_type": art_type.lower() if art_type else "markdown",
            "language": lang or ("html" if art_type == "html" else "markdown"),
            "content": cleaned_content
        }
    
    # Fallback: check for standalone html codeblocks ```html ... ``` if user requested a page
    html_block_pattern = r'```html\s*([\s\S]+?)\s*```'
    html_match = re.search(html_block_pattern, text)
    if html_match and ("<!DOCTYPE html>" in html_match.group(1) or "<html" in html_match.group(1) or "<div" in html_match.group(1)):
        return {
            "id": str(uuid.uuid4()),
            "title": "Interactive Web Artifact",
            "artifact_type": "html",
            "language": "html",
            "content": html_match.group(1).strip()
        }

    return None

