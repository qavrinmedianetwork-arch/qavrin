# QAVRIN — Real Product UI v1

This package is a complete redesign of the QAVRIN web experience.

## Product direction

QAVRIN is a conversation-first platform for Indian youth.

The interface is intentionally:
- text-first
- clean
- fast
- mobile friendly
- easy to scan
- easy to write
- built around topics and perspectives rather than follower vanity metrics

## Included UI

- Home feed
- Latest / Popular / Following controls
- Topic filtering
- Search
- Explore page
- Trending topics
- Notifications
- Profile
- Saved posts
- Create post composer
- Likes
- Comments
- Save
- Delete own posts
- Follow controls
- Profile editing
- Login and account creation screens
- Mobile navigation
- Official QAVRIN logo

## Important architecture note

The included `index.html`, `styles.css` and `app.js` provide a complete frontend experience and a local browser fallback so the UI can be tested immediately.

For real multi-user production operation, connect the frontend to Supabase using:
- Supabase Auth
- PostgreSQL
- Row Level Security
- Storage when media is introduced

The SQL foundation is in `supabase.sql`.

## Deployment

1. Create a Supabase project.
2. Run `supabase.sql` in Supabase SQL Editor.
3. Configure the browser client with your Supabase project URL and publishable/anon key.
4. Replace local-storage data calls in `app.js` with Supabase queries/auth.
5. Deploy the static frontend to GitHub Pages, Cloudflare Pages, Vercel or another static host.
6. Add a custom domain after the product is stable.

## Product rules before public launch

- Never put a service_role/secret key in browser code.
- Do not store passwords in localStorage.
- Add email verification and password reset.
- Add rate limits / anti-spam.
- Add block, mute and report flows.
- Add admin moderation.
- Add Terms, Privacy Policy and Community Guidelines.
- Add account deletion/export.
- Test keyboard navigation and screen readers.
- Add analytics without collecting unnecessary personal data.
- Add backups and monitoring.

## UX principle

The first action on QAVRIN should be obvious:
read something or write something.

Do not bury writing behind multiple menus.
Do not make the home screen a wall of settings.
Do not copy Instagram's follower-first interface.

QAVRIN should earn its value from the quality of conversations.
