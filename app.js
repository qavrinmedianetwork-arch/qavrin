const STORAGE_KEY = "qavrin-demo-v1";

const defaultPosts = [
  {
    id: crypto.randomUUID(),
    author: "Ishita Sharma",
    handle: "@ishita07",
    location: "New Delhi",
    time: "2h ago",
    category: "education",
    tag: "Thought",
    title: "Is our education system preparing us for real life?",
    body: "We memorize for exams, not for understanding. We compete for marks, not for growth.\n\nIt’s time we rethink what success really means.",
    hashtags: "#Education #YouthVoice #Reform",
    likes: 1240,
    comments: 230,
    shares: 185,
    liked: false,
    saved: false,
    avatar: "assets/avatar-ishita.svg"
  },
  {
    id: crypto.randomUUID(),
    author: "Raghav Mehta",
    handle: "@raghavwrites",
    location: "Mumbai",
    time: "4h ago",
    category: "society",
    tag: "Society",
    title: "We need more spaces where young people can disagree without becoming enemies.",
    body: "A healthy debate is not about winning. It is about leaving the conversation with a better understanding of the other side.",
    hashtags: "#Society #Debates #YouthVoice",
    likes: 732,
    comments: 91,
    shares: 64,
    liked: false,
    saved: false,
    avatar: "assets/avatar-raghav.svg"
  },
  {
    id: crypto.randomUUID(),
    author: "Mehak Verma",
    handle: "@mehakv",
    location: "Pune",
    time: "7h ago",
    category: "campus",
    tag: "Campus",
    title: "What should colleges teach that textbooks don't?",
    body: "Money, communication, basic law, digital safety and how to think critically. These should not be optional life lessons.",
    hashtags: "#Campus #Education #India",
    likes: 489,
    comments: 52,
    shares: 37,
    liked: false,
    saved: false,
    avatar: "assets/avatar-mehak.svg"
  }
];

const voices = [
  ["You", "assets/avatar-you.svg"],
  ["Ananya", "assets/avatar-ananya.svg"],
  ["Rohit", "assets/avatar-rohit.svg"],
  ["Mehak", "assets/avatar-mehak.svg"],
  ["Arjun", "assets/avatar-arjun.svg"]
];

let state = loadState();
let activeFilter = "popular";

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.posts) ? saved : { posts: defaultPosts, comments: {} };
  } catch {
    return { posts: defaultPosts, comments: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[ch]));
}

function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0","") + "K";
  return String(n);
}

function renderVoices() {
  document.getElementById("voiceRow").innerHTML = voices.map(([name, src]) => `
    <div class="voice">
      <img src="${src}" alt="" />
      <span class="voice-name">${name}</span>
    </div>
  `).join("");
}

function filteredPosts() {
  let posts = [...state.posts];
  if (activeFilter === "recent") return posts.reverse();
  if (activeFilter === "debates") return posts.filter(p => p.category === "debates");
  if (activeFilter === "campus") return posts.filter(p => p.category === "campus");
  if (activeFilter === "society") return posts.filter(p => p.category === "society");
  return posts.sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2));
}

function renderFeed() {
  const feed = document.getElementById("feed");
  const posts = filteredPosts();
  if (!posts.length) {
    feed.innerHTML = `<div class="post-card"><strong>Nothing here yet.</strong><p class="muted">Start the conversation and make QAVRIN yours.</p></div>`;
    return;
  }

  feed.innerHTML = posts.map(post => {
    const body = escapeHtml(post.body).replace(/\n/g, "<br>");
    return `
      <article class="post-card" data-id="${post.id}">
        <div class="post-head">
          <img src="${post.avatar}" alt="" />
          <div class="post-author">
            <strong>${escapeHtml(post.author)}</strong>
            <div class="meta">${escapeHtml(post.handle)} · ${escapeHtml(post.time)} · ${escapeHtml(post.location)}</div>
          </div>
          <button class="icon-btn more-btn" aria-label="More">⋮</button>
        </div>
        <span class="tag">${escapeHtml(post.tag)}</span>
        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        <p class="post-body">${body}</p>
        <div class="hashtags">${escapeHtml(post.hashtags)}</div>
        <div class="post-actions">
          <button class="action ${post.liked ? "liked" : ""}" data-action="like">♥ ${formatCount(post.likes)}</button>
          <button class="action" data-action="comment">◯ ${formatCount(post.comments)}</button>
          <button class="action" data-action="share">↗ ${formatCount(post.shares)}</button>
          <span class="action-spacer"></span>
          <button class="action ${post.saved ? "saved" : ""}" data-action="save">▢</button>
        </div>
        <div class="comment-box" data-comment-box>
          <input type="text" maxlength="180" placeholder="Add a thought..." />
          <button data-action="send-comment">Send</button>
        </div>
      </article>
    `;
  }).join("");
}

