# QAVRIN

QAVRIN is a Next.js + PostgreSQL social network starter for Indian youth. It includes real authentication, users, profiles, follows, posts, image references, likes, comments, search, notifications, communities, events, messaging, stories, reports and an admin overview.

**Hard product rule: QAVRIN does not support video uploads or video hosting.**

## Run locally

1. Install Node.js 20+ and PostgreSQL 15+.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` and a strong `AUTH_SECRET`.
4. Run `npm install`.
5. Run `npx prisma db push`.
6. Run `npm run db:seed`.
7. Run `npm run dev`.
8. Open `http://localhost:3000`.

Seed demo accounts use password `QavrinDemo123!`.

## GitHub

Push this folder to a GitHub repository. Add the production environment variables in your deployment provider. Never commit `.env`.

## Production work still required

The codebase is a functional launchable foundation, not a claim that a social network is magically production-safe on day one. Before public launch, connect object storage (S3/Cloudinary) to `/api/upload`, add a real email provider, add Redis/rate limiting, WebSockets for realtime chat, proper admin RBAC, automated image moderation, backups, observability, legal/privacy pages and a full security review.

## Architecture

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT session cookie using `jose`
- bcrypt password hashing
- Tailwind CSS

## Important

The upload endpoint explicitly rejects video MIME types. Keep this restriction when replacing it with S3/Cloudinary signed uploads.
