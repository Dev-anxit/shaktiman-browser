# ⚡ Shaktiman Browser — Built by DevXanxit

<p align="center">
  <img src="assets/logo.png" alt="Shaktiman Browser Logo" width="200" height="200" style="border-radius: 50%; box-shadow: 0 0 35px rgba(245, 158, 11, 0.6), 0 0 70px rgba(239, 68, 68, 0.35);">
</p>

<p align="center">
  <b>High-dynamic desktop AI browser with BaseWindow zero-flicker WebContentsView architecture, private BM25 lexical ranking, live web metasearch via DDGS, and agentic AI sidebar automation.</b>
</p>

## Creator & Ownership

- **Creator & Lead Architect:** DevXanxit (Ankit Kumar)
- **Copyright:** © 2026 DevXanxit. All rights reserved.
- **Official Portfolio:** [https://ankit-portfolio-ten-tawny.vercel.app/](https://ankit-portfolio-ten-tawny.vercel.app/)

## Architectural Overview

1. **Hybrid BM25 + Live DDGS Metasearch Engine**:
   - In-memory Okapi BM25 ranking (k1=1.5, b=0.75, 2x title weighting) for private knowledge base documents and indexed local files.
   - Resilient live metasearch fallback powered by the modern `ddgs` library, aggregating real web results with verified hyperlinks and snippets.
   - Automated content synthesis generating AI Overview summaries with clickable citation links.

2. **Electron Desktop & WebView Engine**:
   - Multi-tab browser shell engineered with zero-flicker tab compositing, tab reordering, and Safari-inspired unified pill toolbar.
   - Built-in `session.defaultSession.webRequest.onBeforeRequest` tracking and ad blocker protecting against major tracker networks.
   - DuckDuckGo-style session fire button clearing cookies, caches, and web storage partitions in a single click.

3. **Autonomous Shaktiman AI Agent & Visual Credit System**:
   - Slide-out autonomous agent drawer supporting page contextual analysis, response drafting, DOM structure inspection, navigation task scanning, and tab summarization.
   - Gamified persistent energy credit counter (`shaktiman_credits` in `localStorage`), initialized to 10 credits with real-time UI status updates in the sticky header (`⚡ Shaktiman AI (10 credits)`).
   - High-voltage digital invoice paywall modal triggered when energy reaches 0 credits, featuring top-up options and instant verification bypass passes (`SHAKTI999` / `gimme_Credits`).

4. **Dynamic Animals & Memes Wallpaper Engine**:
   - Live switchable background modes: Funny Cats, Funny Dogs, Programmer & Dank Memes, Mixed Chaos, and Aurora Gradient with 0.6s smooth CSS transitions.

## Requirements

- Python 3.9+
- Node.js 18+
- Dependencies listed in `requirements.txt` and `package.json`

## Installation

```bash
python3 -m pip install -U -r requirements.txt
npm install
```

## Running the Application

### 1. Start Shaktiman Search Backend

```bash
python3 -m uvicorn app:app --host 0.0.0.0 --port 8000
```

### 2. Launch Shaktiman Desktop Browser

```bash
ELECTRON_RUN_AS_NODE= npm start
```

## Key Capabilities

- **Creator & Brand Attribution**: Built and owned by DevXanxit with portfolio integration.
- **Official Brand Assets**: Custom Shaktiman emblem, application dock icon, and browser favicon.
- **Full Metasearch Integration**: Dual-mode querying over local text/PDF indexes and live web results.
- **Agentic Actions**: One-click contextual browser actions for web analysis and workflow automation.
- **Privacy First**: Complete tracker blocking and DuckDuckGo-style session data burning.
