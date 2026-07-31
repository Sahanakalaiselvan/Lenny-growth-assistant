# 🎨 UI/UX Design Specification Document (`design.md`)

## 1. Product Design Vision & Philosophy

**"The Lenny Growth Assistant"** is designed as a state-of-the-art, immersive AI workspace for startup founders, product managers, and growth leaders. Drawing inspiration from modern desktop productivity tools (Linear, Raycast, Claude Artifacts), the UI prioritizes **visual elegance, rapid scannability, and seamless dual-pane context**.

### Core Design Principles
1. **Rich Modern Aesthetics:** Deep slate background palette (`#090d16`), vibrant indigo/purple/cyan accents, dark glassmorphic panels, and subtle ambient gradient blur blobs.
2. **Dual-Pane Side-by-Side Artifact Workspace:** Generates live UI components and Markdown documents without forcing tab switches or external browser redirects.
3. **Hyper-Skimmable Content Typography:** Optimized reading experience with custom font stack (**Plus Jakarta Sans**), high-contrast bolding, formatted bullet hierarchies, and inline citation pills.
4. **Instant Visual Feedback & Micro-Interactions:** Reactive status badges, glowing primary buttons, hover scale transitions, and clear toast notifications (`✓ Using Local Ollama`, `✓ Switched to Claude`).

---

## 2. Layout & Component Architecture

The interface is structured as a **flexible 3-column desktop layout**:

```
+-----------------------------------------------------------------------------------+
|  [Left Sidebar]        |  [Chat Window Area]             | [Artifact Workspace]   |
|  - Branding & Logo     |  - Header Bar & LLM Pill        | - Title & Type Badge   |
|  - New Chat Button     |  - Chat Messages Stream         | - Preview / Code Toggle|
|  - Session Search      |  - Quick Prompt Cards           | - Live Sandboxed       |
|  - Conversation List   |  - Citation Badge Cards         |   Interactive Iframe   |
|  - LLM Engine Selector |  - Floating Input Bar           |   OR Markdown Preview  |
|    (Ollama / Cloud)    |  - Skill & Mode Toggles         | - Code Copy & Close    |
+-----------------------------------------------------------------------------------+
```

### Component Details

#### A. Left Sidebar (`Sidebar.jsx`)
- **Branding Header:** Gradient icon badge with glowing pulse animation and version subtitle.
- **New Chat CTA:** Primary glowing CTA button (`.glow-btn`) with smooth hover state.
- **Search Bar:** Real-time filtering of conversation titles.
- **LLM Engine Selector:** Toggle between **Local Ollama** and **Cloud** modes with active highlight rings and gear configuration icon.

#### B. Header Bar (`Header.jsx`)
- **Editable Chat Title:** Click-to-edit session title with inline check button.
- **Status Badges:** RAG transcript indicator pill and active LLM model pill (`Local Ollama` vs `Claude`).
- **Artifact Workspace Toggle:** Quick toggle button with pulsing cyan indicator when artifacts are available.

#### C. Main Chat Stream (`ChatWindow.jsx`)
- **Empty State Hero:** Welcoming hero section featuring 4 interactive Quick Prompt cards (Q&A Insight, Ship30for30 Skill, Artifact Generator, Guest Deep-Dive).
- **Bubble Stream:** Distinct styling for user messages (solid indigo) vs assistant messages (dark slate card with rendered Markdown).
- **Citations Card:** Dedicated transcript source badge listing guest name, episode title, and hoverable transcript snippet.
- **Side-by-Side Trigger:** Direct button on assistant messages to launch the generated artifact in the right workspace.

#### D. Bottom Floating Input Bar (`ChatWindow.jsx`)
- **Mode Toggles:** Skill pills to activate **Ship30for30 Skill** or **Generate Artifact** modes.
- **Textarea Input:** Multi-line responsive textarea with enter-to-send support.

#### E. Side-by-Side Artifact Viewer (`ArtifactViewer.jsx`)
- **Dual View Modes:**
  1. **Preview Mode:**
     - For `html`: Live sandboxed `<iframe>` rendering HTML/CSS/JS components with full interactivity.
     - For `markdown`: Rendered HTML document with standard heading styling.
  2. **Code Mode:** Monospaced syntax-highlighted code viewer with 1-click clipboard copy.

---

## 3. Design Tokens & Color Palette

| Token Category | Color / Value | Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#090d16` | Main window dark background |
| **Sidebar & Header** | `#0c1220` | Navigation & sidebar background |
| **Card & Panel Fill** | `#0f172a` / `slate-900` | Chat bubble & card background |
| **Primary Accent** | `#6366f1` / `indigo-600` | User bubbles, primary buttons |
| **Secondary Accent** | `#9333ea` / `purple-600` | Ship30 skill, Cloud engine toggle |
| **Cyan Accent** | `#0891b2` / `cyan-600` | Artifact Workspace highlights |
| **Text Primary** | `#f8fafc` / `slate-100` | Headings & message body text |
| **Text Muted** | `#94a3b8` / `slate-400` | Subtitles, metadata, timestamps |
| **Border Tokens** | `border-slate-800` | Subtle divider lines |

---

## 4. Accessibility & Responsiveness

- **Keyboard Navigation:** Full accessibility for `Enter` submit, `Shift+Enter` newline, and `Escape` modal close.
- **Iframe Sandboxing:** HTML artifacts are rendered inside `sandbox="allow-scripts allow-modals"` to isolate scripts safely.
- **Dark Mode Optimization:** Carefully calibrated contrast ratios ensuring text readability against dark slate surfaces.
