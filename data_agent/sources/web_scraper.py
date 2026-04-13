import logging
import time

import requests
from bs4 import BeautifulSoup

from data_agent.sources.base import Document, Source

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/",
}

# Verified accessible URLs (checked with browser headers, HTTP 200)
URLS = [
    "https://en.wikipedia.org/wiki/Ski_binding",       # binding setup and DIN
    "https://en.wikipedia.org/wiki/Ski_wax",           # wax types, application, temperature guide
    "https://en.wikipedia.org/wiki/Alpine_skiing",     # ski equipment, technique, maintenance context
    "https://www.outdoor-ed.com/how-to/how-to-tune-skis/",  # full ski tuning walkthrough
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
                if resp.status_code != 200:
                    logger.warning(f"Skipping {url} — HTTP {resp.status_code}")
                    continue
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
