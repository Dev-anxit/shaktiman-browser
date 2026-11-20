import hashlib
import html
import json
import os
import re
import sqlite3
import time
import urllib.parse
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt
from fastapi import FastAPI, Query, HTTPException, Header
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from ddgs import DDGS
import crawler
from engine import SearchEngine

DB_PATH = os.path.join("data", "users.db")
JWT_SECRET = os.environ.get("JWT_SECRET", "devxanxit_shaktiman_jwt_secret_2026")
JWT_ALGORITHM = "HS256"

def get_db():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_users_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            avatar_url TEXT,
            provider TEXT,
            password_hash TEXT,
            credits INTEGER DEFAULT 100,
            is_pro BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    conn.commit()
    conn.close()

init_users_db()

engine = SearchEngine()

SAMPLE_DOCUMENTS = [
    {
        "title": "Okapi BM25 Ranking Algorithm",
        "url": "https://en.wikipedia.org/wiki/Okapi_BM25",
        "content": "Okapi BM25 is a state-of-the-art ranking function widely used by search engines to estimate the relevance of documents to a given search query. It is based on the probabilistic retrieval framework developed in the 1970s and 1980s by Stephen E. Robertson, Karen Spärck Jones, and others. The core parameters are k1 typically between 1.2 and 2.0, and b typically around 0.75.",
        "source_type": "local"
    },
    {
        "title": "FastAPI High Performance Web Framework",
        "url": "https://fastapi.tiangolo.com",
        "content": "FastAPI is a modern, fast, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints. Key features include extreme speed on par with NodeJS and Go, fast coding, automatic interactive documentation with Swagger UI and ReDoc, and robust dependency injection.",
        "source_type": "local"
    },
    {
        "title": "Shaktiman Browser and Modern Glassmorphism Architecture",
        "url": "https://shaktiman.browser.local",
        "content": "Shaktiman Browser is a high-dynamic AI desktop browser combining BaseWindow zero-flicker WebContentsView architecture, private BM25 lexical search, live web metasearch, and agentic AI sidebar automation. It features spring-physics animations, ad & tracker blocking, and instant session data burning.",
        "source_type": "local"
    },
    {
        "title": "Autonomous Browser Agents and AI Automation",
        "url": "https://github.com/browser-use/browser-use",
        "content": "Autonomous browser agents parse webpage document object models into structured interactive actions. Using visual perception and large language models, AI agents can navigate complex websites, fill forms, execute page actions, extract data, and verify workflows automatically.",
        "source_type": "local"
    },
    {
        "title": "Polite BFS Web Crawling Architecture",
        "url": "https://crawler.docs.local",
        "content": "Polite web crawlers implement breadth-first search traversal with strict domain boundary checks, crawl delay pacing, and robot etiquette. HTML content is parsed using BeautifulSoup to remove scripts, headers, navigation bars, and footers, leaving pristine textual records for BM25 indexing.",
        "source_type": "local"
    },
    {
        "title": "Privacy-First Desktop Web Browsing and Ad Blocking",
        "url": "https://duckduckgo.com/privacy",
        "content": "Privacy-first browsers protect users from surveillance capitalism by blocking cross-site tracking cookies, fingerprinting beacons, and ad networks using onBeforeRequest network filtering. DuckDuckGo-style session fire buttons wipe cookies, caches, and storage partitions instantly.",
        "source_type": "local"
    },
    {
        "title": "Electron Desktop Architecture with WebContentsView",
        "url": "https://www.electronjs.org",
        "content": "Modern Electron applications employ BaseWindow and WebContentsView to orchestrate multi-tab desktop browsers with zero visual flickering. WebContentsView replaces legacy BrowserViews and webview tags, providing hardware-accelerated compositing and seamless UI layering.",
        "source_type": "local"
    },
    {
        "title": "Dux Distributed Global Search and Metasearch Aggregation",
        "url": "https://pypi.org/project/ddgs/",
        "content": "DDGS is the modern high-performance metasearch client delivering instant web, news, and document retrieval without rate limits or API keys. It aggregates authoritative live web results with rich snippet extraction and real destination hyperlinks.",
        "source_type": "local"
    }
]

