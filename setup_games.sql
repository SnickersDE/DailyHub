-- Setup Tables for Games (Tic-Tac-Toe, RPS)

-- 1. GAMES Table
-- Stores the active state of games
create table games (
  id uuid default uuid_generate_v4() primary key,
  game_type text check (game_type in ('tictactoe', 'rps')) not null,
  player1_id uuid references auth.users not null,
  player2_id uuid references auth.users not null,
  current_turn uuid references auth.users, -- Whose turn is it? (null for simultaneous like RPS)
  state jsonb default '{}'::jsonb, -- Flexible storage for board state (grid for TTT)
  status text check (status in ('waiting', 'playing', 'finished', 'aborted')) default 'waiting',
  winner_id uuid references auth.users, -- null if draw or ongoing
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Games
alter table games enable row level security;

-- Players can view their own games
create policy "Players can view their own games." 
  on games for select 
  using (auth.uid() = player1_id or auth.uid() = player2_id);

-- Players can update their own games (make moves)
create policy "Players can update their own games." 
  on games for update 
  using (auth.uid() = player1_id or auth.uid() = player2_id);

-- Allow creating games (usually done via invite acceptance)
create policy "Players can create games." 
  on games for insert 
  with check (auth.uid() = player1_id or auth.uid() = player2_id);


-- 2. GAME INVITES Table
-- Handles the lobby logic
create table game_invites (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  game_type text check (game_type in ('tictactoe', 'rps')) not null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  game_id uuid references games(id), -- Linked game once accepted
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Invites
alter table game_invites enable row level security;

-- Users can see invites they sent or received
create policy "Users can view their invites." 
  on game_invites for select 
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can send invites
create policy "Users can create invites." 
  on game_invites for insert 
  with check (auth.uid() = sender_id);

-- Users can update invites (accept/decline)
create policy "Users can update their invites." 
  on game_invites for update 
  using (auth.uid() = sender_id or auth.uid() = receiver_id);


-- 3. Enable Realtime for these tables
-- This is crucial for the "P2P" feel
begin;
  alter publication supabase_realtime add table games;
  alter publication supabase_realtime add table game_invites;
commit;
