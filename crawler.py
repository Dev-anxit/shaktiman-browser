import hashlib
import json
import os
import re
import sys
import time
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader

DEFAULT_STORE_PATH = os.path.join("data", "index_store.json")

def load_store(store_path=DEFAULT_STORE_PATH):
    if not os.path.exists(store_path):
        return []
    try:
        with open(store_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except Exception:
        return []

def save_store(records, store_path=DEFAULT_STORE_PATH):
    os.makedirs(os.path.dirname(os.path.abspath(store_path)), exist_ok=True)
    with open(store_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

def crawl(seed_urls, allowed_domains, max_pages=25, crawl_delay=0.3, store_path=DEFAULT_STORE_PATH):
    if isinstance(seed_urls, str):
        seed_urls = [seed_urls]
    if isinstance(allowed_domains, str):
        allowed_domains = {allowed_domains.lower().strip()}
    else:
        allowed_domains = {str(d).lower().strip() for d in allowed_domains}

    existing_records = load_store(store_path)
    records_by_url = {item["url"]: item for item in existing_records if "url" in item}

    queue = deque()
    visited = set()

    for url in seed_urls:
        clean_seed = url.split("#")[0].strip()
        if clean_seed:
            queue.append(clean_seed)
            visited.add(clean_seed)

    session = requests.Session()
    session.headers.update({"User-Agent": "PrivateSearchEngineBot/1.0 (+https://localhost)"})

    crawled_count = 0

    while queue and crawled_count < max_pages:
        current_url = queue.popleft()
        try:
            time.sleep(crawl_delay)
            response = session.get(current_url, timeout=10)
            if response.status_code != 200:
                continue

            content_type = response.headers.get("Content-Type", "").lower()
            if "text/html" not in content_type and not current_url.endswith((".html", ".htm", "/")):
                continue

            soup = BeautifulSoup(response.text, "html.parser")

            for tag_name in ["script", "style", "nav", "footer", "header"]:
                for element in soup.find_all(tag_name):
                    element.decompose()

            raw_title = soup.title.get_text() if soup.title else ""
            title = re.sub(r"\s+", " ", raw_title).strip()
            if not title:
                title = current_url

            raw_text = soup.get_text(separator=" ", strip=True)
            content = re.sub(r"\s+", " ", raw_text).strip()

            if content or title:
                doc_id = hashlib.sha256(current_url.encode("utf-8")).hexdigest()[:16]
                record = {
                    "id": doc_id,
                    "url": current_url,
                    "title": title,
                    "content": content,
                    "source_type": "web"
                }
                records_by_url[current_url] = record
                crawled_count += 1

            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"].strip()
                if not href or href.startswith(("javascript:", "mailto:", "tel:")):
                    continue
                next_url = urljoin(current_url, href).split("#")[0].strip()
                parsed = urlparse(next_url)
                if parsed.scheme in ("http", "https"):
                    host = parsed.netloc.lower()
                    if host in allowed_domains or any(host.endswith("." + d) for d in allowed_domains):
                        if next_url not in visited:
                            visited.add(next_url)
                            queue.append(next_url)

        except Exception:
            continue

    all_records = list(records_by_url.values())
    save_store(all_records, store_path)
    return all_records

def ingest_local_files(folder_path, store_path=DEFAULT_STORE_PATH):
    existing_records = load_store(store_path)
    records_by_url = {item["url"]: item for item in existing_records if "url" in item}

    target_dir = Path(folder_path)
    if not target_dir.exists():
        return list(records_by_url.values())

    for path in target_dir.rglob("*"):
        if not path.is_file():
            continue

        ext = path.suffix.lower()
        if ext not in [".txt", ".md", ".pdf"]:
            continue

        file_url = str(path.resolve())
        doc_id = hashlib.sha256(file_url.encode("utf-8")).hexdigest()[:16]
        title = path.name
        content = ""

        try:
            if ext in [".txt", ".md"]:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                if ext == ".md":
                    for line in content.splitlines():
                        trimmed = line.strip()
                        if trimmed.startswith("#"):
                            header_title = trimmed.lstrip("#").strip()
                            if header_title:
                                title = header_title
                                break

            elif ext == ".pdf":
                reader = PdfReader(str(path))
                extracted_pages = []
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_pages.append(page_text)
                content = "\n".join(extracted_pages)
                if reader.metadata and reader.metadata.title:
                    meta_title = reader.metadata.title.strip()
                    if meta_title:
                        title = meta_title

        except Exception:
            continue

        clean_content = re.sub(r"\s+", " ", content).strip()
        if not clean_content and not title:
            continue

        record = {
            "id": doc_id,
            "url": file_url,
            "title": title,
            "content": clean_content,
            "source_type": "local"
        }
        records_by_url[file_url] = record

    all_records = list(records_by_url.values())
    save_store(all_records, store_path)
    return all_records

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--ingest":
        ingest_local_files(sys.argv[2])
    elif len(sys.argv) > 2:
        crawl(sys.argv[1], sys.argv[2], max_pages=int(sys.argv[3]) if len(sys.argv) > 3 else 25)
