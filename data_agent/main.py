import logging

from data_agent.db.connection import get_connection
from data_agent.pipeline.chunker import chunk_document
from data_agent.pipeline.embedder import embed_batch
from data_agent.pipeline.store import upsert_chunks
from data_agent.sources.static_docs import StaticDocsSource
from data_agent.sources.web_scraper import WebScraperSource
from data_agent.sources.youtube import YouTubeSource

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

SOURCES = [
    StaticDocsSource(),
    WebScraperSource(),
    YouTubeSource(),
]


def run() -> None:
    conn = get_connection()
    total_chunks = 0

    for source in SOURCES:
        logger.info(f"Running source: {source.__class__.__name__}")
        try:
            docs = source.fetch()
        except Exception as e:
            logger.error(f"Source {source.__class__.__name__} failed to fetch: {e}")
            continue

        for doc in docs:
            try:
                chunks = chunk_document(doc)
                if not chunks:
                    logger.warning(f"No chunks produced for {doc.url}")
                    continue
                embeddings = embed_batch([c["text"] for c in chunks])
                upsert_chunks(conn, chunks, embeddings)
                total_chunks += len(chunks)
                logger.info(f"Processed {doc.url} — {len(chunks)} chunks")
            except Exception as e:
                logger.error(f"Failed processing {doc.url}: {e}")
                try:
                    conn.rollback()
                except Exception:
                    pass

    conn.close()
    logger.info(f"Run complete. Total chunks upserted: {total_chunks}")


if __name__ == "__main__":
    run()
