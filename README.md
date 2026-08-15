# QAVRIN V2 — Trial Build

This version replaces the original static demo with a simple account + writing flow.

## What is included

### Public entry
- QAVRIN official logo supplied by the founder is used throughout the site.
- Clear positioning: “Your thoughts deserve a place.”
- Trial-version notice.

### Account flow
- Create account with:
  - Full name
  - Username
  - Email
  - Password
- Log in
- Demo-account shortcut
- Log out
- Basic account summary

### Writing flow
- Create a post
- Title
- Long-form body
- Topic
- Tags
- Character counter
- Publish
- Delete your own post

### Community flow
- Latest feed
- Popular feed
- My posts
- Topic filtering
- Likes
- Comments
- Simple comment list

### Design choice
No avatar system is included in this trial, as requested. The product identity is based on name, username and writing.

## IMPORTANT: this is still a browser-only trial

GitHub Pages is static hosting. It cannot safely provide real shared authentication and a shared database by itself.

In this build:
- users are stored in the browser's localStorage
- passwords are stored locally in plain text
- posts exist only in that browser
- another person on another phone/browser will NOT see the same accounts or posts

This is deliberate for the trail/trial demonstration, but it is NOT suitable for production.

## What the next real version needs

Move the application backend to a real service such as Supabase and connect:

1. Authentication
2. PostgreSQL database
3. Server-side authorization
4. Real user profiles
5. Posts table
6. Comments table
7. Likes table
8. Follows table
9. Reports / moderation
10. Image/video storage later
11. Rate limiting and anti-spam
12. Privacy policy, terms and community rules

### Suggested database structure

users / profiles
- id
- full_name
- username
- email
- created_at

posts
- id
- user_id
- title
- body
- topic
- created_at
- updated_at

comments
- id
- post_id
- user_id
- body
- created_at

likes
- post_id
- user_id
- created_at

## GitHub Pages deployment

Upload the project contents to the `qavrin` repository.

Then:

GitHub → Repository → Settings → Pages

Choose:

- Source: Deploy from a branch
- Branch: main
- Folder: / (root)

Save and wait for the Pages deployment.

## Suggested launch sequence

Do not add payments or ads yet.

First test:
- 10–20 people
- 2–4 weeks
- number of account creations
- number of posts
- posts per active user
- comments per post
- return users
- reports / spam

Only after people are actually using it should the production backend and monetisation work begin.
