-- Fix missing foreign key relation for game_invites sender
ALTER TABLE game_invites
ADD CONSTRAINT game_invites_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Ensure RLS policies allow reading profiles for invites
create policy "Allow reading profiles for invites"
on profiles for select
to authenticated
using (true);
