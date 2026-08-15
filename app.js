const DB_KEY = "qavrin-trial-db-v2";
const SESSION_KEY = "qavrin-trial-session-v2";

const seedPosts = [
  {
    id: crypto.randomUUID(),
    userId: "seed-ishita",
    name: "Ishita Sharma",
    username: "ishita07",
    title: "Is our education system preparing us for real life?",
    body: "We memorise for exams, not for understanding. We compete for marks, not for growth.\n\nIt is time we rethink what success really means.",
    topic: "Education",
    tags: ["education","youth","reform"],
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    likes: 1200,
    likedBy: [],
    comments: []
  },
  {
    id: crypto.randomUUID(),
    userId: "seed-raghav",
    name: "Raghav Mehta",
    username: "raghavwrites",
    title: "We need better spaces for disagreement.",
    body: "A healthy debate is not about winning. It is about leaving the conversation with a better understanding of the other side.",
    topic: "Society",
    tags: ["society","debates","youthvoice"],
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    likes: 730,
    likedBy: [],
    comments: []
  },
  {
    id: crypto.randomUUID(),
    userId: "seed-mehak",
    name: "Mehak Verma",
    username: "mehakv",
    title: "What should colleges teach that textbooks do not?",
    body: "Money, communication, basic law, digital safety and critical thinking should not be optional life lessons.",
    topic: "Campus",
    tags: ["campus","education","india"],
    createdAt: Date.now() - 9 * 60 * 60 * 1000,
    likes: 482,
    likedBy: [],
    comments: []
  }
];

function defaultDB() {
  return {
    users: [],
    posts: seedPosts,
    comments: []
  };
}

function loadDB() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DB_KEY));
    return parsed && parsed.users && parsed.posts ? parsed : defaultDB();
  } catch {
    return defaultDB();
  }
}

let db = loadDB();

function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function saveSession(userId) {
  localStorage.setItem(SESSION_KEY, userId);
}

function getSessionUser() {
  const id = localStorage.getItem(SESSION_KEY);
  return db.users.find(user => user.id === id) || null;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
}

function esc(value="") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function timeAgo(ts) {
  const mins = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function toast(message) {
  const node = document.getElementById("toast");
  node.textContent = message;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 1900);
}

function showAuth(tab) {
  document.querySelectorAll(".auth-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.authTab === tab);
  });
  document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
  document.getElementById("signupForm").classList.toggle("hidden", tab !== "signup");
}

function currentUser() {
  return getSessionUser();
}

function appStart() {
  const user = currentUser();
  const auth = document.getElementById("authScreen");
  const app = document.getElementById("appScreen");

  if (user) {
    auth.classList.add("hidden");
    app.classList.remove("hidden");
    document.getElementById("currentUserName").textContent = user.name;
    document.getElementById("currentUserHandle").textContent = `@${user.username}`;
    document.getElementById("welcomeTitle").textContent = `Write what you think, ${user.name.split(" ")[0]}.`;
    renderFeed();
  } else {
    auth.classList.remove("hidden");
    app.classList.add("hidden");
  }
}

function registerUser(event) {
  event.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const username = document.getElementById("signupUsername").value.trim().toLowerCase();
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value;

  if (db.users.some(u => u.email === email)) return toast("That email is already registered.");
  if (db.users.some(u => u.username === username)) return toast("That username is already taken.");

  // Trial only: password is stored locally. Never do this in production.
  const user = { id: crypto.randomUUID(), name, username, email, password, createdAt: Date.now() };
  db.users.push(user);
  saveDB();
  saveSession(user.id);
  toast("Account created.");
  document.getElementById("signupForm").reset();
  appStart();
}

function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return toast("Email or password is incorrect.");
  saveSession(user.id);
  toast("Logged in.");
  document.getElementById("loginForm").reset();
  appStart();
}

