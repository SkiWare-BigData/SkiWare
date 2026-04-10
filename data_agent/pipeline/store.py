import hashlib
import json
import logging

import pg8000

logger = logging.getLogger(__name__)


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def upsert_chunks(conn: pg8000.Connection, chunks: list[dict], embeddings: list[list[float]]) -> None:
    cursor = conn.cursor()

    for chunk, embedding in zip(chunks, embeddings):
        content_hash = _hash(chunk["text"])

        # Check if this exact content already exists
        cursor.execute(
            "SELECT id FROM ski_knowledge_chunks WHERE content_hash = %s",
            (content_hash,),
        )
        if cursor.fetchone():
            logger.debug(f"Skipping duplicate chunk (hash={content_hash[:8]}...)")
            continue

        # If same source_url + chunk_index exists with different content, remove stale row
        cursor.execute(
            """
            DELETE FROM ski_knowledge_chunks
            WHERE source_url = %s AND chunk_index = %s AND content_hash != %s
            """,
            (chunk["source_url"], chunk["chunk_index"], content_hash),
        )

        embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
        cursor.execute(
            """
            INSERT INTO ski_knowledge_chunks
                (content_hash, source_type, source_url, source_title,
                 chunk_index, chunk_text, metadata, embedding)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s::vector)
            ON CONFLICT (content_hash) DO NOTHING
            """,
            (
                content_hash,
                chunk["source_type"],
                chunk["source_url"],
                chunk["source_title"],
                chunk["chunk_index"],
                chunk["text"],
                json.dumps(chunk["metadata"]),
                embedding_str,
            ),
        )

    conn.commit()
    cursor.close()
    logger.info(f"Upserted {len(chunks)} chunks")
