# QAVRIN v1

QAVRIN is a responsive front-end prototype for a youth-first social platform where Indian users can share thoughts, ideas, opinions and perspectives.

## What works in this version

- Responsive feed UI based on the QAVRIN concept
- Create a text post
- Like / unlike posts
- Save posts
- Share (copies the page URL where browser permissions allow)
- Add comments
- Feed filters: Popular, Recent, Debates, Campus, Society
- Profile modal with local stats
- LocalStorage persistence
- Mobile bottom navigation
- GitHub Pages compatible — no build step required

## Run locally

Open `index.html` directly in a browser, or use a small local server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy on GitHub Pages

1. Create a new GitHub repository, e.g. `qavrin`.
2. Upload all files and folders from this project.
3. In GitHub: **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Save. GitHub will give you the public site URL.

## Important

This is a front-end demo. It does **not** yet have real user accounts, a real database, server-side moderation, image uploads, or production authentication.

For the real QAVRIN app, the next technical stage should add:

- Supabase/PostgreSQL database
- Authentication
- Real profiles and follows
- Server-side posts/comments/likes
- Image/video storage
- Moderation and reporting
- Search
- Admin dashboard
- Rate limits and anti-spam
- Production deployment
