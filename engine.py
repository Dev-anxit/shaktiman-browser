import html
import json
import math
import os
import re
from collections import Counter

DEFAULT_STORE_PATH = os.path.join("data", "index_store.json")

def tokenize(text):
    if not text:
        return []
    return re.findall(r"\b\w+\b", text.lower())

class SearchEngine:
    def __init__(self, store_path=DEFAULT_STORE_PATH, k1=1.5, b=0.75):
        self.store_path = store_path
        self.k1 = k1
        self.b = b
        self.documents = []
        self.doc_count = 0
        self.inverted_index = {}
        self.content_tfs = []
        self.title_tfs = []
        self.content_lengths = []
        self.title_lengths = []
        self.avg_content_len = 1.0
        self.avg_title_len = 1.0
        self.df = {}
        self.load_index()

    def load_index(self, store_path=None):
        if store_path:
            self.store_path = store_path

        self.documents = []
        self.inverted_index = {}
        self.content_tfs = []
        self.title_tfs = []
        self.content_lengths = []
        self.title_lengths = []
        self.df = {}

        if not os.path.exists(self.store_path):
            self.doc_count = 0
            self.avg_content_len = 1.0
            self.avg_title_len = 1.0
            return

        try:
            with open(self.store_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    self.documents = data
        except Exception:
            self.documents = []

        self.doc_count = len(self.documents)
        if self.doc_count == 0:
            self.avg_content_len = 1.0
            self.avg_title_len = 1.0
            return

        total_content_len = 0
        total_title_len = 0

        for idx, doc in enumerate(self.documents):
            c_tokens = tokenize(doc.get("content", ""))
            t_tokens = tokenize(doc.get("title", ""))

            c_counter = Counter(c_tokens)
            t_counter = Counter(t_tokens)

            self.content_tfs.append(c_counter)
            self.title_tfs.append(t_counter)

            c_len = len(c_tokens)
            t_len = len(t_tokens)

            self.content_lengths.append(c_len)
            self.title_lengths.append(t_len)

            total_content_len += c_len
            total_title_len += t_len

            unique_doc_tokens = set(c_counter.keys()) | set(t_counter.keys())
            for token in unique_doc_tokens:
                if token not in self.inverted_index:
                    self.inverted_index[token] = set()
                self.inverted_index[token].add(idx)
                self.df[token] = self.df.get(token, 0) + 1

        self.avg_content_len = max(total_content_len / self.doc_count, 1.0)
        self.avg_title_len = max(total_title_len / self.doc_count, 1.0)

    def extract_snippet(self, content, query_terms, window_size=180):
        if not content:
            return ""

        escaped_terms = [re.escape(term) for term in query_terms if term]
        if not escaped_terms:
            raw_chunk = content[:window_size]
            if len(content) > window_size:
                raw_chunk += "..."
            return html.escape(raw_chunk)

        combined_regex = re.compile(r"\b(?:" + "|".join(escaped_terms) + r")\b", re.IGNORECASE)
        match = combined_regex.search(content)

        if match:
            start_pos = match.start()
            end_pos = match.end()
            center = int((start_pos + end_pos) / 2)
            half_window = int(window_size / 2)

            win_start = max(0, center - half_window)
            win_end = min(len(content), win_start + window_size)

            if win_end == len(content):
                win_start = max(0, win_end - window_size)

            snippet_text = content[win_start:win_end]
            prefix = "..." if win_start > 0 else ""
            suffix = "..." if win_end < len(content) else ""
            full_raw_snippet = f"{prefix}{snippet_text}{suffix}"
        else:
            snippet_text = content[:window_size]
            suffix = "..." if len(content) > window_size else ""
            full_raw_snippet = f"{snippet_text}{suffix}"

        escaped = html.escape(full_raw_snippet)
        highlight_regex = re.compile(
            r"\b(" + "|".join(sorted(escaped_terms, key=len, reverse=True)) + r")\b",
            re.IGNORECASE
        )
        return highlight_regex.sub(r"<mark>\1</mark>", escaped)

    def search(self, query, source_type=None, limit=50):
        if not query or self.doc_count == 0:
            return []

        q_tokens = tokenize(query)
        if not q_tokens:
            return []

        unique_q_tokens = list(dict.fromkeys(q_tokens))

        candidate_indices = set()
        for token in unique_q_tokens:
            if token in self.inverted_index:
                candidate_indices.update(self.inverted_index[token])

        if not candidate_indices:
            return []

        filter_source = source_type.lower().strip() if source_type else "all"

        scored_results = []
        for idx in candidate_indices:
            doc = self.documents[idx]
            doc_source = doc.get("source_type", "web").lower().strip()

            if filter_source != "all" and doc_source != filter_source:
                continue

            c_tf = self.content_tfs[idx]
            t_tf = self.title_tfs[idx]
            c_len = self.content_lengths[idx]
            t_len = self.title_lengths[idx]

            doc_score = 0.0

            for token in unique_q_tokens:
                f_c = c_tf.get(token, 0)
                f_t = t_tf.get(token, 0)
                if f_c == 0 and f_t == 0:
                    continue

                doc_freq = self.df.get(token, 0)
                idf = math.log(1.0 + (self.doc_count - doc_freq + 0.5) / (doc_freq + 0.5))

                c_denom = f_c + self.k1 * (1.0 - self.b + self.b * (c_len / self.avg_content_len))
                c_score = (f_c * (self.k1 + 1.0) / c_denom) if c_denom > 0 else 0.0

                t_denom = f_t + self.k1 * (1.0 - self.b + self.b * (t_len / self.avg_title_len))
                t_score = 2.0 * ((f_t * (self.k1 + 1.0) / t_denom) if t_denom > 0 else 0.0)

                doc_score += idf * (c_score + t_score)

            if doc_score > 0:
                snippet = self.extract_snippet(doc.get("content", ""), unique_q_tokens, window_size=180)
                scored_results.append({
                    "id": doc.get("id"),
                    "url": doc.get("url"),
                    "title": doc.get("title") or doc.get("url"),
                    "source_type": doc_source,
                    "score": round(doc_score, 4),
                    "snippet": snippet
                })

        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:limit]
