-- Fix RLS policies to ensure user_stats are publicly viewable
-- This fixes the issue where friends' points show as 0

-- Enable RLS just in case
alter table user_stats enable row level security;

-- Drop existing policy if it exists to avoid conflicts (we can't check existence easily in standard SQL script without PL/pgSQL, so we'll use a DO block)
do $$
begin
  if exists (
    select 1 from pg_policies 
    where tablename = 'user_stats' 
    and policyname = 'Stats are viewable by everyone.'
  ) then
    drop policy "Stats are viewable by everyone." on user_stats;
  end if;
end $$;

-- Create the policy allowing SELECT for everyone (authenticated and anon)
-- Or just authenticated if you prefer: using (auth.role() = 'authenticated')
create policy "Stats are viewable by everyone." 
  on user_stats 
  for select 
  using (true);

-- Ensure profiles are also viewable
do $$
begin
  if exists (
    select 1 from pg_policies 
    where tablename = 'profiles' 
    and policyname = 'Public profiles are viewable by everyone.'
  ) then
    drop policy "Public profiles are viewable by everyone." on profiles;
  end if;
end $$;

create policy "Public profiles are viewable by everyone." 
  on profiles 
  for select 
  using (true);
