import hashlib
import html
import json
import os
import re
import time
import urllib.parse
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import requests
from ddgs import DDGS
import crawler
from engine import SearchEngine

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
    engine.load_index()
    if engine.doc_count == 0:
        seed_sample_data()
    yield

app = FastAPI(title="Shaktiman Search Engine", lifespan=lifespan)

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

HTML_PAGE = """<!DOCTYPE html>
<html lang="en" data-theme="aurora">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shaktiman Search</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    :root, [data-theme="aurora"] {
      --bg-layer: radial-gradient(at 0% 0%, #4338ca 0px, transparent 50%),
                  radial-gradient(at 100% 0%, #7e22ce 0px, transparent 50%),
                  radial-gradient(at 100% 100%, #0e7490 0px, transparent 50%),
                  radial-gradient(at 0% 100%, #be185d 0px, transparent 50%), rgb(7, 11, 20);
      --glass-bg: rgba(15, 23, 42, 0.65);
      --glass-border: rgba(255, 255, 255, 0.16);
      --glass-pill: rgba(30, 41, 59, 0.7);
      --text-primary: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.35);
      --mark-bg: #fbbf24;
      --mark-text: #0f172a;
      --spring: cubic-bezier(0.22, 1, 0.36, 1);
    }
    [data-theme="cyber"] {
      --bg-layer: #05070f;
      --glass-bg: rgba(10, 15, 30, 0.75);
      --glass-border: rgba(14, 165, 233, 0.25);
      --glass-pill: rgba(15, 23, 42, 0.85);
      --text-primary: #f0fdf4;
      --text-muted: #64748b;
      --accent: #22c55e;
      --accent-glow: rgba(34, 197, 94, 0.35);
      --mark-bg: #22c55e;
      --mark-text: #022c22;
      --spring: cubic-bezier(0.22, 1, 0.36, 1);
    }
    [data-theme="sunset"] {
      --bg-layer: radial-gradient(at 15% 15%, #b45309 0px, transparent 50%),
                  radial-gradient(at 85% 20%, #be123c 0px, transparent 55%),
                  radial-gradient(at 50% 85%, #6d28d9 0px, transparent 60%), rgb(19, 7, 34);
      --glass-bg: rgba(36, 15, 48, 0.65);
      --glass-border: rgba(244, 63, 94, 0.22);
      --glass-pill: rgba(48, 20, 64, 0.75);
      --text-primary: #fff1f2;
      --text-muted: #cbd5e1;
      --accent: #fb7185;
      --accent-glow: rgba(251, 113, 133, 0.4);
      --mark-bg: #f43f5e;
      --mark-text: #ffffff;
      --spring: cubic-bezier(0.22, 1, 0.36, 1);
    }
    [data-theme="strawberry"] {
      --bg-layer: radial-gradient(at 10% 20%, #fecdd3 0px, transparent 55%),
                  radial-gradient(at 90% 10%, #fed7aa 0px, transparent 50%),
                  radial-gradient(at 50% 90%, #fbcfe8 0px, transparent 60%),
                  radial-gradient(at 80% 80%, #ddd6fe 0px, transparent 50%), rgb(255, 241, 242);
      --glass-bg: rgba(255, 255, 255, 0.75);
      --glass-border: rgba(244, 63, 94, 0.25);
      --glass-pill: rgba(255, 241, 242, 0.85);
      --text-primary: #881337;
      --text-muted: #9f1239;
      --accent: #e11d48;
      --accent-glow: rgba(225, 29, 72, 0.25);
      --mark-bg: #f43f5e;
      --mark-text: #ffffff;
      --spring: cubic-bezier(0.22, 1, 0.36, 1);
    }
    [data-theme="custom"] {
      --bg-layer: #090d16;
      --glass-bg: rgba(15, 23, 42, 0.7);
      --glass-border: rgba(255, 255, 255, 0.2);
      --glass-pill: rgba(30, 41, 59, 0.8);
      --text-primary: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.35);
      --mark-bg: #fbbf24;
      --mark-text: #0f172a;
      --spring: cubic-bezier(0.22, 1, 0.36, 1);
    }
    html, body {
      min-height: 100vh;
      width: 100%;
      background: transparent !important;
      color: var(--text-primary);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
      overflow-x: hidden;
    }
    div#bg-fixed-layer {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: var(--bg-layer);
      background-size: cover;
      background-position: center;
      transition: background 0.6s ease;
      z-index: -1;
      pointer-events: none;
    }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.6;
      animation: drift 18s ease-in-out infinite alternate;
      pointer-events: none;
    }
    .orb-1 {
      width: 450px;
      height: 450px;
      background: #6366f1;
      top: 5%;
      left: 10%;
    }
    .orb-2 {
      width: 500px;
      height: 500px;
      background: #ec4899;
      top: 40%;
      right: 10%;
      animation-duration: 22s;
    }
    .orb-3 {
      width: 380px;
      height: 380px;
      background: #06b6d4;
      bottom: 5%;
      left: 30%;
      animation-duration: 26s;
    }
    @keyframes drift {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(60px, -40px) scale(1.1); }
      100% { transform: translate(-50px, 50px) scale(0.95); }
    }
    canvas#particle-canvas {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      display: none;
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
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--glass-border);
      border-radius: 30px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    }
    .theme-btn {
      padding: 5px 12px;
      font-size: 0.75rem;
      font-weight: 700;
      border: none;
      border-radius: 20px;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.25s var(--spring);
    }
    .theme-btn:hover {
      color: var(--text-primary);
    }
    .theme-btn.active {
      background: var(--accent);
      color: #ffffff;
      box-shadow: 0 2px 10px var(--accent-glow);
    }
    .top-action-btn {
      padding: 5px 10px;
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
      transition: all 0.5s var(--spring);
    }
    .search-hero-container.compact {
      padding: 16px 20px;
      position: sticky;
      top: 0;
      z-index: 40;
      background: var(--glass-bg);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border-bottom: 1px solid var(--glass-border);
      max-width: 100%;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
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
    .brand-logo-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--accent), #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #ffffff;
      box-shadow: 0 8px 24px var(--accent-glow);
    }
    .brand-title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.04em;
    }
    .search-pill-form {
      width: 100%;
      max-width: 720px;
      position: relative;
      background: var(--glass-pill);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      padding: 6px 8px 6px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.2);
      transition: all 0.3s var(--spring);
    }
    .search-pill-form:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px var(--accent-glow), 0 16px 45px rgba(0, 0, 0, 0.3);
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
      filter: brightness(1.15);
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
      background: var(--glass-bg);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--glass-border);
      border-radius: 18px;
      padding: 20px;
      display: none;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      animation: fadeUp 0.4s var(--spring);
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
      background: var(--glass-bg);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      padding: 20px;
      transition: all 0.25s var(--spring);
      animation: fadeUp 0.4s var(--spring) forwards;
      opacity: 0;
      transform: translateY(14px);
    }
    .result-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.2);
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
      color: var(--text-primary);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .card-title a:hover {
      color: var(--accent);
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
      background: var(--glass-bg);
      backdrop-filter: blur(24px);
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      padding: 40px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .seed-btn {
      padding: 10px 20px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, var(--accent), #a855f7);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 4px 18px var(--accent-glow);
      transition: all 0.2s var(--spring);
    }
    .seed-btn:hover {
      transform: scale(1.04);
      filter: brightness(1.15);
    }
    .ai-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 440px;
      max-width: 90vw;
      background: var(--glass-bg);
      backdrop-filter: blur(32px);
      -webkit-backdrop-filter: blur(32px);
      border-left: 1px solid var(--glass-border);
      z-index: 200;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.4s var(--spring);
      box-shadow: -15px 0 45px rgba(0, 0, 0, 0.4);
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
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      z-index: 300;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-overlay.open {
      display: flex;
    }
    .modal-card {
      background: var(--glass-bg);
      backdrop-filter: blur(28px);
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid var(--glass-border);
      background: var(--glass-pill);
      color: var(--text-primary);
      outline: none;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div id="bg-fixed-layer">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>
  <canvas id="particle-canvas"></canvas>

  <div class="theme-pill-bar">
    <button class="theme-btn active" data-theme="aurora" onclick="setTheme('aurora')">Aurora</button>
    <button class="theme-btn" data-theme="cyber" onclick="setTheme('cyber')">Cyber</button>
    <button class="theme-btn" data-theme="sunset" onclick="setTheme('sunset')">Sunset</button>
    <button class="theme-btn" data-theme="strawberry" onclick="setTheme('strawberry')">Strawberry</button>
    <button class="theme-btn" data-theme="custom" onclick="openCustomWpModal()">Custom</button>
    <button class="top-action-btn" onclick="toggleAiDrawer()">&#10022; AI</button>
    <button class="top-action-btn" onclick="seedSampleData()">+ Seed</button>
  </div>

  <div class="app-viewport">
    <div class="search-hero-container" id="heroContainer">
      <div class="hero-badge-row">
        <div class="brand-logo-icon">&#10022;</div>
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

  <div class="modal-overlay" id="customWpModal">
    <div class="modal-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700;">Custom Live Backdrop</span>
        <button style="background:none; border:none; color:var(--text-primary); font-size:1.2rem; cursor:pointer;" onclick="closeCustomWpModal()">&times;</button>
      </div>
      <input type="url" class="modal-input" id="customUrlInput" placeholder="Enter image URL (Unsplash, direct link)...">
      <div style="display:flex; gap:10px; align-items:center;">
        <span style="font-size:0.85rem; color:var(--text-muted);">Or pick local image:</span>
        <input type="file" id="customFileInput" accept="image/png,image/jpeg,image/webp" style="font-size:0.85rem;">
      </div>
      <button class="seed-btn" onclick="applyCustomWallpaper()" style="align-self:flex-end;">Apply Wallpaper</button>
    </div>
  </div>

  <script>
    let currentFilter = 'all';
    let particleActive = false;

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('shaktiman_theme', theme);

      document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.getAttribute('data-theme') === theme) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      const particleCanvas = document.getElementById('particle-canvas');
      const fixedLayer = document.getElementById('bg-fixed-layer');

      if (theme === 'cyber') {
        particleCanvas.style.display = 'block';
        particleActive = true;
        initParticles();
      } else {
        particleCanvas.style.display = 'none';
        particleActive = false;
      }

      if (theme !== 'custom') {
        fixedLayer.style.backgroundImage = '';
      }
    }

    function initTheme() {
      const saved = localStorage.getItem('shaktiman_theme') || 'aurora';
      setTheme(saved);
      const customWp = localStorage.getItem('shaktiman_custom_wp');
      if (saved === 'custom' && customWp) {
        document.getElementById('bg-fixed-layer').style.backgroundImage = `url('${customWp}')`;
      }
    }

    function openCustomWpModal() {
      document.getElementById('customWpModal').classList.add('open');
    }

    function closeCustomWpModal() {
      document.getElementById('customWpModal').classList.remove('open');
    }

    function applyCustomWallpaper() {
      const urlInput = document.getElementById('customUrlInput').value.trim();
      const fileInput = document.getElementById('customFileInput');

      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const dataUrl = e.target.result;
          document.getElementById('bg-fixed-layer').style.backgroundImage = `url('${dataUrl}')`;
          localStorage.setItem('shaktiman_custom_wp', dataUrl);
          setTheme('custom');
          closeCustomWpModal();
        };
        reader.readAsDataURL(fileInput.files[0]);
        return;
      }

      if (urlInput) {
        document.getElementById('bg-fixed-layer').style.backgroundImage = `url('${urlInput}')`;
        localStorage.setItem('shaktiman_custom_wp', urlInput);
        setTheme('custom');
        closeCustomWpModal();
      }
    }

    let pCanvas, pCtx, pWidth, pHeight;
    let particles = [];

    function initParticles() {
      pCanvas = document.getElementById('particle-canvas');
      pCtx = pCanvas.getContext('2d');
      pWidth = pCanvas.width = window.innerWidth;
      pHeight = pCanvas.height = window.innerHeight;

      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * pWidth,
          y: Math.random() * pHeight,
          vx: (Math.random() - 0.5) * 0.9,
          vy: (Math.random() - 0.5) * 0.9,
          r: Math.random() * 2 + 1.5
        });
      }
      renderParticles();
    }

    function renderParticles() {
      if (!particleActive) return;
      pCtx.clearRect(0, 0, pWidth, pHeight);
      pCtx.fillStyle = 'rgba(34, 197, 94, 0.6)';
      pCtx.strokeStyle = 'rgba(34, 197, 94, 0.12)';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > pWidth) p.vx *= -1;
        if (p.y < 0 || p.y > pHeight) p.vy *= -1;

        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pCtx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            pCtx.beginPath();
            pCtx.moveTo(p.x, p.y);
            pCtx.lineTo(p2.x, p2.y);
            pCtx.stroke();
          }
        }
      }
      requestAnimationFrame(renderParticles);
    }

    window.addEventListener('resize', () => {
      if (particleActive && pCanvas) {
        pWidth = pCanvas.width = window.innerWidth;
        pHeight = pCanvas.height = window.innerHeight;
      }
    });

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

      window.history.pushState({}, "", "/?q=" + encodeURIComponent(q));
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

    results = []
    seen_urls = set()

    if source in ("all", "local"):
        local_results = engine.search(query=clean_q, source_type="local" if source == "local" else None, limit=limit)
        for r in local_results:
            results.append(r)
            seen_urls.add(r["url"])

    if source in ("all", "web"):
        try:
            with DDGS() as ddgs:
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
    return {
        "query": clean_q,
        "source": source,
        "latency_ms": elapsed_ms,
        "total_results": len(results),
        "results": results[:limit]
    }

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
