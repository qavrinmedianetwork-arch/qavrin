# QAVRIN — Production Web Foundation

This package is the next step from the GitHub Pages prototype.

It uses:
- GitHub Pages for static hosting
- Supabase Auth for real accounts
- Supabase Postgres for shared data
- Row Level Security (RLS) for browser-side authorization

The browser uses only the Supabase publishable/anon key. Never put a service-role/secret key into the repository.

## What is implemented

### Public/authentication
- QAVRIN branded sign-in screen
- Account creation
- Email/password login
- Password reset
- Persistent Supabase session
- Profile creation on signup
- Username validation
- Logout

### Core social product
- Create posts
- Long-form thoughts
- Topics
- Tags
- Latest feed
- Topic filtering
- Search
- Likes
- Comments
- Follow/unfollow
- Public profiles
- Profile editing
- Post deletion by owner
- Notifications in database for likes/comments/follows
- Report flow
- Community rules UI
- Responsive mobile navigation
- No avatar upload; initials are used for identity

### Security foundation
- Postgres RLS
- Owner-only writes
- Safe profile update RPC that cannot modify `is_admin`
- Admin report policy
- Auth trigger for profile creation
- Indexed user/post/comment/notification access paths

## Important: this is a production foundation, not a finished enterprise platform

Before a public launch you still need:
- moderation/admin dashboard
- account deletion workflow
- email/phone verification policy
- anti-spam and rate limiting
- abuse detection
- blocked-user enforcement
- privacy policy and terms
- cookie/analytics consent where applicable
- backups and recovery plan
- error monitoring
- performance monitoring
- SEO/OG metadata
- accessibility audit
- security review
- load testing
- content moderation operations
- data retention/deletion rules
- age policy and child-safety review
- legal review for India and any future markets
- domain + HTTPS
- custom transactional email templates
- image/video storage only after the text product is stable

## Setup

### 1. Create Supabase project
Open Supabase and create a project.

Then open:
Supabase Dashboard → SQL Editor

Paste the complete contents of `supabase.sql` and run it.

The SQL creates:
- profiles
- posts
- comments
- likes
- follows
- notifications
- reports
- indexes
- RLS policies
- signup trigger
- safe profile-update RPC
- notification triggers

### 2. Configure Auth

In Supabase:
Authentication → Providers → Email

Choose the email-confirmation behaviour you want.

For the first closed test, email/password is enough. Add Google/Apple later if users ask for it.

Set the Site URL and redirect URL to your GitHub Pages URL, for example:

https://YOUR-USERNAME.github.io/qavrin/

Use your exact repository URL.

### 3. Get browser-safe API credentials

Supabase Dashboard → Project Settings → API.

Copy:
- Project URL
- Publishable key (or anon key if your project still labels it that way)

Paste them into `config.js`.

Do NOT paste:
- service_role
- secret key
- database password
- connection string

### 4. Upload to GitHub

Replace the old:
- index.html
- styles.css
- app.js

Upload:
- config.js
- supabase.sql
- README.md
- assets/qavrin-logo.png

Keep the repository root structure:

qavrin/
  index.html
  styles.css
  app.js
  config.js
  supabase.sql
  README.md
  assets/
    qavrin-logo.png

### 5. GitHub Pages

Repository → Settings → Pages:
- Source: Deploy from a branch
- Branch: main
- Folder: / (root)

Save.

### 6. Test with two accounts

Do NOT test only with your own account.

Create:
- Account A
- Account B

Check:
1. A creates a post.
2. B can see it.
3. B comments.
4. A sees the comment.
5. B follows A.
6. A can see follower count.
7. B likes A's post.
8. A can see the like.
9. A deletes own post.
10. B cannot delete A's post.
11. A edits profile.
12. Search finds posts.

If any of those fail, fix the database/RLS before inviting more users.

## Product launch order

Do not add everything at once.

Phase 1:
- accounts
- profiles
- posts
- comments
- likes
- follows
- search
- reports

Phase 2:
- notifications UI
- moderation dashboard
- blocked users
- saved posts
- better discovery
- email templates

Phase 3:
- image upload
- richer editor
- mobile PWA/app
- analytics
- creator/community tools

Phase 4:
- monetisation

Do not add ads or subscriptions before you have real usage data.

## Architecture

GitHub Pages
    ↓
QAVRIN browser app
    ↓
Supabase Auth
    ↓
Supabase Postgres + RLS
    ↓
notifications / moderation / future storage

The browser is not trusted. The database policies are the security boundary.

## Current brand direction

QAVRIN is intentionally:
- text-first
- clean
- youth-focused
- India-focused
- identity through name/username, not avatar pressure
- conversation over vanity metrics

The next major design decision should be the feed/discovery algorithm, not cosmetic features.
