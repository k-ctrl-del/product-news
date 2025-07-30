from fastapi import FastAPI, HTTPException
import feedparser
import json
import time
from pathlib import Path

# Gravity constant from Hacker News time-decay formula
GRAVITY = 1.8

app = FastAPI(
    title="Retro News Aggregator",
    description="Aggregates articles from trusted design and psychology sources and ranks them using a time-decay formula",
    version="0.1.0",
)

# Load list of RSS sources with tags
BASE_DIR = Path(__file__).resolve().parent
with open(BASE_DIR / "sources.json", "r", encoding="utf-8") as f:
    SOURCES = json.load(f)

# In-memory list of articles
articles: list[dict] = []

def compute_score(entry: dict, base_score: float = 1.0) -> float:
    """Compute a time-decayed score for an article.

    Args:
        entry: Article dict containing `published_parsed` (time.struct_time).
        base_score: Base score (default 1). Higher base score can account for votes later.

    Returns:
        A float score. Articles with no published date return 0.
    """
    published_time = entry.get("published_parsed")
    if not published_time:
        return 0.0
    age_hours = (time.time() - time.mktime(published_time)) / 3600.0
    # Score formula: (base_score - 1) / ((age_hours + 2) ** GRAVITY)
    return (base_score - 1) / ((age_hours + 2) ** GRAVITY)

def fetch_articles() -> None:
    """Fetch articles from all RSS sources and populate the global articles list.

    Each article includes title, link, published date (string and parsed), source name and tags.
    """
    global articles
    articles = []
    for source in SOURCES:
        feed = feedparser.parse(source["url"])
        for entry in feed.entries:
            article = {
                "title": entry.get("title"),
                "link": entry.get("link"),
                "published": entry.get("published"),
                "published_parsed": entry.get("published_parsed"),
                "source": source.get("name"),
                "tags": source.get("tags", []),
            }
            articles.append(article)

# Fetch articles at startup
@app.on_event("startup")
def startup_event() -> None:
    fetch_articles()

@app.get("/top")
def get_top(limit: int = 50) -> list[dict]:
    """Return top articles ranked by time-decayed score."""
    scored = []
    for article in articles:
        score = compute_score(article)
        article_with_score = article.copy()
        article_with_score["score"] = score
        scored.append(article_with_score)
    sorted_articles = sorted(scored, key=lambda x: x["score"], reverse=True)
    return sorted_articles[:limit]

@app.get("/latest")
def get_latest(limit: int = 50) -> list[dict]:
    """Return latest articles by publication time."""
    sorted_articles = sorted(
        articles,
        key=lambda x: x["published_parsed"] if x["published_parsed"] else time.gmtime(0),
        reverse=True,
    )
    return sorted_articles[:limit]

@app.get("/category/{tag}")
def get_category(tag: str, limit: int = 50) -> list[dict]:
    """Return articles matching a given tag, ranked by score."""
    filtered = [a for a in articles if tag.lower() in [t.lower() for t in a.get("tags", [])]]
    scored = []
    for article in filtered:
        score = compute_score(article)
        article_with_score = article.copy()
        article_with_score["score"] = score
        scored.append(article_with_score)
    sorted_articles = sorted(scored, key=lambda x: x["score"], reverse=True)
    return sorted_articles[:limit]

# Endpoint to force refresh of articles (e.g. manual update)
@app.post("/refresh")
def refresh() -> dict:
    """Refresh articles from RSS feeds. Returns number of articles."""
    fetch_articles()
    return {"message": "Feeds refreshed", "count": len(articles)}