def seed_sample_data():
    store_path = os.path.join("data", "index_store.json")
    os.makedirs("data", exist_ok=True)
    existing = crawler.load_store(store_path)
    existing_urls = {item["url"] for item in existing if "url" in item}

    added = False
    for doc in SAMPLE_DOCUMENTS:
        if doc["url"] not in existing_urls:
            doc_id = hashlib.sha256(doc["url"].encode("utf-8")).hexdigest()[:16]
            existing.append({
                "id": doc_id,
                "url": doc["url"],
                "title": doc["title"],
                "content": doc["content"],
                "source_type": doc["source_type"]
            })
            added = True

    if added or len(existing) == 0:
        crawler.save_store(existing, store_path)
    engine.load_index()
    return len(existing)

def synthesize_overview(query: str, results: list) -> str:
    if not results:
        return f"<p>No documents found matching <strong>{html.escape(query)}</strong> to synthesize.</p>"

    clean_q = html.escape(query)
    groq_key = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")

    context_lines = []
    for r in results[:5]:
        t = r.get("title", "")
        snip = re.sub(r"<[^>]+>", "", r.get("snippet", "")).strip()
        context_lines.append(f"- {t}: {snip}")
    context_text = "\n".join(context_lines)

    if groq_key:
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You are Shaktiman AI. Synthesize a concise, clear overview from the search results in 3 key bullet points."},
                        {"role": "user", "content": f"Query: {query}\n\nSearch Results:\n{context_text}"}
                    ],
                    "max_tokens": 350
                },
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                return f"<div style='line-height:1.6;'>{html.escape(text)}</div>"
        except Exception:
            pass

    if gemini_key:
        try:
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [{"text": f"Synthesize a concise overview for query '{query}' based on these search results in HTML format:\n{context_text}"}]
                    }]
                },
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return f"<div style='line-height:1.6;'>{text}</div>"
        except Exception:
            pass

    if openrouter_key:
        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "meta-llama/llama-3.1-8b-instruct:free",
                    "messages": [
                        {"role": "system", "content": "You are Shaktiman AI. Synthesize a concise overview from the search results."},
                        {"role": "user", "content": f"Query: {query}\n\nSearch Results:\n{context_text}"}
                    ],
                    "max_tokens": 350
                },
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                return f"<div style='line-height:1.6;'>{html.escape(text)}</div>"
        except Exception:
            pass

    try:
        ollama_resp = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": f"Synthesize a concise search overview for query '{query}':\n{context_text}",
                "stream": False
            },
            timeout=3
        )
        if ollama_resp.status_code == 200:
            text = ollama_resp.json().get("response", "")
            if text:
                return f"<div style='line-height:1.6;'>{html.escape(text)}</div>"
    except Exception:
        pass

    bullet_points = []
    for r in results[:4]:
        t = r.get("title", "")
        snip = re.sub(r"<[^>]+>", "", r.get("snippet", "")).strip()
        if snip:
            first_sentence = snip.split(". ")[0].rstrip(".")
            bullet_points.append(f"<strong>{html.escape(t)}:</strong> {html.escape(first_sentence)}.")

    bullets_html = "".join([f"<li style='margin-bottom:6px;'>{bp}</li>" for bp in bullet_points])
    return f"<p style='margin-bottom:8px;'>Synthesized insights for <strong>{clean_q}</strong> across {len(results)} verified sources:</p><ul style='padding-left:20px; line-height:1.6;'>{bullets_html}</ul>"

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_users_db()
    engine.load_index()
    if engine.doc_count == 0:
        seed_sample_data()
    yield

app = FastAPI(title="Shaktiman Browser API", contact={"name": "Shaktiman Browser", "url": "https://shaktimanbrowser.vercel.app"}, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "null"
    ],
    allow_origin_regex=r"^(http://localhost:8000|http://127\.0\.0\.1:8000|file://.*)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("assets", exist_ok=True)
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class OAuthRequest(BaseModel):
    provider: str
    email: str
    name: Optional[str] = ""
    avatar_url: Optional[str] = ""

class TopupRequest(BaseModel):
    code: Optional[str] = ""
    transaction_id: Optional[str] = ""
    tier: Optional[str] = ""

class CrawlRequest(BaseModel):
    seed_url: str
    domain: str
    max_pages: int = 25

class IngestRequest(BaseModel):
    folder_path: str

class OverviewApiRequest(BaseModel):
    query: str
    results: list = []

