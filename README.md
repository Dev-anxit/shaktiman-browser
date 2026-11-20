# ⚡ Shaktiman Browser — Built by DevXanxit

<p align="center">
  <img src="assets/logo.png" alt="Shaktiman Browser Logo" width="200" height="200" style="border-radius: 50%; box-shadow: 0 0 35px rgba(245, 158, 11, 0.6), 0 0 70px rgba(239, 68, 68, 0.35);">
</p>

<p align="center">
  <b>Hardened high-performance desktop AI browser with strict process isolation, Brave-grade network shields, private BM25 lexical ranking, live web metasearch via DDGS, and agentic AI sidebar automation.</b>
</p>

## Creator & Ownership

- **Creator & Lead Architect:** DevXanxit (Ankit Kumar)
- **Copyright:** © 2026 DevXanxit. All rights reserved.
- **Official Website:** [https://shaktimanbrowser.vercel.app](https://shaktimanbrowser.vercel.app)
- **Official Portfolio:** [https://ankit-portfolio-ten-tawny.vercel.app/](https://ankit-portfolio-ten-tawny.vercel.app/)

## Architectural Overview

1. **High-Security Hardening & Process Isolation**:
   - Main `BrowserWindow` runs with `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`, and `allowRunningInsecureContent: false`.
   - All inter-process communication is exposed safely via `contextBridge` in `main-preload.js`.
   - Multi-tab external web pages execute inside isolated `<webview>` instances with web security enabled and navigation strictly limited to `http:` and `https:` protocols (blocking `file:`, `javascript:`, and dangerous `data:` top-level navigations).
   - Strict Content Security Policy (CSP) applied to local HTML surfaces.
   - Electron `safeStorage` encryption for sensitive API keys.
   - FastAPI search and AI backend bound strictly to `127.0.0.1:8000` with restricted CORS policies.

2. **Tamper-Resistant Credit Store (HMAC SHA-256)**:
   - Credit balances are maintained securely in the Electron main process (`userData/credits.json`) authenticated with HMAC SHA-256 signatures.
   - Credit deduction and redemption are validated through IPC handlers (`get-credits`, `consume-credit`, `redeem-code`).
   - Secure top-up redemption supports verified cryptographic activation keys (e.g. `SHAKTI-DEVXANXIT-2026`).

3. **Brave-Grade Shaktiman Shields & Multi-Layer Ad Blocker**:
   - Engine-level network ad and tracker blocking powered by `@ghostery/adblocker-electron` and `cross-fetch` with full EasyList, EasyPrivacy, and uBlock filter rulesets.
   - Interactive Shaktiman Shields popover with per-site ON/OFF toggle, live blocked counter, and domain inspection list.
   - Cosmetic ad & cookie consent destroyer hiding intrusive banners, overlays, and tracking frames across web views.
   - YouTube Ad-FastForward & Auto-Skip: Real-time MutationObserver muting video ads and auto-clicking modern skip buttons instantaneously.
   - Privacy Hardening: Referer header stripping, WebRTC non-proxied UDP leak prevention, and canvas fingerprint noise randomization.

4. **Specialized Built-In Power Features**:
   - **Split-Screen Dual View (`Cmd/Ctrl + \`)**: Side-by-side browsing inside a single tab with an interactive draggable horizontal divider.
   - **Floating Picture-in-Picture (PiP)**: One-click popout detecting HTML5 video elements and popping them into an always-on-top floating player.
   - **Distraction-Free Reader Mode (`Cmd/Ctrl + Shift + R`)**: Decluttered article view with font sizing, light/sepia/dark reading themes, and TTS speech synthesis read-aloud.
   - **Quick Scratchpad & Clipboard Vault (`Cmd/Ctrl + Shift + N`)**: Slide-out drawer with auto-persistent note taking, URL clipping, selection quotes, and Markdown export.
   - **Page Dev & Full-Page Screenshot**: High-speed page capture saving PNG images directly to the user's Downloads folder.

5. **Hybrid BM25 + Live DDGS Metasearch Engine**:
   - In-memory Okapi BM25 ranking (k1=1.5, b=0.75, 2x title weighting) for private knowledge base documents and indexed local files.
   - Resilient live metasearch fallback powered by the modern `ddgs` library, aggregating real web results with verified hyperlinks and snippets.
   - Automated content synthesis generating AI Overview summaries with clickable citation links.

6. **Autonomous Shaktiman AI Agent**:
   - Slide-out autonomous agent drawer supporting page contextual analysis, response drafting, DOM structure inspection, navigation task scanning, and tab summarization.
   - Gamified persistent energy credit counter with real-time UI status updates in the sticky header (`⚡ Shaktiman AI (10 credits)`).
   - High-voltage digital invoice paywall modal triggered when energy reaches 0 credits.

7. **Dynamic Animals & Memes Wallpaper Engine**:
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

### 1. Start Shaktiman Search Backend (Secured on 127.0.0.1)

```bash
python3 backend_server.py
```

Or via uvicorn directly:

```bash
python3 -m uvicorn app:app --host 127.0.0.1 --port 8000
```

### 2. Launch Shaktiman Desktop Browser

```bash
npm start
```

### 3. Production Packaging

```bash
npm run build
```

## Creator Attribution

Built and copyrighted by DevXanxit. All rights reserved.
Official Portfolio: [https://ankit-portfolio-ten-tawny.vercel.app/](https://ankit-portfolio-ten-tawny.vercel.app/)
