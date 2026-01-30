-- COMPLETE RLS FIX
-- Run this entire script in Supabase SQL Editor to fix all permission issues

-- 1. USER STATS (Points, etc.)
alter table user_stats enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where tablename = 'user_stats' and policyname = 'Stats are viewable by everyone.') then
    drop policy "Stats are viewable by everyone." on user_stats;
  end if;
end $$;

create policy "Stats are viewable by everyone." 
  on user_stats for select 
  using (true);

-- 2. PROFILES (Names, Avatars)
alter table profiles enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Public profiles are viewable by everyone.') then
    drop policy "Public profiles are viewable by everyone." on profiles;
  end if;
end $$;

create policy "Public profiles are viewable by everyone." 
  on profiles for select 
  using (true);

-- 3. FRIENDSHIPS (The list itself)
alter table friendships enable row level security;

-- Allow users to see friendships where they are involved
do $$
begin
  if exists (select 1 from pg_policies where tablename = 'friendships' and policyname = 'Friendships are viewable by involved parties.') then
    drop policy "Friendships are viewable by involved parties." on friendships;
  end if;
end $$;

create policy "Friendships are viewable by involved parties." 
  on friendships for select 
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Also allow inserting friendships (sending requests)
do $$
begin
  if exists (select 1 from pg_policies where tablename = 'friendships' and policyname = 'Users can create friend requests.') then
    drop policy "Users can create friend requests." on friendships;
  end if;
end $$;

create policy "Users can create friend requests." 
  on friendships for insert 
  with check (auth.uid() = user_id);
