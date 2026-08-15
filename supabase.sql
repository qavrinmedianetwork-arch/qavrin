-- QAVRIN production database
-- Run this ONCE in Supabase Dashboard -> SQL Editor.
-- This script creates the core schema, RLS policies, profile trigger,
-- profile update RPC, indexes, and notification triggers.
--
-- IMPORTANT:
-- - Never expose a service_role/secret key in the frontend.
-- - RLS is the security boundary for browser access.
-- - Review Supabase Auth email settings before launch.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text not null,
  bio text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint full_name_length check (char_length(full_name) between 1 and 60),
  constraint bio_length check (char_length(bio) <= 160)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  topic text not null default 'General',
  tags text[] not null default '{}',
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint title_length check (char_length(title) between 3 and 120),
  constraint body_length check (char_length(body) between 20 and 3000)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint comment_length check (char_length(body) between 1 and 500)
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
  constraint no_self_follow check (follower_id <> following_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  details text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint report_target check (post_id is not null or comment_id is not null),
  constraint report_status check (status in ('open','reviewing','resolved','dismissed'))
);

create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists posts_user_idx on public.posts(user_id);
create index if not exists posts_topic_idx on public.posts(topic);
create index if not exists comments_post_idx on public.comments(post_id,created_at);
create index if not exists likes_post_idx on public.likes(post_id);
create index if not exists follows_following_idx on public.follows(following_id);
create index if not exists notifications_user_idx on public.notifications(user_id,created_at desc);
create index if not exists reports_status_idx on public.reports(status,created_at desc);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

-- Public/authenticated read policies
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to anon,authenticated using (true);

drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts for select to anon,authenticated using (is_deleted = false);

drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments for select to anon,authenticated using (true);

drop policy if exists "likes_select" on public.likes;
create policy "likes_select" on public.likes for select to anon,authenticated using (true);

drop policy if exists "follows_select" on public.follows;
create policy "follows_select" on public.follows for select to anon,authenticated using (true);

-- Own writes
drop policy if exists "posts_insert" on public.posts;
create policy "posts_insert" on public.posts for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "posts_update" on public.posts;
create policy "posts_update" on public.posts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "posts_delete" on public.posts;
create policy "posts_delete" on public.posts for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "comments_delete" on public.comments;
create policy "comments_delete" on public.comments for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "likes_insert" on public.likes;
create policy "likes_insert" on public.likes for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "likes_delete" on public.likes;
create policy "likes_delete" on public.likes for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "follows_insert" on public.follows;
create policy "follows_insert" on public.follows for insert to authenticated
with check ((select auth.uid()) = follower_id and follower_id <> following_id);

drop policy if exists "follows_delete" on public.follows;
create policy "follows_delete" on public.follows for delete to authenticated
using ((select auth.uid()) = follower_id);

drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports for insert to authenticated
with check ((select auth.uid()) = reporter_id);

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports for select to authenticated
using ((select auth.uid()) = reporter_id);

-- Profile creation/update.
-- The client never receives permission to change is_admin.
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Notifications: users can only read/update their own notifications.
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Admin policies. is_admin is never editable by the normal profile RPC below.
drop policy if exists "reports_admin_select" on public.reports;
create policy "reports_admin_select" on public.reports for select to authenticated
using ((select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin)));

drop policy if exists "reports_admin_update" on public.reports;
create policy "reports_admin_update" on public.reports for update to authenticated
using ((select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin)))
with check ((select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin)));

-- Profile creation trigger from Supabase Auth metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username','user_' || substr(new.id::text,1,8)), '[^a-zA-Z0-9_]', '_', 'g'));
  if char_length(base_username) < 3 then base_username := 'user_' || substr(new.id::text,1,8); end if;
  base_username := left(base_username,24);
  final_username := base_username;

  if exists(select 1 from public.profiles where username=final_username) then
    final_username := left(base_username,19) || '_' || substr(new.id::text,1,4);
  end if;

  insert into public.profiles(id,username,full_name,bio)
  values(
    new.id,
    final_username,
    left(coalesce(new.raw_user_meta_data->>'full_name','QAVRIN User'),60),
    left(coalesce(new.raw_user_meta_data->>'bio',''),160)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Safe profile update RPC. It does NOT accept is_admin.
create or replace function public.update_my_profile(
  p_full_name text,
  p_username text,
  p_bio text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare result public.profiles;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_username !~ '^[a-z0-9_]{3,24}$' then raise exception 'Invalid username'; end if;
  update public.profiles
  set full_name=left(trim(p_full_name),60),
      username=lower(trim(p_username)),
      bio=left(trim(coalesce(p_bio,'')),160),
      updated_at=now()
  where id=auth.uid()
  returning * into result;
  return result;
end;
$$;

revoke all on function public.update_my_profile(text,text,text) from public;
grant execute on function public.update_my_profile(text,text,text) to authenticated;

-- Automatic notifications.
create or replace function public.notify_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.posts where id=new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications(user_id,actor_id,type,post_id)
    values(owner_id,new.user_id,'like',new.post_id);
  end if;
  return new;
end;
$$;

drop trigger if exists like_notification on public.likes;
create trigger like_notification after insert on public.likes for each row execute function public.notify_like();

create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.posts where id=new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications(user_id,actor_id,type,post_id,comment_id)
    values(owner_id,new.user_id,'comment',new.post_id,new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists comment_notification on public.comments;
create trigger comment_notification after insert on public.comments for each row execute function public.notify_comment();

create or replace function public.notify_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications(user_id,actor_id,type)
  values(new.following_id,new.follower_id,'follow');
  return new;
end;
$$;

drop trigger if exists follow_notification on public.follows;
create trigger follow_notification after insert on public.follows for each row execute function public.notify_follow();

-- Timestamp helper.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

-- Grant least privilege for browser Data API access.
grant select on public.profiles,public.posts,public.comments,public.likes,public.follows to anon,authenticated;
grant insert,update,delete on public.posts,public.comments,public.likes,public.follows to authenticated;
grant insert on public.profiles,public.reports to authenticated;
grant select,update on public.notifications to authenticated;
grant select on public.reports to authenticated;

-- Recommended: expose only the tables/functions your frontend needs in
-- Supabase Dashboard -> Integrations/Data API. Keep sensitive tables private.