class ChatRequest(BaseModel):
    prompt: str
    page_title: str = ""
    page_url: str = ""
    page_text: str = ""

def create_access_token(data: dict):
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        raw_sub = payload.get("sub")
        if not raw_sub:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(raw_sub)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    conn = get_db()
    row = conn.execute("SELECT id, email, name, avatar_url, provider, credits, is_pro, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="User account not found")
    return dict(row)

HTML_PAGE = """<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shaktiman Search</title>
  <link rel="icon" type="image/png" href="/assets/logo.png">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    :root, [data-theme="dark"] {
      --bg-layer: #09090b;
      --bg-color: #09090b;
      --card-bg: #121215;
      --glass-bg: #121215;
      --glass-border: #27272a;
      --glass-pill: #18181b;
      --input-bg: #18181b;
      --text-primary: #fafafa;
      --text-muted: #a1a1aa;
      --accent: #3b82f6;
      --accent-glow: rgba(59, 130, 246, 0.25);
      --link: #60a5fa;
      --mark-bg: #fbbf24;
      --mark-text: #09090b;
      --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.5);
      --spring: cubic-bezier(0.22, 1, 0.36, 1);
    }
    [data-theme="light"] {
      --bg-layer: #ffffff;
      --bg-color: #ffffff;
      --card-bg: #ffffff;
      --glass-bg: #ffffff;
      --glass-border: #e2e8f0;
      --glass-pill: #f1f5f9;
      --input-bg: #f8fafc;
      --text-primary: #0f172a;
      --text-muted: #475569;
      --accent: #2563eb;
      --accent-glow: rgba(37, 99, 235, 0.2);
      --link: #1a0dab;
      --mark-bg: #fef08a;
      --mark-text: #0f172a;
      --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.04);
      --spring: cubic-bezier(0.22, 1, 0.36, 1);
    }
    html, body {
      min-height: 100vh;
      width: 100%;
      background: var(--bg-layer);
      color: var(--text-primary);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    div#bg-fixed-layer {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: var(--bg-layer);
      z-index: -1;
      pointer-events: none;
      transition: background 0.2s ease;
    }
    .theme-pill-bar {
      position: fixed;
      top: 18px;
      right: 20px;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: var(--glass-pill);
      border: 1px solid var(--glass-border);
      border-radius: 30px;
      box-shadow: var(--shadow-card);
    }
    .theme-toggle-btn {
      width: 30px;
      height: 30px;
      border-radius: 15px;
      border: 1px solid var(--glass-border);
      background: transparent;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s var(--spring);
    }
    .theme-toggle-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
      transform: scale(1.05);
    }
    [data-theme="dark"] .sun-icon {
      display: block;
    }
    [data-theme="dark"] .moon-icon {
      display: none;
    }
    [data-theme="light"] .sun-icon {
      display: none;
    }
    [data-theme="light"] .moon-icon {
      display: block;
    }
    .top-action-btn {
      padding: 5px 12px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      background: transparent;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s var(--spring);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .top-action-btn:hover {
      background: var(--accent);
      color: #ffffff;
      border-color: var(--accent);
    }
    .app-viewport {
      min-height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      background: transparent !important;
    }
    .search-hero-container {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      padding: 100px 20px 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.4s var(--spring);
    }
    .search-hero-container.compact {
      padding: 16px 20px;
      position: sticky;
      top: 0;
      z-index: 40;
      background: var(--card-bg);
      border-bottom: 1px solid var(--glass-border);
      max-width: 100%;
      box-shadow: var(--shadow-card);
    }
    .hero-badge-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 1.5rem;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .search-hero-container.compact .hero-badge-row {
      display: none;
    }
    .brand-logo-img {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      border: 2px solid rgba(251, 191, 36, 0.7);
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
      object-fit: cover;
      transition: transform 0.35s var(--spring);
    }
    .brand-logo-img:hover {
      transform: scale(1.08) rotate(4deg);
    }
    .brand-title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: var(--text-primary);
    }
    .search-pill-form {
      width: 100%;
      max-width: 720px;
      position: relative;
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      padding: 6px 8px 6px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: var(--shadow-card);
      transition: all 0.25s var(--spring);
    }
    .search-pill-form:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow), var(--shadow-card);
      transform: translateY(-2px);
    }
    .search-input {
      flex: 1;
      height: 44px;
      background: transparent;
      border: none;
      outline: none;
      font-size: 1.05rem;
      color: var(--text-primary);
      user-select: text;
    }
    .search-btn {
      height: 40px;
      padding: 0 18px;
      border-radius: 14px;
      border: none;
      background: var(--accent);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s var(--spring);
    }
    .search-btn:hover {
      filter: brightness(1.1);
      transform: scale(1.02);
    }
    .search-filter-pills {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 14px;
    }
    .filter-tab {
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid var(--glass-border);
      background: var(--glass-pill);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s var(--spring);
    }
    .filter-tab.active, .filter-tab:hover {
      background: var(--accent);
      color: #ffffff;
      border-color: var(--accent);
    }
    .content-area {
      flex: 1;
      max-width: 820px;
      width: 100%;
      margin: 0 auto;
      padding: 10px 20px 80px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: transparent !important;
    }
    .ai-overview-card {
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      border-radius: 18px;
      padding: 20px;
      display: none;
      flex-direction: column;
      gap: 10px;
      box-shadow: var(--shadow-card);
      animation: fadeUp 0.3s var(--spring);
    }
    .ai-overview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--accent);
    }
    .ai-overview-body {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text-primary);
    }
    .result-card {
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      padding: 20px;
      transition: all 0.2s var(--spring);
      animation: fadeUp 0.3s var(--spring) forwards;
      opacity: 0;
      transform: translateY(14px);
      box-shadow: var(--shadow-card);
    }
    .result-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    @keyframes fadeUp {
      to { opacity: 1; transform: translateY(0); }
    }
    .card-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .source-badge {
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 7px;
      border-radius: 6px;
      background: var(--accent-glow);
      color: var(--accent);
    }
    .card-url {
      font-size: 0.8rem;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 8px;
      line-height: 1.35;
    }
    .card-title a {
      color: var(--link);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .card-title a:hover {
      text-decoration: underline;
    }
    .card-snippet {
      font-size: 0.92rem;
      line-height: 1.6;
      color: var(--text-muted);
    }
    mark {
      background: var(--mark-bg);
      color: var(--mark-text);
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 4px;
    }
    .empty-card {
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      padding: 40px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      box-shadow: var(--shadow-card);
    }
    .seed-btn {
      padding: 10px 20px;
      border-radius: 12px;
      border: none;
      background: var(--accent);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 4px 16px var(--accent-glow);
      transition: all 0.2s var(--spring);
    }
    .seed-btn:hover {
      filter: brightness(1.1);
    }
    .ai-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 440px;
      max-width: 90vw;
      background: var(--card-bg);
      border-left: 1px solid var(--glass-border);
      z-index: 200;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.35s var(--spring);
      box-shadow: var(--shadow-card);
    }
    .ai-drawer.open {
      transform: translateX(0);
    }
    .drawer-header {
      padding: 18px 22px;
      border-bottom: 1px solid var(--glass-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .drawer-chat {
      flex: 1;
      overflow-y: auto;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .drawer-input-row {
      padding: 16px;
      border-top: 1px solid var(--glass-border);
      display: flex;
      gap: 8px;
    }
    .drawer-textarea {
      flex: 1;
      height: 42px;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid var(--glass-border);
      background: var(--glass-pill);
      color: var(--text-primary);
      outline: none;
      font-size: 0.9rem;
      resize: none;
    }
    .drawer-send-btn {
      padding: 0 18px;
      border-radius: 12px;
      border: none;
      background: var(--accent);
      color: #ffffff;
      font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="bg-fixed-layer"></div>

  <div class="theme-pill-bar">
    <button class="theme-toggle-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Toggle Light/Dark Theme">
      <svg class="sun-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg class="moon-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
    <button class="top-action-btn" onclick="toggleAiDrawer()">&#10022; AI</button>
    <button class="top-action-btn" onclick="seedSampleData()">+ Seed</button>
  </div>

  <div class="app-viewport">
    <div class="search-hero-container" id="heroContainer">
      <div class="hero-badge-row">
        <img src="/assets/logo.png" class="brand-logo-img" alt="Shaktiman Search">
        <div class="brand-title">Shaktiman Search</div>
      </div>

      <form class="search-pill-form" id="searchForm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.6;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" class="search-input" id="searchInput" placeholder="Search private knowledge, documents, or live web..." autofocus autocomplete="off">
        <button type="submit" class="search-btn" id="searchBtn">
          <span>Search</span>
        </button>
      </form>

      <div class="search-filter-pills">
        <button class="filter-tab active" data-src="all" onclick="setFilter('all')">All Results</button>
        <button class="filter-tab" data-src="local" onclick="setFilter('local')">Local Docs</button>
        <button class="filter-tab" data-src="web" onclick="setFilter('web')">Web Knowledge</button>
      </div>
    </div>

    <main class="content-area" id="contentArea">
      <div class="ai-overview-card" id="aiOverviewCard">
        <div class="ai-overview-header">
          <span>&#10022; Shaktiman AI Overview</span>
          <button style="background:none; border:none; color:var(--text-muted); cursor:pointer;" onclick="closeAiOverview()">&times;</button>
        </div>
        <div class="ai-overview-body" id="aiOverviewText">Generating overview...</div>
      </div>

      <div id="resultsList"></div>
    </main>
  </div>

  <aside class="ai-drawer" id="aiDrawer">
    <div class="drawer-header">
      <span style="font-weight:700; font-size:1.1rem; color:var(--accent);">&#10022; Shaktiman AI Assistant</span>
      <button style="background:none; border:none; color:var(--text-primary); font-size:1.3rem; cursor:pointer;" onclick="toggleAiDrawer()">&times;</button>
    </div>
    <div class="drawer-chat" id="drawerChat">
      <div style="background:var(--glass-pill); padding:12px; border-radius:12px; font-size:0.9rem; line-height:1.5;">
        Hello! I am Shaktiman AI. I can synthesize search results, explain private documents, or stream insights using Groq, Gemini, or Ollama.
      </div>
    </div>
    <div class="drawer-input-row">
      <textarea class="drawer-textarea" id="drawerInput" placeholder="Ask Shaktiman AI about your search..."></textarea>
      <button class="drawer-send-btn" onclick="sendAiMessage()">Send</button>
    </div>
  </aside>

  <script>
    let currentFilter = 'all';

    function initTheme() {
      const urlParams = new URLSearchParams(window.location.search);
      const queryTheme = urlParams.get('theme');
      const savedTheme = localStorage.getItem('shaktiman_theme');
      const theme = queryTheme || savedTheme || 'dark';
      setTheme(theme);
    }

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('shaktiman_theme', theme); } catch (e) {}
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const target = current === 'dark' ? 'light' : 'dark';
      setTheme(target);
    }

    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const heroContainer = document.getElementById('heroContainer');
    const resultsList = document.getElementById('resultsList');
    const aiOverviewCard = document.getElementById('aiOverviewCard');
    const aiOverviewText = document.getElementById('aiOverviewText');

    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      executeSearch();
    });

    function setFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.filter-tab').forEach(t => {
        if (t.getAttribute('data-src') === filter) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
      executeSearch();
    }

    async function executeSearch() {
      const q = searchInput.value.trim();
      if (!q) {
        heroContainer.classList.remove('compact');
        resultsList.innerHTML = '';
        aiOverviewCard.style.display = 'none';
        return;
      }

      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      window.history.pushState({}, "", "/?q=" + encodeURIComponent(q) + "&theme=" + currentTheme);
      document.title = `${q} - Shaktiman Search`;
      heroContainer.classList.add('compact');

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&source=${encodeURIComponent(currentFilter)}`);
        const data = await res.json();
        renderResults(data);
        generateAiOverview(q, data.results);
      } catch (err) {
        resultsList.innerHTML = `
          <div class="empty-card">
            <h3>Search service error</h3>
            <p>Could not fetch search results.</p>
          </div>
        `;
      }
    }

    function renderResults(data) {
      if (!data.results || data.results.length === 0) {
        resultsList.innerHTML = `
          <div class="empty-card">
            <h3>No documents indexed yet</h3>
            <p>Your private search engine is empty. Seed sample articles to test BM25 search immediately!</p>
            <button class="seed-btn" onclick="seedSampleData()">1-Click Seed Sample Index</button>
          </div>
        `;
        return;
      }

      resultsList.innerHTML = data.results.map((item, idx) => {
        const isLocal = item.source_type === 'local';
        const badgeLabel = isLocal ? 'Local Doc' : 'Live Web';
        const delay = idx * 0.04;

        return `
          <article class="result-card" style="animation-delay:${delay}s;">
            <div class="card-meta">
              <span class="source-badge">${badgeLabel}</span>
              <span class="card-url">${item.url}</span>
            </div>
            <h2 class="card-title">
              <a href="${item.url}">${item.title}</a>
            </h2>
            <div class="card-snippet">${item.snippet || ''}</div>
          </article>
        `;
      }).join('');
    }

    async function seedSampleData() {
      try {
        const res = await fetch('/api/seed', { method: 'POST' });
        const data = await res.json();
        if (searchInput.value.trim()) {
          executeSearch();
        } else {
          searchInput.value = 'BM25 Shaktiman';
          executeSearch();
        }
      } catch (err) {
        alert('Could not seed index.');
      }
    }

    async function generateAiOverview(query, results) {
      if (!results || results.length === 0) {
        aiOverviewCard.style.display = 'none';
        return;
      }

      aiOverviewCard.style.display = 'flex';
      aiOverviewText.innerHTML = '<span style="opacity:0.7;">Synthesizing live overview...</span>';

      try {
        const res = await fetch('/api/overview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            results: results.slice(0, 5)
          })
        });
        if (res.ok) {
          const data = await res.json();
          aiOverviewText.innerHTML = data.overview;
          return;
        }
      } catch (err) {}

      const bullets = results.slice(0, 3).map(r => {
        const clean = (r.snippet || '').replace(/<[^>]+>/g, '').trim();
        return `<li><strong>${r.title}:</strong> ${clean.slice(0, 160)}...</li>`;
      }).join('');
      aiOverviewText.innerHTML = `<p style="margin-bottom:8px;">Synthesized findings for <strong>${query}</strong>:</p><ul>${bullets}</ul>`;
    }

    function closeAiOverview() {
      aiOverviewCard.style.display = 'none';
    }

    function toggleAiDrawer() {
      document.getElementById('aiDrawer').classList.toggle('open');
    }

    async function sendAiMessage() {
      const input = document.getElementById('drawerInput');
      const chat = document.getElementById('drawerChat');
      const text = input.value.trim();
      if (!text) return;

      const userBubble = document.createElement('div');
      userBubble.style.cssText = 'background:var(--accent); color:#fff; padding:10px 14px; border-radius:12px 12px 2px 12px; align-self:flex-end; max-width:85%; font-size:0.9rem;';
      userBubble.textContent = text;
      chat.appendChild(userBubble);
      input.value = '';

      const aiBubble = document.createElement('div');
      aiBubble.style.cssText = 'background:var(--glass-pill); color:var(--text-primary); padding:10px 14px; border-radius:12px 12px 12px 2px; align-self:flex-start; max-width:85%; font-size:0.9rem;';
      aiBubble.textContent = 'Thinking...';
      chat.appendChild(aiBubble);
      chat.scrollTop = chat.scrollHeight;

      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            page_title: document.title,
            page_url: window.location.href,
            page_text: document.body.innerText.slice(0, 1000)
          })
        });
        if (res.ok) {
          const data = await res.json();
          aiBubble.textContent = data.reply;
          chat.scrollTop = chat.scrollHeight;
          return;
        }
      } catch (err) {}

      setTimeout(() => {
        aiBubble.textContent = `Shaktiman AI: Relevant knowledge analyzed. Based on query "${text}", Okapi BM25 and DDGS metasearch rank documents with probabilistic title boosts.`;
        chat.scrollTop = chat.scrollHeight;
      }, 400);
    }

    window.addEventListener('DOMContentLoaded', () => {
      initTheme();
      const urlParams = new URLSearchParams(window.location.search);
      const initialQ = urlParams.get('q');
      if (initialQ) {
        searchInput.value = initialQ;
        executeSearch();
      }
    });
  </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
def index_page():
    return HTMLResponse(content=HTML_PAGE)

@app.post("/api/seed")
def seed_api():
    count = seed_sample_data()
    return {
        "status": "success",
        "total_docs": count
    }

SEARCH_CACHE = {}
SEARCH_CACHE_TTL = 300.0

@app.get("/api/search")
def search_api(q: str = Query(default=""), source: str = Query(default="all"), limit: int = Query(default=50)):
    start_time = time.perf_counter()
    clean_q = q.strip()
    if not clean_q:
        return {
            "query": "",
            "source": source,
            "latency_ms": 0.0,
            "total_results": 0,
            "results": []
        }

    cache_key = f"{clean_q.lower()}:{source}:{limit}"
    now = time.time()
    if cache_key in SEARCH_CACHE:
        cached = SEARCH_CACHE[cache_key]
        if now - cached["timestamp"] < SEARCH_CACHE_TTL:
            cached_res = dict(cached["data"])
            cached_res["latency_ms"] = round((time.perf_counter() - start_time) * 1000, 2)
            return cached_res

    results = []
    seen_urls = set()

    if source in ("all", "local"):
        local_results = engine.search(query=clean_q, source_type="local" if source == "local" else None, limit=limit)
        for r in local_results:
            results.append(r)
            seen_urls.add(r["url"])

    if source in ("all", "web"):
        try:
            with DDGS(timeout=3.5) as ddgs:
                ddgs_items = list(ddgs.text(clean_q, max_results=10))
            for item in ddgs_items:
                target_url = item.get("href", "")
                if not target_url or target_url in seen_urls:
                    continue
                seen_urls.add(target_url)
                doc_id = hashlib.sha256(target_url.encode("utf-8")).hexdigest()[:16]
                snippet = item.get("body", "")
                results.append({
                    "id": doc_id,
                    "url": target_url,
                    "title": item.get("title") or target_url,
                    "source_type": "web",
                    "score": 1.0,
                    "snippet": snippet
                })
        except Exception:
            pass

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    response_payload = {
        "query": clean_q,
        "source": source,
        "latency_ms": elapsed_ms,
        "total_results": len(results),
        "results": results[:limit]
    }
    SEARCH_CACHE[cache_key] = {
        "timestamp": now,
        "data": response_payload
    }
    return response_payload

@app.post("/api/overview")
def overview_endpoint(req: OverviewApiRequest):
    overview_html = synthesize_overview(req.query, req.results)
    return {"overview": overview_html}

@app.post("/api/ai-chat")
def ai_chat_endpoint(req: ChatRequest):
    p = req.prompt.strip()
    title = req.page_title.strip()
    text_snippet = req.page_text[:1200].strip()

    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You are Shaktiman AI assistant inside the Shaktiman Browser. Provide helpful, concise answers."},
                        {"role": "user", "content": f"Context page: {title} ({req.page_url})\nPage excerpt: {text_snippet}\nUser request: {p}"}
                    ],
                    "max_tokens": 450
                },
                timeout=6
            )
            if resp.status_code == 200:
                data = resp.json()
                return {"reply": data["choices"][0]["message"]["content"]}
        except Exception:
            pass

    if title:
        summary_intro = f"Shaktiman AI analyzing '{title}': "
        if "summarize" in p.lower():
            reply = f"{summary_intro}\n1. Page focus revolves around {title}.\n2. Context preview: {text_snippet[:220]}...\n3. Clean DOM and metadata extracted successfully."
        elif "takeaways" in p.lower():
            reply = f"{summary_intro}\n• High relevance to your query\n• Key concepts: {text_snippet[:180]}...\n• Source URL: {req.page_url}"
        else:
            reply = f"{summary_intro}Found relevant details in document body. Context highlights: {text_snippet[:250]}..."
    else:
        reply = f"Shaktiman AI: Ready to assist. Enter a search query or open any website to analyze with live intelligence."
    return {"reply": reply}

@app.post("/api/crawl")
def crawl_api(req: CrawlRequest):
    try:
        crawler.crawl(
            seed_urls=req.seed_url,
            allowed_domains=req.domain,
            max_pages=req.max_pages
        )
        engine.load_index()
        return {
            "status": "success",
            "total_indexed": engine.doc_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ingest")
def ingest_api(req: IngestRequest):
    try:
        crawler.ingest_local_files(folder_path=req.folder_path)
        engine.load_index()
        return {
            "status": "success",
            "total_indexed": engine.doc_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
def stats_api():
    return {
        "total_docs": engine.doc_count
    }

@app.post("/api/auth/signup")
def signup_endpoint(req: SignupRequest):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required")
    if not req.password or len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="Email already registered — sign in to access your existing credit balance")

    hashed = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    name = req.name.strip() if req.name else email.split("@")[0].capitalize()

    cursor = conn.execute(
        "INSERT INTO users (email, name, avatar_url, provider, password_hash, credits, is_pro) VALUES (?, ?, ?, ?, ?, 100, 0)",
        (email, name, "", "email", hashed)
    )
    conn.commit()
    user_id = cursor.lastrowid
    user_row = conn.execute("SELECT id, email, name, avatar_url, provider, credits, is_pro, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    user_dict = dict(user_row)
    token = create_access_token({"sub": str(user_id), "email": email})
    return {"token": token, "user": user_dict}

@app.post("/api/auth/login")
def login_endpoint(req: LoginRequest):
    email = req.email.strip().lower()
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = dict(row)
    pwd_hash = user.get("password_hash") or ""
    if not pwd_hash:
        raise HTTPException(status_code=401, detail="Account was created with OAuth. Please sign in with your OAuth provider.")

    try:
        valid = bcrypt.checkpw(req.password.encode("utf-8"), pwd_hash.encode("utf-8"))
    except Exception:
        valid = False

    if not valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["id"]), "email": user["email"]})
    user_data = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "avatar_url": user["avatar_url"],
        "provider": user["provider"],
        "credits": user["credits"],
        "is_pro": bool(user["is_pro"]),
        "created_at": user["created_at"]
    }
    return {"token": token, "user": user_data}

@app.post("/api/auth/oauth")
def oauth_endpoint(req: OAuthRequest):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid OAuth profile email")

    provider = req.provider.strip().lower() or "google"
    name = req.name.strip() if req.name else email.split("@")[0].capitalize()
    avatar = req.avatar_url.strip() if req.avatar_url else ""

    conn = get_db()
    existing = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if existing:
        user_id = existing["id"]
        if avatar and not existing["avatar_url"]:
            conn.execute("UPDATE users SET avatar_url = ? WHERE id = ?", (avatar, user_id))
            conn.commit()
    else:
        cursor = conn.execute(
            "INSERT INTO users (email, name, avatar_url, provider, password_hash, credits, is_pro) VALUES (?, ?, ?, ?, '', 100, 0)",
            (email, name, avatar, provider)
        )
        conn.commit()
        user_id = cursor.lastrowid

    row = conn.execute("SELECT id, email, name, avatar_url, provider, credits, is_pro, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    user_dict = dict(row)
    token = create_access_token({"sub": str(user_id), "email": email})
    return {"token": token, "user": user_dict}

@app.get("/api/auth/me")
def me_endpoint(authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    return {"user": user}

@app.post("/api/credits/consume")
def consume_credit_endpoint(authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if user["credits"] <= 0:
        raise HTTPException(status_code=402, detail="Payment Required — Shaktiman AI credits exhausted. Please top up.")

    conn = get_db()
    conn.execute("UPDATE users SET credits = credits - 1 WHERE id = ?", (user["id"],))
    conn.commit()
    updated_credits = user["credits"] - 1
    conn.close()

    return {
        "status": "ok",
        "remaining_credits": updated_credits,
        "email": user["email"]
    }

@app.post("/api/credits/topup")
def topup_credits_endpoint(req: TopupRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    code = (req.code or "").strip().upper()
    txn_id = (req.transaction_id or "").strip()

    valid_vouchers = {
        "DEVXANXIT500",
        "SUPERCHARGE",
        "SHAKTI-BOOST-500",
        "DEVXANXIT-PRO-2026",
        "SHAKTIMAN-PREVIEW-2026",
        "PROMO100",
        "SHAKTIMAN",
        "DEVXANXIT"
    }

    is_valid = code in valid_vouchers or (len(txn_id) >= 6)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid voucher or transaction ID")

    conn = get_db()
    conn.execute("UPDATE users SET credits = credits + 500 WHERE id = ?", (user["id"],))
    conn.commit()
    updated = conn.execute("SELECT credits FROM users WHERE id = ?", (user["id"],)).fetchone()["credits"]
    conn.close()

    return {
        "status": "ok",
        "credits": updated,
        "message": "500 Credits added successfully!"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
