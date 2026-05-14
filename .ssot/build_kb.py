#!/usr/bin/env python3
"""
build_kb.py — Build the CCEM/APM knowledge base.

Tries sqlite-vec first; if the system sqlite cannot load extensions (Apple's
default Python 3.9 ships without `enable_load_extension`), falls back to
storing raw embeddings in a BLOB column and doing brute-force cosine search
in Python at query time. Result is functionally identical for the 200-2k
chunk scale of this KB.

Crawls a fixed set of source paths under ~/Developer/ccem and supporting
locations, chunks the content (~500 tokens per chunk by paragraph window),
embeds with sentence-transformers/all-MiniLM-L6-v2 (384-dim), and stores in
sqlite.

Outputs:
  ~/Developer/ccem/.ssot/ccem.sqlite

Schema (vec mode):
  chunks(id INTEGER PRIMARY KEY, source TEXT, kind TEXT, title TEXT, body TEXT, tokens INT)
  vec_chunks(rowid INTEGER PRIMARY KEY, embedding FLOAT[384])  -- virtual table

Schema (fallback mode):
  chunks(id INTEGER PRIMARY KEY, source TEXT, kind TEXT, title TEXT, body TEXT, tokens INT, embedding BLOB)
  kb_meta(key TEXT PRIMARY KEY, value TEXT)
"""
from __future__ import annotations
import os
import sys
import sqlite3
import struct
import json
import glob
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DB_PATH = HERE / "ccem.sqlite"
ROOT = Path.home() / "Developer/ccem"

SOURCES: list[tuple[str, str]] = []
SOURCES += [
    ("readme", str(ROOT / "apm-v4/README.md")),
    ("release", str(ROOT / "apm-v4/RELEASE_NOTES*.md")),
    ("prd", str(ROOT / "apm-v4/prd.json")),
    ("readme", str(ROOT / "packages/apm/README.md")),
    ("readme", str(ROOT / "README.md")),
    ("claudemd", str(ROOT / ".claude/CLAUDE.md")),
    ("claudemd", str(ROOT / ".claude/fleet-agentic-orchestration-architecture.md")),
    ("wiki", str(ROOT / "wiki/*.md")),
    ("wiki", str(ROOT / "docs/**/*.md")),
    ("showcase-data", str(ROOT / "showcase/data/*.json")),
    ("openapi", str(HERE / "openapi.snapshot.json")),
]
LIVEVIEW_GLOB = str(ROOT / "apm-v4/lib/apm_v5_web/live/**/*.ex")

CHUNK_SIZE = 1200
EMBED_DIM = 384


def serialize_vector(vec) -> bytes:
    return struct.pack(f"{EMBED_DIM}f", *vec)


def chunk_text(text: str, kind: str, title: str, source: str) -> list[dict]:
    if not text or not text.strip():
        return []
    chunks = []
    paras = re.split(r"\n\n+", text)
    buf, bufsize = [], 0
    for p in paras:
        p = p.strip()
        if not p:
            continue
        if bufsize + len(p) > CHUNK_SIZE and buf:
            chunks.append("\n\n".join(buf))
            buf, bufsize = [p], len(p)
        else:
            buf.append(p)
            bufsize += len(p) + 2
    if buf:
        chunks.append("\n\n".join(buf))
    out = []
    for i, c in enumerate(chunks):
        out.append({
            "source": source,
            "kind": kind,
            "title": title if i == 0 else f"{title} (cont {i})",
            "body": c,
            "tokens": len(c) // 4,
        })
    return out


def extract_moduledoc(path: str):
    try:
        text = open(path).read()
    except Exception:
        return None
    mod_match = re.search(r"defmodule\s+([\w.]+)", text)
    mod = mod_match.group(1) if mod_match else os.path.basename(path)
    doc_match = re.search(r'@moduledoc\s+"""(.+?)"""', text, re.DOTALL)
    if doc_match:
        return mod, doc_match.group(1).strip()
    doc_match = re.search(r'@moduledoc\s+"([^"]+)"', text)
    if doc_match:
        return mod, doc_match.group(1).strip()
    return None


