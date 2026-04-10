import logging
import time

import requests
from bs4 import BeautifulSoup

from data_agent.sources.base import Document, Source

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "SkiWare-DataAgent/1.0 (ski repair knowledge aggregator)"
}

URLS = [
    "https://www.rei.com/learn/expert-advice/ski-care-and-maintenance.html",
    "https://www.rei.com/learn/expert-advice/snowboard-care.html",
    "https://www.evo.com/guide/how-to-tune-your-skis",
    "https://www.evo.com/guide/how-to-wax-your-skis",
]


def _extract_content(soup: BeautifulSoup) -> str:
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    for selector in ["article", "main", "body"]:
        node = soup.find(selector)
        if node:
            return node.get_text(separator="\n", strip=True)
    return soup.get_text(separator="\n", strip=True)


def _get_title(soup: BeautifulSoup, url: str) -> str:
    tag = soup.find("title")
    return tag.get_text(strip=True) if tag else url


class WebScraperSource(Source):
    def fetch(self) -> list[Document]:
        docs = []
        for url in URLS:
            logger.info(f"Scraping {url}")
            try:
                resp = requests.get(url, headers=HEADERS, timeout=15)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "html.parser")
                content = _extract_content(soup)
                title = _get_title(soup, url)
                docs.append(
                    Document(
                        url=url,
                        title=title,
                        content=content,
                        source_type="web",
                        metadata={"scraped_url": url},
                    )
                )
                logger.info(f"Scraped {url} ({len(content)} chars)")
            except Exception as e:
                logger.error(f"Failed to scrape {url}: {e}")
            time.sleep(2)
        return docs
