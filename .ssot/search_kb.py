#!/usr/bin/env python3
"""
search_kb.py — Query the CCEM knowledge base.

Works in both modes:
- sqlite-vec mode: uses MATCH operator on the virtual table
- fallback mode: loads all embeddings into memory and does cosine sim

Usage:
  python search_kb.py "query string" [top_k=5]
"""
from __future__ import annotations
import sys
import sqlite3
import struct
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "ccem.sqlite"
EMBED_DIM = 384


def deserialize_vector(blob: bytes) -> list[float]:
    return list(struct.unpack(f"{EMBED_DIM}f", blob))


def serialize_vector(vec) -> bytes:
    return struct.pack(f"{EMBED_DIM}f", *vec)


def cosine(a, b) -> float:
    # both normalized → dot product = cosine
    return sum(x * y for x, y in zip(a, b))


def main():
    if len(sys.argv) < 2:
        print("usage: python search_kb.py <query> [top_k=5]", file=sys.stderr)
        sys.exit(2)
    query = sys.argv[1]
    top_k = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as e:
        print(f"missing dep: {e}", file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    mode_row = conn.execute("SELECT value FROM kb_meta WHERE key='mode'").fetchone()
    mode = mode_row[0] if mode_row else "fallback"

    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    qvec = model.encode([query], normalize_embeddings=True)[0].tolist()

    if mode == "vec":
        import sqlite_vec
        conn.enable_load_extension(True)
        sqlite_vec.load(conn)
        conn.enable_load_extension(False)
        qblob = serialize_vector(qvec)
        rows = conn.execute(
            """SELECT chunks.id, chunks.source, chunks.kind, chunks.title,
                      substr(chunks.body,1,280), vec_chunks.distance
               FROM vec_chunks
               JOIN chunks ON chunks.id = vec_chunks.rowid
               WHERE vec_chunks.embedding MATCH ?
               ORDER BY vec_chunks.distance LIMIT ?""",
            (qblob, top_k),
        ).fetchall()
    else:
        all_rows = conn.execute("SELECT id, source, kind, title, substr(body,1,280), embedding FROM chunks").fetchall()
        scored = []
        for rid, src, kind, title, preview, blob in all_rows:
            emb = deserialize_vector(blob)
            score = cosine(qvec, emb)
            # convert to "distance" for parity (1 - cosine for normalized vectors)
            scored.append((rid, src, kind, title, preview, 1.0 - score))
        scored.sort(key=lambda r: r[5])
        rows = scored[:top_k]

    print(f"\nQuery: {query!r}  top_k={top_k}  (mode={mode})\n")
    for i, (rid, src, kind, title, preview, dist) in enumerate(rows, 1):
        print(f"#{i}  dist={dist:.4f}  [{kind}]  {title}")
        print(f"    {src}")
        print(f"    {preview.strip()[:260]}\n")


if __name__ == "__main__":
    main()
