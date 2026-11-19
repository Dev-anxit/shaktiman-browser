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

1. **Brave-Grade Shaktiman Shields & Multi-Layer Ad Blocker**:
   - Engine-level network ad and tracker blocking powered by `@ghostery/adblocker-electron` and `cross-fetch` with full EasyList, EasyPrivacy, and uBlock filter rulesets.
   - Interactive Shaktiman Shields popover with per-site ON/OFF toggle, live blocked counter, and domain inspection list.
   - Cosmetic ad & cookie consent destroyer hiding intrusive banners, overlays, and tracking frames across web views.
   - YouTube Ad-FastForward & Auto-Skip: Real-time MutationObserver muting video ads and auto-clicking modern skip buttons instantaneously.
   - Privacy Hardening: Referer header stripping, WebRTC non-proxied UDP leak prevention, and canvas fingerprint noise randomization.

2. **Specialized Built-In Power Features**:
   - **Split-Screen Dual View (`Cmd/Ctrl + \`)**: Side-by-side browsing inside a single tab with an interactive draggable horizontal divider.
   - **Floating Picture-in-Picture (PiP)**: One-click popout detecting HTML5 video elements and popping them into an always-on-top floating player.
   - **Distraction-Free Reader Mode (`Cmd/Ctrl + Shift + R`)**: Decluttered article view with font sizing, light/sepia/dark reading themes, and TTS speech synthesis read-aloud.
   - **Quick Scratchpad & Clipboard Vault (`Cmd/Ctrl + Shift + N`)**: Slide-out drawer with auto-persistent note taking, URL clipping, selection quotes, and Markdown export.
   - **Page Dev & Full-Page Screenshot**: High-speed page capture saving PNG images directly to the user's Downloads folder.

3. **Hybrid BM25 + Live DDGS Metasearch Engine**:
   - In-memory Okapi BM25 ranking (k1=1.5, b=0.75, 2x title weighting) for private knowledge base documents and indexed local files.
   - Resilient live metasearch fallback powered by the modern `ddgs` library, aggregating real web results with verified hyperlinks and snippets.
   - Automated content synthesis generating AI Overview summaries with clickable citation links.

4. **Autonomous Shaktiman AI Agent & Visual Credit System**:
   - Slide-out autonomous agent drawer supporting page contextual analysis, response drafting, DOM structure inspection, navigation task scanning, and tab summarization.
   - Gamified persistent energy credit counter (`shaktiman_credits` in `localStorage`), initialized to 10 credits with real-time UI status updates in the sticky header (`⚡ Shaktiman AI (10 credits)`).
   - High-voltage digital invoice paywall modal triggered when energy reaches 0 credits, featuring top-up options and instant verification bypass passes (`SHAKTI999` / `gimme_Credits`).

5. **Dynamic Animals & Memes Wallpaper Engine**:
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
- **Brave-Grade Shaktiman Shields**: Complete ad, tracker, and script blocking with real-time stats.
- **Exclusive Power Tools**: Split screen, Picture-in-Picture, distraction-free reader mode, and persistent scratchpad vault.
- **Full Metasearch Integration**: Dual-mode querying over local text/PDF indexes and live web results.
- **Agentic Actions**: One-click contextual browser actions for web analysis and workflow automation.