function publishPost() {
  const user = currentUser();
  const title = document.getElementById("postTitle").value.trim();
  const body = document.getElementById("postBody").value.trim();
  const topic = document.getElementById("postTopic").value;
  const rawTags = document.getElementById("postTags").value.trim();

  if (!title) return toast("Add a title.");
  if (body.length < 20) return toast("Write at least 20 characters.");
  if (!user) return logout();

  const tags = rawTags
    .split(",")
    .map(t => t.trim().replace(/^#/, "").toLowerCase())
    .filter(Boolean)
    .slice(0, 6);

  db.posts.unshift({
    id: crypto.randomUUID(),
    userId: user.id,
    name: user.name,
    username: user.username,
    title,
    body,
    topic,
    tags,
    createdAt: Date.now(),
    likes: 0,
    likedBy: [],
    comments: []
  });

  saveDB();
  document.getElementById("postTitle").value = "";
  document.getElementById("postBody").value = "";
  document.getElementById("postTags").value = "";
  document.getElementById("charCount").textContent = "0 / 1200";
  renderFeed();
  toast("Your thought is live in this trial.");
  window.scrollTo({top:0, behavior:"smooth"});
}

function toggleLike(postId) {
  const user = currentUser();
  const post = db.posts.find(p => p.id === postId);
  if (!user || !post) return;

  const index = post.likedBy.indexOf(user.id);
  if (index >= 0) {
    post.likedBy.splice(index, 1);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(user.id);
    post.likes += 1;
  }
  saveDB();
  renderFeed();
}

function toggleComments(card) {
  card.querySelector(".comment-box")?.classList.toggle("open");
}

function addComment(postId, input) {
  const user = currentUser();
  const text = input.value.trim();
  const post = db.posts.find(p => p.id === postId);
  if (!user || !post || !text) return;

  if (!Array.isArray(post.comments)) post.comments = [];
  post.comments.push({
    id: crypto.randomUUID(),
    userId: user.id,
    name: user.name,
    username: user.username,
    text,
    createdAt: Date.now()
  });
  input.value = "";
  saveDB();
  renderFeed();
  toast("Comment added.");
}

function filteredPosts() {
  const value = document.getElementById("feedFilter").value;
  const user = currentUser();
  let posts = [...db.posts];

  if (value === "mine") posts = posts.filter(p => p.userId === user?.id);
  else if (value === "popular") posts.sort((a,b) => b.likes - a.likes);
  else if (value !== "latest") posts = posts.filter(p => p.topic === value);
  else posts.sort((a,b) => b.createdAt - a.createdAt);

  return posts;
}

function renderFeed() {
  const user = currentUser();
  const feed = document.getElementById("feed");
  if (!user) return;

  const posts = filteredPosts();
  if (!posts.length) {
    feed.innerHTML = `
      <article class="post-card">
        <strong>Nothing here yet.</strong>
        <p class="muted">Start the conversation. Write something people can respond to.</p>
      </article>`;
    return;
  }

  feed.innerHTML = posts.map(post => {
    const liked = post.likedBy.includes(user.id);
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const tags = post.tags?.length
      ? `<div class="tags">${post.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join("")}</div>`
      : "";

    const commentHtml = comments.slice(-5).map(c => `
      <div class="comment"><strong>${esc(c.name)}</strong> · @${esc(c.username)}<br>${esc(c.text)}</div>
    `).join("");

    return `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-meta">
          <div class="author-line">
            <span class="author-name">${esc(post.name)}</span>
            <span class="author-handle">@${esc(post.username)} · ${timeAgo(post.createdAt)}</span>
          </div>
        </div>
        <span class="topic-pill">${esc(post.topic)}</span>
        <h3 class="post-title">${esc(post.title)}</h3>
        <p class="post-body">${esc(post.body)}</p>
        ${tags}
        <div class="post-actions">
          <button class="action ${liked ? "active" : ""}" data-action="like">♥ ${post.likes}</button>
          <button class="action" data-action="comment">◯ ${comments.length}</button>
          ${post.userId === user.id ? `<button class="action action-delete">Delete</button>` : ""}
        </div>
        <div class="comment-box">
          <input maxlength="180" placeholder="Add your comment..." />
          <button data-action="send-comment">Send</button>
        </div>
        ${commentHtml ? `<div class="comments">${commentHtml}</div>` : ""}
      </article>`;
  }).join("");
}

function deletePost(postId) {
  const user = currentUser();
  const post = db.posts.find(p => p.id === postId);
  if (!post || post.userId !== user?.id) return;
  db.posts = db.posts.filter(p => p.id !== postId);
  saveDB();
  renderFeed();
  toast("Post deleted.");
}

function openAccountModal() {
  const user = currentUser();
  if (!user) return;
  const ownPosts = db.posts.filter(p => p.userId === user.id);
  const ownLikes = ownPosts.reduce((sum,p) => sum + p.likes, 0);
  document.getElementById("accountDetails").textContent = `${user.name} · @${user.username} · ${user.email}`;
  document.getElementById("myPostCount").textContent = ownPosts.length;
  document.getElementById("myLikeCount").textContent = ownLikes;
  document.getElementById("accountModal").showModal();
}

document.querySelectorAll(".auth-tab").forEach(btn => {
  btn.addEventListener("click", () => showAuth(btn.dataset.authTab));
});
document.getElementById("loginForm").addEventListener("submit", loginUser);
document.getElementById("signupForm").addEventListener("submit", registerUser);

document.getElementById("demoLogin").addEventListener("click", () => {
  const demo = db.users.find(u => u.email === "demo@qavrin.in");
  const user = demo || { id: crypto.randomUUID(), name: "Demo User", username: "demo_user", email: "demo@qavrin.in", password: "qavrin123", createdAt: Date.now() };
  if (!demo) { db.users.push(user); saveDB(); }
  saveSession(user.id);
  appStart();
});

document.getElementById("publishBtn").addEventListener("click", publishPost);
document.getElementById("postBody").addEventListener("input", (e) => {
  document.getElementById("charCount").textContent = `${e.target.value.length} / 1200`;
});
document.getElementById("feedFilter").addEventListener("change", renderFeed);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("newPostTop").addEventListener("click", () => {
  document.getElementById("writer").scrollIntoView({behavior:"smooth"});
  document.getElementById("postTitle").focus();
});

document.getElementById("feed").addEventListener("click", event => {
  const card = event.target.closest(".post-card");
  const postId = card?.dataset.postId;
  if (!card || !postId) return;

  if (event.target.closest('[data-action="like"]')) toggleLike(postId);
  if (event.target.closest('[data-action="comment"]')) toggleComments(card);
  if (event.target.closest('[data-action="send-comment"]')) {
    const input = card.querySelector(".comment-box input");
    addComment(postId, input);
  }
  if (event.target.closest(".action-delete")) deletePost(postId);
});

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => document.getElementById(btn.dataset.close).close());
});

// Triple-click the logo in the app to open a simple account panel during the trial.
document.querySelector(".brand-logo").addEventListener("click", openAccountModal);

appStart();
