-- QAVRIN production database foundation
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  full_name text not null check (char_length(full_name) between 2 and 60),
  bio text default '' check (char_length(bio) <= 160),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 120),
  body text not null check (char_length(body) between 20 and 5000),
  topic text not null default 'General',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id,following_id),
  check (follower_id <> following_id)
);

create table if not exists public.saved_posts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,post_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  post_id uuid references public.posts(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  details text default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.saved_posts enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

drop policy if exists "public profiles readable" on public.profiles;
create policy "public profiles readable" on public.profiles for select using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles inserted by owner" on public.profiles;
create policy "profiles inserted by owner" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "published posts readable" on public.posts;
create policy "published posts readable" on public.posts for select using (true);

drop policy if exists "users create own posts" on public.posts;
create policy "users create own posts" on public.posts for insert with check (auth.uid() = user_id);

drop policy if exists "users edit own posts" on public.posts;
create policy "users edit own posts" on public.posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users delete own posts" on public.posts;
create policy "users delete own posts" on public.posts for delete using (auth.uid() = user_id);

drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments for select using (true);

drop policy if exists "users create comments" on public.comments;
create policy "users create comments" on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own comments" on public.comments;
create policy "users delete own comments" on public.comments for delete using (auth.uid() = user_id);

drop policy if exists "likes readable" on public.likes;
create policy "likes readable" on public.likes for select using (true);

drop policy if exists "users manage own likes" on public.likes;
create policy "users manage own likes" on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "follows readable" on public.follows;
create policy "follows readable" on public.follows for select using (true);

drop policy if exists "users manage own follows" on public.follows;
create policy "users manage own follows" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "saved posts private" on public.saved_posts;
create policy "saved posts private" on public.saved_posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own notifications readable" on public.notifications;
create policy "own notifications readable" on public.notifications for select using (auth.uid() = recipient_id);

drop policy if exists "own notifications update" on public.notifications;
create policy "own notifications update" on public.notifications for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

drop policy if exists "users create reports" on public.reports;
create policy "users create reports" on public.reports for insert with check (auth.uid() = reporter_id);

drop policy if exists "users read own reports" on public.reports;
create policy "users read own reports" on public.reports for select using (auth.uid() = reporter_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username',''), 'user_' || substr(new.id::text,1,8)),
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'QAVRIN User')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_topic_idx on public.posts(topic);
create index if not exists comments_post_idx on public.comments(post_id,created_at);
create index if not exists notifications_recipient_idx on public.notifications(recipient_id,read,created_at desc);
