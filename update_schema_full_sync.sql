-- Create a bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );

-- TASKS Table (Syncing tasks to backend)
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  text text not null,
  completed boolean default false,
  completed_at bigint, -- timestamp as number
  type text check (type in ('daily', 'weekly', 'monthly')),
  due_date text, -- ISO string
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tasks enable row level security;

create policy "Users can view their own tasks." on tasks for select using (auth.uid() = user_id);
create policy "Users can insert their own tasks." on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks." on tasks for update using (auth.uid() = user_id);
create policy "Users can delete their own tasks." on tasks for delete using (auth.uid() = user_id);

-- UNLOCKED ITEMS (Themes & Achievements)
create table user_unlocks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  item_id text not null,
  type text check (type in ('theme', 'achievement')),
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, item_id, type)
);

alter table user_unlocks enable row level security;

create policy "Users can view their own unlocks." on user_unlocks for select using (auth.uid() = user_id);
create policy "Users can insert their own unlocks." on user_unlocks for insert with check (auth.uid() = user_id);

-- Update user_stats to be more robust
-- (Already exists from previous step, but ensuring columns exist)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'user_stats' and column_name = 'active_theme_id') then
        alter table user_stats add column active_theme_id text default 'default';
    end if;
end $$;
