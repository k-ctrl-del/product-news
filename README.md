# product-news

A retro-styled news aggregator for product design, user psychology, economic behavior and related topics. This project scrapes trusted sources (e.g., Nielsen Norman Group, behavioural economics journals) and ranks articles using a Hacker News–style time-decay formula (votes/age^gravity). The backend (to be implemented) will fetch RSS feeds, store articles in a database, compute scores, and expose an API. The frontend will display top and recent articles using a monospaced pixel-themed UI with black and purple styling.

## Structure

- `backend/` – backend code (feed parser, scoring, API).
- `frontend/` – frontend site (HTML/CSS/JS).

## Ranking algorithm

The rank of an item is calculated roughly as `(P-1) / (T+2)^G` where **P** is points, **T** is age in hours, and **G** is gravity (default 1.8). This ensures newer stories with more points rank higher but decay over time.