def gather_records() -> list[dict]:
    records, seen = [], set()
    for kind, pat in SOURCES:
        for path in glob.glob(pat, recursive=True):
            if path in seen:
                continue
            seen.add(path)
            try:
                with open(path) as f:
                    text = f.read()
            except Exception as e:
                print(f"skip {path}: {e}", file=sys.stderr)
                continue
            if path.endswith(".json"):
                try:
                    obj = json.loads(text)
                    text = json.dumps(obj, indent=2)[:50000]
                except Exception:
                    pass
            title = os.path.basename(path)
            records.extend(chunk_text(text, kind, title, path))
    for path in glob.glob(LIVEVIEW_GLOB, recursive=True):
        result = extract_moduledoc(path)
        if not result:
            continue
        mod, doc = result
        records.extend(chunk_text(doc, "moduledoc", mod, path))
    return records


def try_vec_mode(conn):
    try:
        import sqlite_vec
    except ImportError:
        return False
    if not hasattr(conn, "enable_load_extension"):
        return False
    try:
        conn.enable_load_extension(True)
        sqlite_vec.load(conn)
        conn.enable_load_extension(False)
        return True
    except sqlite3.OperationalError:
        return False


def build():
    print(f"[build_kb] DB: {DB_PATH}")
    records = gather_records()
    print(f"[build_kb] gathered {len(records)} chunks")
    if not records:
        print("[build_kb] no records, exiting", file=sys.stderr)
        sys.exit(1)
    if DB_PATH.exists():
        DB_PATH.unlink()
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("install sentence-transformers: pip install --user sentence-transformers", file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    vec_mode = try_vec_mode(conn)
    print(f"[build_kb] vector store mode: {'sqlite-vec' if vec_mode else 'fallback (BLOB + brute-force cosine)'}")

    if vec_mode:
        conn.execute(
            "CREATE TABLE chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT, kind TEXT, title TEXT, body TEXT, tokens INT)"
        )
        conn.execute(f"CREATE VIRTUAL TABLE vec_chunks USING vec0(embedding FLOAT[{EMBED_DIM}])")
    else:
        conn.execute(
            "CREATE TABLE chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT, kind TEXT, title TEXT, body TEXT, tokens INT, embedding BLOB)"
        )
    conn.execute("CREATE TABLE kb_meta (key TEXT PRIMARY KEY, value TEXT)")
    conn.execute("INSERT OR REPLACE INTO kb_meta (key,value) VALUES (?,?)", ("mode", "vec" if vec_mode else "fallback"))
    conn.execute("INSERT OR REPLACE INTO kb_meta (key,value) VALUES (?,?)", ("dim", str(EMBED_DIM)))
    conn.execute("INSERT OR REPLACE INTO kb_meta (key,value) VALUES (?,?)", ("model", "sentence-transformers/all-MiniLM-L6-v2"))

    print("[build_kb] loading sentence-transformers/all-MiniLM-L6-v2 ...")
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    bodies = [r["body"] for r in records]
    print(f"[build_kb] embedding {len(bodies)} chunks ...")
    embeddings = model.encode(bodies, show_progress_bar=False, batch_size=32, normalize_embeddings=True)

    for r, emb in zip(records, embeddings):
        blob = serialize_vector(emb.tolist())
        if vec_mode:
            cur = conn.execute(
                "INSERT INTO chunks (source, kind, title, body, tokens) VALUES (?, ?, ?, ?, ?)",
                (r["source"], r["kind"], r["title"], r["body"], r["tokens"]),
            )
            conn.execute("INSERT INTO vec_chunks (rowid, embedding) VALUES (?, ?)", (cur.lastrowid, blob))
        else:
            conn.execute(
                "INSERT INTO chunks (source, kind, title, body, tokens, embedding) VALUES (?, ?, ?, ?, ?, ?)",
                (r["source"], r["kind"], r["title"], r["body"], r["tokens"], blob),
            )

    conn.commit()
    n = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
    print(f"[build_kb] complete: {n} rows persisted to {DB_PATH}")
    conn.close()


if __name__ == "__main__":
    build()
