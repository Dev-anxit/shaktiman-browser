# Shaktiman Browser & Private Search Engine

High-dynamic AI desktop browser with BaseWindow zero-flicker WebContentsView architecture, private BM25 lexical ranking, live web metasearch via DDGS, and agentic AI sidebar automation.

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

## Features

- Shaktiman Search with dual Okapi BM25 in-memory indexing and live DDGS metasearch fallback.
- AI Overview synthesizing verified query results and real source hyperlinks.
- 5 Live dynamic glassmorphism themes: Aurora Mesh, Cyber Grid & Particles, Sunset Glass, Strawberry Pastel, and Custom Backdrop.
- Real-time address bar sync, instant session burning (cookies, cache & storage), and ad/tracker blocker.
- AI Studio drawer extracting page DOM context and automating browser actions.
