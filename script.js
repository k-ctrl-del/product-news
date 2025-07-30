const API_BASE = "";

async function fetchArticles(endpoint, query = "") {
  try {
    const url = API_BASE + endpoint + (query ? `?${query}` : "");
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Request failed: ${resp.status}`);
    }
    return await resp.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

function parsePublished(parsed) {
  if (Array.isArray(parsed) && parsed.length >= 6) {
    return new Date(Date.UTC(parsed[0], parsed[1] - 1, parsed[2], parsed[3], parsed[4], parsed[5]));
  }
  return null;
}

function getPublishedDate(article) {
  if (article.published_parsed) {
    return parsePublished(article.published_parsed);
  }
  if (article.time) {
    return new Date(article.time * 1000);
  }
  return null;
}

function timeAgo(date) {
  if (!date) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
}

function renderArticles(articles) {
  const container = document.getElementById("articles");
  container.innerHTML = "";
  articles.forEach((article, idx) => {
    const row = document.createElement("div");
    row.className = "article-row";

    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = `${idx + 1}.`;

    const vote = document.createElement("span");
    vote.className = "vote";
    vote.innerHTML = "\u25B2"; // triangle up

    const titleLink = document.createElement("a");
    titleLink.className = "title";
    titleLink.href = article.link || article.url;
    titleLink.target = "_blank";
    titleLink.textContent = article.title;

    const domainSpan = document.createElement("span");
    domainSpan.className = "domain";
    try {
      const urlObj = new URL(article.link || article.url);
      domainSpan.textContent = ` (${urlObj.hostname.replace(/^www\./, "")})`;
    } catch {
      domainSpan.textContent = "";
    }

    row.appendChild(rank);
    row.appendChild(vote);
    row.appendChild(titleLink);
    row.appendChild(domainSpan);
    container.appendChild(row);

    const meta = document.createElement("div");
    meta.className = "meta";
    const points = article.points || article.score || "";
    const pointsStr = points ? `${points} point${points === 1 ? "" : "s"}` : "";
    const author = article.author || article.by || "";
    const authorStr = author ? ` by ${author}` : "";
    const publishedDate = getPublishedDate(article);
    const timeStr = publishedDate ? ` ${timeAgo(publishedDate)}` : "";
    const comments = article.comments;
    let commentsStr = "";
    if (comments !== undefined && comments !== "") {
      commentsStr = ` | ${comments} comment${comments === 1 ? "" : "s"}`;
    }
    meta.textContent = [pointsStr, authorStr, timeStr, commentsStr].join("").trim();
    container.appendChild(meta);
  });
}

async function loadTop() {
  const articles = await fetchArticles("/top", "limit=50");
  renderArticles(articles);
}

async function loadLatest() {
  const articles = await fetchArticles("/latest", "limit=50");
  renderArticles(articles);
}

async function loadCategory(tag) {
  const encoded = encodeURIComponent(tag);
  const articles = await fetchArticles(`/category/${encoded}`, "limit=50");
  renderArticles(articles);
}

async function loadHN() {
  const articles = await fetchArticles("/hn", "limit=50");
  renderArticles(articles);
}

document.addEventListener("DOMContentLoaded", () => {
  const topLink = document.getElementById("topLink");
  if (topLink) {
    topLink.addEventListener("click", (e) => {
      e.preventDefault();
      loadTop();
    });
  }
  const latestLink = document.getElementById("latestLink");
  if (latestLink) {
    latestLink.addEventListener("click", (e) => {
      e.preventDefault();
      loadLatest();
    });
  }
  const hnLink = document.getElementById("hnLink");
  if (hnLink) {
    hnLink.addEventListener("click", (e) => {
      e.preventDefault();
      loadHN();
    });
  }
  const categorySelect = document.getElementById("categorySelect");
  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      const tag = e.target.value;
      if (tag) {
        loadCategory(tag);
      } else {
        loadTop();
      }
    });
  }
  // default load
  loadTop();
});
