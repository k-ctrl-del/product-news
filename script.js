// JavaScript for fetching articles from the backend API and rendering them
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

function renderArticles(articles) {
  const container = document.getElementById("articles");
  container.innerHTML = "";
  articles.forEach((article) => {
    const div = document.createElement("div");
    div.className = "article";
    const link = document.createElement("a");
    link.href = article.link;
    link.target = "_blank";
    link.textContent = article.title;
    div.appendChild(link);
    const meta = document.createElement("small");
    const published = article.published
      ? new Date(article.published).toLocaleString()
      : "";
    meta.textContent = `${article.source || ""} ${published}`;
    div.appendChild(meta);
    container.appendChild(div);
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

document.getElementById("topBtn").addEventListener("click", () => {
  loadTop();
});

document.getElementById("latestBtn").addEventListener("click", () => {
  loadLatest();
});

document.getElementById("categorySelect").addEventListener("change", (e) => {
  const tag = e.target.value;
  if (tag) {
    loadCategory(tag);
  } else {
    loadTop();
  }
});

// Initial load
loadTop();
