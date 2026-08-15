(() => {
  const cfg = window.QAVRIN_CONFIG || {};
  const root = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  let supabase = null;
  let currentProfile = null;
  let feedMode = "latest";
  let searchTerm = "";

  const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
  const initials = name => (name || "?").trim().split(/\s+/).slice(0,2).map(x => x[0]).join("").toUpperCase();
  const ago = ts => {
    const m = Math.max(1, Math.floor((Date.now() - new Date(ts).getTime()) / 60000));
    if(m < 60) return `${m}m`;
    const h = Math.floor(m/60); if(h < 24) return `${h}h`;
    const d = Math.floor(h/24); if(d < 30) return `${d}d`;
    return new Date(ts).toLocaleDateString();
  };
  const toast = msg => { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(window.__qt); window.__qt = setTimeout(()=>toastEl.classList.remove("show"),2200); };
  const isConfigured = () => cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("PASTE_") && cfg.SUPABASE_KEY && !cfg.SUPABASE_KEY.includes("PASTE_");

  async function init(){
    if(!isConfigured()){ renderSetup(); return; }
    supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if(session?.user){ await loadProfile(session.user.id); renderApp(); }
      else { currentProfile = null; renderAuth(); }
    });
    const { data:{session} } = await supabase.auth.getSession();
    if(session?.user){ await loadProfile(session.user.id); renderApp(); }
    else renderAuth();
  }

  function renderSetup(){
    root.innerHTML = `
      <main class="auth-page">
        <section class="auth-card">
          <img class="logo" src="assets/qavrin-logo.png" alt="QAVRIN">
          <p class="eyebrow">QAVRIN SETUP</p>
          <h1 style="font-size:34px;margin:0 0 10px">Connect the real backend.</h1>
          <p class="lead" style="font-size:14px">The frontend is ready. Add your Supabase Project URL and publishable key in <code>config.js</code>, run <code>supabase.sql</code> once in Supabase SQL Editor, then redeploy.</p>
          <div class="feature" style="margin:18px 0">
            <strong>Do not put a service-role/secret key here.</strong>
            <span>Only the browser-safe publishable/anon key belongs in <code>config.js</code>. Database security is enforced with RLS.</span>
          </div>
          <a class="primary full" style="display:block;text-align:center" href="https://supabase.com/" target="_blank" rel="noreferrer">Open Supabase</a>
        </section>
      </main>`;
  }

  function renderAuth(tab="login"){
    root.innerHTML = `
      <main class="auth-page">
        <section class="auth-card">
          <img class="logo" src="assets/qavrin-logo.png" alt="QAVRIN">
          <p class="eyebrow">QAVRIN</p>
          <h1 style="font-size:38px;margin:0">Your thoughts deserve a place.</h1>
          <p class="lead" style="font-size:14px">Write clearly. Read different perspectives. Be part of the conversation.</p>
          <div class="auth-tabs">
            <button class="auth-tab ${tab==="login"?"active":""}" data-tab="login">Log in</button>
            <button class="auth-tab ${tab==="signup"?"active":""}" data-tab="signup">Create account</button>
          </div>
          <div id="authForm"></div>
          <p class="muted" style="font-size:11px;margin:16px 0 0">By joining QAVRIN, you agree to follow the community rules. Be respectful. Do not post illegal, hateful, threatening or deliberately harmful content.</p>
        </section>
      </main>`;
    root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>renderAuth(b.dataset.tab));
    const box = document.getElementById("authForm");
    if(tab==="login"){
      box.innerHTML = `
        <form class="form">
          <h2>Welcome back.</h2>
          <label class="field">Email<input name="email" type="email" required autocomplete="email"></label>
          <label class="field">Password<input name="password" type="password" required autocomplete="current-password"></label>
          <button class="primary full">Log in</button>
          <button type="button" class="text-btn" id="forgot">Forgot password?</button>
          <p class="note">Email confirmation and password reset are handled by Supabase Auth.</p>
        </form>`;
      box.querySelector("form").onsubmit=async e=>{
        e.preventDefault(); const f=new FormData(e.currentTarget);
        const {error}=await supabase.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});
        if(error) toast(error.message); else toast("Welcome back.");
      };
      box.querySelector("#forgot").onclick=async()=>{
        const email=prompt("Enter your QAVRIN account email:");
        if(!email) return;
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.href});
        toast(error ? error.message : "Password reset email sent.");
      };
    } else {
      box.innerHTML = `
        <form class="form">
          <h2>Create your account.</h2>
          <label class="field">Full name<input name="name" maxlength="60" required></label>
          <label class="field">Username<input name="username" maxlength="24" pattern="[A-Za-z0-9_]+" required placeholder="yourusername"></label>
          <label class="field">Email<input name="email" type="email" required autocomplete="email"></label>
          <label class="field">Password<input name="password" type="password" minlength="8" required autocomplete="new-password"></label>
          <label class="field">Short bio <span class="muted" style="font-weight:500">(optional)</span><textarea name="bio" maxlength="160" rows="3"></textarea></label>
          <button class="primary full">Create account</button>
          <p class="note">Use a real email. Depending on your Supabase Auth settings, you may need to confirm it before logging in.</p>
        </form>`;
      box.querySelector("form").onsubmit=async e=>{
        e.preventDefault(); const f=new FormData(e.currentTarget);
        const username=String(f.get("username")).trim().toLowerCase();
        if(!/^[a-z0-9_]{3,24}$/.test(username)) return toast("Username must be 3–24 letters, numbers or underscores.");
        const {data,error}=await supabase.auth.signUp({
          email:f.get("email"),password:f.get("password"),
          options:{data:{full_name:String(f.get("name")).trim(),username,bio:String(f.get("bio")||"").trim()}}
        });
        if(error) return toast(error.message);
        if(data.session) toast("Account created.");
        else {
          root.querySelector("#authForm").innerHTML=`<div class="verify-box">Account created. Check your email to confirm your QAVRIN account, then log in.</div>`;
        }
      };
    }
  }

  async function loadProfile(userId){
    const {data,error}=await supabase.from("profiles").select("*").eq("id",userId).single();
    if(error){ console.error(error); toast("Could not load your profile."); return; }
    currentProfile=data;
  }

  function shell(content, active="home"){
    const p=currentProfile;
    return `
      <div class="app-shell">
        <header class="topbar">
          <a href="#" class="brand-link"><img class="logo" src="assets/qavrin-logo.png" alt="QAVRIN"></a>
          <div class="top-search"><input id="searchInput" placeholder="Search people, posts and topics..." value="${escapeHtml(searchTerm)}"></div>
          <div class="top-actions">
            <button class="secondary" id="writeTop">Write</button>
            <button class="user-button" id="userMenuBtn"><span class="avatar">${initials(p.full_name)}</span>${escapeHtml(p.username)} ▾</button>
            <div class="menu hidden" id="userMenu">
              <button id="profileMenu">My profile</button>
              <button id="settingsMenu">Settings</button>
              <button id="logoutMenu" class="danger">Log out</button>
            </div>
          </div>
        </header>
        <main class="page app-grid">
          <aside class="sidebar">
            <nav class="nav-card">
              <button class="nav-item ${active==="home"?"active":""}" data-nav="home">⌂ Home</button>
              <button class="nav-item ${active==="explore"?"active":""}" data-nav="explore">⌕ Explore</button>
              <button class="nav-item ${active==="profile"?"active":""}" data-nav="profile">◯ My profile</button>
              <button class="nav-item ${active==="settings"?"active":""}" data-nav="settings">⚙ Settings</button>
            </nav>
            <div class="side-card" style="margin-top:12px">
              <h3>QAVRIN</h3>
              <p>A place for Indian youth to share thoughts, ideas, opinions and perspectives.</p>
              <p><strong>Think. Write. Be heard.</strong></p>
            </div>
          </aside>
          <section>${content}</section>
          <aside class="rightbar">
            <div class="side-card">
              <h3>Community rules</h3>
              <p>Challenge ideas, not people. No threats, harassment, impersonation, spam or illegal content.</p>
              <button class="text-btn" id="rulesBtn">Read full rules</button>
            </div>
            <div class="side-card" style="margin-top:12px">
              <h3>Topics</h3>
              <div style="display:grid;gap:5px">
                ${["Education","Society","Campus","Careers","Technology","India","Debates"].map(t=>`<button class="text-btn topic-link" data-topic="${t}" style="text-align:left">#${t}</button>`).join("")}
              </div>
            </div>
          </aside>
        </main>
        <footer class="page footer">
          <div style="display:flex;align-items:center;gap:9px"><img src="assets/qavrin-logo.png" alt="QAVRIN"><span>QAVRIN</span></div>
          <span>Community first · Privacy · Terms · Rules</span>
        </footer>
        <nav class="mobile-nav">
          <button class="${active==="home"?"active":""}" data-nav="home">Home</button>
          <button class="${active==="explore"?"active":""}" data-nav="explore">Explore</button>
          <button data-nav="write">Write</button>
          <button class="${active==="profile"?"active":""}" data-nav="profile">Profile</button>
          <button class="${active==="settings"?"active":""}" data-nav="settings">Settings</button>
        </nav>
      </div>`;
  }

  function bindShell(){
    root.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{
      const n=b.dataset.nav;
      if(n==="home") renderHome();
      else if(n==="explore") renderExplore();
      else if(n==="profile") renderProfile(currentProfile.username);
      else if(n==="settings") renderSettings();
      else if(n==="write"){ renderHome(); setTimeout(()=>document.getElementById("composerBody")?.focus(),50); }
    });
    root.querySelector("#writeTop")?.addEventListener("click",()=>{renderHome();setTimeout(()=>document.getElementById("composerBody")?.focus(),50)});
    const mb=root.querySelector("#userMenuBtn"), menu=root.querySelector("#userMenu");
    mb?.addEventListener("click",()=>menu.classList.toggle("hidden"));
    root.querySelector("#logoutMenu")?.addEventListener("click",()=>supabase.auth.signOut());
    root.querySelector("#profileMenu")?.addEventListener("click",()=>renderProfile(currentProfile.username));
    root.querySelector("#settingsMenu")?.addEventListener("click",()=>renderSettings());
    root.querySelector("#rulesBtn")?.addEventListener("click",showRules);
    root.querySelectorAll(".topic-link").forEach(b=>b.onclick=()=>{searchTerm="";feedMode=b.dataset.topic;renderExplore()});
    root.querySelector("#searchInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){searchTerm=e.currentTarget.value.trim();renderExplore()}});
  }

  async function renderHome(){
    root.innerHTML=shell(`
      <div class="section-head"><div><p class="eyebrow">YOUR SPACE</p><h2>Good to see you, ${escapeHtml(currentProfile.full_name.split(" ")[0])}.</h2></div></div>
      <section class="composer">
        <div class="composer-top"><div><p class="eyebrow">CREATE</p><strong>What do you want to say?</strong></div><span class="muted" id="composerCount">0 / 3000</span></div>
        <form id="composerForm">
          <label class="field">Title<input id="composerTitle" name="title" maxlength="120" placeholder="Give your thought a clear title" required></label>
          <label class="field" style="margin-top:10px">Your thought<textarea id="composerBody" name="body" maxlength="3000" rows="7" placeholder="Write what you actually think. Explain it well." required></textarea></label>
          <div class="composer-row">
            <label class="field">Topic<select name="topic"><option>General</option><option>Education</option><option>Society</option><option>Campus</option><option>Careers</option><option>Technology</option><option>India</option><option>Debates</option></select></label>
            <label class="field">Tags<input name="tags" maxlength="120" placeholder="education, youth, india"></label>
          </div>
          <div class="composer-foot"><span class="muted" style="font-size:11px">You can edit or delete your own posts later.</span><button class="primary">Publish</button></div>
        </form>
      </section>
      <div class="section-head"><div><p class="eyebrow">COMMUNITY</p><h2>Latest thoughts</h2></div><button class="secondary" id="refreshFeed">Refresh</button></div>
      <div id="feed" class="post-list"><div class="empty">Loading conversations…</div></div>
    `,"home");
    bindShell();
    document.getElementById("composerBody").addEventListener("input",e=>document.getElementById("composerCount").textContent=`${e.target.value.length} / 3000`);
    document.getElementById("composerForm").onsubmit=createPost;
    document.getElementById("refreshFeed").onclick=()=>loadFeed("latest");
    await loadFeed("latest");
  }

  async function createPost(e){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const title=String(f.get("title")).trim(), body=String(f.get("body")).trim();
    if(body.length<20) return toast("Write at least 20 characters.");
    const tags=String(f.get("tags")||"").split(",").map(x=>x.trim().replace(/^#/,"").toLowerCase()).filter(Boolean).slice(0,8);
    const {error}=await supabase.from("posts").insert({user_id:currentProfile.id,title,body,topic:f.get("topic"),tags});
    if(error) return toast(error.message);
    e.currentTarget.reset(); document.getElementById("composerCount").textContent="0 / 3000";
    toast("Published.");
    await loadFeed("latest");
  }

  async function loadFeed(mode="latest"){
    feedMode=mode;
    let query=supabase.from("posts").select("id,user_id,title,body,topic,tags,created_at,updated_at,profiles!posts_user_id_fkey(id,username,full_name,bio)").eq("is_deleted",false).limit(30);
    if(["Education","Society","Campus","Careers","Technology","India","Debates"].includes(mode)) query=query.eq("topic",mode);
    if(searchTerm){
      const q=searchTerm.replace(/[%_]/g,"");
      query=query.or(`title.ilike.%${q}%,body.ilike.%${q}%,topic.ilike.%${q}%`);
    }
    query=query.order("created_at",{ascending:false});
    const {data,error}=await query;
    if(error){document.getElementById("feed").innerHTML=`<div class="empty">${escapeHtml(error.message)}</div>`;return}
    await renderPosts(data || []);
  }

  async function renderPosts(posts){
    const feed=document.getElementById("feed"); if(!feed) return;
    if(!posts.length){feed.innerHTML=`<div class="empty"><strong>No posts found.</strong><br>Try another topic or start a new conversation.</div>`;return}
    const ids=posts.map(p=>p.id);
    const {data:likes=[]}=await supabase.from("likes").select("post_id,user_id").in("post_id",ids);
    const {data:comments=[]}=await supabase.from("comments").select("id,post_id,user_id,body,created_at,profiles!comments_user_id_fkey(username,full_name)").in("post_id",ids).order("created_at",{ascending:true});
    const likedSet=new Set((likes||[]).filter(x=>x.user_id===currentProfile.id).map(x=>x.post_id));
    const counts={}; (likes||[]).forEach(x=>counts[x.post_id]=(counts[x.post_id]||0)+1);
    const byPost={}; (comments||[]).forEach(c=>(byPost[c.post_id] ||= []).push(c));
    feed.innerHTML=posts.map(p=>{
      const profile=p.profiles||{};
      const cs=(byPost[p.id]||[]).slice(-4);
      return `<article class="post" data-post="${p.id}">
        <div class="post-author"><div class="avatar">${initials(profile.full_name||"Q")}</div><div class="post-author-info"><strong>${escapeHtml(profile.full_name||"QAVRIN user")}</strong><span>@${escapeHtml(profile.username||"user")} · ${ago(p.created_at)}</span></div><button class="icon-btn post-menu" data-action="report">•••</button></div>
        <span class="topic">${escapeHtml(p.topic)}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="post-body">${escapeHtml(p.body)}</p>
        ${(p.tags||[]).length?`<div class="tags">${p.tags.map(t=>`<span class="tag">#${escapeHtml(t)}</span>`).join("")}</div>`:""}
        <div class="post-actions">
          <button data-action="like" class="${likedSet.has(p.id)?"active":""}">♥ ${counts[p.id]||0}</button>
          <button data-action="comment">◯ ${(byPost[p.id]||[]).length}</button>
          ${p.user_id===currentProfile.id?`<button data-action="delete" class="danger">Delete</button>`:""}
        </div>
        <div class="comment-area"><input maxlength="500" placeholder="Add a thoughtful comment…"><button class="primary" data-action="send-comment">Send</button></div>
        ${cs.length?`<div class="comment-list">${cs.map(c=>`<div class="comment"><strong>${escapeHtml(c.profiles?.full_name||"User")}</strong> · @${escapeHtml(c.profiles?.username||"user")}<br>${escapeHtml(c.body)}</div>`).join("")}</div>`:""}
      </article>`;
    }).join("");
    feed.querySelectorAll("[data-action]").forEach(btn=>btn.onclick=async()=>handlePostAction(btn));
  }

  async function handlePostAction(btn){
    const card=btn.closest("[data-post]"), postId=card.dataset.post, action=btn.dataset.action;
    if(action==="comment"){card.querySelector(".comment-area").classList.toggle("open");return}
    if(action==="like"){
      const {data:existing}=await supabase.from("likes").select("post_id").eq("post_id",postId).eq("user_id",currentProfile.id).maybeSingle();
      if(existing) await supabase.from("likes").delete().eq("post_id",postId).eq("user_id",currentProfile.id);
      else await supabase.from("likes").insert({post_id:postId,user_id:currentProfile.id});
      await loadFeed(feedMode); return;
    }
    if(action==="delete"){
      if(!confirm("Delete this post?")) return;
      const {error}=await supabase.from("posts").update({is_deleted:true}).eq("id",postId).eq("user_id",currentProfile.id);
      if(error) toast(error.message); else {toast("Post deleted.");await loadFeed(feedMode)}
      return;
    }
    if(action==="send-comment"){
      const input=card.querySelector(".comment-area input"), body=input.value.trim();
      if(!body) return;
      const {error}=await supabase.from("comments").insert({post_id:postId,user_id:currentProfile.id,body});
      if(error) toast(error.message); else {input.value="";toast("Comment added.");await loadFeed(feedMode)}
      return;
    }
    if(action==="report"){
      showReport(postId); return;
    }
  }

  async function renderExplore(){
    root.innerHTML=shell(`
      <div class="section-head"><div><p class="eyebrow">EXPLORE</p><h2>${searchTerm?`Results for “${escapeHtml(searchTerm)}”`:"Discover conversations"}</h2></div><select id="topicFilter" class="secondary" style="padding:10px"><option value="latest">Latest</option>${["Education","Society","Campus","Careers","Technology","India","Debates"].map(t=>`<option ${feedMode===t?"selected":""}>${t}</option>`).join("")}</select></div>
      <div id="feed" class="post-list"><div class="empty">Loading…</div></div>
    `,"explore");
    bindShell();
    document.getElementById("topicFilter").onchange=e=>loadFeed(e.target.value);
    await loadFeed(feedMode);
  }

  async function renderProfile(username){
    const {data:profile,error}=await supabase.from("profiles").select("*").eq("username",username).single();
    if(error) return toast(error.message);
    const {count:postCount}=await supabase.from("posts").select("*",{count:"exact",head:true}).eq("user_id",profile.id).eq("is_deleted",false);
    const {count:followerCount}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("following_id",profile.id);
    const {count:followingCount}=await supabase.from("follows").select("*",{count:"exact",head:true}).eq("follower_id",profile.id);
    const {data:follow}=await supabase.from("follows").select("follower_id").eq("follower_id",currentProfile.id).eq("following_id",profile.id).maybeSingle();
    root.innerHTML=shell(`
      <section class="profile-card">
        <div class="profile-top">
          <div class="profile-avatar">${initials(profile.full_name)}</div>
          <div><h2>${escapeHtml(profile.full_name)}</h2><p>@${escapeHtml(profile.username)}</p></div>
          <div class="profile-actions">${profile.id!==currentProfile.id?`<button class="${follow?"secondary":"primary"}" id="followBtn">${follow?"Following":"Follow"}</button>`:"<button class="secondary" id="editProfile">Edit profile</button>"}</div>
        </div>
        ${profile.bio?`<p class="profile-bio">${escapeHtml(profile.bio)}</p>`:""}
        <div class="stat-row"><div class="stat"><strong>${postCount||0}</strong><span>Posts</span></div><div class="stat"><strong>${followerCount||0}</strong><span>Followers</span></div><div class="stat"><strong>${followingCount||0}</strong><span>Following</span></div></div>
      </section>
      <div class="section-head"><div><p class="eyebrow">POSTS</p><h2>Thoughts by @${escapeHtml(profile.username)}</h2></div></div>
      <div id="feed" class="post-list"></div>
    `,"profile");
    bindShell();
    if(profile.id!==currentProfile.id) document.getElementById("followBtn").onclick=async()=>{
      if(follow) await supabase.from("follows").delete().eq("follower_id",currentProfile.id).eq("following_id",profile.id);
      else await supabase.from("follows").insert({follower_id:currentProfile.id,following_id:profile.id});
      renderProfile(username);
    };
    if(profile.id===currentProfile.id) document.getElementById("editProfile").onclick=showEditProfile;
    const {data:posts}=await supabase.from("posts").select("id,user_id,title,body,topic,tags,created_at,updated_at,profiles!posts_user_id_fkey(id,username,full_name,bio)").eq("user_id",profile.id).eq("is_deleted",false).order("created_at",{ascending:false});
    await renderPosts(posts||[]);
  }

  function renderSettings(){
    root.innerHTML=shell(`
      <div class="section-head"><div><p class="eyebrow">ACCOUNT</p><h2>Settings</h2></div></div>
      <div class="settings-grid">
        <div class="side-card"><h3>Profile</h3><p>Change your name, username and bio.</p><button class="primary" id="editSettings">Edit profile</button></div>
        <div class="side-card"><h3>Password</h3><p>Supabase handles password security and reset.</p><button class="secondary" id="resetSettings">Send password reset email</button></div>
        <div class="side-card"><h3>Community</h3><p>Report posts and comments that break the rules. Do not use reports for ordinary disagreement.</p><button class="secondary" id="rulesSettings">Read rules</button></div>
        <div class="side-card"><h3>Danger zone</h3><p>Signing out removes this browser session. Account deletion should be implemented through a protected backend flow before launch.</p><button class="secondary danger" id="logoutSettings">Log out</button></div>
      </div>
    `,"settings");
    bindShell();
    document.getElementById("editSettings").onclick=showEditProfile;
    document.getElementById("rulesSettings").onclick=showRules;
    document.getElementById("logoutSettings").onclick=()=>supabase.auth.signOut();
    document.getElementById("resetSettings").onclick=async()=>{
      const {error}=await supabase.auth.resetPasswordForEmail((await supabase.auth.getUser()).data.user.email,{redirectTo:location.href});
      toast(error?error.message:"Password reset email sent.");
    };
  }

  function showEditProfile(){
    const d=document.createElement("dialog"); d.className="modal";
    d.innerHTML=`<div class="modal-card"><button class="close">×</button><p class="eyebrow">PROFILE</p><h2>Edit your profile</h2><form class="form">
      <label class="field">Full name<input name="name" value="${escapeHtml(currentProfile.full_name)}" maxlength="60" required></label>
      <label class="field">Username<input name="username" value="${escapeHtml(currentProfile.username)}" maxlength="24" pattern="[A-Za-z0-9_]+" required></label>
      <label class="field">Bio<textarea name="bio" maxlength="160" rows="4">${escapeHtml(currentProfile.bio||"")}</textarea></label>
      <button class="primary full">Save changes</button></form></div>`;
    document.body.appendChild(d); d.showModal();
    d.querySelector(".close").onclick=()=>d.close();
    d.querySelector("form").onsubmit=async e=>{
      e.preventDefault(); const f=new FormData(e.currentTarget);
      const username=String(f.get("username")).trim().toLowerCase();
      if(!/^[a-z0-9_]{3,24}$/.test(username)) return toast("Username must be 3–24 letters, numbers or underscores.");
      const {data,error}=await supabase.rpc("update_my_profile",{p_full_name:String(f.get("name")).trim(),p_username:username,p_bio:String(f.get("bio")||"").trim()});
      if(error) return toast(error.message);
      currentProfile=data; d.close(); d.remove(); toast("Profile updated."); renderProfile(currentProfile.username);
    };
  }

  function showRules(){
    const d=document.createElement("dialog");d.className="modal";
    d.innerHTML=`<div class="modal-card"><button class="close">×</button><p class="eyebrow">COMMUNITY RULES</p><h2>Keep QAVRIN worth reading.</h2>
    <div style="display:grid;gap:12px;color:#475467;font-size:13px;line-height:1.6">
      <div><strong>1. Challenge ideas, not people.</strong><br>No harassment, threats or targeted abuse.</div>
      <div><strong>2. No hate or dehumanisation.</strong><br>Do not attack people based on protected characteristics.</div>
      <div><strong>3. No illegal or dangerous instructions.</strong><br>Do not use QAVRIN to facilitate wrongdoing.</div>
      <div><strong>4. No spam or manipulation.</strong><br>No fake engagement, scams, impersonation or mass posting.</div>
      <div><strong>5. Respect privacy.</strong><br>Do not post private personal information about others.</div>
      <div><strong>6. Report problems.</strong><br>Use the report control when content actually breaks the rules.</div>
    </div></div>`;
    document.body.appendChild(d);d.showModal();d.querySelector(".close").onclick=()=>{d.close();d.remove()};
  }

  function showReport(postId){
    const d=document.createElement("dialog");d.className="modal";
    d.innerHTML=`<div class="modal-card"><button class="close">×</button><p class="eyebrow">REPORT</p><h2>What is wrong with this post?</h2><form class="form">
      <label class="field">Reason<select name="reason"><option>Harassment</option><option>Hate or abuse</option><option>Threat</option><option>Spam or scam</option><option>Privacy violation</option><option>Illegal or dangerous content</option><option>Other</option></select></label>
      <label class="field">Details<textarea name="details" maxlength="500" rows="4" placeholder="Tell moderators what happened."></textarea></label>
      <button class="primary full">Submit report</button></form></div>`;
    document.body.appendChild(d);d.showModal();d.querySelector(".close").onclick=()=>{d.close();d.remove()};
    d.querySelector("form").onsubmit=async e=>{
      e.preventDefault();const f=new FormData(e.currentTarget);
      const {error}=await supabase.from("reports").insert({reporter_id:currentProfile.id,post_id:postId,reason:f.get("reason"),details:String(f.get("details")||"").trim()});
      if(error) toast(error.message); else {toast("Report submitted.");d.close();d.remove()}
    };
  }

  init();
})();