function toast(message) {
  const node = document.getElementById("toast");
  node.textContent = message;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 1800);
}

function publishPost() {
  const input = document.getElementById("postInput");
  const raw = input.value.trim();
  if (!raw) return toast("Write something first.");

  state.posts.unshift({
    id: crypto.randomUUID(),
    author: "You",
    handle: "@yourvoice",
    location: "India",
    time: "now",
    category: "society",
    tag: "Thought",
    title: raw.split(/\n/)[0].slice(0, 80),
    body: raw.split(/\n/).slice(1).join("\n") || raw,
    hashtags: "#QAVRIN #YourVoice",
    likes: 0, comments: 0, shares: 0, liked: false, saved: false,
    avatar: "assets/avatar-you.svg"
  });
  input.value = "";
  saveState();
  renderFeed();
  toast("Posted to QAVRIN.");
  window.scrollTo({top: document.getElementById("feed").offsetTop - 80, behavior: "smooth"});
}

function updateStats() {
  const own = state.posts.filter(p => p.handle === "@yourvoice");
  document.getElementById("statPosts").textContent = own.length;
  document.getElementById("statLikes").textContent = own.reduce((n,p) => n + p.likes, 0);
  document.getElementById("statComments").textContent = own.reduce((n,p) => n + p.comments, 0);
}

document.getElementById("postBtn").addEventListener("click", publishPost);
document.getElementById("floatingWrite").addEventListener("click", () => {
  document.getElementById("postInput").focus();
  window.scrollTo({top: 120, behavior: "smooth"});
});
document.getElementById("bottomCreate").addEventListener("click", () => document.getElementById("postInput").focus());

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderFeed();
  });
});

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    toast(btn.textContent + " feed selected.");
  });
});

document.getElementById("feed").addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;
  const card = event.target.closest(".post-card");
  const post = state.posts.find(p => p.id === card.dataset.id);
  if (!post) return;

  if (action.dataset.action === "like") {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
  }
  if (action.dataset.action === "save") post.saved = !post.saved;
  if (action.dataset.action === "share") {
    post.shares += 1;
    navigator.clipboard?.writeText(window.location.href);
    toast("Link copied.");
  }
  if (action.dataset.action === "comment") {
    card.querySelector("[data-comment-box]").classList.toggle("open");
    return;
  }
  if (action.dataset.action === "send-comment") {
    const input = card.querySelector("input");
    if (!input.value.trim()) return;
    post.comments += 1;
    input.value = "";
    card.querySelector("[data-comment-box]").classList.remove("open");
    toast("Comment added.");
  }
  saveState();
  renderFeed();
});

document.getElementById("profileBtn").addEventListener("click", () => {
  updateStats();
  document.getElementById("profileModal").showModal();
});
document.getElementById("notificationBtn").addEventListener("click", () => toast("No new notifications."));
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => document.getElementById(btn.dataset.close).close());
});
document.getElementById("clearLocalBtn").addEventListener("click", () => {
  state = { posts: [...defaultPosts], comments: {} };
  saveState();
  renderFeed();
  updateStats();
  document.getElementById("profileModal").close();
  toast("Demo data reset.");
});

document.querySelectorAll("[data-screen]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".bottom-item").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    const screen = btn.dataset.screen;
    if (screen === "home") window.scrollTo({top:0, behavior:"smooth"});
    else toast(screen[0].toUpperCase() + screen.slice(1) + " is next in the build.");
  });
});

renderVoices();
renderFeed();
